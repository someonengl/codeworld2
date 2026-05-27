import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { mapStatusToDbEnum, submitToJudge0, getJudge0LanguageId } from "@/utils/judge0";

// Simple in-memory rate limiter (Consider upgrading to Redis for production)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const record = rateLimit.get(key);

  if (!record || now > record.resetTime) {
    rateLimit.set(key, { count: 1, resetTime: now + 60000 });
    return false;
  }

  record.count += 1;
  if (record.count >= 15) return true; // 15 submissions per min
  return false;
}

const LANGUAGES = [
  "cpp", "c", "python", "java", "js", "go", "rust", "kotlin"
];

export async function POST(req: Request) {
  try {
    // 1. DDOS Protection: Body Size Limit Check
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 1 * 1024 * 1024) { // 1MB Limit
      return NextResponse.json({ error: "Payload too large. Max 1MB allowed." }, { status: 413 });
    }

    const { source_code, language, problem_id, user_id, time_limit_ms } = await req.json();
    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for") || "unknown";
    const limitKey = user_id || ip;

    if (isRateLimited(limitKey)) {
      return NextResponse.json({ error: "Rate limit exceeded (15 submissions/min). Slow down!" }, { status: 429 });
    }

    if (!source_code || !language || !problem_id || !user_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. INPUT WHITELISTING AND TYPE ENFORCEMENT
    if (!LANGUAGES.includes(language)) {
      return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
    }

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isMock = problem_id === "mock" || problem_id === "00000000-0000-0000-0000-000000000000";

    if (!isMock && !UUID_REGEX.test(problem_id)) {
      return NextResponse.json({ error: "Invalid problem ID format. Must be a valid UUID." }, { status: 400 });
    }

    if (typeof user_id !== "string" || !UUID_REGEX.test(user_id)) {
      return NextResponse.json({ error: "Invalid user ID format. Must be a valid UUID." }, { status: 400 });
    }

    if (time_limit_ms !== undefined && (typeof time_limit_ms !== "number" || time_limit_ms < 100 || time_limit_ms > 15000)) {
      return NextResponse.json({ error: "Invalid time limit. Must be a number between 100 and 15000." }, { status: 400 });
    }

    let testCases: any[] = [];

    if (isMock) {
      // Mock test cases for testing compiler validation easily
      testCases = [
        {
          id: "mock-case-1",
          is_sample: true,
          input: "5\n",
          expected_output: "10\n",
        }
      ];
    } else {
      // 2. Fetch all test cases securely from Supabase (Bypass RLS to get hidden test cases)
      const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: dbCases, error: tcError } = await supabaseAdmin
        .from("test_cases")
        .select("*")
        .eq("problem_id", problem_id);

      if (tcError || !dbCases || dbCases.length === 0) {
        return NextResponse.json({ error: "Failed to fetch test cases or problem has no test cases" }, { status: 500 });
      }
      testCases = dbCases;
    }

    // 3. Evaluate against all test cases concurrently using Promise.all()
    const judge0LangId = getJudge0LanguageId(language);

    const evaluatePromises = testCases.map(async (tc) => {
      let res;
      if (isMock) {
        // Direct route-level offline simulation fallback
        const emulatedStdout = (tc.input || "").trim() === "5" ? "10\n" : "2\n";
        res = {
          success: true,
          statusDescription: "Accepted",
          statusCode: 3, // AC
          stdout: emulatedStdout,
          stderr: "",
          compileOutput: "",
          time: 0.05,
          memory: 1240,
        };
      } else {
        // Call your self-hosted Judge0 server concurrently
        res = await submitToJudge0(source_code, judge0LangId, tc.input || "", time_limit_ms || 15000, isMock);
      }
      
      let status = "RE";
      if (!res.success) {
        status = "RE";
      } else if (res.statusCode === 3) {
        status = "AC";
      } else if (res.statusCode === 4) {
        status = "WA";
      } else if (res.statusCode === 5) {
        status = "TLE";
      } else if (res.statusCode === 6) {
        status = "CE";
      } else {
        status = "RE";
      }

      const actual = (res.stdout || "").trim();
      const expected = (tc.expected_output || "").trim();

      if (status === "AC") {
        status = actual === expected ? "AC" : "WA";
      }

      // Add to results
      return {
        case_id: tc.id,
        is_sample: tc.is_sample,
        status: status,
        stdout: tc.is_sample ? res.stdout : "[HIDDEN]",
        stderr: res.stderr || res.compileOutput || res.errorMessage || "",
        expected: tc.is_sample ? expected : "[HIDDEN]",
        time_ms: Math.round(res.time * 1000), // convert seconds to ms
      };
    });

    const runResults = await Promise.all(evaluatePromises);

    // Compute overall verdict
    let currentOverall = "AC";
    const priority = ["CE", "RE", "TLE", "WA", "AC"];
    for (const r of runResults) {
      const currentScore = priority.indexOf(r.status);
      const overallScore = priority.indexOf(currentOverall);
      if (currentScore < overallScore) {
        currentOverall = r.status;
      }
    }

    // 4. Determine language_id safely
    const langIndex = LANGUAGES.indexOf(language);
    const language_id = langIndex >= 0 ? langIndex + 1 : 1; // Fallback to 1 if not found to prevent DB crash

    const maxExecutionTime = runResults.length > 0 ? Math.max(...runResults.map(r => r.time_ms)) : 0;
    let submissionId = "mock-submission-id";

    if (!isMock) {
      const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: sub, error: insertErr } = await supabaseAdmin
        .from("submissions")
        .insert({
          problem_id,
          student_id: user_id,
          code: source_code,
          language_id,
          status: mapStatusToDbEnum(currentOverall),
          execution_time_ms: maxExecutionTime,
          result_data: runResults
        })
        .select("id")
        .single();

      if (insertErr) {
        console.error("Submission Insert Error:", insertErr);
        return NextResponse.json({ error: "Failed to save submission to database" }, { status: 500 });
      }
      submissionId = sub?.id || "";
    }

    // 6. Return secure result to client
    return NextResponse.json({
      submission_id: submissionId,
      overall_status: currentOverall,
      results: runResults
    });

  } catch (error: any) {
    console.error("Submit API Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

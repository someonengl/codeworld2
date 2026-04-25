import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient as createAdminClient } from "@supabase/supabase-js";

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

// Wandbox compiler names
const WANDBOX_COMPILER: Record<string, string> = {
  cpp:    "gcc-13.2.0",
  c:      "gcc-13.2.0-c",
  python: "cpython-3.12.5",
  rust:   "rust-head",
  go:     "go-head",
  js:     "nodejs-22.4.0",
  java:   "openjdk-23",
  ruby:   "ruby-head",
};

const LANGUAGES = [
  "cpp", "c", "python", "java", "js", "go", "rust", "kotlin"
];

const WANDBOX_URL = "https://wandbox.org/api/compile.json";

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

    const compiler = WANDBOX_COMPILER[language];
    if (!compiler) {
      return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
    }

    // 2. Fetch all test cases securely from Supabase (Bypass RLS to get hidden test cases)
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: testCases, error: tcError } = await supabaseAdmin
      .from("test_cases")
      .select("*")
      .eq("problem_id", problem_id);

    if (tcError || !testCases || testCases.length === 0) {
      return NextResponse.json({ error: "Failed to fetch test cases or problem has no test cases" }, { status: 500 });
    }

    // 3. Evaluate against all test cases
    const runResults: any[] = [];
    let currentOverall = "AC";

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const res = await runOnWandbox(compiler, source_code, tc.input || "", time_limit_ms);
      
      let status = res.status;
      const actual = (res.stdout || "").trim();
      const expected = (tc.expected_output || "").trim();

      if (status === "AC") {
        status = actual === expected ? "AC" : "WA";
      }

      // Add to results
      const caseResult = {
        case_id: tc.id,
        is_sample: tc.is_sample,
        status: status,
        stdout: tc.is_sample ? res.stdout : "[HIDDEN]",
        stderr: res.stderr,
        expected: tc.is_sample ? expected : "[HIDDEN]",
        time_ms: res.time_ms,
      };

      runResults.push(caseResult);

      // Compute overall verdict
      const priority = ["CE", "RE", "TLE", "WA", "AC"];
      const currentScore = priority.indexOf(status);
      const overallScore = priority.indexOf(currentOverall);
      if (currentScore < overallScore) {
        currentOverall = status;
        if (status === "CE" || status === "RE") break;
      }
    }

    // 4. Determine language_id safely
    const langIndex = LANGUAGES.indexOf(language);
    const language_id = langIndex >= 0 ? langIndex + 1 : 1; // Fallback to 1 if not found to prevent DB crash

    // 5. Insert submission securely into DB
    const maxExecutionTime = runResults.length > 0 ? Math.max(...runResults.map(r => r.time_ms)) : 0;

    const { data: sub, error: insertErr } = await supabaseAdmin
      .from("submissions")
      .insert({
        problem_id,
        student_id: user_id,
        code: source_code,
        language_id,
        status: currentOverall,
        execution_time_ms: maxExecutionTime,
        result_data: runResults
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("Submission Insert Error:", insertErr);
      return NextResponse.json({ error: "Failed to save submission to database" }, { status: 500 });
    }

    // 6. Return secure result to client
    return NextResponse.json({
      submission_id: sub?.id,
      overall_status: currentOverall,
      results: runResults
    });

  } catch (error: any) {
    console.error("Submit API Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

async function runOnWandbox(
  compiler: string,
  code: string,
  stdin: string,
  timeLimitMs?: number
): Promise<{ status: string; stdout: string; stderr: string; time_ms: number }> {
  const controller = new AbortController();
  const effectiveTimeout = (timeLimitMs || 2000) + 25000; 
  const timeout = setTimeout(() => controller.abort(), effectiveTimeout); 

  try {
    const res = await fetch(WANDBOX_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        compiler,
        code,
        stdin: stdin || "",
        "save": false,
        "compiler-option-raw": "-O0", 
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Wandbox error ${res.status}: ${text}`);
    }

    const data = await res.json();

    if (data.compiler_error && data.compiler_error.trim().length > 0) {
      return {
        status: "CE",
        stdout: "",
        stderr: data.compiler_error || data.compiler_message || "",
        time_ms: 0,
      };
    }

    if (data.status !== "0") {
      return {
        status: "RE",
        stdout: data.program_output || "",
        stderr: data.program_error || "",
        time_ms: 0,
      };
    }

    return {
      status: "AC",
      stdout: data.program_output || "",
      stderr: data.program_error || "",
      time_ms: 0,
    };
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      return { 
        status: "TLE", 
        stdout: "", 
        stderr: `Execution timed out (${effectiveTimeout}ms limit reached)`, 
        time_ms: effectiveTimeout 
      };
    }
    return { status: "RE", stdout: "", stderr: err.message, time_ms: 0 };
  }
}

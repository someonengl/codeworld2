import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { submitToJudge0, getJudge0LanguageId } from "@/utils/judge0";

// Simple in-memory rate limiter
const rateLimit = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const record = rateLimit.get(key);

  if (!record || now > record.resetTime) {
    rateLimit.set(key, { count: 1, resetTime: now + 60000 });
    return false;
  }

  record.count += 1;
  if (record.count >= 15) return true; // Increased to 15 per min
  return false;
}

// Removed Wandbox support to route exclusively to self-hosted Judge0

export async function POST(req: Request) {
  try {
    const { source_code, language, test_case, time_limit_ms, user_id, stdin } = await req.json();
    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for") || "unknown";
    const limitKey = user_id || ip;

    if (isRateLimited(limitKey)) {
      return NextResponse.json({ error: "Rate limit exceeded (15 submissions/min). Slow down!" }, { status: 429 });
    }

    if (!source_code || !language) {
      return NextResponse.json({ error: "Missing source_code or language" }, { status: 400 });
    }

    const judge0LangId = getJudge0LanguageId(language);

    // Run against the single provided test case or raw stdin
    const inputToUse = stdin !== undefined ? stdin : (test_case?.input || "");
    const res = await submitToJudge0(source_code, judge0LangId, inputToUse, time_limit_ms || 15000);
    
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

    const mappedRes = {
      status: status,
      stdout: res.stdout || "",
      stderr: res.stderr || res.compileOutput || res.errorMessage || "",
      time_ms: Math.round(res.time * 1000)
    };

    return NextResponse.json({ 
      results: [mappedRes] // wrap in results array for IdeClient compatibility
    });
  } catch (error: any) {
    console.error("Judge API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}


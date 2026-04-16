import { NextResponse } from "next/server";
import { headers } from "next/headers";

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

// Wandbox compiler names — https://wandbox.org/api/list.json
// Completely free, no API key, no account needed.
const WANDBOX_COMPILER: Record<string, string> = {
  cpp:    "gcc-13.2.0",       // Stable GCC version
  c:      "gcc-13.2.0-c",     // Stable GCC version
  python: "cpython-3.12.5",   // Python 3.12
  rust:   "rust-head",        // Rust latest
  go:     "go-head",          // Go latest
  js:     "nodejs-22.4.0",    // Node.js 22
  java:   "openjdk-23",       // Java 23
  ruby:   "ruby-head",        // Ruby latest
};

const BATCH_SIZE = 2; // Reduced to 2 to avoid overwhelming Wandbox with multiple compilations
const WANDBOX_URL = "https://wandbox.org/api/compile.json";

function mapWandboxStatus(
  result: { status: string; compiler_error?: string; program_error?: string }
): string {
  if (result.compiler_error && result.compiler_error.trim().length > 0) return "CE";
  if (result.status !== "0") return "RE";
  return "AC"; // stdout comparison happens in the caller
}

export async function POST(req: Request) {
  try {
    const { source_code, language, test_case, time_limit_ms, user_id } = await req.json();
    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for") || "unknown";
    const limitKey = user_id || ip;

    if (isRateLimited(limitKey)) {
      return NextResponse.json({ error: "Rate limit exceeded (15 submissions/min). Slow down!" }, { status: 429 });
    }

    if (!source_code || !language) {
      return NextResponse.json({ error: "Missing source_code or language" }, { status: 400 });
    }

    const compiler = WANDBOX_COMPILER[language];
    if (!compiler) {
      return NextResponse.json({ error: `Unsupported language: ${language}` }, { status: 400 });
    }

    // Run against the single provided test case
    const res = await runOnWandbox(compiler, source_code, test_case?.input || "", time_limit_ms);
    
    let status = res.status;
    const actual = (res.stdout || "").trim();
    const expected = (test_case?.expected_output || "").trim();

    if (status === "AC" && test_case) {
      status = actual === expected ? "AC" : "WA";
    }

    // TOTAL BLACKOUT: Hide all results from students to prevent leaks during contests
    return NextResponse.json({ 
      ...res, 
      status, 
      case_id: test_case?.id, 
      expected: "[HIDDEN]",
      stdout: "[HIDDEN]"
    });
  } catch (error: any) {
    console.error("Judge API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function runOnWandbox(
  compiler: string,
  code: string,
  stdin: string,
  timeLimitMs?: number
): Promise<{ status: string; stdout: string; stderr: string; time_ms: number }> {
  const controller = new AbortController();
  // Compilation + Network Overhead can take 15-20s for large C++ headers on Wandbox.
  // Bumped buffer to 25s ensure students don't get false TLEs on cold starts.
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
        "compiler-option-raw": "-O0", // Disable expensive optimization for speed
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Wandbox error ${res.status}: ${text}`);
    }

    const data = await res.json();

    // CE — compiler emitted errors
    if (data.compiler_error && data.compiler_error.trim().length > 0) {
      return {
        status: "CE",
        stdout: "",
        stderr: data.compiler_error || data.compiler_message || "",
        time_ms: 0,
      };
    }

    // RE — non-zero exit code
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

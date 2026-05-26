"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Upload, ChevronDown, ChevronUp, FlaskConical, CheckCircle2, XCircle, AlertCircle, Clock, Loader2, X, Copy, Check } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";

interface Translation {
  language_code: string;
  title: string;
  description: string;
  status: string;
}

interface TestCase {
  id: string;
  input: string;
  expected_output: string;
  is_sample: boolean;
}

type Verdict = "AC" | "WA" | "TLE" | "CE" | "RE" | "Pending";

interface CaseResult {
  case_id: string;
  is_sample?: boolean;
  status: Verdict;
  stdout: string;
  stderr: string;
  expected: string;
  time_ms: number;
}

interface SubmissionRecord {
  id: string;
  student_id: string;
  code: string;
  status: string;
  execution_time_ms: number;
  result_data?: any[];
  created_at: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

const LANGUAGES = [
  { key: "cpp",    label: "C++ (GCC)",      template: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    // Your solution here\n    \n    return 0;\n}' },
  { key: "c",      label: "C (GCC)",         template: '#include <stdio.h>\n\nint main() {\n    // Your solution here\n    return 0;\n}' },
  { key: "python", label: "Python 3.10",        template: 'import sys\ninput = sys.stdin.readline\n\n# Your solution here\n' },
  { key: "java",   label: "Java 15",            template: 'import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Your solution here\n    }\n}' },
  { key: "js",     label: "JavaScript (Node)",  template: 'const lines = require("fs").readFileSync("/dev/stdin","utf8").split("\\n");\n// Your solution here\n' },
  { key: "go",     label: "Go 1.16",            template: 'package main\n\nimport "fmt"\n\nfunc main() {\n    // Your solution here\n}' },
  { key: "rust",   label: "Rust 1.50",          template: 'use std::io::{self, BufRead};\n\nfn main() {\n    let stdin = io::stdin();\n    // Your solution here\n}' },
  { key: "kotlin", label: "Kotlin 1.8",         template: 'fun main() {\n    // Your solution here\n}' },
];

const VERDICT_CONFIG: Record<Verdict, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  AC:      { label: "Accepted",         color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", icon: <CheckCircle2 className="w-4 h-4" /> },
  WA:      { label: "Wrong Answer",     color: "text-red-400",     bg: "bg-red-500/10 border-red-500/30",         icon: <XCircle className="w-4 h-4" /> },
  TLE:     { label: "Time Limit",       color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30",     icon: <Clock className="w-4 h-4" /> },
  CE:      { label: "Compile Error",    color: "text-orange-400",  bg: "bg-orange-500/10 border-orange-500/30",   icon: <AlertCircle className="w-4 h-4" /> },
  RE:      { label: "Runtime Error",    color: "text-rose-400",    bg: "bg-rose-500/10 border-rose-500/30",       icon: <AlertCircle className="w-4 h-4" /> },
  Pending: { label: "Pending",          color: "text-zinc-400",    bg: "bg-zinc-800/50 border-zinc-700",          icon: <Loader2 className="w-4 h-4 animate-spin" /> },
};
export default function SubmitClient({
  problemId,
  userId,
  translations,
  testCases,
  timeLimitMs,
  memoryLimitKb,
  isTeacher = false,
  isArchive = false,
  allowViewTestcases = false,
  allowViewOthers = false,
  allSubmissions = [],
  userSubmissions = [],
}: {
  problemId: string;
  userId: string;
  translations: Translation[];
  testCases: TestCase[];
  timeLimitMs: number;
  memoryLimitKb: number;
  isTeacher?: boolean;
  isArchive?: boolean;
  allowViewTestcases?: boolean;
  allowViewOthers?: boolean;
  allSubmissions?: SubmissionRecord[];
  userSubmissions?: any[];
}) {
  const router = useRouter();
  const [lang, setLang] = useState(LANGUAGES[0].key);
  const [code, setCode] = useState(LANGUAGES[0].template);
  const [displayLang, setDisplayLang] = useState(translations[0]?.language_code ?? "EN");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSamples, setShowSamples] = useState(true);
  const [results, setResults] = useState<CaseResult[] | null>(null);
  const [overall, setOverall] = useState<Verdict | null>(null);
  const [errorOutput, setErrorOutput] = useState<string>("");
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [viewingCode, setViewingCode] = useState<SubmissionRecord | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [copyOutputSuccess, setCopyOutputSuccess] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const sampleCases = testCases.filter((tc) => tc.is_sample);
  const currentTrans = translations.find((t) => t.language_code === displayLang) ?? translations[0];

  // QOL: Persistence & Shortcuts
  useEffect(() => {
    // 1. Load Last Used Language
    const savedLang = localStorage.getItem("codeworld_preferred_lang");
    if (savedLang && LANGUAGES.some(l => l.key === savedLang)) {
      setLang(savedLang);
      // Only auto-fill template if code is empty
      const cachedCode = localStorage.getItem(`codeworld_code_${problemId}_${savedLang}`);
      if (cachedCode) {
        setCode(cachedCode);
      } else {
        const l = LANGUAGES.find(l => l.key === savedLang)!;
        if (!code || code === LANGUAGES[0].template) setCode(l.template);
      }
    }

    // 2. Keyboard Shortcut Listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        const btn = document.getElementById("submit-btn");
        if (btn) btn.click();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [problemId]);

  // QOL: Persistence on change
  useEffect(() => {
    if (code && code !== LANGUAGES.find(l => l.key === lang)?.template) {
      localStorage.setItem(`codeworld_code_${problemId}_${lang}`, code);
    }
  }, [code, lang, problemId]);

  useEffect(() => {
    localStorage.setItem("codeworld_preferred_lang", lang);
  }, [lang]);

  // Group submissions by student
  const grouped = (allSubmissions || []).reduce((acc, sub) => {
    if (!acc[sub.student_id]) acc[sub.student_id] = [];
    acc[sub.student_id].push(sub);
    return acc;
  }, {} as Record<string, SubmissionRecord[]>);

  const uniqueStudents = Object.values(grouped).map(subs => {
    const bestStatus = subs.some(s => s.status === 'AC' || s.status === 'Accepted') ? 'AC' : subs[0].status;
    return { 
      student_id: subs[0].student_id, 
      bestStatus, 
      count: subs.length, 
      profile: subs[0].profiles,
      subs: subs.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    };
  }).sort((a,b) => {
    const nameA = a.profile?.username || "anonymous";
    const nameB = b.profile?.username || "anonymous";
    return nameA.localeCompare(nameB);
  });

  const activeStudent = uniqueStudents.find(s => s.student_id === selectedStudentId);

  function handleLangChange(newKey: string) {
    const l = LANGUAGES.find((l) => l.key === newKey)!;
    setLang(newKey);
    
    // QOL: Check for cached code for this language
    const cached = localStorage.getItem(`codeworld_code_${problemId}_${newKey}`);
    if (cached) {
      setCode(cached);
    } else {
      setCode(l.template);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCode(ev.target?.result as string);
    reader.readAsText(file);
  }

  function handleReset() {
    if (confirm("Reset code to language template? This will erase your current work for this problem.")) {
      const l = LANGUAGES.find((l) => l.key === lang)!;
      setCode(l.template);
      localStorage.removeItem(`codeworld_code_${problemId}_${lang}`);
    }
  }

  function getJudge0LanguageId(langKey: string): number {
    switch (langKey) {
      case "cpp": return 54;
      case "c": return 50;
      case "python": return 71;
      case "java": return 62;
      case "js": return 63;
      case "go": return 60;
      case "rust": return 73;
      case "kotlin": return 78;
      default: return 54;
    }
  }

  function getVerdictFromStatusId(statusId: number): Verdict {
    switch (statusId) {
      case 3: return "AC";
      case 4: return "WA";
      case 5: return "TLE";
      case 6: return "CE";
      default: return "RE";
    }
  }

  function mapVerdictToDbEnum(v: Verdict): string {
    switch (v) {
      case "AC": return "AC";
      case "WA": return "WA";
      case "TLE": return "TLE";
      case "CE": return "CE";
      default: return "RE";
    }
  }



  async function handleSubmit() {
    if (isSubmitting || !code.trim()) return;
    setIsSubmitting(true);
    setResults([]);
    setOverall(null);
    setErrorOutput("");
    setSubmissionId(null);

    try {
      const runResults: CaseResult[] = [];
      let currentOverall: Verdict = "AC";
      const judge0LangId = getJudge0LanguageId(lang);

      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        
        const encodedSource = btoa(code);
        const encodedStdin = btoa(tc.input || "");
        
        const response = await fetch("https://judge0myownserver.store/submissions?wait=true&base64_encoded=true", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            source_code: encodedSource,
            language_id: judge0LangId,
            stdin: encodedStdin,
            base64_encoded: true
          })
        });

        if (!response.ok) {
          const errDetail = `Compiler Server Error: HTTP ${response.status}`;
          throw new Error(errDetail);
        }

        const data = await response.json();
        const safeAtob = (str: string | null | undefined) => {
          if (!str) return "";
          try {
            return atob(str);
          } catch {
            return str;
          }
        };

        const stdout = safeAtob(data.stdout);
        const stderr = safeAtob(data.stderr || data.compile_output);
        const time = data.time ? Math.round(parseFloat(data.time) * 1000) : 0;
        const statusCode = data.status?.id || 0;

        let status: Verdict = getVerdictFromStatusId(statusCode);

        const actual = stdout.trim();
        const expected = (tc.expected_output || "").trim();

        if (status === "AC") {
          status = actual === expected ? "AC" : "WA";
        }

        const caseResult: CaseResult = {
          case_id: tc.id,
          is_sample: tc.is_sample,
          status: status,
          stdout: tc.is_sample || isTeacher || allowViewTestcases ? stdout : "[HIDDEN]",
          stderr: stderr,
          expected: tc.is_sample || isTeacher || allowViewTestcases ? tc.expected_output : "[HIDDEN]",
          time_ms: time
        };

        runResults.push(caseResult);

        // Compute overall verdict priority
        const priority: Verdict[] = ["CE", "RE", "TLE", "WA", "AC"];
        const currentScore = priority.indexOf(status);
        const overallScore = priority.indexOf(currentOverall);
        if (currentScore < overallScore) {
          currentOverall = status;
          if (status === "CE" || status === "RE") break;
        }
      }

      setResults(runResults);
      setOverall(currentOverall);

      // Insert directly into Supabase database securely
      const maxExecutionTime = runResults.length > 0 ? Math.max(...runResults.map(r => r.time_ms)) : 0;
      const langIndex = ["cpp", "c", "python", "java", "js", "go", "rust", "kotlin"].indexOf(lang);
      const language_id = langIndex >= 0 ? langIndex + 1 : 1;

      const { data: sub, error: insertErr } = await supabase
        .from("submissions")
        .insert({
          problem_id: problemId,
          student_id: userId,
          code: code,
          language_id: language_id,
          status: mapVerdictToDbEnum(currentOverall),
          execution_time_ms: maxExecutionTime,
          result_data: runResults
        })
        .select("id")
        .single();

      if (insertErr) {
        console.error("Submission DB Insert Error:", insertErr);
        setErrorOutput("Graded successfully, but failed to log submission in database history.");
      } else if (sub?.id) {
        setSubmissionId(sub.id);
        router.refresh();
      }

    } catch (err: any) {
      setErrorOutput(err.message || "Failed to communicate directly with the production Judge0 server.");
      setOverall("RE");
    } finally {
      setIsSubmitting(false);
    }
  }

  const overallCfg = overall ? VERDICT_CONFIG[overall] : null;

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      
      {/* ── TEACHER MODAL: View Student Code ────────────────── */}
      {viewingCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8">
          <div className="bg-[#0d0d0d] border border-zinc-800 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg shadow-inner uppercase font-mono">
                  {viewingCode.profiles?.username?.[0]?.toUpperCase() || 'A'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">@{viewingCode.profiles.username}</h3>
                  <p className="text-[10px] text-zinc-500">{new Date(viewingCode.created_at).toLocaleString()} · {viewingCode.status}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setCode(viewingCode.code);
                    setViewingCode(null);
                  }}
                  className="px-3 py-1.5 bg-emerald-600/10 text-emerald-500 text-xs font-bold rounded border border-emerald-500/30 hover:bg-emerald-600/20 transition-all uppercase tracking-widest"
                >
                  Sync to Editor
                </button>
                <button 
                  onClick={() => setViewingCode(null)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-[#0a0a0a] divide-y divide-zinc-800/10">
              {/* Code Section */}
              <div className="p-6">
                <div className="text-[10px] uppercase text-zinc-600 font-mono mb-3 tracking-widest">Source Code</div>
                <pre className="text-xs font-mono text-zinc-300 leading-relaxed overflow-x-auto bg-[#0d0d0d] p-4 rounded border border-zinc-900">
                  {viewingCode.code}
                </pre>
              </div>

              {/* Saved Results Section */}
              {viewingCode.result_data && Array.isArray(viewingCode.result_data) && (
                <div className="p-6">
                  <div className="text-[10px] uppercase text-zinc-600 font-mono mb-4 tracking-widest">Results Snapshot</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {viewingCode.result_data.map((r: any, idx: number) => {
                      const cfg = VERDICT_CONFIG[r.status as Verdict] ?? VERDICT_CONFIG["RE"];
                      const isSample = testCases.find(tc => tc.id === r.case_id)?.is_sample;
                      return (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
                          <div className={`p-1.5 rounded-md ${cfg.bg} ${cfg.color}`}>
                            {cfg.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-zinc-400">CASE #{idx + 1}</span>
                              <span className={`text-[10px] font-bold font-mono ${cfg.color}`}>{r.status}</span>
                            </div>
                            {/* Detailed output if WA and allowed */}
                            {r.status === "WA" && (
                              <div className="mt-1.5 text-[9px] font-mono italic text-zinc-700">
                                Output hidden for security.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── LEFT: Problem Statement ─────────────────────────────── */}
      <aside className="w-[420px] shrink-0 border-r border-white/[0.05] bg-[#050505] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.05] bg-white/[0.01]">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[9px] font-bold px-2.5 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20 uppercase tracking-widest">
              Submit Only
            </span>
            <span className="text-[9px] text-zinc-600 font-mono">{timeLimitMs}ms · {Math.round(memoryLimitKb / 1024)}MB</span>
          </div>
          <h1 className="text-base font-bold text-white leading-snug">{currentTrans?.title ?? "Untitled Problem"}</h1>
        </div>

        {/* Lang picker */}
        {translations.length > 1 && (
          <div className="px-6 py-2 border-b border-zinc-800 flex items-center gap-2 bg-zinc-900">
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">Lang</span>
            <select
              value={displayLang}
              onChange={(e) => setDisplayLang(e.target.value)}
              className="bg-zinc-800 text-xs py-1 px-2 rounded border border-zinc-700 outline-none focus:border-emerald-500 text-zinc-300"
            >
              {translations.map((t) => (
                <option key={t.language_code} value={t.language_code}>{t.language_code}</option>
              ))}
            </select>
          </div>
        )}

        {/* Description */}
        <div className="flex-1 overflow-y-auto p-6 text-sm text-zinc-300 leading-relaxed scrollbar-hide">
          <div className="whitespace-pre-wrap font-sans">{currentTrans?.description}</div>

          {/* Teacher Activity Panel (only for classroom groups) */}
          {(isTeacher || allowViewOthers) && allSubmissions && allSubmissions.length > 0 && (
            <div className="mt-8 border-t border-zinc-800 pt-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold">
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-500" />
                    {selectedStudentId ? "Submission History" : (isTeacher ? `Students (${uniqueStudents.length})` : "Peer Activity")}
                  </span>
                </div>
                {selectedStudentId && (
                  <button 
                    onClick={() => setSelectedStudentId(null)}
                    className="text-[10px] text-zinc-500 hover:text-white transition-colors uppercase font-mono"
                  >
                    ← Back
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                {!selectedStudentId ? (
                  /* Unique Student List */
                  uniqueStudents.length === 0 ? (
                    <p className="text-[10px] text-zinc-600 italic">No students yet.</p>
                  ) : uniqueStudents.map((stu) => (
                    <button
                      key={stu.student_id}
                      onClick={() => setSelectedStudentId(stu.student_id)}
                      className="w-full text-left p-3 bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 rounded-lg group transition-all"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">@{stu.profile.username || "anonymous"}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-mono tracking-tighter
                          ${(stu.bestStatus === 'AC' || stu.bestStatus === 'Accepted') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {(stu.bestStatus === 'AC' || stu.bestStatus === 'Accepted') ? 'AC' : stu.bestStatus}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-600 font-mono">
                        <span>{stu.count} attempt{stu.count !== 1 ? 's' : ''}</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500">View History →</span>
                      </div>
                    </button>
                  ))
                ) : (
                  /* Drill-down: Specific Student History */
                  <div className="space-y-2">
                    <div className="px-1 py-1 rounded bg-zinc-900 border border-zinc-800 mb-3 text-center">
                      <span className="text-[10px] text-zinc-400 font-mono">Viewing Activity for <span className="text-emerald-400">@{activeStudent?.profile.username}</span></span>
                    </div>
                    {activeStudent?.subs.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => setViewingCode(sub)}
                        className="w-full text-left p-2.5 bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 rounded-lg group transition-all"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] w-6 text-center py-0.5 rounded border uppercase font-mono tracking-tighter
                              ${(sub.status === 'AC' || sub.status === 'Accepted') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                              {(sub.status === 'AC' || sub.status === 'Accepted') ? 'AC' : sub.status}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity font-mono">CODE</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Student History Panel (only for students) */}
          {userSubmissions && userSubmissions.length > 0 && (
            <div className="mt-8 border-t border-zinc-800 pt-5">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-4 uppercase tracking-widest font-bold">
                <Clock className="w-4 h-4 text-emerald-500" />
                My Submissions ({userSubmissions.length})
              </div>
              
              <div className="space-y-2">
                {userSubmissions.length === 0 ? (
                  <p className="text-[10px] text-zinc-600 italic">No submissions yet.</p>
                ) : userSubmissions.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setViewingCode(sub)}
                    className="w-full text-left p-2.5 bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 rounded-lg group transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] w-6 text-center py-0.5 rounded border uppercase font-mono tracking-tighter
                          ${(sub.status === 'AC' || sub.status === 'Accepted') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {(sub.status === 'AC' || sub.status === 'Accepted') ? 'AC' : sub.status}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="text-[9px] text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity font-mono">RELOAD</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Full Test Suite (Teacher view only) */}
          {isTeacher && (
            <div className="mt-8 border-t border-zinc-800 pt-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-widest font-bold">
                  <FlaskConical className="w-4 h-4 text-amber-500" />
                  Test Case Details ({testCases.length})
                </div>
              </div>
              
              <div className="space-y-4">
                {testCases.map((tc, idx) => (
                  <div key={tc.id} className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden transition-all hover:border-amber-500/30">
                    <div className="px-3 py-2 bg-zinc-900/50 border-b border-zinc-800 flex justify-between items-center">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-tighter">Case #{idx + 1}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded border uppercase font-bold
                        ${tc.is_sample ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                        {tc.is_sample ? 'Sample' : 'Hidden'}
                      </span>
                    </div>
                    <div className="p-3 space-y-3">
                      <div>
                        <div className="text-[9px] text-zinc-600 font-mono uppercase mb-1">Input</div>
                        <pre className="text-[10px] bg-black p-2 rounded border border-zinc-900 font-mono text-zinc-300 max-h-24 overflow-y-auto whitespace-pre-wrap">{tc.input || "(empty)"}</pre>
                      </div>
                      <div>
                        <div className="text-[9px] text-zinc-600 font-mono uppercase mb-1">Expected Output</div>
                        <pre className="text-[10px] bg-black p-2 rounded border border-zinc-900 font-mono text-emerald-400 max-h-24 overflow-y-auto whitespace-pre-wrap">{tc.expected_output || "(empty)"}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hidden/Collapsible Test Cases */}
          <div className="mt-8 border-t border-white/[0.05] pt-6 group/section">
            <button 
              onClick={() => setShowSamples(!showSamples)}
              className="w-full flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-widest font-bold text-emerald-400/80">
                    {allowViewTestcases ? "Test Case Inputs" : "Example Cases"}
                  </div>
                  <div className="text-[9px] font-mono text-zinc-600">
                    {testCases.length} Cases Provided
                  </div>
                </div>
              </div>
              <div className="bg-white/[0.02] p-1.5 rounded-lg border border-white/[0.05] group-hover:border-white/[0.1] transition-all">
                {showSamples ? <ChevronUp className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />}
              </div>
            </button>
              
              {showSamples && (
                <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  {testCases
                    .filter(tc => allowViewTestcases || tc.is_sample)
                    .map((tc, idx) => (
                    <div key={tc.id} className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden shadow-xl ring-1 ring-white/5">
                      <div className="px-3 py-1.5 bg-zinc-900/50 border-b border-zinc-800 flex justify-between items-center">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                          {tc.is_sample ? "Sample" : "Test Case"}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 divide-x divide-zinc-800">
                        <div className="p-3 bg-zinc-950/50">
                          <div className="flex justify-between items-center mb-2">
                            <div className="text-[9px] uppercase font-bold text-zinc-600 tracking-wider">Input</div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(tc.input || "");
                                setCopySuccess(tc.id);
                                setTimeout(() => setCopySuccess(null), 2000);
                              }}
                              className="p-1 text-zinc-600 hover:text-emerald-400 transition-colors bg-white/[0.02] rounded-md border border-white/[0.05]"
                            >
                              {copySuccess === tc.id ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                            </button>
                          </div>
                          <pre className="text-zinc-300 whitespace-pre-wrap break-all text-[11px] font-mono">{tc.input || "(empty)"}</pre>
                        </div>
                        <div className="p-3 bg-zinc-900/20">
                          {(isTeacher || tc.is_sample) ? (
                            <>
                              <div className="flex justify-between items-center mb-2">
                                <div className="text-[9px] uppercase font-bold text-zinc-600 tracking-wider">Expected Output</div>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(tc.expected_output || "");
                                    setCopyOutputSuccess(tc.id);
                                    setTimeout(() => setCopyOutputSuccess(null), 2000);
                                  }}
                                  className="p-1 text-zinc-600 hover:text-emerald-400 transition-colors bg-white/[0.02] rounded-md border border-white/[0.05]"
                                >
                                  {copyOutputSuccess === tc.id ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                                </button>
                              </div>
                              <pre className="text-emerald-400/80 whitespace-pre-wrap break-all text-[11px] font-mono">{tc.expected_output || "(empty)"}</pre>
                            </>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <span className="text-[10px] text-zinc-600 italic font-mono">Expected output hidden</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

      {/* ── RIGHT: Submission Form + Results ───────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#050505]">

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.05] bg-white/[0.01]">
          {/* Language Select */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-600 uppercase font-mono tracking-widest">Language</span>
            <select
              value={lang}
              onChange={(e) => handleLangChange(e.target.value)}
              className="bg-white/[0.04] text-xs py-1.5 px-3 rounded-xl border border-white/[0.06] outline-none focus:border-indigo-500/50 text-zinc-200 font-mono transition-colors"
            >
              {LANGUAGES.map((l) => (
                <option key={l.key} value={l.key}>{l.label}</option>
              ))}
            </select>
          </div>

          <div className="flex-1" />

          {/* Reset button */}
          <button
            onClick={handleReset}
            className="text-[11px] text-zinc-500 hover:text-red-400 transition-colors px-3 py-1.5 rounded-xl border border-white/[0.06] hover:border-red-500/20 bg-white/[0.02] hover:bg-red-500/5 uppercase font-bold tracking-widest"
            title="Reset to template"
          >
            Reset
          </button>

          {/* Upload File */}
          <label
            className="flex items-center gap-1.5 text-[11px] cursor-pointer text-zinc-500 hover:text-zinc-200 transition-colors border border-white/[0.06] hover:border-white/[0.12] px-3 py-1.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04]"
            title="Upload a source file"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload
            <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} accept=".cpp,.c,.py,.java,.js,.ts,.go,.rs,.kt" />
          </label>

          {/* Submit Button */}
          <button
            id="submit-btn"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition-all
              ${isSubmitting
                ? "bg-white/[0.04] text-zinc-600 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(52,211,153,0.2)] hover:shadow-[0_0_30px_rgba(52,211,153,0.35)] hover:-translate-y-0.5"
              }`}
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Judging...</>
            ) : (
              <><Send className="w-4 h-4" /> Submit</>
            )}
          </button>
        </div>

        {/* Code Editor Area */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="flex items-center gap-2 px-5 py-2 bg-[#050505] border-b border-white/[0.04]">
            <div className="w-2 h-2 rounded-full bg-white/[0.1]" />
            <span className="text-[10px] font-mono text-zinc-700">
              {LANGUAGES.find((l) => l.key === lang)?.label ?? lang}
            </span>
          </div>
          <div className="flex-1 min-h-0 bg-[#0d0d0d]">
            <Editor
              height="100%"
              defaultLanguage="cpp"
              language={lang === "js" ? "javascript" : lang}
              value={code}
              theme="vs-dark"
              onChange={(val: string | undefined) => setCode(val || "")}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                automaticLayout: true,
                folding: false,
                lineNumbersMinChars: 3,
                glyphMargin: false,
                wordWrap: "on",
                renderLineHighlight: "all",
                lineDecorationsWidth: 10,
                hideCursorInOverviewRuler: true,
                overviewRulerBorder: false,
                scrollbar: {
                  vertical: "visible",
                  horizontal: "visible",
                  verticalScrollbarSize: 8,
                  horizontalScrollbarSize: 8,
                },
                padding: { top: 12, bottom: 12 },
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                snippetSuggestions: "top"
              }}
            />
          </div>
        </div>

        {/* ── Results Panel ── */}
        {(isSubmitting || overall) && (
          <div className="border-t border-zinc-800 bg-[#0a0a0a] max-h-64 overflow-y-auto">

            {/* Overall Verdict Header */}
            {overallCfg && (
              <div className={`flex items-center gap-3 px-5 py-3 border-b border-zinc-800 ${overallCfg.bg} border-b`}>
                <span className={`${overallCfg.color} flex items-center gap-1.5 font-bold text-sm`}>
                  {overallCfg.icon}
                  {overallCfg.label}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  {results ? `${results.filter((r) => r.status === "AC").length}/${results.length} test cases passed` : ""}
                </span>
                {submissionId && (
                  <span className="ml-auto text-[10px] text-zinc-600 font-mono">#{submissionId.slice(0, 8)}</span>
                )}
              </div>
            )}

            {/* Loading state */}
            {isSubmitting && !overall && (
              <div className="flex items-center gap-3 px-5 py-4 text-zinc-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                Running against {testCases.length > 0 ? `${testCases.length} test case${testCases.length > 1 ? "s" : ""}` : "sandbox"}...
              </div>
            )}

            {/* Compile/Runtime error */}
            {errorOutput && (
              <div className="px-5 py-4">
                <div className="text-[10px] uppercase text-zinc-600 font-mono mb-2 tracking-widest">Error Output</div>
                <pre className="text-xs font-mono text-red-400 whitespace-pre-wrap">{errorOutput}</pre>
              </div>
            )}

            {/* Per-Case Results */}
            {results && results.length > 0 && (
              <div className="divide-y divide-zinc-800/50">
                {results.map((r, i) => {
                  const cfg = VERDICT_CONFIG[r.status] ?? VERDICT_CONFIG["RE"];
                  const isErr = r.status === "CE" || r.status === "RE";
                  return (
                    <div key={r.case_id ?? i} className="px-5 py-3 flex items-start gap-4">
                      <div className={`mt-0.5 flex items-center gap-1.5 font-mono text-[11px] font-bold min-w-[110px] ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </div>
                      <div className="flex-1 min-w-0">
                        {isErr && (r.stderr || r.stdout) ? (
                          <pre className="text-[11px] font-mono text-zinc-400 whitespace-pre-wrap truncate max-h-12 overflow-hidden">
                            {(r.stderr || r.stdout).slice(0, 300)}
                          </pre>
                        ) : r.status === "WA" ? (
                          <div className="text-[11px] font-mono text-zinc-500 space-y-0.5">
                            {/* ONLY show expected/got if it's a sample OR current user is teacher OR group setting allows it */}
                            {isTeacher ? (
                              <>
                                <div><span className="text-zinc-600">Expected: </span><span className="text-emerald-400">{r.expected.slice(0, 80)}</span></div>
                                <div><span className="text-zinc-600">Got:      </span><span className="text-red-400">{(r.stdout || "").trim().slice(0, 80)}</span></div>
                              </>
                            ) : (
                              <div className="italic text-zinc-600 tracking-tight">Verdict details are hidden for this project.</div>
                            )}
                          </div>
                        ) : null}
                      </div>
                      <span className="text-[10px] text-zinc-600 font-mono shrink-0">Case {i + 1}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

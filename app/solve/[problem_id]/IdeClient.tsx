"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Play, Languages, Send, FlaskConical, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { mapStatusToDbEnum } from "@/utils/judge0";

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

export default function IdeClient({ 
  problemId, 
  userId, 
  translations, 
  testCases,
  timeLimitMs,
  memoryLimitKb
}: { 
  problemId: string; 
  userId: string; 
  translations: Translation[];
  testCases: TestCase[];
  timeLimitMs: number;
  memoryLimitKb: number;
}) {
  const [code, setCode] = useState("#include <iostream>\nusing namespace std;\n\nint main() {\n  // Your solution here\n  \n  return 0;\n}");
  const [lang, setLang] = useState(translations.length > 0 ? translations[0].language_code : "EN");
  const [output, setOutput] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showTestCases, setShowTestCases] = useState(true);
  
  // Custom stdin — defaults to first test case input if available
  const [customStdin, setCustomStdin] = useState(testCases.length > 0 ? testCases[0].input : "");
  const [useCustomInput, setUseCustomInput] = useState(false);
  
  // Translation form states
  const [newTransLang, setNewTransLang] = useState("");
  const [newTransTitle, setNewTransTitle] = useState("");
  const [newTransDesc, setNewTransDesc] = useState("");

  const supabase = createClient();

  const handleRun = async (stdinOverride?: string) => {
    if (isRunning) return;
    setIsRunning(true);
    setOutput("Executing on Judge0 worker...\n");

    const stdin = stdinOverride ?? (useCustomInput ? customStdin : (testCases.length > 0 ? testCases[0].input : ""));

    try {
      const res = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          source_code: code, 
          language: "cpp", 
          stdin: stdin,
          time_limit_ms: timeLimitMs
        })
      });

      const data = await res.json();
      
      if (data.error) {
        setOutput((prev) => prev + `[Error]: ${data.error}`);
        return;
      }

      // Wandbox results are in data.results[0]
      const result = data.results?.[0] || {};
      const finalStatus = result.status === "AC" ? "AC" : result.status || "RE";

      // Log submission to database
      await supabase.from('submissions').insert({
        problem_id: problemId,
        student_id: userId,
        code: code,
        language_id: 1, // C++
        status: mapStatusToDbEnum(finalStatus),
        execution_time_ms: result.time_ms || 0,
        memory_used_kb: 0
      });

      const compilationInfo = result.stderr && result.status === "CE" ? `[Compilation]:\n${result.stderr}\n` : "";
      const stdoutInfo = result.stdout ? `[Output]:\n${result.stdout}\n` : "";
      const stderrInfo = result.stderr && result.status !== "CE" ? `[Stderr]:\n${result.stderr}\n` : "";
      const statusInfo = `[Status]: ${finalStatus} (${result.time_ms || 0}ms)`;
      
      // Expected vs Actual comparison for Run
      const expectedOutput = testCases.length > 0 ? testCases[0].expected_output.trim() : null;
      const actualOutput = (result.stdout || "").trim();
      let verdictInfo = "";
      if (expectedOutput && result.status === "AC") {
        if (actualOutput === expectedOutput) {
          verdictInfo = "\n✅ Output matches expected result!\n";
        } else {
          verdictInfo = `\n❌ Wrong Answer\n  Expected: ${expectedOutput}\n  Got:      ${actualOutput}\n`;
        }
      }

      setOutput(`Execution Finished.\n\n${compilationInfo}${stdoutInfo}${stderrInfo}${verdictInfo}\n${statusInfo}`);

    } catch (e) {
      setOutput("Failed to reach compiler network.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleTranslationSubmit = async () => {
    if (!newTransLang || !newTransTitle || !newTransDesc) return;
    await supabase.from('problem_translations').insert({
      problem_id: problemId,
      language_code: newTransLang.toUpperCase(),
      title: newTransTitle,
      description: newTransDesc,
      author_id: userId,
      status: 'Pending'
    });
    setIsTranslating(false);
    alert("Translation submitted to Moderation Queue!");
  };

  const currentTranslation = translations.find(t => t.language_code === lang) || translations[0];

  return (
    <div className="flex-1 w-full flex overflow-hidden">
      
      {/* Left Panel: Problem Description & Translations */}
      <div className="w-1/3 min-w-[400px] border-r border-white/[0.04] bg-[#050505]/80 backdrop-blur-3xl flex flex-col z-10 shadow-[8px_0_24px_rgba(0,0,0,0.5)]">
        <header className="p-6 border-b border-white/[0.04] flex justify-between items-start bg-white/[0.01]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold px-2 py-0.5 bg-amber-500/20 text-amber-500 rounded border border-amber-500/30 uppercase tracking-wide">Dynamic</span>
              <span className="text-[10px] font-mono text-zinc-600">{timeLimitMs}ms | {Math.round(memoryLimitKb / 1024)}MB</span>
            </div>
            <h1 className="text-xl font-bold">{currentTranslation?.title || "Problem Description Unavailable"}</h1>
          </div>
        </header>

        {/* Translation Controls */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-white/[0.02] border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-zinc-400" />
            <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value)}
              className="bg-white/[0.05] hover:bg-white/[0.08] transition-colors text-sm py-1.5 px-3 rounded-lg border border-white/[0.05] outline-none focus:border-emerald-500/50 cursor-pointer shadow-sm text-zinc-300"
            >
              {translations.map(t => (
                <option key={t.language_code} value={t.language_code}>{t.language_code}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => setIsTranslating(!isTranslating)}
            className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
          >
            {isTranslating ? "Cancel Translation" : "Submit Translation"}
          </button>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-6 text-sm text-zinc-300 leading-relaxed font-sans space-y-4">
          {isTranslating ? (
            <div className="space-y-4">
              <p className="text-emerald-400 text-xs font-mono p-3 border border-emerald-900 bg-emerald-950/20 rounded">
                You are submitting a translation. Your prompt will enter a moderation queue.
              </p>
              <div>
                <label className="text-xs text-zinc-500 uppercase font-bold mb-1 block">Language Code</label>
                <input value={newTransLang} onChange={e=>setNewTransLang(e.target.value)} type="text" placeholder="e.g. TR, FR, ES" className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded focus:border-[#00ff00] outline-none" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase font-bold mb-1 block">Translated Title</label>
                <input value={newTransTitle} onChange={e=>setNewTransTitle(e.target.value)} type="text" placeholder="Translated Title..." className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded focus:border-[#00ff00] outline-none" />
              </div>
              <div>
                <label className="text-xs text-zinc-500 uppercase font-bold mb-1 block">Translated Description</label>
                <textarea value={newTransDesc} onChange={e=>setNewTransDesc(e.target.value)} rows={8} placeholder="Problem description..." className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded focus:border-[#00ff00] outline-none font-mono" />
              </div>
              <button onClick={handleTranslationSubmit} className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded transition-colors">
                <Send className="w-4 h-4"/> Submit translation
              </button>
            </div>
          ) : (
            <>
              <div className="whitespace-pre-wrap">{currentTranslation?.description}</div>
              
              {/* Sample Test Cases */}
              {testCases.length > 0 && (
                <div className="mt-6 border-t border-zinc-800 pt-4">
                  <button 
                    onClick={() => setShowTestCases(!showTestCases)}
                    className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors mb-3"
                  >
                    <FlaskConical className="w-4 h-4 text-emerald-500"/>
                    <span className="uppercase tracking-wider font-bold">Sample Test Cases ({testCases.length})</span>
                    {showTestCases ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/> }
                  </button>
                  
                  {showTestCases && (
                    <div className="space-y-3">
                      {testCases.map((tc, idx) => (
                        <div key={tc.id} className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
                          <div className="text-[10px] font-mono text-zinc-600 px-3 py-1.5 border-b border-zinc-800 bg-zinc-900">
                            Example #{idx + 1}
                          </div>
                          <div className="grid grid-cols-2 divide-x divide-zinc-800">
                            <div className="p-3">
                              <div className="text-[10px] font-mono text-zinc-600 uppercase mb-1">Input</div>
                              <pre className="text-xs text-zinc-300 font-mono whitespace-pre-wrap">{tc.input || "(empty)"}</pre>
                            </div>
                            <div className="p-3">
                              <div className="text-[10px] font-mono text-zinc-600 uppercase mb-1">Output</div>
                              <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap">{tc.expected_output || "(empty)"}</pre>
                            </div>
                          </div>
                          <div className="px-3 py-1.5 border-t border-zinc-800 bg-zinc-900">
                            <button 
                              onClick={() => { setCustomStdin(tc.input); setUseCustomInput(true); }}
                              className="text-[10px] text-blue-400 hover:text-blue-300 font-mono"
                            >
                              Use this input →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Panel: IDE & Console */}
      <div className="flex-1 flex flex-col bg-[#050505]">
        <div className="flex justify-between items-center px-6 py-3 bg-white/[0.02] border-b border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <div className="flex items-center gap-3">
            <div className="bg-white/[0.05] border border-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] text-[10px] px-3 py-1.5 rounded-md text-zinc-300 font-mono tracking-widest uppercase">main.cpp</div>
          </div>
          <button 
            onClick={() => handleRun()}
            disabled={isRunning}
            className={`flex items-center gap-1.5 bg-[#00ff00]/10 text-[#00ff00] border border-[#00ff00]/30 px-4 py-1.5 rounded text-sm font-semibold transition-colors ${isRunning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#00ff00]/20'}`}
          >
            <Play className="w-4 h-4 fill-current"/>
            {isRunning ? "EXECUTING..." : "RUN & SUBMIT"}
          </button>
        </div>

        <div className="flex-1 bg-transparent relative z-0 pt-4">
          <Editor
            height="100%"
            defaultLanguage="cpp"
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              padding: { top: 16 }
            }}
          />
        </div>

        {/* Console / Output Window */}
        <div className="h-64 border-t border-white/[0.04] bg-[#050505]/50 backdrop-blur-md flex flex-col shadow-[0_-8px_32px_rgba(0,0,0,0.4)] z-10 relative">
          <div className="flex items-center gap-4 px-6 py-3 border-b border-white/[0.04] bg-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
            <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider">Terminal / Judge0 Output</span>
            <div className="flex-1"/>
            <label className="flex items-center gap-2 text-[10px] text-zinc-500 cursor-pointer">
              <input 
                type="checkbox" 
                checked={useCustomInput}
                onChange={(e) => setUseCustomInput(e.target.checked)}
                className="accent-emerald-500"
              />
              Custom Input
            </label>
          </div>

          {/* Custom Input Area (collapsible) */}
          {useCustomInput && (
            <div className="px-6 py-3 border-b border-white/[0.04] bg-black/40">
              <label className="text-[10px] font-mono text-zinc-500 uppercase mb-2 block tracking-widest font-bold">Stdin Input</label>
              <textarea 
                value={customStdin}
                onChange={(e) => setCustomStdin(e.target.value)}
                rows={3}
                className="w-full bg-black border border-zinc-800 rounded p-2 text-xs font-mono outline-none focus:border-emerald-500 text-zinc-300 resize-none"
                placeholder="Enter custom stdin here..."
              />
            </div>
          )}

          <div className="flex-1 p-6 font-mono text-sm overflow-y-auto">
            {output ? <pre className="text-zinc-300 leading-relaxed font-mono">{output}</pre> : <div className="text-zinc-600 italic text-xs tracking-wide">Waiting for execution...</div>}
          </div>
        </div>
      </div>

    </div>
  );
}

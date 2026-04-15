"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, Save, X, Upload, FileArchive } from "lucide-react";
import JSZip from "jszip";

export interface TestCase {
  input: string;
  expected_output: string;
  is_sample: boolean;
}

interface ProblemFormProps {
  initialData?: {
    title: string;
    description: string;
    difficulty: "Easy" | "Medium" | "Hard";
    timeLimitMs: number;
    memoryLimitKb: number;
    testCases: TestCase[];
  };
  onSubmit: (data: {
    title: string;
    description: string;
    difficulty: "Easy" | "Medium" | "Hard";
    timeLimitMs: number;
    memoryLimitKb: number;
    testCases: TestCase[];
  }) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export default function ProblemForm({ 
  initialData, 
  onSubmit, 
  onCancel,
  submitLabel = "Save Problem"
}: ProblemFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">(initialData?.difficulty || "Easy");
  const [timeLimitMs, setTimeLimitMs] = useState(initialData?.timeLimitMs || 2000);
  const [memoryLimitKb, setMemoryLimitKb] = useState(initialData?.memoryLimitKb || 256000);
  const [testCases, setTestCases] = useState<TestCase[]>(initialData?.testCases || [
    { input: "", expected_output: "", is_sample: true }
  ]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addTestCase = () => {
    setTestCases([...testCases, { input: "", expected_output: "", is_sample: false }]);
  };

  const removeTestCase = (idx: number) => {
    setTestCases(testCases.filter((_, i) => i !== idx));
  };

  const updateTestCase = (idx: number, field: keyof TestCase, value: string | boolean) => {
    const updated = [...testCases];
    (updated[idx] as any)[field] = value;
    setTestCases(updated);
  };

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const zip = new JSZip();
      const content = await zip.loadAsync(file);
      
      const files: { [key: string]: { input?: string, output?: string, is_sample: boolean } } = {};

      // Standardize file info extraction
      const getFileDetails = (name: string) => {
        const lower = name.toLowerCase();
        
        // Match numbers: 1.in, input1.txt, test_01.out, sample1.txt, etc.
        const match = name.match(/(\d+)/);
        if (!match) return null;
        const id = match[1];

        // Improved patterns
        const isInput = lower.includes('in') || lower.endsWith('.in') || lower.includes('input');
        const isOutput = lower.includes('out') || lower.includes('output') || lower.includes('ans') || lower.includes('sol') || lower.endsWith('.out') || lower.endsWith('.ans');
        const isSample = lower.includes('sample') || lower.includes('example');
        
        return { id, isInput, isOutput, isSample };
      };

      for (const filename of Object.keys(content.files)) {
        if (content.files[filename].dir) continue;
        
        const details = getFileDetails(filename);
        if (!details) continue;

        if (!files[details.id]) files[details.id] = { is_sample: false };
        if (details.isSample) files[details.id].is_sample = true;

        const text = await content.files[filename].async("text");
        if (details.isInput) files[details.id].input = text;
        if (details.isOutput) files[details.id].output = text;
      }

      const newTestCases: TestCase[] = Object.values(files)
        .filter(f => f.input !== undefined || f.output !== undefined)
        .map(f => ({
          input: f.input || "",
          expected_output: f.output || "",
          is_sample: f.is_sample
        }));

      if (newTestCases.length > 0) {
        if (confirm(`Detected ${newTestCases.length} test cases in ZIP. Append to existing or replace? \n(Cancel = Append, OK = Replace)`)) {
          setTestCases(newTestCases);
        } else {
          setTestCases([...testCases, ...newTestCases]);
        }
      } else {
        alert("No valid test cases found in ZIP. Ensure files are named like '1.in' / '1.out' or 'input1.txt' / 'output1.txt'.");
      }
    } catch (err: any) {
      alert("Error reading ZIP: " + err.message);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const internalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    
    // Validate at least one test case has content
    const validTestCases = testCases.filter(tc => tc.input.trim() || tc.expected_output.trim());
    if (validTestCases.length === 0) {
      alert("Please add at least one test case with input or expected output.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title,
        description,
        difficulty,
        timeLimitMs,
        memoryLimitKb,
        testCases: validTestCases
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={internalSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Basic Info */}
        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">Problem Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-lg p-3 text-sm outline-none transition-all shadow-inner"
              placeholder="e.g. Find Rotation Point"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">Difficulty & Limits</label>
            <div className="grid grid-cols-3 gap-3">
              <select 
                value={difficulty} 
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs outline-none focus:border-emerald-500/50"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              <input 
                type="number" 
                value={timeLimitMs}
                onChange={(e) => setTimeLimitMs(Number(e.target.value))}
                className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs outline-none focus:border-emerald-500/50"
                placeholder="Time (ms)"
                min={500}
                max={10000}
              />
              <input 
                type="number" 
                value={memoryLimitKb}
                onChange={(e) => setMemoryLimitKb(Number(e.target.value))}
                className="bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs outline-none focus:border-emerald-500/50"
                placeholder="Memory (KB)"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">Problem Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-64 bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-lg p-3 text-sm outline-none font-mono transition-all resize-none shadow-inner"
              placeholder="Constraints, examples, and goal..."
              required
            />
          </div>
        </div>

        {/* Right Column: Test Cases */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-1 border-b border-zinc-800/50">
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">Test Cases</label>
            <div className="flex items-center gap-3">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleZipUpload} 
                className="hidden" 
                accept=".zip"
              />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] text-zinc-400 hover:text-white font-bold uppercase tracking-tighter flex items-center gap-1 transition-colors"
                title="Upload ZIP containing inputX.txt / outputX.txt"
              >
                <FileArchive className="w-3 h-3" /> Import ZIP
              </button>
              <button 
                type="button" 
                onClick={addTestCase}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-tighter flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Case
              </button>
            </div>
          </div>

          <div className="max-h-[460px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
            {testCases.map((tc, idx) => (
              <div key={idx} className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3 relative group">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-zinc-600 uppercase">Case #{idx + 1}</span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-[10px] cursor-pointer hover:text-zinc-300 transition-colors uppercase font-bold">
                      <input 
                        type="checkbox"
                        checked={tc.is_sample}
                        onChange={(e) => updateTestCase(idx, "is_sample", e.target.checked)}
                        className="accent-emerald-500 w-3 h-3 rounded border-zinc-800"
                      />
                      <span className={tc.is_sample ? "text-emerald-400" : "text-zinc-500 opacity-50"}>
                        {tc.is_sample ? "Sample" : "Hidden"}
                      </span>
                    </label>
                    {testCases.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeTestCase(idx)} 
                        className="text-zinc-700 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <textarea 
                    value={tc.input}
                    onChange={(e) => updateTestCase(idx, "input", e.target.value)}
                    rows={2}
                    className="w-full bg-black/50 border border-zinc-800/50 focus:border-zinc-700 rounded-lg p-2 text-[11px] font-mono outline-none transition-all"
                    placeholder="Input"
                  />
                  <textarea 
                    value={tc.expected_output}
                    onChange={(e) => updateTestCase(idx, "expected_output", e.target.value)}
                    rows={2}
                    className="w-full bg-black/50 border border-zinc-800/50 focus:border-zinc-700 rounded-lg p-2 text-[11px] font-mono outline-none transition-all"
                    placeholder="Output"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-zinc-800 flex items-center justify-end gap-4">
        {onCancel && (
          <button 
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors font-mono"
          >
            Cancel
          </button>
        )}
        <button 
          type="submit" 
          disabled={loading}
          className="flex items-center gap-2 px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-all text-xs uppercase tracking-widest disabled:opacity-50 shadow-lg shadow-emerald-900/20"
        >
          {loading ? "Processing..." : (
            <>
              <Save className="w-4 h-4" />
              {submitLabel}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

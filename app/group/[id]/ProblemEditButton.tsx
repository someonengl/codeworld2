"use client";

import { useState } from "react";
import { Edit2, X } from "lucide-react";
import ProblemForm from "@/app/components/ProblemForm";
import { updateProblem } from "@/app/actions/createProblem";

export default function ProblemEditButton({ problem }: { problem: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const translation = problem.problem_translations?.[0];
  
  // Extract title and description from translation
  const rawDescription = translation?.description || "/";
  // Remove the [Difficulty: X] metadata tag for editing
  const title = translation?.title || "Untitled Problem";
  const difficultyMatch = rawDescription.match(/\[Difficulty: (Easy|Medium|Hard)\]\n\n/);
  const difficulty = (difficultyMatch?.[1] as any) || "Easy";
  const description = rawDescription.replace(/\[Difficulty: (Easy|Medium|Hard)\]\n\n/, "");

  const initialData = {
    title,
    description,
    difficulty,
    timeLimitMs: problem.time_limit_ms,
    memoryLimitKb: problem.memory_limit_kb,
    testCases: problem.test_cases?.map((tc: any) => ({
      input: tc.input,
      expected_output: tc.expected_output,
      is_sample: tc.is_sample
    }))
  };

  const handleUpdate = async (data: any) => {
    try {
      await updateProblem(problem.id, data.title, data.description, {
        difficulty: data.difficulty,
        time_limit_ms: data.timeLimitMs,
        memory_limit_kb: data.memoryLimitKb,
        test_cases: data.testCases
      });
      setIsOpen(false);
      window.location.reload();
    } catch (err: any) {
      alert("Failed to update: " + err.message);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-1.5 text-zinc-600 hover:text-emerald-500 transition-colors rounded hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100"
        title="Edit Problem"
      >
        <Edit2 className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl ring-1 ring-white/10">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono">EDIT_ALGORITHMIC_PROBLEM</h3>
                  <p className="text-[10px] text-zinc-500 font-mono tracking-tighter uppercase">{problem.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-[#0a0a0a]">
              <ProblemForm 
                initialData={initialData}
                onSubmit={handleUpdate}
                onCancel={() => setIsOpen(false)}
                submitLabel="Apply Changes"
              />
            </div>
            
            {/* Footer Status */}
            <div className="px-6 py-2 bg-zinc-950 border-t border-zinc-800 flex justify-end">
               <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">System Ready • v2.0 - Hotfix: Edit_Enabled</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

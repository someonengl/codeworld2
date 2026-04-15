"use client";

import { useState } from "react";
import { createProblem } from "@/app/actions/createProblem";
import { Plus } from "lucide-react";
import ProblemForm from "@/app/components/ProblemForm";

export default function TeacherHubControls({ groupId }: { groupId: string }) {
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (data: any) => {
    await createProblem(groupId, data.title, data.description, {
      difficulty: data.difficulty,
      time_limit_ms: data.timeLimitMs,
      memory_limit_kb: data.memoryLimitKb,
      test_cases: data.testCases
    });
    window.location.reload();
  };

  return (
    <div className="mb-6">
      <button 
        onClick={() => setIsCreating(!isCreating)}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded text-sm font-bold tracking-widest uppercase hover:bg-emerald-500/20 transition-colors"
      >
        <Plus className="w-4 h-4" /> {isCreating ? "Cancel Creation" : "Add Assignment"}
      </button>

      {isCreating && (
        <div className="mt-4 p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl ring-1 ring-white/5">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 font-mono">
             <span className="w-2 h-6 bg-emerald-500 block rounded-full" />
             CREATE_NEW_PROBLEM
          </h2>
          <ProblemForm 
            onSubmit={handleSubmit} 
            onCancel={() => setIsCreating(false)}
            submitLabel="Deploy Problem to Hub"
          />
        </div>
      )}
    </div>
  );
}

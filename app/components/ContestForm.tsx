"use client";

import { useState } from "react";
import { X, Calendar, Clock, Link as LinkIcon, Plus, Trophy } from "lucide-react";

interface ContestFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    problemIds: string[];
  }) => void;
  onCancel: () => void;
}

export default function ContestForm({ onSubmit, onCancel }: ContestFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [problemIds, setProblemIds] = useState<string[]>([""]);

  const handleAddProblemId = () => setProblemIds([...problemIds, ""]);
  
  const handleProblemIdChange = (index: number, val: string) => {
    const next = [...problemIds];
    next[index] = val;
    setProblemIds(next);
  };

  const handleRemoveProblemId = (index: number) => {
    setProblemIds(problemIds.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      startTime,
      endTime,
      problemIds: problemIds.filter(id => id.trim().length > 0)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5 block">Contest_Title</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Winter Algorithm Cup 2024"
              className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm focus:border-emerald-500 focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rules and prize information..."
              className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 font-mono text-sm focus:border-emerald-500 focus:outline-none transition-all h-24 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5 block">Start_Time</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  required
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 font-mono text-xs focus:border-emerald-500 focus:outline-none transition-all [color-scheme:dark]"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5 block">End_Time</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  required
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 font-mono text-xs focus:border-emerald-500 focus:outline-none transition-all [color-scheme:dark]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5 block">Problem_Set (Archive UUIDs)</label>
          <div className="max-height-[300px] overflow-y-auto space-y-2 pr-2 scrollbar-hide">
            {problemIds.map((id, index) => (
              <div key={index} className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-700" />
                  <input
                    type="text"
                    value={id}
                    onChange={(e) => handleProblemIdChange(index, e.target.value)}
                    placeholder="Problem UUID..."
                    className="w-full bg-black border border-zinc-800 rounded-lg pl-9 pr-4 py-2 font-mono text-[10px] focus:border-emerald-500 focus:outline-none transition-all"
                  />
                </div>
                {problemIds.length > 1 && (
                  <button type="button" onClick={() => handleRemoveProblemId(index)} className="p-2 text-zinc-600 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button 
              type="button" 
              onClick={handleAddProblemId}
              className="w-full py-2 border border-dashed border-zinc-800 rounded-lg text-zinc-500 hover:text-emerald-500 hover:border-emerald-500/50 transition-all text-[10px] font-mono flex items-center justify-center gap-2 uppercase tracking-widest"
            >
              <Plus className="w-3 h-3" /> Add Challenge to Set
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 text-xs font-mono text-zinc-500 hover:text-white transition-colors"
        >
          ABORT_MISSION
        </button>
        <button
          type="submit"
          className="px-8 py-2 bg-emerald-500 text-black text-xs font-bold rounded-lg hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.2)]"
        >
          <Trophy className="w-4 h-4" /> DEPLOY_CONTEST
        </button>
      </div>
    </form>
  );
}

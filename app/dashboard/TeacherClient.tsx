"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function TeacherClient({ initialGroups, userId }: { initialGroups: any[], userId: string }) {
  const [groups, setGroups] = useState(initialGroups);
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupCode, setNewGroupCode] = useState("");
  const supabase = createClient();

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName || !newGroupCode) return;

    const { data, error } = await supabase.from('groups').insert({
      teacher_id: userId,
      name: newGroupName,
      join_code: newGroupCode
    }).select().single();

    if (error) {
      alert(error.message);
      return;
    }

    setGroups([...groups, data]);
    setIsCreating(false);
    setNewGroupName("");
    setNewGroupCode("");
  };

  return (
    <div className="space-y-6 animate-fade-in delay-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 border-l-2 border-brand-orange/50 pl-3">Active Groups</h2>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="text-[11px] font-bold uppercase tracking-widest bg-white/[0.02] border border-white/[0.04] px-4 py-2 rounded-xl transition-all duration-300 hover:bg-brand-cyan/10 hover:text-brand-cyan hover:border-brand-cyan/30"
        >
          {isCreating ? "CANCEL" : "+ CREATE GROUP"}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreateGroup} className="p-8 bg-white/[0.02] backdrop-blur-md border border-white/[0.04] rounded-2xl flex flex-col gap-4 max-w-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] animate-fade-in">
          <input
            type="text"
            placeholder="Classroom Name (e.g. CS101)"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl outline-none focus:border-brand-cyan/50 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-colors"
          />
          <input
            type="text"
            placeholder="Unique Join Code"
            value={newGroupCode}
            onChange={e => setNewGroupCode(e.target.value)}
            className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl outline-none focus:border-brand-cyan/50 text-sm font-mono text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition-colors"
          />
          <button type="submit" className="bg-brand-cyan hover:bg-brand-cyan/90 text-black font-bold py-3 mt-2 rounded-xl transition-all shadow-[0_0_20px_rgba(0,245,255,0.2)] text-[11px] uppercase tracking-widest hover:-translate-y-0.5">
            Launch Classroom
          </button>
        </form>
      )}

      {groups.length === 0 && !isCreating && (
        <div className="text-zinc-500 font-mono text-sm italic p-8 text-center bg-white/[0.02] backdrop-blur-md border border-white/[0.04] border-dashed rounded-[1.5rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          No active classrooms. Create one to begin.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in delay-300">
        {groups.map((g, i) => (
          <div key={g.id} className="flex flex-col p-8 bg-white/[0.02] backdrop-blur-md border border-white/[0.04] transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/[0.04] rounded-[1.5rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] group hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex justify-between items-start mb-6">
              <h3 className="font-bold text-lg text-white group-hover:text-brand-cyan transition-colors tracking-tight">{g.name}</h3>
              <span className="text-[10px] font-mono font-bold tracking-widest bg-white/[0.05] border border-white/[0.05] text-zinc-300 px-2 py-1 rounded-md">Code: {g.join_code}</span>
            </div>
            <div className="mt-auto pt-6 flex gap-2 relative border-t border-white/[0.04]">
              <a href={`/group/${g.id}`} className="flex-1 text-center bg-white text-black text-[11px] uppercase tracking-widest font-bold py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:-translate-y-0.5 hover:bg-zinc-200 relative">
                Manage Hub
                {g.pendingCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-bounce border-2 border-[#1c1c1e]">
                    {g.pendingCount}
                  </span>
                )}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

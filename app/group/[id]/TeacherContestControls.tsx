"use client";

import { useState, useEffect } from "react";
import { Plus, Trophy, X, Globe, Library, Search, Loader2 } from "lucide-react";
import ContestForm from "@/app/components/ContestForm";
import { createContest } from "@/app/actions/createContest";
import { createClient } from "@/utils/supabase/client";

export default function TeacherContestControls({ 
  groupId, 
  problems: groupProblems 
}: { 
  groupId: string;
  problems: any[];
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'hub' | 'archive'>('hub');
  const [archiveSearch, setArchiveSearch] = useState("");
  const [archiveResults, setArchiveResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const supabase = createClient();

  const handleArchiveSearch = async () => {
    if (!archiveSearch.trim()) return;
    setIsSearching(true);
    const { data } = await supabase
      .from('problems')
      .select('*, problem_translations(*)')
      .eq('is_public', true)
      .eq('status', 'Approved')
      .textSearch('problem_translations.title', archiveSearch)
      .limit(10);
    
    setArchiveResults(data || []);
    setIsSearching(false);
  };

  const handleSubmit = async (data: any) => {
    try {
      await createContest(
        groupId,
        data.title,
        data.description,
        data.startTime,
        data.endTime,
        data.problemIds
      );
      setIsCreating(false);
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="mb-6">
      <button 
        onClick={() => setIsCreating(!isCreating)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded text-sm font-bold tracking-widest uppercase hover:bg-blue-500/20 transition-all font-mono"
      >
        <Plus className="w-4 h-4" /> {isCreating ? "Cancel_Creation" : "Deploy_New_Contest"}
      </button>

      {isCreating && (
        <div className="mt-6 p-8 bg-zinc-950 border border-zinc-800 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10 animate-in fade-in zoom-in duration-300">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-3 font-mono">
               <Trophy className="w-6 h-6 text-blue-500" />
               CONTEST_ENGINE_V1
            </h2>
            <button onClick={() => setIsCreating(false)} className="text-zinc-500 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
            <div>
              <ContestForm 
                onSubmit={handleSubmit} 
                onCancel={() => setIsCreating(false)}
              />
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-4 h-[600px] flex flex-col overflow-hidden">
              <div className="flex items-center gap-1 p-1 bg-black border border-zinc-800 rounded-xl mb-2">
                <button 
                  onClick={() => setActiveTab('hub')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-mono font-bold rounded-lg transition-all ${activeTab === 'hub' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <Library className="w-3 h-3" /> HUB_STORE
                </button>
                <button 
                  onClick={() => setActiveTab('archive')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-mono font-bold rounded-lg transition-all ${activeTab === 'archive' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <Globe className="w-3 h-3" /> ARCHIVE
                </button>
              </div>

              {activeTab === 'archive' && (
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                    <input 
                      type="text"
                      value={archiveSearch}
                      onChange={(e) => setArchiveSearch(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleArchiveSearch()}
                      placeholder="Search Approved Problems..."
                      className="w-full bg-black border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-[10px] font-mono focus:border-blue-500/50 outline-none"
                    />
                  </div>
                  <button 
                    onClick={handleArchiveSearch}
                    disabled={isSearching}
                    className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-all disabled:opacity-50"
                  >
                    {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                {activeTab === 'hub' ? (
                  groupProblems && groupProblems.length > 0 ? (
                    groupProblems.map((p) => (
                      <div key={p.id} className="p-3 bg-black border border-zinc-800 rounded-xl group/item">
                        <div className="text-[11px] font-bold text-zinc-300 truncate mb-1">
                          {p.problem_translations?.[0]?.title || "Untitled"}
                        </div>
                        <div className="flex items-center justify-between">
                          <code className="text-[9px] text-blue-500 font-mono select-all">
                            {p.id}
                          </code>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-zinc-700 italic text-center py-8">No hub problems found.</p>
                  )
                ) : (
                  archiveResults.length > 0 ? (
                    archiveResults.map((p) => (
                      <div key={p.id} className="p-3 bg-black border border-blue-500/20 rounded-xl group/item">
                        <div className="text-[11px] font-bold text-blue-400 truncate mb-1">
                          {p.problem_translations?.[0]?.title || "Untitled"}
                        </div>
                        <div className="flex items-center justify-between">
                          <code className="text-[9px] text-zinc-500 font-mono select-all">
                            {p.id}
                          </code>
                          <span className="text-[8px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded font-bold uppercase">Archive</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-zinc-700 italic text-center py-8">Search for approved archive problems.</p>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

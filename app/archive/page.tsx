"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Terminal, Book, User, ArrowRight, Zap, Target, Search, Plus, X, CheckCircle2 } from "lucide-react";
import { motion, Variants } from "framer-motion";
import MotionCard from "@/app/components/MotionCard";
import ProblemForm from "@/app/components/ProblemForm";
import { createProblem } from "@/app/actions/createProblem";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
};

const statsItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const gridContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } }
};

const problemItem: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

interface Problem {
  id: string;
  is_public: boolean;
  teacher_id: string;
  created_at: string;
  problem_translations: {
    title: string;
    description: string;
    language_code: string;
  }[];
  profiles: {
    username: string;
  };
}

export default function ArchivePage() {
  const supabase = createClient();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isContributing, setIsContributing] = useState(false);

  useEffect(() => {
    async function fetchArchive() {
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from('problems')
        .select(`
          *,
          problem_translations (*),
          profiles (username)
        `)
        .eq('is_public', true);

      // Safety check: only filter by status if the column exists
      const { data: checkData, error: checkError } = await supabase.from('problems').select('status').limit(1);

      if (!checkError) {
        query = query.eq('status', 'Approved');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (data) setProblems(data as any);

      // Fetch user's solved problems
      if (user) {
        const { data: subs } = await supabase
          .from('submissions')
          .select('problem_id')
          .eq('student_id', user.id)
          .eq('status', 'Accepted');

        if (subs) {
          setSolvedIds(new Set(subs.map((s: any) => s.problem_id)));
        }
      }

      setLoading(false);
    }
    fetchArchive();
  }, [supabase]);

  const handleContribute = async (data: any) => {
    await createProblem(null, data.title, data.description, {
      difficulty: data.difficulty,
      time_limit_ms: data.timeLimitMs,
      memory_limit_kb: data.memoryLimitKb,
      test_cases: data.testCases,
      is_public: true
    });
    setIsContributing(false);
    window.location.reload();
  };

  const filteredProblems = problems.filter(p => {
    const title = p.problem_translations[0]?.title?.toLowerCase() || "";
    const username = p.profiles?.username?.toLowerCase() || "";
    return title.includes(searchQuery.toLowerCase()) || username.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 p-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute top-[20%] left-[10%] w-[40vw] h-[40vw] rounded-full bg-emerald-900/10 blur-[130px]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 animate-fade-in">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-emerald-500 font-mono text-sm mb-2 uppercase tracking-[0.2em] font-bold">
              <Terminal className="w-4 h-4" />
              Global_Archive
            </div>
            <Link href="/" className="group/title block w-fit hover:opacity-85 transition-opacity">
              <h1 className="text-4xl font-black tracking-tight text-white mb-2">
                The <span className="text-emerald-500">Codeworld</span> Repository
              </h1>
            </Link>
            <p className="text-zinc-500 font-mono text-sm">
              Discover challenges created by teachers and elite students across the community.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" />
              <input
                type="text"
                placeholder="Search challenges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/[0.02] backdrop-blur-md border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] rounded-xl pl-10 pr-4 py-3 w-full md:w-64 font-mono text-sm focus:outline-none focus:bg-white/[0.04] focus:border-emerald-500/50 transition-all text-white"
              />
            </div>
            <button
              onClick={() => setIsContributing(true)}
              className="px-6 py-3 bg-emerald-500 text-black rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(52,211,153,0.2)] cursor-pointer"
            >
              <Plus className="w-5 h-5" /> Contribute
            </button>
          </div>
        </div>

        {/* Contribution Modal Overlay */}
        {isContributing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-10 relative scrollbar-hide ring-1 ring-white/10 shadow-2xl">
              <button
                onClick={() => setIsContributing(false)}
                className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-8 h-8" />
              </button>
              <div className="mb-10">
                <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">PROPOSE_GLOBAL_CHALLENGE</h2>
                <p className="text-zinc-500 font-mono text-sm">Your problem will be available to all teachers and students in the archive.</p>
              </div>
              <ProblemForm
                onSubmit={handleContribute}
                onCancel={() => setIsContributing(false)}
                submitLabel="Deploy to Global Archive"
              />
            </div>
          </div>
        )}

        {/* 2-Column Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Content Area (Span 8) - Problems Grid */}
          <div className="lg:col-span-8 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredProblems.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-zinc-800 rounded-3xl">
                <Book className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <h3 className="text-zinc-500 font-mono">No problems found in the archive.</h3>
              </div>
            ) : (
              <motion.div
                initial="hidden"
                animate="show"
                variants={gridContainer}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {filteredProblems.map((p, i) => (
                  <motion.div
                    key={p.id}
                    variants={problemItem}
                  >
                    <Link
                      href={`/solve/${p.id}`}
                      className="block h-full"
                    >
                      <MotionCard
                        glowColor="rgba(16,185,129,0.1)"
                        className="group relative bg-white/[0.02] backdrop-blur-3xl border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] rounded-2xl p-6 hover:bg-white/[0.04] hover:border-emerald-500/30 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.6)] transition-all duration-500 hover:-translate-y-1.5 overflow-hidden h-full flex flex-col"
                      >
                        {/* ID Badge */}
                        <div className="absolute top-0 right-0 px-3 py-1 bg-white/[0.03] border-l border-b border-white/[0.06] rounded-bl-xl text-[10px] font-mono text-zinc-600 tracking-tighter">
                          #{p.id.slice(0, 8)}
                        </div>

                        <div className="mb-4">
                          <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors mb-2 pr-12">
                            {p.problem_translations[0]?.title || "Untitled Challenge"}
                          </h3>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 font-mono uppercase">Standard</span>
                            {solvedIds.has(p.id) && (
                              <span className="text-[10px] px-2 py-0.5 rounded border border-blue-500/20 bg-blue-500/10 text-blue-400 font-mono uppercase flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Solved
                              </span>
                            )}
                            <span className="text-[10px] text-zinc-600 font-mono flex items-center gap-1">
                              <User className="w-3 h-3" />
                              @{p.profiles?.username || "anonymous"}
                            </span>
                          </div>
                        </div>

                        <p className="text-zinc-500 text-xs font-mono line-clamp-2 mb-6 leading-relaxed flex-1">
                          {p.problem_translations[0]?.description.replace(/<[^>]*>?/gm, "") || "No description available for this global challenge."}
                        </p>

                        <div className="flex items-center justify-between mt-auto">
                          <div className="text-[10px] font-mono text-zinc-700">
                            {new Date(p.created_at).toLocaleDateString()}
                          </div>
                          <motion.div
                            className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-black transition-all"
                            whileHover={{ scale: 1.2, rotate: 45 }}
                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                          >
                            <ArrowRight className="w-4 h-4" />
                          </motion.div>
                        </div>
                      </MotionCard>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Right Sidebar (Span 4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Dashboard Shortcuts Card */}
            <div className="bg-white/[0.01] backdrop-blur-md border border-white/[0.04] p-6 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-l-2 border-emerald-500/50 pl-3">Shortcuts</h3>
              <div className="flex flex-col gap-2">
                <Link href="/dashboard" className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.08] rounded-xl text-sm font-semibold text-zinc-300 hover:text-white transition-all group">
                  Go to Dashboard <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </Link>
                <Link href="/topics" className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.08] rounded-xl text-sm font-semibold text-zinc-300 hover:text-white transition-all group">
                  Explore Topics <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </Link>
                <button onClick={() => setIsContributing(true)} className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-all text-left w-full cursor-pointer group">
                  Contribute Challenge <Plus className="w-4 h-4 text-emerald-400 group-hover:rotate-90 transition-transform" />
                </button>
              </div>
            </div>

            {/* CodeWorld Problems Stats Card */}
            <div className="bg-white/[0.01] backdrop-blur-md border border-white/[0.04] p-6 rounded-2xl space-y-4">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-l-2 border-emerald-500/50 pl-3">Stats</h3>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { icon: Zap, bg: "bg-emerald-500/10", border: "border-emerald-500/20", color: "text-emerald-400", glow: "rgba(16,185,129,0.12)", label: "Total Problems", val: problems.length },
                  { icon: Target, bg: "bg-blue-500/10", border: "border-blue-500/20", color: "text-blue-400", glow: "rgba(59,130,246,0.12)", label: "Solved Rank", val: "N/A" },
                  { icon: User, bg: "bg-purple-500/10", border: "border-purple-500/20", color: "text-purple-400", glow: "rgba(168,85,247,0.12)", label: "Contributors", val: new Set(problems.map(p => p.teacher_id)).size },
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={i} className="bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center border ${s.border}`}>
                        <Icon className={`w-4 h-4 ${s.color}`} />
                      </div>
                      <div>
                        <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-bold">{s.label}</div>
                        <div className="text-xl font-black font-mono text-white">{s.val}</div>
                       </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

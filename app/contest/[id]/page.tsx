import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Trophy, Clock, ArrowRight, BookOpen, AlertCircle, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function ContestArenaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const supabaseAdmin = createAdminClient();

  // Fetch Contest Metadata
  const { data: contest } = await supabaseAdmin
    .from('contests')
    .select('*, groups(name)')
    .eq('id', id)
    .single();

  if (!contest) redirect("/dashboard");

  // Fetch Problems linked to this contest
  const { data: contestProblems } = await supabaseAdmin
    .from('contest_problems')
    .select('*, problems(*, problem_translations(*))')
    .eq('contest_id', id)
    .order('order_index', { ascending: true });

  const now = new Date();
  const start = new Date(contest.start_time);
  const end = new Date(contest.end_time);
  const isLive = now >= start && now <= end;
  const isCompleted = now > end;
  const isUpcoming = now < start;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 relative overflow-hidden">
      {/* Background FX */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.05)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
      
      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Navigation Breadcrumb */}
        <nav className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-8 font-bold">
          <Link href={`/group/${contest.group_id}`} className="hover:text-purple-400 transition-colors">Group Hub</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-zinc-300">Contest Arena</span>
        </nav>

        {/* Header Hero */}
        <header className="mb-12 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-[0.15em] border ${
                  isLive ? "bg-purple-500 text-white border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] animate-pulse" : 
                  isCompleted ? "bg-zinc-800 text-zinc-400 border-zinc-700" : 
                  "bg-amber-500/20 text-amber-400 border-amber-500/30"
                }`}>
                  {isLive ? "Live Arena" : isCompleted ? "Upsolving Mode" : "Scheduled"}
                </div>
                {isCompleted && (
                  <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-zinc-500 uppercase">
                    <AlertCircle className="w-3 h-3" /> Practice only
                  </div>
                )}
              </div>
              <h1 className="text-5xl font-black tracking-tight text-white uppercase italic">
                {contest.title}
              </h1>
              <p className="text-zinc-500 font-mono text-xs max-w-2xl leading-relaxed">
                {contest.description || "No official directive provided for this rotation."}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
               <div className="flex items-center gap-3 bg-white/[0.02] border border-white/[0.05] rounded-2xl px-5 py-3 backdrop-blur-sm">
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-0.5">Timeline</p>
                    <p className="text-sm font-mono text-white font-black italic">
                      {isCompleted ? "CONTEST_FINALIZED" : isUpcoming ? "T-MINUS_" + Math.round((start.getTime() - now.getTime())/3600000) + "H" : "SYSTEM_ACTIVE"}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <Trophy className={`w-6 h-6 ${isLive ? "text-purple-400" : "text-zinc-700"}`} />
               </div>
            </div>
          </div>
        </header>

        {/* Problems List */}
        <div className="space-y-12">
          <section>
            <div className="flex items-center gap-2 mb-6">
               <div className="h-4 w-1 bg-purple-500 rounded-full" />
               <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500">Problem Rotation</h2>
            </div>

            {isUpcoming ? (
              <div className="p-16 border-2 border-dashed border-white/[0.05] rounded-[2rem] bg-white/[0.01] flex flex-col items-center justify-center text-center">
                <Clock className="w-12 h-12 text-zinc-800 mb-4" />
                <h3 className="text-xl font-bold text-zinc-700 uppercase italic">Encryption Active</h3>
                <p className="text-zinc-600 font-mono text-xs mt-2 max-w-xs">
                  Problem data is currently locked. The arena opens on {start.toLocaleString()}.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {contestProblems && contestProblems.length > 0 ? contestProblems.map((cp: any, idx: number) => {
                  const prob = cp.problems;
                  const trans = prob.problem_translations?.[0];
                  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                  
                  return (
                    <div 
                      key={cp.id} 
                      className="group relative bg-[#0a0a0a] hover:bg-[#0c0c0c] border border-white/[0.04] hover:border-purple-500/30 rounded-[1.25rem] p-6 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] overflow-hidden"
                    >
                      {/* Side Letter */}
                      <div className="absolute top-0 right-0 p-8 opacity-5 font-black text-8xl italic pointer-events-none group-hover:opacity-10 transition-opacity">
                        {letters[idx] || "X"}
                      </div>

                      <div className="flex items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-xl font-black shadow-[0_4px_12px_rgba(168,85,247,0.1)] group-hover:bg-purple-500 group-hover:text-black transition-all">
                              {letters[idx] || (idx + 1)}
                           </div>
                           <div className="space-y-1">
                              <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors uppercase tracking-tight italic">
                                {trans?.title || `Protocol_${prob.id.split('-')[0]}`}
                              </h3>
                              <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-600 uppercase tracking-widest font-bold">
                                <span>TL: {prob.time_limit_ms}ms</span>
                                <div className="w-1 h-1 rounded-full bg-zinc-800" />
                                <span>ML: {Math.round((prob.memory_limit_kb || 262144) / 1024)}MB</span>
                              </div>
                           </div>
                        </div>

                        <Link 
                          href={`/solve/${prob.id}`}
                          className="px-6 py-2.5 bg-white/[0.03] border border-white/[0.06] hover:bg-purple-500 hover:text-black hover:border-purple-400 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group/btn"
                        >
                          {isCompleted ? "Upsolve" : "Begin Solution"}
                          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="p-12 text-center text-zinc-600 font-mono text-sm border border-dashed border-white/[0.05] rounded-3xl">
                    No problems assigned to this rotation yet.
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Guidelines */}
          <section className="bg-purple-500/[0.02] border border-purple-500/10 rounded-3xl p-8">
             <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                   <BookOpen className="w-5 h-5" />
                </div>
                <div>
                   <h4 className="text-sm font-black uppercase tracking-widest text-purple-300 mb-2 italic">Standard Protocols</h4>
                   <p className="text-xs text-zinc-500 leading-relaxed max-w-2xl font-mono">
                      Strict adherence to time limits and resource bounds is mandatory. Submissions made during Upsolving Mode will be recorded for personal growth metrics but will not impact the original competition ranking.
                   </p>
                </div>
             </div>
          </section>
        </div>

      </div>
    </div>
  );
}

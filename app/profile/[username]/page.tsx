import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { User, Code2, AlertCircle, ArrowUpRight, TrendingUp, MapPin, Search, Plus, MoreHorizontal } from "lucide-react";
import ProfileEditClient from "./ProfileEditClient";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> | { username: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const username = resolvedParams.username;
  
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Fetch the target profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single();

  if (!profile) {
    notFound();
  }

  // Fetch current viewer
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user && user.id === profile.id;
  const role = profile.role || "Member";

  // Fetch stats safely
  const { count: solved } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', profile.id)
    .eq('status', 'Accepted');

  const { count: translations } = await supabase
    .from('problem_translations')
    .select('*', { count: 'exact', head: true })
    .eq('author_id', profile.id)
    .eq('status', 'Approved');

  // Fetch some recent submissions to show in the list
  const { data: recentSubs } = await supabase
    .from('submissions')
    .select('id, status, created_at, problem_id')
    .eq('student_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch weekly
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const { data: weekSubsData } = await supabase
    .from('submissions')
    .select('created_at')
    .eq('student_id', profile.id)
    .gte('created_at', sevenDaysAgo.toISOString());

  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  if (weekSubsData) {
     weekSubsData.forEach((sub: any) => {
       const d = new Date(sub.created_at).getDay();
       const index = d === 0 ? 6 : d - 1; // Mon=0, Sun=6
       dayCounts[index]++;
     });
  }
  const maxDayCount = Math.max(...dayCounts, 1);
  const weekHeights = dayCounts.map(c => Math.round((c / maxDayCount) * 100));

  // Fetch languages
  const { data: allSubsLang } = await supabase
    .from('submissions')
    .select('language_id')
    .eq('student_id', profile.id);

  const totalSubmissions = allSubsLang?.length || 0;

  const langCounts = { cpp: 0, python: 0, java: 0, other: 0 };
  if (allSubsLang) {
    allSubsLang.forEach((sub: any) => {
       const lang = sub.language_id;
       if ([50, 52, 53, 54, 75, 76].includes(lang)) langCounts.cpp++;
       else if ([71, 70, 100].includes(lang)) langCounts.python++;
       else if ([62, 63].includes(lang)) langCounts.java++;
       else langCounts.other++;
    });
  }
  const hasSubmissions = totalSubmissions > 0;
  const cppPct = hasSubmissions ? Math.round((langCounts.cpp / totalSubmissions) * 100) : 33;
  const pyPct = hasSubmissions ? Math.round((langCounts.python / totalSubmissions) * 100) : 33;
  const javaPct = hasSubmissions ? Math.round((langCounts.java / totalSubmissions) * 100) : 34;


  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 md:p-8 overflow-hidden font-sans bg-[#0e0e0e]">
      
      {/* Dynamic Background Blur Effects mimicking a room/environment */}
      <div className="fixed inset-0 z-0 bg-[#050505]">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
         <div className="absolute top-[10%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-orange-900/10 blur-[130px] pointer-events-none"></div>
         <div className="absolute bottom-[-10%] left-[10%] w-[50vw] h-[50vw] rounded-full bg-indigo-900/10 blur-[130px] pointer-events-none"></div>
         <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#050505] pointer-events-none"></div>
      </div>

      {/* Main Glass OS Window */}
      <div className="relative z-10 w-full max-w-[1400px] min-h-[85vh] bg-[#09090b]/40 backdrop-blur-3xl border border-white/[0.04] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_24px_64px_rgba(0,0,0,0.6)] flex flex-col text-zinc-200" style={{ borderRadius: '2rem' }}>
        
        {/* Top App Header / Bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center px-8 py-5 border-b border-white/[0.08] animate-fade-in">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
             Student Cabinet 
             {profile.is_banned && <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full border border-red-500/30 uppercase tracking-wider font-extrabold flex items-center gap-1"><AlertCircle className="w-3 h-3"/>SUSPENDED</span>}
          </h1>
          

        </div>

        {/* Dashboard Grid Content */}
        <div className="flex-1 p-6 lg:p-8 grid grid-cols-1 xl:grid-cols-12 gap-8 overflow-y-auto">
           
           {/* LEFT CONTENT (Span 8) */}
           <div className="xl:col-span-8 flex flex-col gap-8">
              
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {[ 
                   { title: "Problems Solved", val: solved || 0 },
                   { title: "Code Submissions", val: totalSubmissions },
                   { title: "Translations", val: translations || 0 },
                 ].map((s, i) => (
                    <div key={i} className="bg-white/[0.02] backdrop-blur-md border border-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] p-7 flex flex-col justify-between transition-all duration-500 hover:bg-white/[0.04] hover:border-white/[0.08] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_8px_16px_rgba(0,0,0,0.4)] hover:-translate-y-1.5 animate-fade-in group" style={{ borderRadius: '1.5rem', animationDelay: `${i * 100 + 100}ms` }}>
                      <p className="text-zinc-500 text-[11px] font-bold tracking-widest uppercase mb-6 whitespace-nowrap group-hover:text-zinc-400 transition-colors">{s.title}</p>
                      <div className="flex flex-col sm:flex-row sm:items-end gap-3 mt-auto">
                        <span className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-zinc-600 leading-none tracking-tighter drop-shadow-sm">{s.val}</span>
                      </div>
                    </div>
                 ))}
              </div>

               {/* Middle Charts Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Bar Chart Panel */}
                 <div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] p-8 h-80 flex flex-col animate-fade-in delay-300 group hover:border-white/[0.06] transition-all duration-500" style={{ borderRadius: '1.5rem' }}>
                    <div className="flex justify-between items-center mb-8">
                       <h3 className="text-zinc-500 font-bold uppercase tracking-widest text-[11px] group-hover:text-zinc-400 transition-colors">Weekly Submissions</h3>
                       <button className="text-zinc-600 hover:text-white transition-colors"><MoreHorizontal className="w-5 h-5"/></button>
                    </div>
                    {/* Fake Chart Visualization styling from screenshot */}
                    <div className="flex-1 flex items-end justify-between gap-3 pb-3 border-b border-white/[0.06]">
                       {weekHeights.map((h, i) => (
                          <div key={i} className="w-full flex justify-center group h-full items-end">
                             <div 
                                style={{ height: `${Math.max(h, 5)}%` }} 
                                className={`w-full max-w-[2rem] rounded-sm transition-all duration-300 ${i === new Date().getDay() - 1 || (new Date().getDay() === 0 && i === 6) ? 'bg-[#10b981]' : 'bg-white/10 group-hover:bg-white/20'}`}
                             ></div>
                          </div>
                       ))}
                    </div>
                    <div className="flex justify-between text-[11px] text-zinc-400 font-semibold px-3 pt-4">
                       <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                 </div>

                 {/* Donut Chart Panel */}
                 <div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] p-8 h-80 flex flex-col animate-fade-in delay-400 group hover:border-white/[0.06] transition-all duration-500" style={{ borderRadius: '1.5rem' }}>
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="text-zinc-500 font-bold uppercase tracking-widest text-[11px] group-hover:text-zinc-400 transition-colors">Active Languages</h3>
                       <button className="text-zinc-600 hover:text-white transition-colors"><MoreHorizontal className="w-5 h-5"/></button>
                    </div>
                    <div className="flex-1 flex flex-col 2xl:flex-row items-center justify-center gap-8">
                       {/* Pure CSS SVG Donut */}
                       <div className="relative w-36 h-36 shrink-0">
                         <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full drop-shadow-xl">
                           <circle cx="50" cy="50" r="35" fill="none" stroke="#ffffff08" strokeWidth="18" />
                           {/* C++ (Green) */}
                           <circle cx="50" cy="50" r="35" fill="none" stroke="#10b981" strokeWidth="18" strokeDasharray="219.9" strokeDashoffset={219.9 - (cppPct/100)*219.9} />
                           {/* Python (Orange) */}
                           <circle cx="50" cy="50" r="35" fill="none" stroke="#ff5a36" strokeWidth="18" strokeDasharray="219.9" strokeDashoffset={219.9 - (pyPct/100)*219.9} className="origin-center" style={{ transform: `rotate(${cppPct * 3.6}deg)` }} />
                           {/* Java (Blue) */}
                           <circle cx="50" cy="50" r="35" fill="none" stroke="#6366f1" strokeWidth="18" strokeDasharray="219.9" strokeDashoffset={219.9 - (javaPct/100)*219.9} className="origin-center" style={{ transform: `rotate(${(cppPct + pyPct) * 3.6}deg)` }} />
                         </svg>
                         {/* Donut inner hole overlay */}
                         <div className="absolute inset-0 m-auto w-[46px] h-[46px] rounded-full bg-[#343437] shadow-inner flex items-center justify-center">
                         </div>
                       </div>
                       
                       <div className="flex flex-col gap-4 w-full">
                          <div className="flex items-center gap-3 text-[13px]">
                             <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]"></div>
                             <span className="text-zinc-300 font-medium flex-1">C++</span>
                             <span className="text-white font-semibold">{cppPct}%</span>
                          </div>
                          <div className="flex items-center gap-3 text-[13px]">
                             <div className="w-2.5 h-2.5 rounded-full bg-[#ff5a36] shadow-[0_0_8px_#ff5a36]"></div>
                             <span className="text-zinc-300 font-medium flex-1">Python</span>
                             <span className="text-white font-semibold">{pyPct}%</span>
                          </div>
                          <div className="flex items-center gap-3 text-[13px]">
                             <div className="w-2.5 h-2.5 rounded-full bg-[#6366f1] shadow-[0_0_8px_#6366f1]"></div>
                             <span className="text-zinc-300 font-medium flex-1">Java</span>
                             <span className="text-white font-semibold">{javaPct}%</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>


           </div>

           {/* RIGHT SIDEBAR (Span 4) */}
           <div className="xl:col-span-4 flex flex-col gap-8">
              
              {/* Profile Card */}
              <div className="bg-[#1c1c1e]/40 backdrop-blur-lg border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] p-8 relative overflow-hidden animate-fade-in delay-200" style={{ borderRadius: '1.5rem' }}>
                 
                 <div className="flex justify-between items-start mb-8 relative z-10">
                    <div className="flex gap-4 items-center">
                       <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-tr from-[#9b8af4] to-[#f49b8a] p-[3px] shadow-lg">
                          <div className="w-full h-full bg-[#1c1c1e] rounded-full flex items-center justify-center text-white overflow-hidden relative">
                             <User className="w-8 h-8 text-white/50" />
                          </div>
                       </div>
                       <div>
                          <h2 className="text-lg font-bold text-white leading-tight mb-1">@{profile.username}</h2>
                       </div>
                    </div>
                    {isOwner && (
                       <ProfileEditClient currentUsername={profile.username} email={user?.email} role={role} />
                    )}
                 </div>

                 <div className="space-y-4 text-[13px] relative z-10 w-full mb-6">
                    <div className="flex justify-between items-center">
                       <span className="text-zinc-400 font-medium tracking-wide">Role</span>
                       <span className="text-white font-semibold">{role}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-zinc-400 font-medium tracking-wide">Location</span>
                       <span className="text-white font-semibold">United States, New York</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-zinc-400 font-medium tracking-wide">Joined Platform</span>
                       <span className="text-white font-semibold">{new Date(profile.created_at || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>

                 </div>
              </div>

              {/* Recent Activity List */}
              <div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] p-8 flex-1 flex flex-col animate-fade-in delay-500 group hover:border-white/[0.06] transition-all duration-500" style={{ borderRadius: '1.5rem' }}>
                 <div className="flex justify-between items-center mb-8">
                    <h3 className="text-zinc-500 font-bold uppercase tracking-widest text-[11px] group-hover:text-zinc-400 transition-colors">Recent Solves</h3>
                    <button className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white transition-colors rounded-full font-bold tracking-widest uppercase">
                       VIEW ALL <ArrowUpRight className="w-3 h-3" />
                    </button>
                 </div>

                 <div className="flex flex-col gap-5 flex-1">
                    {recentSubs && recentSubs.length > 0 ? (
                       recentSubs.map((sub: any, i: number) => (
                         <div key={i} className="flex gap-4 items-center group cursor-pointer hover:bg-white/[0.03] p-2.5 -mx-2.5 rounded-2xl transition-all">
                            <div className="w-[52px] h-[52px] rounded-2xl bg-gradient-to-br from-[#1c1c1e] to-[#2a2a2c] shadow-inner border border-white/5 flex items-center justify-center shrink-0 overflow-hidden relative">
                               <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#10b981]/40 via-transparent to-transparent"></div>
                               <Code2 className="w-6 h-6 text-[#10b981] relative z-10 drop-shadow-md" />
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-[15px] font-bold text-zinc-100 truncate mb-1 bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-400">Problem #{sub.problem_id}</p>
                               <div className="flex items-center gap-2">
                                 <span className="text-[10px] text-[#10b981] font-bold tracking-wide uppercase">{sub.status} ↗</span>
                               </div>
                            </div>

                         </div>
                       ))
                    ) : (
                       <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
                          <Code2 className="w-12 h-12 mb-3 opacity-20" />
                          <p className="text-[13px] font-medium tracking-wide">No recent activity</p>
                       </div>
                    )}
                 </div>
              </div>

           </div>
        </div>
      </div>
    </div>
  );
}

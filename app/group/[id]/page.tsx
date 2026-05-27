import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ChatSidebar from "./ChatSidebar";
import TeacherHubControls from "./TeacherHubControls";
import TeacherMaterialControls from "./TeacherMaterialControls";
import MaterialList from "@/app/components/MaterialList";
import MemberManagement from "./MemberManagement";
import ProblemDeleteButton from "./ProblemDeleteButton";
import ProblemEditButton from "./ProblemEditButton";
import GroupSettingsButton from "./GroupSettingsButton";
import TeacherContestControls from "./TeacherContestControls";
import ContestDeleteButton from "./ContestDeleteButton";
import { Users2, BookOpen, Shield, Trophy, ExternalLink, Clock, CheckCircle } from "lucide-react";

export default async function GroupHubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  // Fetch Group and check membership
  const { data: group } = await supabase
    .from('groups')
    .select('*, memberships!inner(student_id)')
    .eq('id', id)
    .single();

  let groupRef = group;
  if (!groupRef) {
    const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: adminGroup } = await supabaseAdmin.from('groups').select('*').eq('id', id).single();
    
    if (adminGroup) {
      if (adminGroup.teacher_id === user.id) {
        groupRef = adminGroup;
      } else {
        // Verify if the user is a securely enrolled student
        const { data: membership } = await supabaseAdmin
          .from('memberships')
          .select('id')
          .eq('group_id', id)
          .eq('student_id', user.id)
          .single();
          
        if (membership) {
          groupRef = adminGroup;
        }
      }
    }
    
    if (!groupRef) {
      return (
        <div className="p-12 text-zinc-300 font-mono">
          <h1 className="text-xl text-red-500 mb-4 font-bold">SYSTEM ALERT: ACCESS DENIED</h1>
          <p>The routing engine blocked access to this group hub.</p>
          <div className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded">
            <p className="text-amber-400">Diagnostic Info:</p>
            <p>Target Group ID: {id}</p>
            <p>Your User ID: {user.id}</p>
          </div>
          <a href="/dashboard" className="text-emerald-500 mt-6 inline-block hover:underline">Return to Server Dashboard</a>
        </div>
      );
    }
  }

  // Access Control: Check membership status for students
  const isTeacher = groupRef.teacher_id === user.id;
  if (!isTeacher) {
    const { data: membership } = await supabase
      .from('memberships')
      .select('status')
      .eq('group_id', id)
      .eq('student_id', user.id)
      .single();

    if (membership?.status !== 'approved') {
      redirect("/dashboard?error=Your membership is pending or has been revoked.");
    }
  }
  const groupName = groupRef.name || "Advanced C++ Algorithms";
  
  // Fetch specific problems generated for this group using service role to bypass RLS missing policies
  const supabaseAdmin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data: problems } = await supabaseAdmin
    .from('problems')
    .select(`
      *,
      problem_translations(*),
      ${isTeacher ? 'test_cases(*)' : 'test_cases(is_sample, input, expected_output)'}
    `)
    .eq('group_id', id);

  // SECURE DATA PARTITIONING: Strip non-sample test cases from students
  const problemsData = problems?.map(p => ({
    ...p,
    test_cases: isTeacher ? p.test_cases : p.test_cases?.filter((tc: any) => tc.is_sample) || []
  }));

  const { data: initialMessages } = await supabase
    .from('messages')
    .select('*, profiles(username, full_name)')
    .eq('group_id', id)
    .order('created_at', { ascending: true })
    .limit(100);

  const { data: materials } = await supabaseAdmin
    .from('materials')
    .select('*')
    .eq('group_id', id)
    .order('created_at', { ascending: false });

  const { data: contests } = await supabaseAdmin
    .from('contests')
    .select('*, contest_problems(count)')
    .eq('group_id', id)
    .order('start_time', { ascending: true });

  // Derive Leaderboard from actual submissions data
  const { data: allSubmissions } = await supabaseAdmin
    .from('submissions')
    .select('student_id, status, problem_id, problems!inner(group_id)')
    .eq('problems.group_id', id)
    .eq('status', 'Accepted');

  const solvedSet = new Set<string>();
  if (allSubmissions) {
    allSubmissions
      .filter(s => s.student_id === user.id)
      .forEach(s => solvedSet.add(s.problem_id));
  }

  // Aggregate per student
  const studentMap = new Map<string, number>();
  if (allSubmissions) {
    // Count unique accepted problem IDs per student
    const seen = new Set<string>();
    for (const sub of allSubmissions) {
      const key = `${sub.student_id}:${sub.problem_id}`;
      if (!seen.has(key)) {
        seen.add(key);
        studentMap.set(sub.student_id, (studentMap.get(sub.student_id) || 0) + 1);
      }
    }
  }

  // Fetch profile names for leaderboard students
  const studentIds = Array.from(studentMap.keys());
  let leaderboard: { id: string; name: string; username: string; solved: number; xp: number }[] = [];
  if (studentIds.length > 0) {
    const { data: studentProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, username')
      .in('id', studentIds);
    
    leaderboard = studentIds
      .map(sid => {
        const profile = studentProfiles?.find(p => p.id === sid);
        const solved = studentMap.get(sid) || 0;
        return {
          id: sid,
          name: profile?.username || profile?.full_name || "Agent " + sid.slice(0, 4).toUpperCase(),
          username: profile?.username || sid.slice(0, 8),
          solved,
          xp: solved * 100
        };
      })
      .sort((a, b) => b.solved - a.solved)
      .slice(0, 10);
  }

  // Fetch all members for teacher management
  const { data: allMemberships } = isTeacher ? await supabaseAdmin
    .from('memberships')
    .select('*, profiles:student_id(username, full_name, avatar_url)')
    .eq('group_id', id)
    : { data: [] };

  return (
    <div className="flex flex-1 w-full h-[calc(100vh-64px)] overflow-hidden">

      {/* Left Column */}
      <div className="flex-1 flex flex-col p-8 overflow-y-auto bg-[#050505] min-w-0 border-r border-white/[0.04] relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />
        <div className="absolute top-0 right-0 w-[60%] h-[300px] bg-indigo-900/6 blur-[100px] pointer-events-none z-0" />
        <div className="relative z-10 w-full max-w-7xl mx-auto">

          {/* Header */}
          <header className="mb-8 pb-6 border-b border-white/[0.05]">
            <p className="text-[11px] font-mono font-bold tracking-widest text-zinc-600 uppercase mb-2 flex items-center gap-2">
              <Users2 className="w-3.5 h-3.5" /> Group Hub
            </p>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-3xl font-black tracking-tight text-white">
                {groupName}
              </h1>
              <div className="flex items-center gap-3 mt-1 shrink-0">
                {isTeacher && (
                  <GroupSettingsButton
                    groupId={id}
                    initialSettings={{
                      allow_view_testcases: groupRef.allow_view_testcases || false,
                      allow_view_others: groupRef.allow_view_others || false
                    }}
                  />
                )}
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Assignments */}
          <section className="space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-6 border-l-2 border-emerald-500/50 pl-3">Active Assignments</h2>

            {isTeacher && <TeacherHubControls groupId={id} />}

            <div className="space-y-3">
               {problemsData && problemsData.length > 0 ? problemsData.map((prob) => {
                 const translation = prob.problem_translations[0];
                 const title = translation?.title || `Problem ${prob.id.split('-')[0]}`;
                 return (
                  <div key={prob.id} className="group p-5 bg-white/[0.02] backdrop-blur-md border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.08] transition-all rounded-2xl flex justify-between items-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:-translate-y-0.5">
                    <div className="flex-1 min-w-0 flex items-center gap-4">
                      {solvedSet.has(prob.id) && (
                        <div className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-white group-hover:text-emerald-300 transition-colors">{title}</h3>
                        <p className="text-[10px] text-zinc-600 font-mono mt-1">{prob.time_limit_ms}ms · {Math.round((prob.memory_limit_kb || 262144) / 1024)}MB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isTeacher && (
                        <>
                          <ProblemEditButton problem={prob} />
                          <ProblemDeleteButton problemId={prob.id} groupId={id} />
                        </>
                      )}
                      <a href={`/solve/${prob.id}`} className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold tracking-widest rounded-xl hover:bg-emerald-500/20 transition-all">
                        Solve
                      </a>
                    </div>
                  </div>
                 );
               }) : (
                 <div className="p-8 text-sm text-zinc-600 font-mono text-center bg-white/[0.01] border border-white/[0.04] border-dashed rounded-2xl">No active assignments yet.</div>
               )}
            </div>
          </section>

          {/* Learning Materials */}
          <section className="space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-6 border-l-2 border-blue-500/50 pl-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500/50" /> Learning Materials
            </h2>

            {isTeacher && <TeacherMaterialControls groupId={id} />}
            <MaterialList materials={materials || []} isTeacher={isTeacher} groupId={id} />
          </section>

          {/* Timed Contests */}
          <section className="space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-6 border-l-2 border-purple-500/50 pl-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-purple-500/50" /> Timed Contests
            </h2>
            
            {isTeacher && <TeacherContestControls groupId={id} problems={problems || []} />}

            <div className="space-y-3">
              {contests && contests.length > 0 ? (
                contests.map((contest: any) => {
                  const now = new Date();
                  const start = new Date(contest.start_time);
                  const end = new Date(contest.end_time);
                  const isActive = now >= start && now <= end;
                  const isUpcoming = now < start;

                  return (
                    <div key={contest.id} className={`p-5 bg-white/[0.02] backdrop-blur-md border ${isActive ? 'border-purple-500/40 shadow-[0_0_24px_rgba(168,85,247,0.08)]' : 'border-white/[0.04]'} rounded-2xl group transition-all hover:bg-white/[0.04] hover:-translate-y-0.5`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse" />}
                            <h3 className="text-white font-semibold group-hover:text-purple-300 transition-colors">{contest.title}</h3>
                          </div>
                          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                            {isActive ? "Live Now" : isUpcoming ? "Upcoming" : "Completed"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className={`px-2 py-1 rounded-lg text-[10px] font-bold font-mono border ${
                            isActive ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            isUpcoming ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-white/[0.03] text-zinc-600 border-white/[0.05]'
                          }`}>
                            {contest.contest_problems?.[0]?.count || 0} Problems
                          </div>
                          {isTeacher && <ContestDeleteButton contestId={contest.id} groupId={id} />}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 font-mono">
                          <Clock className="w-3 h-3" />
                          {start.toLocaleDateString()} {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <a 
                          href={`/contest/${contest.id}`}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-widest px-3 py-1.5 bg-purple-500/5 border border-purple-500/10 hover:border-purple-500/30 rounded-xl"
                        >
                          Enter Arena <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-sm text-zinc-600 font-mono text-center bg-white/[0.01] border border-white/[0.04] border-dashed rounded-2xl">No scheduled contests.</div>
              )}
            </div>
          </section>

          {isTeacher && (
            <section className="space-y-4">
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-6 border-l-2 border-amber-500/50 pl-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500/50" /> Admin & Security
              </h2>
              <MemberManagement groupId={id} initialMembers={allMemberships as any || []} />
            </section>
          )}

          {/* Group Leaderboard */}
          <section className="space-y-4">
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-6 border-l-2 border-blue-500/50 pl-3">Group Leaderboard</h2>
            <div className="bg-white/[0.02] backdrop-blur-md border border-white/[0.04] rounded-[1.5rem] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="grid grid-cols-4 bg-white/[0.01] px-5 py-3 text-[10px] tracking-widest font-mono text-zinc-600 border-b border-white/[0.04] uppercase font-bold">
                <div className="col-span-2">Member</div>
                <div className="text-right">Solved</div>
                <div className="text-right">Score</div>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {leaderboard.length === 0 ? (
                  <div className="p-10 text-center text-zinc-600 text-sm font-mono">No submissions yet. Be first.</div>
                ) : leaderboard.map((m, idx) => (
                  <div key={idx} className="grid grid-cols-4 px-5 py-4 text-sm hover:bg-white/[0.03] transition-colors items-center group">
                    <div className="col-span-2 font-medium flex items-center gap-3">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 ${
                        idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                        idx === 1 ? 'bg-zinc-400/10 text-zinc-400' :
                        idx === 2 ? 'bg-orange-500/10 text-orange-500' :
                        'bg-white/[0.04] text-zinc-600'
                      }`}>{idx + 1}</span>
                      <div>
                        <p className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">{m.name}</p>
                        <p className="text-[10px] font-mono text-zinc-600">@{m.username}</p>
                      </div>
                    </div>
                    <div className="text-right font-mono text-emerald-400 font-bold">{m.solved}</div>
                    <div className="text-right font-mono text-blue-400">{m.xp}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
        </div>
      </div>

      {/* Right Column — Chat */}
      <ChatSidebar groupId={id} userId={user.id} initialMessages={initialMessages as any} />
    </div>
  );
}

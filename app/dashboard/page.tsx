import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import TeacherClient from "./TeacherClient";
import StudentClient from "./StudentClient";
import RoleSelector from "./RoleSelector";
import AnnouncementPanel from "../components/AnnouncementPanel";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  // Profile & Ban Check (with safety for missing columns)
  const { data: profile, error: profileErr } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  
  // Only redirect if banned column exists and is true
  if (profile && (profile as any).is_banned) {
    redirect('/banned');
  }

  const currentRole = profile?.role || 'normal';

  if (currentRole === 'normal') {
    return (
      <div className="flex-1 w-full max-w-6xl mx-auto p-6 md:p-12">
        <RoleSelector userId={user.id} />
      </div>
    );
  }

  const isTeacher = currentRole === 'teacher';

  let teacherGroups: any[] = [];
  let studentMemberships: any[] = [];
  let studentStats = { xp: 0, solved: 0, translations: 0 };

  if (isTeacher) {
    const { data } = await supabase
      .from('groups')
      .select('*, memberships(count)')
      .eq('teacher_id', user.id)
      .eq('memberships.status', 'pending');
    
    if (data) {
      teacherGroups = data.map(g => ({
        ...g,
        pendingCount: g.memberships?.[0]?.count || 0
      }));
    }
  } else {
    // 1. Fetch groups student has joined
    const { data: mems } = await supabase.from('memberships').select('id, group_id, status, groups(name, join_code)').eq('student_id', user.id);
    if (mems) studentMemberships = mems;

    const { data: trans } = await supabase.from('problem_translations').select('id').eq('author_id', user.id).eq('status', 'Approved');
    
    studentStats.solved = subs?.length || 0;
    studentStats.xp = (subs?.length || 0) * 100; // Base 100 XP per solve
    studentStats.translations = trans?.length || 0;
  }

  // Fetch Global Announcements
  const { data: announcements } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });

  return (
    <div className="flex-1 w-full min-h-screen relative bg-[#050505]">
      {/* Background */}
      {/* Dot-grid Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute top-[10%] right-[5%] w-[50vw] h-[50vw] rounded-full bg-indigo-900/8 blur-[130px]" />
        <div className="absolute bottom-[0%] left-[0%] w-[40vw] h-[40vw] rounded-full bg-emerald-900/6 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto p-6 md:p-12 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/[0.05]">
          <div>
            <p className="text-[11px] font-mono font-bold tracking-widest text-zinc-600 uppercase mb-1">
              {isTeacher ? "Teacher Portal" : "Student Portal"}
            </p>
            <h1 className="text-3xl font-black tracking-tight text-white">Dashboard</h1>
          </div>
        </div>

        {/* Announcements Section */}
        {announcements && announcements.length > 0 && (
          <AnnouncementPanel initialAnnouncements={announcements} />
        )}

        {isTeacher ? (
          <TeacherClient initialGroups={teacherGroups} userId={user.id} />
        ) : (
          <StudentClient initialMemberships={studentMemberships} stats={studentStats} />
        )}
      </div>
    </div>
  );
}

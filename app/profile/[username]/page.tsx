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

  const { data: allSubsLang } = await supabase
    .from('submissions')
    .select('id')
    .eq('student_id', profile.id);

  const totalSubmissions = allSubsLang?.length || 0;


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
                       <span className="text-zinc-400 font-medium tracking-wide">Joined Platform</span>
                       <span className="text-white font-semibold">{new Date(profile.created_at || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>

                 </div>
              </div>


           </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  Users, 
  BookOpen, 
  Globe2, 
  PlusCircle, 
  CheckCircle, 
  XCircle, 
  Megaphone, 
  BarChart3, 
  Activity, 
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Trash,
  Hammer,
  RotateCcw,
  Edit3,
  Search,
  Lock,
  Unlock,
  Ban
} from "lucide-react";

export default function AdminClient({ userId }: { userId: string }) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "problems" | "translations" | "announcements">("dashboard");

  // Platform Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProblems: 0,
    totalSubmissions: 0,
    pendingTranslations: 0,
    pendingProblems: 0
  });

  const [users, setUsers] = useState<any[]>([]);
  const [problems, setProblems] = useState<any[]>([]);
  const [pendingArchive, setPendingArchive] = useState<any[]>([]);
  const [bans, setBans] = useState<any[]>([]);
  const [translations, setTranslations] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  
  // Ban Form
  const [banValue, setBanValue] = useState("");
  const [banType, setBanType] = useState<"email" | "username" | "ip">("email");
  const [banReason, setBanReason] = useState("");

  // Edit Problem State
  const [editingProb, setEditingProb] = useState<any>(null);
  const [selectedAudit, setSelectedAudit] = useState<any>(null);
  
  // Announcement Form
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annType, setAnnType] = useState("info");

  // New Problem Form
  const [newProbGroup, setNewProbGroup] = useState("");
  const [newProbTime, setNewProbTime] = useState("1000");
  const [newProbMem, setNewProbMem] = useState("256000");
  const [newProbENName, setNewProbENName] = useState("");
  const [newProbENDesc, setNewProbENDesc] = useState("");

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === "dashboard") {
        const { count: uCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        
        // Safety check for 'status' column in problems
        const { data: pCheck, error: pCheckErr } = await supabase.from('problems').select('status').limit(1);
        const hasStatusCol = !pCheckErr;

        let pCount = 0;
        let ppCount = 0;

        if (hasStatusCol) {
          const { count: pc } = await supabase.from('problems').select('*', { count: 'exact', head: true }).eq('status', 'Approved');
          const { count: ppc } = await supabase.from('problems').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
          pCount = pc || 0;
          ppCount = ppc || 0;
        } else {
          const { count: pc } = await supabase.from('problems').select('*', { count: 'exact', head: true });
          pCount = pc || 0;
        }

        const { count: sCount } = await supabase.from('submissions').select('*', { count: 'exact', head: true });
        
        // Safety check translations
        let tCount = 0;
        const { data: tCheck, error: tCheckErr } = await supabase.from('problem_translations').select('status').limit(1);
        if (!tCheckErr) {
          const { count: tc } = await supabase.from('problem_translations').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
          tCount = tc || 0;
        }

        const { data: recent } = await supabase.from('submissions').select('*, profiles(username), problems(id)').order('created_at', { ascending: false }).limit(5);
        
        setStats({
          totalUsers: uCount || 0,
          totalProblems: pCount,
          totalSubmissions: sCount || 0,
          pendingTranslations: tCount,
          pendingProblems: ppCount
        });
        if (recent) setRecentSubmissions(recent);
      } 
      else if (activeTab === "users") {
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (data) setUsers(data);
      } 
      else if (activeTab === "problems") {
        const { data: p, error: pErr } = await supabase
          .from('problems')
          .select('*, groups(name), problem_translations(*), test_cases(*)')
          .order('created_at', { ascending: false });
        
        const { data: g } = await supabase.from('groups').select('*');
        if (p) {
          // Identify if 'status' column exists for filtering
          const hasStatus = p.length > 0 && p[0].hasOwnProperty('status');
          if (hasStatus) {
            setProblems(p.filter(x => x.status === 'Approved'));
            setPendingArchive(p.filter(x => x.status === 'Pending'));
          } else {
            setProblems(p);
            setPendingArchive([]);
          }
        }
        if (g) setGroups(g);
      } 
      else if (activeTab === "translations") {
        const { data } = await supabase.from('problem_translations').select('*, profiles(username)').eq('status', 'Pending');
        if (data) setTranslations(data);
      }
      else if (activeTab === "announcements") {
        const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
        if (data) setAnnouncements(data);
      }
      else if (activeTab === "bans" as any) {
        // Only fetch if table exists
        const { data, error } = await supabase.from('bans').select('*, author:profiles(username)').order('created_at', { ascending: false });
        if (!error && data) setBans(data);
      }
    } catch (err) {
      console.error("Admin fetch error:", err);
    }
  };

  const postAnnouncement = async () => {
    if (!annTitle || !annContent) return;
    await supabase.from('announcements').insert({
      title: annTitle,
      content: annContent,
      type: annType,
      author_id: userId
    });
    setAnnTitle("");
    setAnnContent("");
    fetchData();
  };

  const toggleAnnouncement = async (id: string, current: boolean) => {
    await supabase.from('announcements').update({ is_active: !current }).eq('id', id);
    fetchData();
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await supabase.from('announcements').delete().eq('id', id);
    fetchData();
  };

  const updateUserRole = async (targetId: string, newRole: string) => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', targetId);
    fetchData();
  };

  const createProblem = async () => {
    if (!newProbGroup || !newProbENName) return alert("Missing fields");
    
    // 1. Create Core Problem
    const { data: pData, error: pError } = await supabase.from('problems').insert({
      teacher_id: userId,
      group_id: newProbGroup,
      time_limit_ms: parseInt(newProbTime),
      memory_limit_kb: parseInt(newProbMem)
    }).select().single();

    if (pError || !pData) return alert(pError?.message || "Failed to create core problem.");

    // 2. Create Base English Translation auto-approved
    await supabase.from('problem_translations').insert({
      problem_id: pData.id,
      language_code: 'EN',
      title: newProbENName,
      description: newProbENDesc,
      author_id: userId,
      status: 'Approved'
    });

    setNewProbENName("");
    setNewProbENDesc("");
    fetchData();
  };

  const moderateTranslation = async (transId: string, status: 'Approved' | 'Rejected') => {
    await supabase.from('problem_translations').update({ status }).eq('id', transId);
    fetchData();
  };

  const moderateProblem = async (probId: string, status: 'Approved' | 'Rejected') => {
    try {
      const { error } = await supabase.from('problems').update({ status }).eq('id', probId);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert("Moderation failed: " + err.message);
    }
  };

  const deleteProblem = async (id: string) => {
    if (!confirm("Delete this problem permanentely? All submissions and testcases will be lost.")) return;
    try {
      const { error } = await supabase.from('problems').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  const applyBan = async () => {
    if (!banValue) return;
    await supabase.from('bans').insert({
      target_value: banValue,
      type: banType,
      reason: banReason,
      author_id: userId
    });
    
    // Also toggle profile bit if email or username
    if (banType === 'email' || banType === 'username') {
      const field = banType === 'email' ? 'email' : 'username';
      // In a real app we'd lookup ID by that field first.
    }
    
    setBanValue("");
    setBanReason("");
    fetchData();
  };

  const liftBan = async (id: string) => {
    await supabase.from('bans').delete().eq('id', id);
    fetchData();
  };

  const toggleUserBan = async (targetId: string, currentlyBanned: boolean) => {
    await supabase.from('profiles').update({ is_banned: !currentlyBanned }).eq('id', targetId);
    fetchData();
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Tab Selectors */}
      <div className="flex gap-1 border-b border-zinc-800 pb-0 overflow-x-auto scrollbar-hide">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3, color: 'amber' },
          { id: 'announcements', label: 'Alerts', icon: Megaphone, color: 'blue' },
          { id: 'users', label: 'Users', icon: Users, color: 'purple' },
          { id: 'problems', label: 'Archive', icon: BookOpen, color: 'emerald' },
          { id: 'bans', label: 'Bans', icon: ShieldCheck, color: 'red' },
          { id: 'translations', label: 'Translations', icon: Globe2, color: 'rose' },
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)} 
            className={`flex items-center gap-2 px-6 py-3 font-bold text-xs transition-all border-b-2 uppercase tracking-widest
              ${activeTab === tab.id 
                ? `border-${tab.color}-500 text-${tab.color}-400 bg-${tab.color}-500/5` 
                : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/10'}`}
          >
            <tab.icon className="w-3.5 h-3.5"/>
            {tab.label}
          </button>
        ))}
      </div>

      {/* TABS CONTENT */}
      
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-purple-400" },
              { label: "Global Archive", value: stats.totalProblems, icon: BookOpen, color: "text-emerald-400" },
              { label: "Submissions", value: stats.totalSubmissions, icon: Activity, color: "text-blue-400" },
              { label: "Pending Issues", value: stats.pendingTranslations + stats.pendingProblems, icon: ShieldCheck, color: "text-rose-400" },
            ].map((s, idx) => (
              <div key={idx} className="bg-zinc-950 border border-zinc-900 p-5 rounded-xl shadow-inner">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] uppercase font-mono text-zinc-600 tracking-widest">{s.label}</span>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div className="text-2xl font-bold font-mono">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Global Activity */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-zinc-900 bg-zinc-900/30 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Live Submission Stream</span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="divide-y divide-zinc-900">
                {recentSubmissions.map(sub => (
                  <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-zinc-900/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-mono font-bold text-zinc-500">
                        {sub.profiles?.username?.[0]?.toUpperCase() || 'A'}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">@{sub.profiles?.username}</div>
                        <div className="text-[10px] text-zinc-600 font-mono">Problem: {sub.problems?.id.substring(0, 8)}...</div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${(sub.status === 'AC' || sub.status === 'Accepted') ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}>
                      {sub.status === 'Accepted' ? 'AC' : sub.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 flex flex-col justify-center gap-4">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2 border-b border-zinc-900 pb-2">Admin Shortcuts</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setActiveTab('announcements')} className="flex flex-col items-center gap-2 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-all text-blue-400">
                  <Megaphone className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase">Broadcast</span>
                </button>
                <button onClick={() => setActiveTab('bans' as any)} className="flex flex-col items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all text-red-400">
                  <Ban className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase">Executioner</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Creator */}
          <div className="lg:col-span-1 bg-zinc-950 border border-zinc-900 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest border-b border-zinc-900 pb-2">New Announcement</h3>
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Message Title..." 
                value={annTitle} 
                onChange={e=>setAnnTitle(e.target.value)} 
                className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs outline-none focus:border-blue-500 transition-all"
              />
              <select 
                value={annType} 
                onChange={e=>setAnnType(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs outline-none focus:border-blue-500 transition-all"
              >
                <option value="info">Information (Blue)</option>
                <option value="warning">Warning (Amber)</option>
                <option value="error">Critical Alert (Red)</option>
                <option value="success">Success News (Green)</option>
              </select>
              <textarea 
                placeholder="Broadcast content (Markdown)..." 
                rows={5} 
                value={annContent} 
                onChange={e=>setAnnContent(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs outline-none focus:border-blue-500 transition-all font-mono"
              />
              <button 
                onClick={postAnnouncement}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded text-xs uppercase tracking-widest transition-all"
              >
                Launch Broadcast
              </button>
            </div>
          </div>

          {/* History */}
          <div className="lg:col-span-2 space-y-4 font-mono">
            {announcements.map(ann => (
              <div key={ann.id} className="bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${ann.is_active ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
                    <h4 className="font-bold text-white text-sm truncate">{ann.title}</h4>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold
                      ${ann.type === 'error' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                        ann.type === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                      {ann.type}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mb-2 truncate">{ann.content}</p>
                  <div className="text-[9px] text-zinc-600 tracking-tighter">
                    {new Date(ann.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleAnnouncement(ann.id, ann.is_active)} className="p-2 bg-zinc-900 border border-zinc-800 rounded hover:text-white transition-colors">
                    {ann.is_active ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button onClick={() => deleteAnnouncement(ann.id)} className="p-2 bg-zinc-900 border border-zinc-800 rounded hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900 border-b border-zinc-800 text-xs uppercase text-zinc-500">
              <tr>
                <th className="p-4">User ID</th>
                <th className="p-4">Role</th>
                <th className="p-4">Superadmin</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
               {users.map((u) => <tr key={u.id} className="border-b border-zinc-900/50 hover:bg-zinc-900/20 transition-colors">
                      <td className="py-4 px-2">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white tracking-tight">
                            {u.username || "UNIDENTIFIED_USER"}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-medium">
                            {u.full_name || "Agent No Name"}
                          </span>
                          <span className="text-[8px] font-mono text-zinc-700 mt-1 uppercase tracking-tighter">
                            ID: {u.id.substring(0,18)}...
                          </span>
                        </div>
                      </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-xs border ${u.role === 'teacher' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold ${u.is_banned ? 'text-red-500' : 'text-emerald-500'}`}>
                      {u.is_banned ? "BANNED" : "ACTIVE"}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button onClick={() => toggleUserBan(u.id, u.is_banned)} className={`p-1.5 rounded border ${u.is_banned ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'} hover:scale-110 transition-transform`}>
                      {u.is_banned ? <RotateCcw className="w-3.5 h-3.5"/> : <Ban className="w-3.5 h-3.5"/>}
                    </button>
                    <button onClick={() => updateUserRole(u.id, 'teacher')} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded">TEACHER</button>
                    <button onClick={() => updateUserRole(u.id, 'student')} className="text-[10px] bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded">STUDENT</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'problems' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2 border-b border-zinc-800 pb-2"><PlusCircle className="w-5 h-5 text-blue-500"/> Create New Problem</h2>
            <div className="space-y-3 font-mono text-xs">
              <select value={newProbGroup} onChange={e=>setNewProbGroup(e.target.value)} className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded outline-none">
                <option value="">Select Target Group...</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.id.substring(0,8)})</option>)}
              </select>
              <div className="flex gap-4">
                <input type="number" placeholder="Time Limit (ms)" value={newProbTime} onChange={e=>setNewProbTime(e.target.value)} className="w-1/2 p-2 bg-zinc-900 border border-zinc-700 rounded outline-none" />
                <input type="number" placeholder="Mem Limit (KB)" value={newProbMem} onChange={e=>setNewProbMem(e.target.value)} className="w-1/2 p-2 bg-zinc-900 border border-zinc-700 rounded outline-none" />
              </div>
              <input type="text" placeholder="Base English Title..." value={newProbENName} onChange={e=>setNewProbENName(e.target.value)} className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded outline-none" />
              <textarea placeholder="Base English Markdown Description..." rows={8} value={newProbENDesc} onChange={e=>setNewProbENDesc(e.target.value)} className="w-full p-2 bg-zinc-900 border border-zinc-700 rounded outline-none whitespace-pre-wrap"></textarea>
              <button onClick={createProblem} className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-2 rounded text-white tracking-widest uppercase transition-colors">Inject Problem</button>
            </div>
          </div>

           <div className="space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2 pb-2 border-b border-zinc-800">
                <CheckCircle className="w-5 h-5 text-emerald-500"/> Moderation Queue
              </h2>
              {pendingArchive.length === 0 && <div className="text-zinc-600 text-xs italic">No problems awaiting approval.</div>}
               {pendingArchive.map(p => {
                 const trans = p.problem_translations?.[0];
                 return (
                   <div 
                     key={p.id} 
                     onClick={() => setSelectedAudit(p)}
                     className="p-5 bg-zinc-950 border border-zinc-900 rounded-xl space-y-4 cursor-pointer hover:border-blue-500/30 hover:bg-zinc-900/20 transition-all group/aud"
                   >
                     <div className="flex items-start justify-between">
                       <div className="flex-1 pr-4">
                         <div className="text-xs font-bold text-blue-400 mb-1 flex items-center gap-2">
                           REQ_ID: {p.id.substring(0,8)}
                           <span className="text-[9px] px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded border border-blue-500/20 opacity-0 group-hover/aud:opacity-100 transition-opacity">CLICK_TO_AUDIT</span>
                         </div>
                         <h4 className="text-sm font-bold text-white mb-2">{trans?.title || "Untitled Contribution"}</h4>
                         <div className="p-3 bg-zinc-900/50 rounded border border-zinc-800 text-[11px] font-mono text-zinc-400 line-clamp-2">
                           {trans?.description || "No description provided."}
                         </div>
                       </div>
                       <div className="flex gap-2">
                         <button onClick={(e) => { e.stopPropagation(); moderateProblem(p.id, 'Approved'); }} className="p-2.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-all shadow-lg hover:shadow-emerald-500/10">
                           <CheckCircle className="w-5 h-5"/>
                         </button>
                         <button onClick={(e) => { e.stopPropagation(); moderateProblem(p.id, 'Rejected'); }} className="p-2.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all shadow-lg hover:shadow-red-500/10">
                           <XCircle className="w-5 h-5"/>
                         </button>
                       </div>
                     </div>
                     <div className="flex items-center gap-4 pt-2 border-t border-zinc-900 text-[9px] font-mono uppercase tracking-widest text-zinc-600">
                       <span>Time: {p.time_limit_ms}ms</span>
                       <span>Mem: {p.memory_limit_kb}KB</span>
                       <span>Hub: {p.groups?.name || 'GLOBAL'}</span>
                     </div>
                   </div>
                 );
               })}

              <h2 className="text-lg font-bold mt-8 flex items-center gap-2 pb-2 border-b border-zinc-800">
                <Globe2 className="w-5 h-5 text-blue-500"/> Live Archive
              </h2>
              <div className="space-y-3">
                {problems.map(p => (
                   <div key={p.id} className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg group">
                    <div className="flex justify-between items-start">
                       <div>
                        <div className="text-sm font-bold text-white mb-1">
                          {p.problem_translations?.[0]?.title || `PID: ${p.id.split('-')[0].toUpperCase()}`}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">PID: {p.id.substring(0,8)}</span>
                          <span className="text-[9px] font-mono text-zinc-600">•</span>
                          <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">HUB: {p.groups?.name || 'GLOBAL'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 bg-zinc-800 text-zinc-400 hover:text-white rounded"><Edit3 className="w-3.5 h-3.5"/></button>
                        <button onClick={() => deleteProblem(p.id)} className="p-1.5 bg-zinc-800 text-zinc-400 hover:text-red-500 rounded"><Trash2 className="w-3.5 h-3.5"/></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          </div>
        </div>
      )}

      {activeTab === 'bans' as any && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1 bg-zinc-950 border border-zinc-900 rounded-xl p-6 space-y-4 h-fit">
              <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest border-b border-red-900/30 pb-2 flex items-center gap-2">
                <Hammer className="w-4 h-4"/> Issue Ban
              </h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button onClick={()=>setBanType('email')} className={`flex-1 py-1 text-[10px] font-bold rounded border ${banType==='email' ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-zinc-950 text-zinc-600 border-zinc-900'}`}>GMAIL</button>
                  <button onClick={()=>setBanType('username')} className={`flex-1 py-1 text-[10px] font-bold rounded border ${banType==='username' ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-zinc-950 text-zinc-600 border-zinc-900'}`}>USER</button>
                  <button onClick={()=>setBanType('ip')} className={`flex-1 py-1 text-[10px] font-bold rounded border ${banType==='ip' ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-zinc-950 text-zinc-600 border-zinc-900'}`}>IP</button>
                </div>
                <input type="text" placeholder={`Target ${banType}...`} value={banValue} onChange={e=>setBanValue(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs outline-none focus:border-red-500 font-mono" />
                <textarea placeholder="Reason (Optional)..." rows={3} value={banReason} onChange={e=>setBanReason(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-xs outline-none focus:border-red-500" />
                <button onClick={applyBan} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded text-xs uppercase tracking-widest animate-pulse">Execute Ban</button>
              </div>
           </div>

           <div className="lg:col-span-2 space-y-4">
              <div className="bg-zinc-950 border border-zinc-900 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 border-b border-zinc-900">
                  <tr>
                    <th className="text-left py-4 px-2">IDENTITY</th>
                    <th className="text-center py-4">ROLE</th>
                    <th className="text-center py-4">SUPERADMIN</th>
                    <th className="text-right py-4 pr-10">ACTIONS</th>
                  </tr>
                </thead>
                  <tbody className="divide-y divide-zinc-900 font-mono">
                    {bans.map(b => (
                      <tr key={b.id} className="hover:bg-red-500/5">
                        <td className="p-4 text-red-400 font-bold">{b.target_value}</td>
                        <td className="p-4 capitalize">{b.type}</td>
                        <td className="p-4 text-zinc-500 italic">{b.reason || "No reason provided"}</td>
                        <td className="p-4 text-right">
                          <button onClick={() => liftBan(b.id)} className="text-zinc-500 hover:text-emerald-500 transition-colors">REMOVE</button>
                        </td>
                      </tr>
                    ))}
                    {bans.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-zinc-600 italic">Judgement halls are empty. No active bans.</td></tr>}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      ) as any}

      {activeTab === 'translations' && (
        <div className="space-y-4">
          <div className="bg-emerald-950/20 border border-emerald-900 p-4 rounded text-emerald-400 text-sm mb-4">
            Moderate community-submitted problem translations before they become available in the IDE Arena.
          </div>
          {translations.length === 0 && <div className="text-zinc-500 text-sm">No pending translations.</div>}
          {translations.map(t => (
            <div key={t.id} className="p-5 bg-zinc-950 border border-zinc-800 rounded-lg flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="bg-zinc-800 px-2 py-0.5 rounded text-xs font-bold text-emerald-400">{t.language_code}</span>
                  <span className="font-bold">{t.title}</span>
                </div>
                <div className="text-xs text-zinc-500 font-mono">Submitted by: {t.profiles?.full_name || t.author_id}</div>
                <div className="p-3 bg-zinc-900 rounded border border-zinc-800 text-xs font-mono whitespace-pre-wrap text-zinc-400 max-h-48 overflow-y-auto">
                  {t.description}
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full md:w-48 justify-center">
                <button onClick={() => moderateTranslation(t.id, 'Approved')} className="flex items-center justify-center gap-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20 py-2 rounded font-bold text-sm transition-colors"><CheckCircle className="w-4 h-4"/> Approve</button>
                <button onClick={() => moderateTranslation(t.id, 'Rejected')} className="flex items-center justify-center gap-2 bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 py-2 rounded font-bold text-sm transition-colors"><XCircle className="w-4 h-4"/> Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DEEP AUDIT MODAL */}
      {selectedAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setSelectedAudit(null)} />
          <div className="relative bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)] ring-1 ring-white/10 animate-in fade-in zoom-in duration-300">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-blue-500 uppercase tracking-[0.3em] font-bold">Audit_Sequence_v4.0</div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {selectedAudit.problem_translations?.[0]?.title || "Untitled_Audit_Target"}
                  </h3>
                </div>
              </div>
              <button onClick={() => setSelectedAudit(null)} className="p-2 text-zinc-500 hover:text-white transition-colors bg-zinc-900/50 rounded-lg border border-zinc-800">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Description & Metadata */}
                <div className="lg:col-span-2 space-y-8">
                  <section>
                    <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4 text-emerald-400" /> MISSION_PARAMETERS
                    </h4>
                    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 font-mono text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap min-h-[200px] border-l-4 border-l-blue-500/50">
                      {selectedAudit.problem_translations?.[0]?.description || "No description provided."}
                    </div>
                  </section>

                  <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-zinc-900/20 border border-zinc-800 rounded-xl">
                      <div className="text-[9px] text-zinc-600 uppercase font-bold mb-1">Time_Limit</div>
                      <div className="text-lg font-mono text-white">{selectedAudit.time_limit_ms}ms</div>
                    </div>
                    <div className="p-4 bg-zinc-900/20 border border-zinc-800 rounded-xl">
                      <div className="text-[9px] text-zinc-600 uppercase font-bold mb-1">Memory_Buffer</div>
                      <div className="text-lg font-mono text-white">{selectedAudit.memory_limit_kb}KB</div>
                    </div>
                    <div className="p-4 bg-zinc-900/20 border border-zinc-800 rounded-xl">
                      <div className="text-[9px] text-zinc-600 uppercase font-bold mb-1">Source_Hub</div>
                      <div className="text-lg font-mono text-white truncate">{selectedAudit.groups?.name || 'GLOBAL'}</div>
                    </div>
                  </section>
                </div>

                {/* Right Column: Testcase Preview */}
                <div className="lg:col-span-1">
                  <h4 className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <Search className="w-4 h-4 text-amber-500" /> TEST_CASE_MATRIX
                  </h4>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {selectedAudit.test_cases?.length > 0 ? (
                      selectedAudit.test_cases.map((tc: any, idx: number) => (
                        <div key={tc.id} className="p-4 bg-black border border-zinc-800 rounded-2xl space-y-3">
                          <div className="flex justify-between items-center text-[9px] font-mono uppercase tracking-tighter text-zinc-600">
                            <span>Case_#{idx + 1}</span>
                            {tc.is_sample && <span className="text-blue-400 font-bold border border-blue-400/20 px-1 rounded bg-blue-400/5">SAMPLE</span>}
                          </div>
                          <div className="space-y-2">
                            <div>
                              <div className="text-[8px] text-zinc-700 uppercase mb-1">Input Data</div>
                              <div className="text-[10px] font-mono bg-zinc-900 rounded p-2 text-zinc-400 truncate tracking-tight">{tc.input || "EMPTY"}</div>
                            </div>
                            <div>
                              <div className="text-[8px] text-zinc-700 uppercase mb-1">Expected Output</div>
                              <div className="text-[10px] font-mono bg-emerald-500/5 border border-emerald-500/10 rounded p-2 text-emerald-400 truncate tracking-tight">{tc.expected_output || "EMPTY"}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-zinc-900/20 border border-zinc-800 border-dashed rounded-2xl italic text-xs text-zinc-600">
                        No test cases defined for this mission.
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer (Action Control) */}
            <div className="px-8 py-6 bg-zinc-950 border-t border-zinc-900 flex justify-between items-center rounded-b-3xl">
              <div className="text-[10px] font-mono text-zinc-600 uppercase">
                Awaiting Judicial Enforcement • ID: {selectedAudit.id.substring(0,16)}
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => { moderateProblem(selectedAudit.id, 'Rejected'); setSelectedAudit(null); }}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/20"
                >
                  Terminate_Reject
                </button>
                <button 
                  onClick={() => { moderateProblem(selectedAudit.id, 'Approved'); setSelectedAudit(null); }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20"
                >
                  Verify_Approved
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

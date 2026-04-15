"use client";

import { useState } from "react";
import { Users, UserCheck, UserX, Trash2, Ban, ShieldCheck, ShieldAlert } from "lucide-react";
import { manageMembership } from "@/app/actions/manageMembership";

interface Member {
  student_id: string;
  status: string;
  profiles: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export default function MemberManagement({ groupId, initialMembers }: { groupId: string, initialMembers: Member[] }) {
  const [members, setMembers] = useState(initialMembers);
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (studentId: string, action: 'approve' | 'reject' | 'kick' | 'blacklist' | 'unblacklist') => {
    setLoading(studentId + action);
    try {
      await manageMembership(groupId, studentId, action);
      // Optimistically update or just reload
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
      setLoading(null);
    }
  };

  const pending = members.filter(m => m.status === 'pending');
  const approved = members.filter(m => m.status === 'approved');
  const blacklisted = members.filter(m => m.status === 'blacklisted');

  return (
    <div className="space-y-8 bg-zinc-950/50 p-6 rounded-xl border border-zinc-800">
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <Users className="w-6 h-6 text-emerald-500" />
        <h2 className="text-xl font-bold tracking-tight">Hub Security & Personnel</h2>
      </div>

      {/* Pending Requests */}
      <section className="space-y-4">
        <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500" /> Pending Requests ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <p className="text-sm text-zinc-700 italic">No incoming decryption requests.</p>
        ) : (
          <div className="grid gap-3">
            {pending.map((m) => (
              <div key={m.student_id} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 overflow-hidden">
                    {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} alt="" /> : <Users className="w-4 h-4 text-zinc-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.profiles?.username || m.profiles?.full_name || "Agent " + m.student_id.slice(0, 4).toUpperCase()}</p>
                    <p className="text-[10px] font-mono text-zinc-500">@{m.profiles?.username || m.student_id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAction(m.student_id, 'approve')}
                    className="p-1.5 hover:bg-emerald-500/10 text-emerald-500 rounded-md transition-colors"
                    title="Approve Access"
                  >
                    <UserCheck className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleAction(m.student_id, 'reject')}
                    className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-md transition-colors"
                    title="Decline Access"
                  >
                    <UserX className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active Members */}
      <section className="space-y-4">
        <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Enrolled Hackers ({approved.length})
        </h3>
        {approved.length === 0 ? (
          <p className="text-sm text-zinc-700 italic">No hackers currently deployed.</p>
        ) : (
          <div className="grid gap-3">
            {approved.map((m) => (
              <div key={m.student_id} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 overflow-hidden text-emerald-500 font-mono text-xs">
                    {approved.indexOf(m) + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{m.profiles?.username || m.profiles?.full_name || "Agent " + m.student_id.slice(0, 4).toUpperCase()}</p>
                    <p className="text-[10px] font-mono text-zinc-500">@{m.profiles?.username || m.student_id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   {/* In a real app we'd add `group` class to parent */}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAction(m.student_id, 'kick')}
                    className="p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 rounded-md transition-all"
                    title="Kick from Server"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleAction(m.student_id, 'blacklist')}
                    className="p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-red-600 rounded-md transition-all"
                    title="Terminate & Blacklist"
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

       {/* Blacklist */}
       {blacklisted.length > 0 && (
         <section className="space-y-4 pt-4 border-t border-zinc-900">
           <h3 className="text-xs font-mono text-red-500 uppercase tracking-widest flex items-center gap-2">
             <Ban className="w-4 h-4" /> Permanently Blacklisted ({blacklisted.length})
           </h3>
           <div className="grid gap-2">
             {blacklisted.map((m) => (
               <div key={m.student_id} className="flex items-center justify-between p-2 bg-red-950/10 border border-red-900/30 rounded-lg">
                 <div className="flex items-center gap-3">
                   <p className="text-sm font-medium text-red-400">{(m.profiles?.username || m.profiles?.full_name || "AGENT_" + m.student_id.slice(0, 6).toUpperCase()).replace(/^@/, '')}</p>
                 </div>
                 <button 
                   onClick={() => handleAction(m.student_id, 'unblacklist')}
                   className="text-[10px] font-bold text-red-500 hover:text-red-400 uppercase tracking-tighter"
                 >
                   Restore Access
                 </button>
               </div>
             ))}
           </div>
         </section>
       )}
    </div>
  );
}

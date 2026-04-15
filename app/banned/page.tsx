import { ShieldAlert, Mail, Terminal } from "lucide-react";

export default function BannedPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
          <ShieldAlert className="w-12 h-12" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white tracking-tight uppercase tracking-widest">Access_Denied</h1>
          <p className="text-zinc-500 font-mono text-sm leading-relaxed">
            Your account has been flagged and suspended for violations of the platform security protocol or terms of service.
          </p>
        </div>

        <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-4">
          <div className="flex items-center gap-3 text-left">
            <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">Support_Channel</p>
              <p className="text-sm text-zinc-300">support@codeworld.io</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-left">
            <div className="p-2 bg-zinc-900 rounded-lg text-zinc-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">Protocol_ID</p>
              <p className="text-sm text-zinc-300 font-mono">CODEWORLD_JUDICIAL_ENFORCEMENT</p>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-zinc-700 font-mono uppercase tracking-widest">
          Permanent IP & Identity Logged
        </p>
      </div>
    </div>
  );
}

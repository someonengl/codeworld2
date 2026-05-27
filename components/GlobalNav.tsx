"use client";

import { createClient } from "@/utils/supabase/client";
import { LogOut, Terminal, Shield } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function GlobalNav() {
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data?.user);
      if (data?.user) {
        supabase.from('profiles').select('is_super_admin').eq('id', data.user.id).single().then((p: any) => {
          if (p.data?.is_super_admin) setIsAdmin(true);
        });
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      setUser(session?.user || null);
    });

    return () => authListener.subscription.unsubscribe();
  }, [supabase]);

  if (!user) return null; // Only show navigation explicitly if logged in

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <nav className="w-full border-b border-zinc-800 bg-[#0a0a0a] px-6 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="flex items-center gap-3 text-white hover:text-[#00ff00] transition-colors">
        <Terminal className="w-5 h-5 text-[#00ff00]" />
        <span className="font-bold tracking-widest uppercase text-sm">CodeWorld</span>
      </Link>

      <div className="flex items-center gap-6">
        <div className="text-xs text-zinc-500 font-mono hidden sm:block">
          {user.email}
        </div>
        
        {isAdmin && (
          <Link href="/admin" className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded hover:bg-red-500/20 transition-colors text-xs font-bold uppercase tracking-widest">
            <Shield className="w-3.5 h-3.5"/> Control
          </Link>
        )}

        <button 
          onClick={handleSignOut}
          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="uppercase tracking-widest font-bold">Disconnect</span>
        </button>
      </div>
    </nav>
  );
}

"use client";

import { useState } from "react";
import { Terminal, Lock, ChevronRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleOAuth = async (provider: 'google' | 'github') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    
    // Slight artificial delay for UX feel of 'processing logic'
    setTimeout(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMsg(error.message);
        setIsLoading(false);
      } else {
        window.location.href = "/dashboard";
      }
    }, 500);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] items-center justify-center p-8 bg-[url('https://images.unsplash.com/photo-1635830648400-b6817112ebbd?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center relative">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-0"></div>
      
      <div className="z-10 w-full max-w-md bg-zinc-950/80 backdrop-blur-md p-8 rounded-2xl border border-zinc-800 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col gap-6 transform transition-all duration-500 hover:border-zinc-700">
        <div className="text-center space-y-2">
          <div className="mx-auto bg-zinc-900 border border-zinc-800 p-3 rounded-full w-fit mb-4 text-[#00ff00]">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">System Authorized Access</h1>
          <p className="text-zinc-400 text-sm">Enter your credentials to enter the arena.</p>
        </div>

        <form onSubmit={handleEmailLogin} className="flex flex-col gap-4 w-full mt-4">
          {errorMsg && (
            <div className="text-red-400 text-xs px-3 py-2 bg-red-400/10 border border-red-400/20 rounded animate-pulse">
              [!] Access Denied: {errorMsg}
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-xs font-mono text-zinc-500 uppercase">Hacker ID (Email)</label>
            <input 
              type="email" 
              placeholder="root@terminal.com" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-zinc-800 p-3 rounded-lg focus:border-[#00ff00] focus:ring-1 focus:ring-[#00ff00]/50 outline-none text-sm font-mono transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-zinc-500 uppercase">Passphrase</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-zinc-800 p-3 rounded-lg focus:border-[#00ff00] focus:ring-1 focus:ring-[#00ff00]/50 outline-none text-sm font-mono transition-all"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="group w-full mt-2 bg-gradient-to-r from-emerald-500 to-[#00ff00] hover:from-emerald-400 hover:to-emerald-300 text-black font-bold px-6 py-3 rounded-lg transition-all duration-300 uppercase tracking-wider text-xs flex justify-center items-center gap-2 hover:shadow-[0_0_20px_rgba(0,255,0,0.3)] disabled:opacity-50"
          >
            {isLoading ? "Authenticating..." : "Execute Login"}
            {!isLoading && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="flex items-center gap-4 w-full my-4 opacity-50">
          <div className="flex-1 h-px bg-zinc-700"></div>
          <span className="text-xs text-zinc-400 font-mono">OAUTH PROTOCOL</span>
          <div className="flex-1 h-px bg-zinc-700"></div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button 
            type="button"
            onClick={() => handleOAuth('google')}
            className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-zinc-800 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm hover:border-zinc-600"
          >
            Google
          </button>
          <button 
            type="button"
            onClick={() => handleOAuth('github')}
            className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-zinc-800 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm hover:border-zinc-600"
          >
            GitHub
          </button>
        </div>

        <p className="text-center mt-4 text-xs text-zinc-500">
          No security clearance? <Link href="/register" className="text-[#00ff00] hover:underline underline-offset-4 cursor-pointer">Register here.</Link>
        </p>
      </div>
    </div>
  );
}

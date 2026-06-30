"use client";

import React, { useState } from "react";
import { Shield, ChevronRight, Loader2, KeyRound, Terminal } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    
    const resolvedEmail = email.includes("@") ? email : `${email.trim().toLowerCase()}@codeworld.local`;
    
    // Slight artificial delay for UX feel of 'processing logic'
    setTimeout(async () => {
      const { error } = await supabase.auth.signInWithPassword({ 
        email: resolvedEmail, 
        password 
      });
      
      if (error) {
        setErrorMsg(error.message);
        setIsLoading(false);
      } else {
        router.push("/dashboard");
      }
    }, 500);
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4 sm:p-8 bg-zinc-950 relative overflow-hidden font-sans">
      {/* Dynamic Glowing Ambient Blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/5 blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-teal-500/5 blur-[130px] pointer-events-none z-0" />

      {/* Vector Tech Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 25 }}
        className="z-10 w-full max-w-md bg-zinc-900/35 backdrop-blur-2xl p-8 sm:p-10 rounded-[32px] border border-white/[0.05] shadow-[0_32px_96px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.03)] flex flex-col gap-6 relative"
      >
        {/* Glow Accent Bar */}
        <div className="absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

        {/* Card Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto bg-white/[0.02] border border-white/[0.06] p-3.5 rounded-2xl w-fit mb-2 text-emerald-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase">Authenticate Core</h1>
          <p className="text-zinc-400 text-xs leading-relaxed">Enter your security credentials to access your learning dashboard and practice area.</p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleEmailLogin} className="flex flex-col gap-5 w-full">
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-red-400 text-xs px-3.5 py-2.5 bg-red-500/5 border border-red-500/10 rounded-xl flex items-center gap-2 font-mono"
            >
              <span>[!]</span>
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* Username Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-1">Handle Identity</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 select-none">
                <Terminal className="w-4 h-4" />
              </span>
              <input
                id="username-or-email-input"
                type="text"
                placeholder="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/[0.08] pl-10 pr-4 py-3 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-sm text-white font-mono transition-all duration-300 placeholder:text-zinc-700"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-1">Security Key</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 select-none">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                id="password-input"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/[0.08] pl-10 pr-4 py-3 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none text-sm text-white font-mono transition-all duration-300 placeholder:text-zinc-700"
              />
            </div>
          </div>

          {/* Submit Action */}
          <motion.button
            whileHover={!isLoading ? { scale: 1.015, y: -1 } : {}}
            whileTap={!isLoading ? { scale: 0.985 } : {}}
            id="login-btn"
            type="submit"
            disabled={isLoading}
            className="group w-full mt-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800/50 disabled:text-zinc-600 text-black font-bold px-6 py-3.5 rounded-xl transition-all duration-300 uppercase tracking-widest text-xs flex justify-center items-center gap-2 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating...</>
            ) : (
              <>Establish Connection <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
            )}
          </motion.button>
        </form>

        {/* Footer Login Info */}
        <p className="text-center text-xs text-zinc-500 font-normal mt-2">
          New to the platform?{" "}
          <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4 decoration-2 transition-colors">
            Register here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Terminal, Cpu, Database, Eye } from "lucide-react";
import { motion } from "framer-motion";

export default function PrivacyPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4 sm:p-8 bg-zinc-950 relative overflow-hidden font-sans">
      {/* Premium Glowing Ambient Background Layer */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none z-0" />

      {/* Vector Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="z-10 w-full max-w-5xl bg-zinc-900/35 border border-white/[0.04] backdrop-blur-2xl p-6 sm:p-10 md:p-14 rounded-[32px] shadow-[0_24px_80px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.03)] flex flex-col gap-10 my-10 relative"
      >
        {/* Glow Accent Bar */}
        <div className="absolute top-0 inset-x-12 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

        {/* Back navigation */}
        <motion.div variants={itemVariants}>
          <Link 
            href="/register" 
            className="flex items-center gap-2 text-zinc-500 hover:text-cyan-400 font-mono text-[10px] uppercase tracking-widest transition-colors w-fit group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            Back to Registry Portal
          </Link>
        </motion.div>

        {/* Dual Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          
          {/* Left Column: Title & Metadata */}
          <motion.div variants={itemVariants} className="lg:col-span-5 flex flex-col justify-between gap-8 lg:sticky lg:top-8 h-fit">
            <div className="space-y-6">
              <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-2xl w-fit text-cyan-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <ShieldCheck className="w-10 h-10 animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white uppercase bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
                  Privacy<br />Policy
                </h1>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-relaxed">
                  CodeWorld Data Registry Matrix // VER 2.1
                </p>
              </div>

              <p className="text-sm text-zinc-400 leading-relaxed font-normal">
                This registry describes the secure methods, encryption standards, and storage parameters applied to user profile nodes and code compilation assets on the CodeWorld platform.
              </p>
            </div>

            {/* Micro Dashboard Status Panel */}
            <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.03] space-y-3 font-mono text-[10px] text-zinc-500">
              <div className="flex items-center justify-between">
                <span>SECURITY GUARD:</span>
                <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  STANDBY ACTIVE
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>DATABASE CLOUD:</span>
                <span className="text-white">SUPABASE SECURE HOSTING</span>
              </div>
              <div className="flex items-center justify-between">
                <span>ENCRYPTION SYSTEM:</span>
                <span className="text-white">BCRYPT & RLS RESTRICTIONS</span>
              </div>
              <div className="h-px bg-white/[0.03] my-2" />
              <div className="flex items-center gap-2 text-[9px] text-zinc-600">
                <Terminal className="w-3.5 h-3.5" />
                <span>REGISTRY SHA256 APPROVED</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Policies Scroll/List */}
          <div className="lg:col-span-7 space-y-6">
            
            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-zinc-900/20 border border-white/[0.03] space-y-3 hover:border-cyan-500/20 transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/5 text-cyan-400 border border-cyan-500/10 group-hover:scale-105 transition-transform">
                  <Database className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">01 / Profile Collection</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                We store user-generated handles, shadow local emails (`@codeworld.local`), verified email coordinates collected through Google/GitHub OAuth integrations, and profile avatar assets securely in indexed database records.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-zinc-900/20 border border-white/[0.03] space-y-3 hover:border-cyan-500/20 transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/5 text-cyan-400 border border-cyan-500/10 group-hover:scale-105 transition-transform">
                  <Cpu className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">02 / Code Assets Processing</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Raw source codes are securely dispatched to compiling sandboxes to judge logical validity. Compiler outputs, execution runtimes (ms), memory scopes (kb), and solution timestamps are cached to construct leaderboards and student reports.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-zinc-900/20 border border-white/[0.03] space-y-3 hover:border-cyan-500/20 transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/5 text-cyan-400 border border-cyan-500/10 group-hover:scale-105 transition-transform">
                  <Eye className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">03 / Zero Ad-Sales Policy</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your engineering scripts, leaderboard statistics, and identities are considered intellectual property. We implement a strict security architecture and never sell, trade, or distribute your inputs to commercial brokers.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-zinc-900/20 border border-white/[0.03] space-y-3 hover:border-cyan-500/20 transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/5 text-cyan-400 border border-cyan-500/10 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">04 / Row-Level Security Enforcements</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                PostgreSQL data paths operate under tight Row-Level Security (RLS). Solutions and test vectors are strictly readable only by you and the validated classroom educators managing the groups you choose to join.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-zinc-900/20 border border-white/[0.03] space-y-3 hover:border-cyan-500/20 transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/5 text-cyan-400 border border-cyan-500/10 group-hover:scale-105 transition-transform">
                  <Terminal className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">05 / Purging & Deletion</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                You retain complete authority to delete your profile catalog at any stage. Submitting a profile deletion request instantly flushes your records and anonymizes historical test case submissions.
              </p>
            </motion.div>
          </div>

        </div>

        {/* Footer Area */}
        <motion.div 
          variants={itemVariants} 
          className="flex flex-col sm:flex-row items-center justify-between border-t border-white/[0.04] pt-8 gap-6"
        >
          <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500">
            <Terminal className="w-4 h-4" />
            <span>ENCRYPTED NODE: SHA256-CODEWORLD-STABLE</span>
          </div>
          <Link 
            href="/register" 
            className="px-6 py-3 bg-cyan-500 text-black hover:bg-cyan-400 font-bold font-sans text-xs uppercase tracking-wider rounded-xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(6,182,212,0.35)]"
          >
            Agree & Sign Up
          </Link>
        </motion.div>

      </motion.div>
    </div>
  );
}

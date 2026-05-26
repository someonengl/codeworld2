"use client";

import React from "react";
import Link from "next/link";
import { ScrollText, ArrowLeft, Terminal, AlertTriangle, Shield, Scale, Info } from "lucide-react";
import { motion } from "framer-motion";

export default function TermsPage() {
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
      {/* Premium Glowing Ambient Background Layer (Emerald Accent) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-600/5 blur-[120px] pointer-events-none z-0" />

      {/* Vector Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="z-10 w-full max-w-5xl bg-zinc-900/35 border border-white/[0.04] backdrop-blur-2xl p-6 sm:p-10 md:p-14 rounded-[32px] shadow-[0_24px_80px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.03)] flex flex-col gap-10 my-10 relative"
      >
        {/* Glow Accent Bar */}
        <div className="absolute top-0 inset-x-12 h-0.5 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

        {/* Back navigation */}
        <motion.div variants={itemVariants}>
          <Link 
            href="/register" 
            className="flex items-center gap-2 text-zinc-500 hover:text-emerald-400 font-mono text-[10px] uppercase tracking-widest transition-colors w-fit group"
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
              <div className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-2xl w-fit text-emerald-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <ScrollText className="w-10 h-10 animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white uppercase bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
                  User<br />Agreement
                </h1>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-relaxed">
                  CodeWorld Platform Regulations // VER 1.4
                </p>
              </div>

              <p className="text-sm text-zinc-400 leading-relaxed font-normal">
                By compiling scripts, joining classroom networks, or uploading assets to our remote grading benches, you agree to operate in absolute conformity with these terms.
              </p>
            </div>

            {/* Micro Dashboard Status Panel */}
            <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/[0.03] space-y-3 font-mono text-[10px] text-zinc-500">
              <div className="flex items-center justify-between">
                <span>SYSTEM STATUS:</span>
                <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  SANDBOX ONLINE
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>LICENSE CLASSIFICATION:</span>
                <span className="text-white">COMPILER ACCESS ENTITLEMENT</span>
              </div>
              <div className="flex items-center justify-between">
                <span>ACADEMIC COMPLIANCE:</span>
                <span className="text-white">ZERO PLAGIARISM METRIC</span>
              </div>
              <div className="h-px bg-white/[0.03] my-2" />
              <div className="flex items-center gap-2 text-[9px] text-zinc-600">
                <Terminal className="w-3.5 h-3.5" />
                <span>REGISTRATION LICENSING CONFIRMED</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Terms Scroll/List */}
          <div className="lg:col-span-7 space-y-6">
            
            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-zinc-900/20 border border-white/[0.03] space-y-3 hover:border-emerald-500/20 transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 group-hover:scale-105 transition-transform">
                  <Info className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">01 / Acceptance of Regulations</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Platform registrations certify immediate validation of these guidelines. Users not consenting to these sandbox code regulations must immediately terminate credentials and cease code execution.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-zinc-900/20 border border-white/[0.03] space-y-3 hover:border-emerald-500/20 transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 group-hover:scale-105 transition-transform">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">02 / Academic Integrity Code</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                You certify that all compiled script inputs are authored exclusively by your registered profile. Copying peer solutions, leveraging plagiarized segments, or distributing hints during active classroom test runs is strictly forbidden.
              </p>
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[10px] font-mono text-emerald-400/90 leading-normal">
                [!] Plagiarism triggers automated telemetry inspection and immediate, irreversible account block.
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-zinc-900/20 border border-white/[0.03] space-y-3 hover:border-emerald-500/20 transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 group-hover:scale-105 transition-transform">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">03 / Exploit Restriction Policies</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Escalating privilege scopes inside remote compilers, attempting sandbox escapes, or querying system network items outside sandbox configurations is categorized as a security breach and triggers immediate forensic deactivation.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-zinc-900/20 border border-white/[0.03] space-y-3 hover:border-emerald-500/20 transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 group-hover:scale-105 transition-transform">
                  <Scale className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">04 / Sandbox Entitlement License</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                You retain complete ownership of your uploaded intellectual code scripts. By executing scripts, you accord CodeWorld a worldwide, royalty-free license to run, compile, distribute, and score solution vectors for leaderboard ranks.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="p-6 rounded-2xl bg-zinc-900/20 border border-white/[0.03] space-y-3 hover:border-emerald-500/20 transition-all duration-300 group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 group-hover:scale-105 transition-transform">
                  <Terminal className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider">05 / Disclaimer of Warranties</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Sandbox execution runs are delivered "as is". CodeWorld offers zero performance guarantees concerning compilations and holds zero liability for submission losses or system delays near deadlines.
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
            className="px-6 py-3 bg-emerald-500 text-black hover:bg-emerald-400 font-bold font-sans text-xs uppercase tracking-wider rounded-xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(16,185,129,0.35)]"
          >
            Agree & Sign Up
          </Link>
        </motion.div>

      </motion.div>
    </div>
  );
}

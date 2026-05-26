"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ShieldCheck, ScrollText, Check, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PolicyModalProps {
  type: "terms" | "privacy";
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export default function PolicyModal({ type, isOpen, onClose, onAccept }: PolicyModalProps) {
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleScroll = () => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    // Set scrolled to bottom if within a tiny margin
    if (scrollHeight - scrollTop <= clientHeight + 40) {
      setHasScrolledToBottom(true);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false);
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = 0;
        }
      }, 50);
    }
  }, [isOpen, type]);

  if (!isOpen || !mounted) return null;

  const isTerms = type === "terms";
  const title = isTerms ? "User Agreement" : "Privacy Policy";
  const subtitle = isTerms ? "Academic Integrity & Sandboxing Regulations" : "Security & Data Protection Registry";
  
  const accentColor = isTerms ? "emerald" : "cyan";
  const glowShadow = isTerms ? "shadow-[0_0_50px_rgba(16,185,129,0.12)]" : "shadow-[0_0_50px_rgba(6,182,212,0.12)]";

  const handleAcceptClick = () => {
    if (onAccept) onAccept();
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Immersive Dark Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-black/85 backdrop-blur-md" 
        onClick={onClose} 
      />

      {/* Magnificent Frosted Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", damping: 25, stiffness: 350 }}
        className={`relative w-full max-w-2xl bg-zinc-950/70 border border-white/[0.06] rounded-3xl ${glowShadow} backdrop-blur-2xl overflow-hidden flex flex-col max-h-[85vh]`}
      >
        {/* Subtle Ambient Top Glow */}
        <div className={`absolute top-0 inset-x-0 h-40 bg-gradient-to-b ${isTerms ? "from-emerald-500/10" : "from-cyan-500/10"} to-transparent pointer-events-none`} />

        {/* Top Glow Accent Bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${isTerms ? "from-emerald-500 via-teal-400 to-emerald-600" : "from-cyan-500 via-blue-400 to-cyan-600"}`} />

        {/* Header Section */}
        <div className="relative flex items-center justify-between px-6 sm:px-8 py-5 border-b border-white/[0.04]">
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-center ${isTerms ? "text-emerald-400" : "text-cyan-400"}`}>
              {isTerms ? <ScrollText className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-zinc-400 hover:text-white p-2 hover:bg-white/[0.04] rounded-full transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content (Frosted Scrollable Area) */}
        <div 
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800"
        >
          {/* Version / System Log Tag */}
          <div className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/[0.04] rounded-2xl font-mono text-[10px]">
            <span className={isTerms ? "text-emerald-400" : "text-cyan-400"}>
              [LOG: {isTerms ? "TERMS_V1.4" : "PRIVACY_V2.1"}]
            </span>
            <span className="text-zinc-500">SYSTEM STABLE · ACTIVE VERIFICATION</span>
          </div>

          {/* Guidelines Description */}
          <p className="text-sm text-zinc-400 leading-relaxed font-sans">
            Welcome to CodeWorld. Prior to compiling files in our sandboxed compiler or competing on the dashboard, please inspect our formal platform expectations.
          </p>

          {isTerms ? (
            // REDESIGNED TERMS OF SERVICE (EMERALD)
            <div className="space-y-4 font-sans">
              <div className="p-5 rounded-2xl bg-zinc-900/30 border border-white/[0.03] space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <span className="text-emerald-400 font-mono text-xs">01/</span> Acceptance of Sandbox License
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  By executing scripts, compiling inputs, or competing on leaderboards, you grant CodeWorld a secure, non-exclusive license to build, compile, and evaluate your solutions. 
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/30 border border-white/[0.03] space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <span className="text-emerald-400 font-mono text-xs">02/</span> Academic Integrity Code
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  No plagiarism is permitted. Uploading shared scripts, copying peer codes, or leaking contest details during runtime is strictly forbidden. 
                </p>
                <div className="flex items-center gap-2 mt-2 p-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10 text-[10px] font-mono text-emerald-400">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Violations trigger automated forensic account lock.</span>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/30 border border-white/[0.03] space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <span className="text-emerald-400 font-mono text-xs">03/</span> Exploit Limits & Sandbox Safety
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Bypassing remote execution containers, gaining OS-level command escalation, or querying database files outside your role bounds is categorized as an exploit and will result in a permanent system ban.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/30 border border-white/[0.03] space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <span className="text-emerald-400 font-mono text-xs">04/</span> Disclaimer of Sandbox Warranty
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                   Runtimes run in ephemeral sandboxes. CodeWorld provides no compile-time persistence guarantees and is not liable for system delays, server shutdowns, or submission errors near evaluation deadlines.
                </p>
              </div>
            </div>
          ) : (
            // REDESIGNED PRIVACY POLICY (CYAN)
            <div className="space-y-4 font-sans">
              <div className="p-5 rounded-2xl bg-zinc-900/30 border border-white/[0.03] space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <span className="text-cyan-400 font-mono text-xs">01/</span> Security Matrix & Collection
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  We collect profile handles, verified emails, compiler scripts, and run statistics (compilation time, memory footprints, and judge states). No passwords or private profiles are stored in plain text.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/30 border border-white/[0.03] space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <span className="text-cyan-400 font-mono text-xs">02/</span> Data Processing Engine
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Your submitted files are strictly executed in standard virtual environments to output judge reports. Ranks are rendered on user leaderboards and shared only with your explicit classroom guides.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/30 border border-white/[0.03] space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <span className="text-cyan-400 font-mono text-xs">03/</span> Row-Level Security Rules
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  All databases implement Supabase Row-Level Security (RLS) policies. Only you and authorized educational admins retain the privilege to inspect solution histories or classroom chat transcripts.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-900/30 border border-white/[0.03] space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <span className="text-cyan-400 font-mono text-xs">04/</span> Erasure & Purging Rights
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  You possess absolute rights to request total profile erasure. Purging your registration completely wipes all database items, metadata files, and chat logs from our storage servers immediately.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Area */}
        <div className="relative px-6 sm:px-8 py-5 border-t border-white/[0.04] bg-zinc-950/90 backdrop-blur-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <div className={`w-2 h-2 rounded-full ${hasScrolledToBottom ? (isTerms ? "bg-emerald-500 animate-pulse" : "bg-cyan-500 animate-pulse") : "bg-zinc-600"}`} />
            <span className={hasScrolledToBottom ? "text-zinc-300" : "text-zinc-500 font-semibold"}>
              {hasScrolledToBottom ? "LOG PARSED · READY TO DEPLOY" : "SCROLL DOWN TO VALIDATE"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.06] text-zinc-400 hover:text-white rounded-xl transition-all duration-200 font-sans font-medium text-xs flex-1 sm:flex-none"
            >
              Cancel
            </button>
            <motion.button
              whileHover={hasScrolledToBottom ? { scale: 1.02, y: -1 } : {}}
              whileTap={hasScrolledToBottom ? { scale: 0.98 } : {}}
              onClick={handleAcceptClick}
              disabled={!hasScrolledToBottom && onAccept !== undefined}
              className={`px-5 py-2.5 rounded-xl font-bold font-sans text-xs transition-all duration-300 flex items-center justify-center gap-2 flex-1 sm:flex-none cursor-pointer ${
                isTerms
                  ? "bg-emerald-500 text-black hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16_185_129,0.3)] disabled:bg-zinc-900 disabled:text-zinc-600 disabled:hover:shadow-none"
                  : "bg-cyan-500 text-black hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6_182_212,0.3)] disabled:bg-zinc-900 disabled:text-zinc-600 disabled:hover:shadow-none"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <Check className="w-4 h-4" />
              I Agree & Accept
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

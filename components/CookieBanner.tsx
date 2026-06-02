"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, ShieldAlert } from "lucide-react";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("codeworld-cookie-consent");
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("codeworld-cookie-consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("codeworld-cookie-consent", "declined");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed bottom-6 right-6 left-6 md:left-auto md:max-w-md z-[9999]"
        >
          {/* Glassmorphic Card Container */}
          <div className="relative bg-zinc-950/80 border border-white/[0.08] backdrop-blur-xl p-5 md:p-6 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.05)] flex flex-col gap-4 overflow-hidden">
            {/* Top Cyan Accent bar */}
            <div className="absolute top-0 inset-x-8 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

            {/* Content Row */}
            <div className="flex gap-4">
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-2xl h-fit">
                <Cookie className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Cookie & Privacy Consent
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  We use cookies and secure local storage session keys to maintain your authenticated login state. No advertising cookies are processed.
                </p>
              </div>
              <button 
                onClick={() => setIsVisible(false)}
                className="text-zinc-500 hover:text-zinc-300 p-1 transition-colors h-fit"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Actions Row */}
            <div className="flex items-center justify-between gap-4 mt-2">
              <Link 
                href="/privacy" 
                className="text-[10px] font-mono text-zinc-500 hover:text-cyan-400 uppercase tracking-widest transition-colors"
              >
                Read Privacy Matrix
              </Link>
              <div className="flex gap-2">
                <button
                  onClick={handleDecline}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 text-xs font-semibold rounded-xl transition-all"
                >
                  Decline
                </button>
                <button
                  onClick={handleAccept}
                  className="px-5 py-2 bg-cyan-500 text-black hover:bg-cyan-400 text-xs font-bold rounded-xl transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

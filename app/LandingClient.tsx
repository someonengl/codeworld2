"use client";

import Link from "next/link";
import { Terminal, Code2, Users, Play, ChevronRight, Zap, Globe2, Shield } from "lucide-react";
import { motion, Variants } from "framer-motion";
import MotionCard from "@/app/components/MotionCard";

// Animation variants
const heroContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

const bentoContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const bentoItem: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

interface Props {
  user: any;
}

const FEATURES = [
  {
    col: "col-span-1 md:col-span-2",
    icon: Code2,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    glow: "rgba(16,185,129,0.12)",
    title: "Multi-Language Submit",
    desc: "Paste or upload code in C++, Python, Java, Go, Rust, and more. Clean submit-only interface built for competitive programmers.",
    large: true,
  },
  {
    col: "col-span-1",
    icon: Play,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    glow: "rgba(59,130,246,0.12)",
    title: "Instant Judging",
    desc: "Real-time sandboxed execution against all test cases. Per-case verdict with Accepted, WA, TLE, CE, and RE feedback.",
  },
  {
    col: "col-span-1",
    icon: Shield,
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    glow: "rgba(168,85,247,0.12)",
    title: "Classroom Hubs",
    desc: "Strictly isolated learning environments protected by multi-layered RBAC constraints. Secure your data.",
  },
  {
    col: "col-span-1 md:col-span-2",
    icon: Globe2,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    glow: "rgba(245,158,11,0.12)",
    title: "Community Translations",
    desc: "Algorithmic problems localized implicitly. The community submits and moderates translations across global language vectors.",
    large: true,
  },
];

export default function LandingClient({ user }: Props) {
  return (
    <div className="flex flex-col flex-1 w-full relative">
      {/* Background */}
      <div className="fixed inset-0 z-0 bg-[#050505]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <motion.div
          className="absolute top-0 right-0 w-[900px] h-[900px] bg-indigo-500/8 rounded-full blur-[160px] pointer-events-none"
          animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          style={{ translateX: "30%", translateY: "-30%" }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none"
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          style={{ translateX: "-30%", translateY: "30%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#050505] pointer-events-none" />
      </div>

      <div className="z-10 w-full flex flex-col items-center">

        {/* ─── Hero ────────────────────────────────────────────── */}
        <section className="w-full max-w-6xl mx-auto px-6 py-24 md:py-36 flex flex-col items-center text-center">
          <motion.div
            variants={heroContainer}
            initial="hidden"
            animate="show"
            className="flex flex-col items-center gap-8"
          >
            {/* Badge */}
            <motion.div variants={heroItem}>
              <div className="inline-flex items-center gap-2 bg-[#10b981]/5 text-emerald-400 border border-emerald-500/10 px-4 py-1.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-widest shadow-[inset_0_1px_0_rgba(16,185,129,0.2)]">
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Zap className="w-3.5 h-3.5" />
                </motion.span>
                <span>CodeWorld LMS 2.0 Live</span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={heroItem}
              className="text-5xl md:text-8xl font-black tracking-tighter leading-[1.05] text-white"
            >
              Next-Gen Algorithmic{" "}
              <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-400 via-purple-400 to-emerald-400 animate-gradient">
                Battleground.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={heroItem}
              className="text-lg md:text-2xl text-zinc-500 max-w-3xl leading-relaxed font-light tracking-wide"
            >
              The ultimate LMS for competitive programming logic and execution. Master algorithms, compete in realtime classrooms, and submit translations across the globe.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              variants={heroItem}
              className="flex flex-col sm:flex-row gap-4 pt-2 w-full sm:w-auto"
            >
              {user ? (
                <Link
                  href="/dashboard"
                  className="group flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 text-sm hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:-translate-y-0.5 animate-pulse-glow"
                >
                  Go to Dashboard
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="group flex-1 sm:flex-none flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-xl transition-all duration-300 text-sm hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] hover:-translate-y-0.5"
                  >
                    Get Started
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/login"
                    className="group flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/[0.03] hover:bg-white/[0.06] text-white font-bold border border-white/[0.08] hover:border-white/[0.15] px-8 py-4 rounded-xl transition-all duration-300 text-sm backdrop-blur-sm hover:-translate-y-0.5"
                  >
                    Log In
                    <Terminal className="w-5 h-5 group-hover:opacity-70 transition-opacity" />
                  </Link>
                </>
              )}
            </motion.div>

            {/* spacer */}
            <div className="pt-2" />
          </motion.div>
        </section>

        {/* ─── Bento Grid ──────────────────────────────────────── */}
        <section className="w-full max-w-6xl mx-auto px-6 py-20 border-t border-white/[0.04]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as any }}
            className="text-center mb-16 space-y-4"
          >
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">Engineered for Performance.</h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto font-light">Skip the boilerplate. Jump into a fully integrated execution environment with sub-millisecond judging.</p>
          </motion.div>

          <motion.div
            variants={bentoContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={i} variants={bentoItem} className={f.col}>
                  <MotionCard
                    glowColor={f.glow}
                    className="group bg-white/[0.02] backdrop-blur-3xl border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] rounded-[2rem] p-8 flex flex-col justify-between min-h-[280px] transition-all duration-500 hover:bg-white/[0.04] hover:border-white/[0.08] hover:-translate-y-1.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_16px_48px_rgba(0,0,0,0.7)]"
                  >
                    <div className="space-y-4">
                      <motion.div
                        className={`${f.iconBg} p-3 rounded-xl w-fit ${f.iconColor}`}
                        whileHover={{ scale: 1.15, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        <Icon className="w-8 h-8" />
                      </motion.div>
                      <h3 className={`font-bold text-white ${f.large ? "text-2xl" : "text-xl"}`}>{f.title}</h3>
                      <p className={`text-zinc-400 leading-relaxed font-light ${f.large ? "max-w-md" : "text-sm"}`}>{f.desc}</p>
                    </div>
                    {/* Bottom accent line */}
                    <div className="mt-8 h-px w-0 group-hover:w-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-all duration-700" />
                  </MotionCard>
                </motion.div>
              );
            })}
          </motion.div>
        </section>

        {/* ─── Footer ──────────────────────────────────────────── */}
        <footer className="w-full border-t border-white/[0.04] mt-12 py-12 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 font-bold text-lg text-zinc-500 hover:text-indigo-400 transition-colors">
              <Terminal className="w-5 h-5 text-indigo-500" />
              CodeWorld
            </div>
            <div className="text-xs text-zinc-700 font-mono tracking-widest uppercase">
              © {new Date().getFullYear()} CodeWorld. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

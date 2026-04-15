"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import MotionCard from "@/app/components/MotionCard";
import { ExternalLink, Clock } from "lucide-react";

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export default function StudentClient({
  initialMemberships,
  stats,
}: {
  initialMemberships: any[];
  stats: { xp: number; solved: number; translations: number };
}) {
  const active = initialMemberships.filter((m) => ["approved", "pending"].includes(m.status));

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-10">

      {/* ── Stats Row ─────────────────────────────────────────── */}
      <motion.div variants={item} className="grid grid-cols-3 gap-4">
        {[
          { label: "Problems Solved", val: stats.solved, color: "from-white to-blue-400" },
          { label: "XP Score", val: `${stats.xp}`, color: "from-white to-emerald-400" },
          { label: "Translations", val: stats.translations, color: "from-white to-purple-400" },
        ].map((s, i) => (
          <MotionCard key={i} glowColor="rgba(99,102,241,0.1)" className="p-6 bg-white/[0.02] backdrop-blur-md border border-white/[0.04] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] group hover:bg-white/[0.04] transition-all duration-300">
            <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-zinc-600 group-hover:text-zinc-500 transition-colors mb-3">{s.label}</p>
            <motion.p
              className={`text-4xl font-black font-mono bg-clip-text text-transparent bg-gradient-to-br ${s.color}`}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.1, type: "spring" }}
            >
              {s.val}
            </motion.p>
            {/* Animated bottom bar */}
            <div className="mt-4 h-px w-0 group-hover:w-full bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent transition-all duration-700" />
          </MotionCard>
        ))}
      </motion.div>

      {/* ── Classrooms ─────────────────────────────────────────── */}
      <div>
        <motion.h2 variants={item} className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 mb-5 border-l-2 border-amber-500/50 pl-3">
          Your Classrooms
        </motion.h2>

        {active.length === 0 ? (
          <motion.div variants={item} className="p-10 bg-white/[0.015] border border-white/[0.04] border-dashed rounded-2xl text-zinc-600 font-mono text-sm text-center">
            Not enrolled in any classrooms yet. Enter a Join Code in the navbar.
          </motion.div>
        ) : (
          <div className="space-y-3">
            {active.map((m, i) => (
              <motion.div key={m.id} variants={item}>
                <MotionCard glowColor="rgba(99,102,241,0.08)" className="group bg-white/[0.02] backdrop-blur-md border border-white/[0.04] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300">
                  {/* Single-row horizontal layout */}
                  <div className="flex items-center gap-5 p-5">
                    {/* Status indicator */}
                    <div className={`shrink-0 w-1 h-10 rounded-full ${
                      m.status === "approved"
                        ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]"
                        : "bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse"
                    }`} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-base tracking-tight truncate group-hover:text-indigo-200 transition-colors">
                        {m.groups?.name || "Unknown Group"}
                      </h3>
                      <p className="text-[11px] text-zinc-600 font-mono mt-0.5 uppercase tracking-widest">
                        Join Code: <span className="text-zinc-400">{m.groups?.join_code}</span>
                      </p>
                    </div>

                    {/* CTA */}
                    {m.status === "approved" ? (
                      <Link
                        href={`/group/${m.group_id}`}
                        className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-white text-black text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-100 hover:-translate-y-0.5 transition-all shadow-[0_0_20px_rgba(255,255,255,0.08)] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                      >
                        Enter Hub <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <span className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 text-amber-400 text-[10px] font-mono font-bold border border-amber-500/20 rounded-xl">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </div>
                </MotionCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

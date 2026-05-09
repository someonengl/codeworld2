"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { ExternalLink, Clock, Target, Zap, Globe } from "lucide-react";

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
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
    <motion.div variants={stagger} initial="hidden" animate="show" className="p-8 max-w-7xl mx-auto space-y-12">
      
      {/* ── Header ── */}
      <header className="space-y-2">
        <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-3 uppercase">
          COMMAND_CENTER
          <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
        </h1>
        <p className="text-brand-muted font-medium">Welcome back, Operative. Review your mission parameters below.</p>
      </header>

      {/* ── Stats Grid ── */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Problems Solved", val: stats.solved, icon: Zap, color: "text-brand-cyan" },
          { label: "XP Progress", val: `${stats.xp}`, icon: Target, color: "text-brand-orange" },
          { label: "Translations", val: stats.translations, icon: Globe, color: "text-white" },
        ].map((s, i) => (
          <div key={i} className="mission-card p-6 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-brand-muted">{s.label}</p>
              <s.icon className={`w-4 h-4 ${s.color} opacity-50`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-mono font-black ${s.color}`}>{s.val}</span>
              <span className="text-[10px] font-mono text-brand-muted">UNIT_VECTOR</span>
            </div>
            <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-2">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "70%" }}
                transition={{ duration: 1, delay: 0.5 }}
                className={`h-full ${s.color.replace('text-', 'bg-')}`} 
              />
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── Classrooms ── */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-white tracking-tight uppercase">Active_Sectors</h2>
          <div className="h-px flex-1 bg-brand-border" />
        </div>

        {active.length === 0 ? (
          <div className="p-12 border-2 border-dashed border-brand-border rounded-xl flex flex-col items-center justify-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <Clock className="w-6 h-6 text-brand-muted" />
            </div>
            <p className="text-brand-muted font-mono text-xs uppercase tracking-widest">No Active Deployments Detected.</p>
            <p className="text-[10px] text-zinc-600 uppercase">ENTER JOIN CODE IN THE TOP INTERFACE TO ENROLL</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {active.map((m) => (
              <motion.div key={m.id} variants={item} className="mission-card group">
                <div className="flex flex-col md:flex-row items-center gap-6 p-6">
                  {/* Status Bar */}
                  <div className={`w-1 h-12 rounded-full ${
                    m.status === "approved" ? "bg-brand-cyan shadow-[0_0_10px_rgba(0,245,255,0.5)]" : "bg-brand-orange animate-pulse"
                  }`} />

                  {/* Group Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-brand-cyan uppercase tracking-tighter">Sector_Locked</span>
                      <div className="h-px w-4 bg-brand-border" />
                    </div>
                    <h3 className="text-xl font-black text-white tracking-tight group-hover:text-brand-cyan transition-colors uppercase">
                      {m.groups?.name || "REDACTED_GROUP"}
                    </h3>
                    <p className="text-[10px] text-brand-muted font-mono uppercase tracking-[0.15em] mt-1">
                      ID: TESTKEY123 // STATUS: {m.status.toUpperCase()}
                    </p>
                  </div>

                  {/* Actions */}
                  {m.status === "approved" ? (
                    <Link
                      href={`/group/${m.group_id}`}
                      className="btn-primary"
                    >
                      INITIALIZE_HUB <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-brand-orange/10 text-brand-orange text-[10px] font-mono font-bold border border-brand-orange/20 rounded-lg">
                      <Clock className="w-3.5 h-3.5" /> AWAITING_AUTHORIZATION
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Code2,
  ExternalLink,
  Sparkles,
  User,
  Calendar,
  Tag,
  Layers,
  Zap,
} from "lucide-react";

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Beginner: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  Intermediate: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  Advanced: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  Elite: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
};

export default function TopicDetailClient({ topic }: { topic: any }) {
  const colors = DIFFICULTY_COLORS[topic.difficulty] || DIFFICULTY_COLORS.Beginner;

  return (
    <div className="flex-1 flex flex-col bg-[#050505] relative min-h-0">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />
      <div className="absolute top-0 right-0 w-[60%] h-[400px] bg-cyan-900/6 blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-8 py-10 flex-1">
        {/* Back Link */}
        <Link
          href="/topics"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-cyan-400 text-xs font-bold uppercase tracking-widest transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Topics
        </Link>

        {/* Header */}
        <header className="mb-10 pb-8 border-b border-white/[0.05]">
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${colors.bg} ${colors.text} ${colors.border}`}
            >
              {topic.difficulty}
            </span>
            <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-white/[0.03] text-zinc-500 border border-white/[0.06]">
              {topic.category}
            </span>
          </div>

          <h1 className="text-4xl font-black tracking-tight text-white mb-4">
            {topic.title}
          </h1>

          <div className="flex items-center gap-6 text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <User className="w-3 h-3" />
              {topic.profiles?.username || topic.profiles?.full_name || "Unknown"}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              {new Date(topic.created_at).toLocaleDateString()}
            </span>
          </div>
        </header>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Explanation */}
            <section className="p-8 bg-white/[0.02] backdrop-blur-md border border-white/[0.04] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Concept Explanation
                </h2>
              </div>

              <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap font-mono border-l-4 border-cyan-500/20 pl-6 py-2">
                {topic.explanation || topic.content}
              </div>
            </section>

            {/* Code Example */}
            {topic.code_example && (
              <section className="bg-white/[0.02] backdrop-blur-md border border-white/[0.04] rounded-2xl overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      C++ Implementation
                    </h2>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/50" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/50" />
                  </div>
                </div>

                <div className="p-6 bg-black/30">
                  <pre className="text-[12px] font-mono text-zinc-300 leading-relaxed overflow-x-auto whitespace-pre">
                    <code>{topic.code_example}</code>
                  </pre>
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Topic Info Card */}
            <div className="p-6 bg-white/[0.02] backdrop-blur-md border border-white/[0.04] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-500" /> Quick Info
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-white/[0.03]">
                  <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest flex items-center gap-1.5">
                    <Layers className="w-3 h-3" /> Level
                  </span>
                  <span className={`text-xs font-bold ${colors.text}`}>{topic.difficulty}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-white/[0.03]">
                  <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest flex items-center gap-1.5">
                    <Tag className="w-3 h-3" /> Category
                  </span>
                  <span className="text-xs font-bold text-zinc-400">{topic.category}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest flex items-center gap-1.5">
                    <Zap className="w-3 h-3" /> Author
                  </span>
                  <span className="text-xs font-bold text-zinc-400">
                    @{topic.profiles?.username || "unknown"}
                  </span>
                </div>
              </div>
            </div>

            {/* External Resources */}
            <div className="p-6 bg-white/[0.02] backdrop-blur-md border border-white/[0.04] rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-blue-500" /> Resources
              </h3>
              <div className="space-y-2">
                {topic.topic_resources && topic.topic_resources.length > 0 ? (
                  topic.topic_resources.map((res: any) => (
                    <a
                      key={res.id}
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between w-full p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl hover:bg-white/[0.05] hover:border-cyan-500/20 transition-all text-xs font-semibold text-zinc-300 hover:text-cyan-400 group"
                    >
                      {res.name}
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-700 group-hover:text-cyan-500 transition-colors" />
                    </a>
                  ))
                ) : (
                  <>
                    <a
                      href="https://cp-algorithms.com"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between w-full p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl hover:bg-white/[0.05] hover:border-cyan-500/20 transition-all text-xs font-semibold text-zinc-300 hover:text-cyan-400 group"
                    >
                      CP-Algorithms
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-700 group-hover:text-cyan-500 transition-colors" />
                    </a>
                    <a
                      href="https://www.geeksforgeeks.org/competitive-programming-a-complete-guide/"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between w-full p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl hover:bg-white/[0.05] hover:border-cyan-500/20 transition-all text-xs font-semibold text-zinc-300 hover:text-cyan-400 group"
                    >
                      GeeksForGeeks Guide
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-700 group-hover:text-cyan-500 transition-colors" />
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Practice Links */}
            <div className="p-6 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 backdrop-blur-md border border-cyan-500/10 rounded-2xl">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" /> Practice Problems
              </h3>
              <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed">
                Ready to test your skills? Try related problems on these platforms.
              </p>
              <div className="space-y-2">
                <a
                  href="https://codeforces.com/problemset"
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full text-center py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-cyan-900/20"
                >
                  Codeforces Problems
                </a>
                <a
                  href="https://cses.fi/problemset/"
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full text-center py-2.5 bg-white/[0.03] border border-white/[0.06] text-zinc-300 hover:text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all hover:bg-white/[0.06]"
                >
                  CSES Problem Set
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

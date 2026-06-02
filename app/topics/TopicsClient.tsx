"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  BookOpen,
  Layers,
  Plus,
  X,
  Search,
  Sparkles,
  Code2,
  Zap,
  Trophy,
  Filter,
} from "lucide-react";
import { createTopic } from "@/app/actions/createTopic";
import TopicForm from "@/app/components/TopicForm";

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  Beginner: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", glow: "shadow-emerald-500/10" },
  Intermediate: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20", glow: "shadow-blue-500/10" },
  Advanced: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20", glow: "shadow-purple-500/10" },
  Elite: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20", glow: "shadow-red-500/10" },
};

const DIFFICULTY_ICONS: Record<string, React.ReactNode> = {
  Beginner: <BookOpen className="w-4 h-4" />,
  Intermediate: <Code2 className="w-4 h-4" />,
  Advanced: <Zap className="w-4 h-4" />,
  Elite: <Trophy className="w-4 h-4" />,
};

export default function TopicsClient({
  initialTopics,
  isTeacher,
  userId,
}: {
  initialTopics: any[];
  isTeacher: boolean;
  userId: string | null;
}) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [topics, setTopics] = useState(initialTopics);

  // Group topics by difficulty level
  const difficultyOrder = ["Beginner", "Intermediate", "Advanced", "Elite"];

  // Get unique categories
  const allCategories = Array.from(new Set(topics.map((t: any) => t.category))).sort();

  // Filter topics
  const filteredTopics = topics.filter((t: any) => {
    const matchSearch =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.content?.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.toLowerCase().includes(search.toLowerCase());
    const matchDifficulty = !filterDifficulty || t.difficulty === filterDifficulty;
    const matchCategory = !filterCategory || t.category === filterCategory;
    return matchSearch && matchDifficulty && matchCategory;
  });

  // Group filtered topics by difficulty
  const groupedTopics = difficultyOrder
    .map((diff) => ({
      difficulty: diff,
      topics: filteredTopics.filter((t: any) => t.difficulty === diff),
    }))
    .filter((g) => g.topics.length > 0);

  const handleCreateTopic = async (data: any) => {
    const result = await createTopic(null, data.title, {
      content: data.content,
      explanation: data.explanation,
      code_example: data.code_example,
      difficulty: data.difficulty,
      category: data.category,
      resources: data.resources,
      is_public: true,
    });

    if (result.success) {
      setShowForm(false);
      alert("Topic submitted! It will appear once approved by an admin.");
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#050505] min-h-0 relative">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-900/8 blur-[120px] pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-8 py-12 flex-1">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-mono font-bold tracking-widest text-zinc-600 uppercase mb-3 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-500" /> Learning Path
              </p>
              <h1 className="text-4xl font-black tracking-tight text-white mb-3">
                Topic{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Library
                </span>
              </h1>
              <p className="text-zinc-500 text-sm max-w-2xl leading-relaxed">
                Master competitive programming step-by-step. Explore curated topics covering
                everything from basic syntax to elite algorithms, each with detailed explanations
                and C++ implementations.
              </p>
            </div>

            {isTeacher && (
              <button
                onClick={() => setShowForm(!showForm)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all shrink-0 cursor-pointer ${
                  showForm
                    ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
                    : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/30"
                }`}
              >
                {showForm ? (
                  <>
                    <X className="w-3.5 h-3.5" /> Cancel
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" /> Create Topic
                  </>
                )}
              </button>
            )}
          </div>
        </header>

        {/* Lower Content Area: Search & Filters */}
        <div className="mb-10 p-5 bg-white/[0.01] border border-white/[0.04] rounded-2xl flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[250px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics..."
              className="w-full bg-[#050505] border border-white/[0.06] rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-cyan-500/40 transition-colors text-white placeholder:text-zinc-600"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-zinc-600" />
            {difficultyOrder.map((d) => {
              const colors = DIFFICULTY_COLORS[d];
              const isActive = filterDifficulty === d;
              return (
                <button
                  key={d}
                  onClick={() => setFilterDifficulty(isActive ? null : d)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all cursor-pointer ${
                    isActive
                      ? `${colors.bg} ${colors.text} ${colors.border}`
                      : "bg-white/[0.02] text-zinc-600 border-white/[0.04] hover:border-white/[0.08] hover:text-zinc-400"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {allCategories.length > 1 && (
            <select
              value={filterCategory || ""}
              onChange={(e) => setFilterCategory(e.target.value || null)}
              className="bg-[#050505] border border-white/[0.06] rounded-xl px-3 py-2 text-[11px] outline-none text-zinc-400 focus:border-cyan-500/40 cursor-pointer"
            >
              <option value="">All Categories</option>
              {allCategories.map((c: string) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Create Topic Form */}
        {showForm && (
          <div className="mb-12 p-8 bg-white/[0.02] backdrop-blur-md border border-white/[0.06] rounded-3xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] animate-in fade-in slide-in-from-top-4 duration-300">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-500" /> Create New Topic
            </h2>
            <p className="text-xs text-zinc-500 mb-6">
              Your topic will be reviewed by an admin before it becomes publicly visible.
            </p>
            <TopicForm
              onSubmit={handleCreateTopic}
              onCancel={() => setShowForm(false)}
              submitLabel="Submit for Review"
            />
          </div>
        )}

        {/* Topics Grid by Difficulty */}
        <div className="space-y-12">
          {groupedTopics.length === 0 && (
            <div className="p-16 text-center bg-white/[0.01] border border-white/[0.04] border-dashed rounded-3xl">
              <BookOpen className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
              <p className="text-zinc-600 text-sm font-mono">
                {search || filterDifficulty || filterCategory
                  ? "No topics match your filters."
                  : "No topics available yet. Check back soon!"}
              </p>
            </div>
          )}

          {groupedTopics.map((group) => {
            const colors = DIFFICULTY_COLORS[group.difficulty] || DIFFICULTY_COLORS.Beginner;
            return (
              <section key={group.difficulty}>
                <div className="flex items-center gap-3 mb-6">
                  <div
                    className={`w-9 h-9 rounded-xl ${colors.bg} ${colors.text} border ${colors.border} flex items-center justify-center shadow-lg ${colors.glow}`}
                  >
                    {DIFFICULTY_ICONS[group.difficulty] || <Layers className="w-4 h-4" />}
                  </div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {group.difficulty}
                  </h2>
                  <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                    {group.topics.length} topic{group.topics.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.topics.map((topic: any) => (
                    <Link
                      key={topic.id}
                      href={`/topics/${topic.id}`}
                      className="group"
                    >
                      <div className="h-full p-6 bg-white/[0.02] backdrop-blur-md border border-white/[0.04] rounded-2xl transition-all duration-300 hover:-translate-y-1.5 hover:bg-white/[0.04] hover:border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors leading-tight">
                            {topic.title}
                          </h3>
                          <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-cyan-500 shrink-0 transition-all group-hover:translate-x-0.5" />
                        </div>

                        <p className="text-zinc-500 text-xs leading-relaxed flex-1 mb-4 line-clamp-3">
                          {topic.content}
                        </p>

                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.04]">
                          <span
                            className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md border ${colors.bg} ${colors.text} ${colors.border}`}
                          >
                            {topic.category}
                          </span>
                          <span className="text-[10px] text-cyan-500 font-bold uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                            <BookOpen className="w-3 h-3" /> Explore
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

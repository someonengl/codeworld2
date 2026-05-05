"use client";

import { useState } from "react";
import { Plus, Trash2, Save, X, Link as LinkIcon, BookOpen } from "lucide-react";

export interface TopicResource {
  name: string;
  url: string;
}

interface TopicFormProps {
  initialData?: {
    title: string;
    content: string;
    explanation: string;
    code_example: string;
    difficulty: string;
    category: string;
    resources: TopicResource[];
  };
  onSubmit: (data: {
    title: string;
    content: string;
    explanation: string;
    code_example: string;
    difficulty: string;
    category: string;
    resources: TopicResource[];
  }) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

const CATEGORIES = [
  "General",
  "Number Theory",
  "Sorting",
  "Searching",
  "Graph Theory",
  "Dynamic Programming",
  "Data Structures",
  "Strings",
  "Geometry",
  "Combinatorics",
  "Greedy",
  "Divide & Conquer",
  "Trees",
  "Flows & Matching",
  "Math",
  "Implementation",
];

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Elite"];

export default function TopicForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Publish Topic",
}: TopicFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [explanation, setExplanation] = useState(initialData?.explanation || "");
  const [codeExample, setCodeExample] = useState(initialData?.code_example || "");
  const [difficulty, setDifficulty] = useState(initialData?.difficulty || "Beginner");
  const [category, setCategory] = useState(initialData?.category || "General");
  const [resources, setResources] = useState<TopicResource[]>(
    initialData?.resources || [{ name: "", url: "" }]
  );
  const [loading, setLoading] = useState(false);

  const addResource = () => {
    setResources([...resources, { name: "", url: "" }]);
  };

  const removeResource = (idx: number) => {
    setResources(resources.filter((_, i) => i !== idx));
  };

  const updateResource = (idx: number, field: keyof TopicResource, value: string) => {
    const updated = [...resources];
    updated[idx][field] = value;
    setResources(updated);
  };

  const internalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !explanation.trim()) {
      alert("Title, summary, and explanation are required.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        explanation: explanation.trim(),
        code_example: codeExample.trim(),
        difficulty,
        category,
        resources: resources.filter((r) => r.name.trim() && r.url.trim()),
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={internalSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">
              Topic Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-cyan-500/50 rounded-lg p-3 text-sm outline-none transition-all shadow-inner"
              placeholder="e.g. Binary Search Fundamentals"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs outline-none focus:border-cyan-500/50"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs outline-none focus:border-cyan-500/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">
              Short Summary (Card Preview)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-20 bg-zinc-950 border border-zinc-800 focus:border-cyan-500/50 rounded-lg p-3 text-sm outline-none font-mono transition-all resize-none shadow-inner"
              placeholder="Brief description shown on the topic card..."
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">
              Full Explanation (Markdown)
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="w-full h-52 bg-zinc-950 border border-zinc-800 focus:border-cyan-500/50 rounded-lg p-3 text-sm outline-none font-mono transition-all resize-none shadow-inner"
              placeholder="Detailed explanation of the topic with examples, theory, complexity analysis..."
              required
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5 font-bold">
              C++ Code Example (Optional)
            </label>
            <textarea
              value={codeExample}
              onChange={(e) => setCodeExample(e.target.value)}
              className="w-full h-64 bg-zinc-950 border border-zinc-800 focus:border-cyan-500/50 rounded-lg p-3 text-[11px] outline-none font-mono transition-all resize-none shadow-inner"
              placeholder={`#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your example code here...\n    return 0;\n}`}
            />
          </div>

          {/* Resources */}
          <div>
            <div className="flex items-center justify-between pb-1 border-b border-zinc-800/50 mb-3">
              <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold flex items-center gap-1.5">
                <LinkIcon className="w-3 h-3" /> External Resources
              </label>
              <button
                type="button"
                onClick={addResource}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-tighter flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Link
              </button>
            </div>

            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {resources.map((res, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-3 bg-zinc-950 border border-zinc-800 rounded-xl"
                >
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={res.name}
                      onChange={(e) => updateResource(idx, "name", e.target.value)}
                      className="w-full bg-black/50 border border-zinc-800/50 focus:border-zinc-700 rounded-lg p-2 text-[11px] outline-none transition-all"
                      placeholder="Resource Name (e.g. CP-Algorithms)"
                    />
                    <input
                      type="url"
                      value={res.url}
                      onChange={(e) => updateResource(idx, "url", e.target.value)}
                      className="w-full bg-black/50 border border-zinc-800/50 focus:border-zinc-700 rounded-lg p-2 text-[11px] font-mono outline-none transition-all"
                      placeholder="https://..."
                    />
                  </div>
                  {resources.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeResource(idx)}
                      className="text-zinc-700 hover:text-red-400 transition-colors mt-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-zinc-800 flex items-center justify-end gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors font-mono"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-8 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg transition-all text-xs uppercase tracking-widest disabled:opacity-50 shadow-lg shadow-cyan-900/20"
        >
          {loading ? (
            "Processing..."
          ) : (
            <>
              <BookOpen className="w-4 h-4" />
              {submitLabel}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

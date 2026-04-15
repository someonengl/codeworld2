"use client";

import { useState } from "react";
import { Plus, Link as LinkIcon, Video, FileText, Image as ImageIcon } from "lucide-react";
import { createMaterial } from "@/app/actions/createMaterial";

export default function TeacherMaterialControls({ groupId }: { groupId: string }) {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [materialType, setMaterialType] = useState("link");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !linkUrl) return;

    setLoading(true);
    try {
      await createMaterial(groupId, title, description, linkUrl, materialType);
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsCreating(!isCreating)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-500 border border-blue-500/30 rounded text-sm font-bold tracking-widest uppercase hover:bg-blue-500/20 transition-colors"
      >
        <Plus className="w-4 h-4" /> {isCreating ? "Cancel Material" : "Add Material"}
      </button>

      {isCreating && (
        <form onSubmit={handleSubmit} className="mt-4 p-6 bg-zinc-900 border border-zinc-800 rounded-lg space-y-5 max-w-2xl">
          <div>
            <label className="block text-xs font-mono text-zinc-500 uppercase mb-1">Material Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded p-2.5 text-sm outline-none transition-colors"
              placeholder="e.g. Introduction to Dynamic Programming"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-500 uppercase mb-2">Material Type</label>
            <div className="flex gap-4">
              {[
                { id: "link", icon: LinkIcon, label: "Link" },
                { id: "video", icon: Video, label: "Video" },
                { id: "pdf", icon: FileText, label: "PDF" },
                { id: "image", icon: ImageIcon, label: "Image" },
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setMaterialType(type.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs transition-colors ${
                    materialType === type.id
                      ? "bg-blue-500/20 border-blue-500 text-blue-400"
                      : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                  }`}
                >
                  <type.icon className="w-3.5 h-3.5" />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-500 uppercase mb-1">Resource Link (URL)</label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded p-2.5 text-sm outline-none transition-colors"
              placeholder="https://example.com/resource"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-500 uppercase mb-1">Optional Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-24 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded p-2.5 text-sm outline-none transition-colors"
              placeholder="Provide some context for this resource..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded transition-colors text-sm disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add Material to Hub"}
          </button>
        </form>
      )}
    </div>
  );
}

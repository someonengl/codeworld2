"use client";

import { Video, FileText, Image as ImageIcon, Link as LinkIcon, ExternalLink, Trash2, Loader2 } from "lucide-react";
import { deleteMaterial } from "@/app/actions/deleteMaterial";
import { useState } from "react";

interface Material {
  id: string;
  title: string;
  description: string | null;
  link_url: string;
  material_type: string;
}

export default function MaterialList({ 
  materials, 
  isTeacher = false, 
  groupId 
}: { 
  materials: Material[], 
  isTeacher?: boolean, 
  groupId?: string 
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!groupId) return;
    if (!confirm("Are you sure you want to delete this material?")) return;

    setDeletingId(id);
    try {
      const res = await deleteMaterial(id, groupId);
      if (!res.success) alert(res.error);
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setDeletingId(null);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-5 h-5 text-red-500" />;
      case "pdf":
        return <FileText className="w-5 h-5 text-orange-500" />;
      case "image":
        return <ImageIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <LinkIcon className="w-5 h-5 text-zinc-500" />;
    }
  };

  if (materials.length === 0) {
    return (
      <div className="text-sm text-zinc-500 italic p-4 border border-zinc-800 border-dashed rounded-lg text-center">
        No learning materials have been uploaded yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {materials.map((m) => (
        <div key={m.id} className="relative group/container">
          <a
            href={m.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all rounded-lg flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-zinc-950 rounded border border-zinc-800">
                {getIcon(m.material_type)}
              </div>
              <div>
                <h3 className="font-medium group-hover:text-blue-400 transition-colors">
                  {m.title}
                </h3>
                {m.description && (
                  <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1 pr-8">
                    {m.description}
                  </p>
                )}
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 transition-colors shrink-0" />
          </a>
          
          {isTeacher && (
             <button
                onClick={(e) => handleDelete(e, m.id)}
                disabled={deletingId === m.id}
                className="absolute right-12 top-1/2 -translate-y-1/2 p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover/container:opacity-100 disabled:opacity-50"
             >
                {deletingId === m.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
             </button>
          )}
        </div>
      ))}
    </div>
  );
}

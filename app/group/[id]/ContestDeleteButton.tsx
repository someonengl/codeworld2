"use client";

import { useState } from "react";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
import { deleteContest } from "@/app/actions/deleteContest";

export default function ContestDeleteButton({ 
  contestId, 
  groupId 
}: { 
  contestId: string; 
  groupId: string;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteContest(contestId, groupId);
      if (!result.success) {
        alert("Deletion failed: " + result.error);
        setShowConfirm(false);
      }
    } catch (err: any) {
      alert(err.message);
      setShowConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
        <span className="text-[9px] font-mono text-amber-500 flex items-center gap-1 uppercase tracking-tighter">
          <AlertTriangle className="w-3 h-3" /> Execute_Wipe?
        </span>
        <button
          disabled={isDeleting}
          onClick={handleDelete}
          className="px-2 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded text-[9px] font-bold hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
        >
          {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "YES"}
        </button>
        <button
          disabled={isDeleting}
          onClick={() => setShowConfirm(false)}
          className="px-2 py-1 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded text-[9px] font-bold hover:text-white transition-all disabled:opacity-50"
        >
          NO
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all group/delete"
      title="Delete Contest"
    >
      <Trash2 className="w-3.5 h-3.5" />
    </button>
  );
}

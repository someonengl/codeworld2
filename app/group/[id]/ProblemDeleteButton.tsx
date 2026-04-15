"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { deleteProblem } from "@/app/actions/deleteProblem";

export default function ProblemDeleteButton({ 
  problemId, 
  groupId 
}: { 
  problemId: string, 
  groupId: string 
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this problem? This will permanently remove all test cases and student submissions.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await deleteProblem(problemId, groupId);
      if (!res.success) {
        alert(res.error);
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="p-2 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 shrink-0"
      title="Delete Problem"
    >
      {isDeleting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  );
}

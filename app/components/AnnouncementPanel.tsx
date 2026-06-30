"use client";

import { Megaphone, AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_active?: boolean;
  priority?: number;
  created_at: string;
}

export default function AnnouncementPanel({ initialAnnouncements }: { initialAnnouncements: Announcement[] }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("public_announcements")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            if (payload.new.is_active) {
              setAnnouncements((prev) => [payload.new as Announcement, ...prev].sort((a, b) => (b.priority || 0) - (a.priority || 0)));
            }
          } else if (payload.eventType === "UPDATE") {
            if (!payload.new.is_active) {
              setAnnouncements((prev) => prev.filter((a) => a.id !== payload.new.id));
            } else {
              setAnnouncements((prev) =>
                prev.map((a) => (a.id === payload.new.id ? (payload.new as Announcement) : a)).sort((a, b) => (b.priority || 0) - (a.priority || 0))
              );
            }
          } else if (payload.eventType === "DELETE") {
            setAnnouncements((prev) => prev.filter((a) => a.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const visible = announcements.filter(a => !dismissed.includes(a.id));

  if (visible.length === 0) return null;

  const typeConfig = {
    info: {
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      icon: <Info className="w-4 h-4" />
    },
    warning: {
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      icon: <AlertCircle className="w-4 h-4" />
    },
    error: {
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      icon: <AlertCircle className="w-4 h-4" />
    },
    success: {
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      icon: <CheckCircle2 className="w-4 h-4" />
    }
  };

  return (
    <div className="space-y-3">
      {visible.map((ann) => {
        const cfg = typeConfig[ann.type] || typeConfig.info;
        return (
          <div 
            key={ann.id} 
            className={`relative flex items-start gap-4 p-4 rounded-xl border ${cfg.bg} ${cfg.border} shadow-lg animate-in fade-in slide-in-from-top-2 duration-500`}
          >
            <div className={`mt-0.5 p-2 rounded-lg bg-zinc-950/50 ${cfg.color} border ${cfg.border}`}>
              {cfg.icon}
            </div>
            
            <div className="flex-1 min-w-0 pr-6">
              <h4 className={`text-sm font-bold uppercase tracking-widest ${cfg.color} mb-1`}>
                {ann.title}
              </h4>
              <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                {ann.content}
              </p>
              <div className="mt-2 text-[10px] font-mono text-zinc-500 uppercase tracking-tighter" suppressHydrationWarning>
                Published {new Date(ann.created_at).toLocaleDateString()}
              </div>
            </div>

            <button 
              onClick={() => setDismissed([...dismissed, ann.id])}
              className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

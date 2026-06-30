"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: { username: string | null; full_name: string | null } | null;
  _optimistic?: boolean; // temp flag for messages we added locally
}

export default function ChatSidebar({
  groupId,
  userId,
  initialMessages,
}: {
  groupId: string;
  userId: string;
  initialMessages: Message[];
}) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>(initialMessages ?? []);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [myProfile, setMyProfile] = useState<{ username: string | null; full_name: string | null } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch current user's own profile once (for optimistic messages)
  useEffect(() => {
    supabase
      .from("profiles")
      .select("username, full_name")
      .eq("id", userId)
      .single()
      .then(({ data }: any) => setMyProfile(data));
  }, [userId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription — receives messages from OTHER users
  useEffect(() => {
    const isValidUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(groupId);
    if (!isValidUUID) return;

    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `group_id=eq.${groupId}`,
        },
        async (payload: any) => {
          const newMsg = payload.new as Message;

          // Skip messages sent by ME — we added them optimistically already
          if (newMsg.user_id === userId) {
            // Replace our optimistic placeholder with the real DB row (gets a real id/timestamp)
            setMessages((prev) =>
              prev.map((m) =>
                m._optimistic && m.content === newMsg.content && m.user_id === newMsg.user_id
                  ? { ...newMsg, profiles: myProfile, _optimistic: false }
                  : m
              )
            );
            return;
          }

          // For other people's messages, fetch their profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, full_name")
            .eq("id", newMsg.user_id)
            .single();

          setMessages((prev) => [
            ...prev,
            { ...newMsg, profiles: profile ?? null },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, userId, myProfile]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isSending) return;

    setInput("");
    setIsSending(true);

    // Optimistic update — show message instantly for the sender
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      user_id: userId,
      content: text,
      created_at: new Date().toISOString(),
      profiles: myProfile,
      _optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    await supabase.from("messages").insert({
      group_id: groupId,
      user_id: userId,
      content: text,
    });

    setIsSending(false);
    inputRef.current?.focus();
  }, [input, isSending, userId, groupId, myProfile]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const displayName = (msg: Message) => {
    const handle = msg.profiles?.username || msg.profiles?.full_name;
    if (!handle) return "agent_" + msg.user_id.slice(0, 4).toUpperCase();
    return handle;
  };

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="w-80 shrink-0 flex flex-col bg-[#050505]/80 backdrop-blur-3xl border-l border-white/[0.04] h-full overflow-hidden shadow-[inset_1px_0_0_rgba(255,255,255,0.02),-8px_0_24px_rgba(0,0,0,0.5)] z-10">

      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.04] bg-white/[0.02] flex items-center gap-2 shadow-[inset_0__1px_0_rgba(255,255,255,0.02)]">
        <MessageSquare className="w-4 h-4 text-emerald-400" />
        <h2 className="font-semibold text-sm text-white">Group Chat</h2>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-emerald-400 font-mono">LIVE</span>
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-xs text-center text-zinc-600 font-mono pt-4">
            No messages yet. Say something!
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.user_id === userId;
          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"} ${msg._optimistic ? "opacity-70" : ""}`}
            >
              {/* Name + time */}
              <div className={`flex items-center gap-2 px-1 ${isMe ? "flex-row-reverse" : ""}`}>
                <span className={`text-[11px] font-mono font-semibold ${isMe ? "text-blue-400" : "text-emerald-400"}`}>
                  {displayName(msg)}
                </span>
                <span className="text-[10px] text-zinc-700" suppressHydrationWarning>{formatTime(msg.created_at)}</span>
              </div>

              {/* Bubble */}
              <div
                className={`px-4 py-2 text-sm rounded-2xl max-w-[85%] break-words leading-relaxed shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]
                  ${isMe
                    ? "bg-blue-500/20 border border-blue-500/30 rounded-tr-sm text-white"
                    : "bg-white/[0.05] border border-white/[0.05] rounded-tl-sm text-zinc-300"
                  }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-white/[0.04] bg-white/[0.01]">
        <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] rounded-xl px-3 py-2 focus-within:border-emerald-500/50 focus-within:bg-white/[0.04] transition-all">
          <input
            ref={inputRef}
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Send a message..."
            maxLength={500}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm font-mono text-zinc-200 placeholder-zinc-600"
          />
          <button
            id="chat-send-btn"
            onClick={sendMessage}
            disabled={!input.trim() || isSending}
            className="text-emerald-400 hover:text-emerald-300 disabled:text-zinc-700 transition-colors disabled:cursor-not-allowed"
          >
            {isSending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4" />
            }
          </button>
        </div>
        <p className="text-[10px] text-zinc-700 font-mono mt-1.5 text-right">Enter to send</p>
      </div>
    </div>
  );
}

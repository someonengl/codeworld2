"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Check, Loader2, User, Mail, Edit2 } from "lucide-react";
import { checkUsernameAvailable } from "@/app/actions/checkUsername";
import { updateUsername } from "@/app/actions/updateUsername";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsername: string;
  email?: string;
  role?: string;
  onUpdate: (newUsername: string) => void;
}

type UsernameState = "idle" | "checking" | "available" | "taken" | "invalid" | "current";

export default function ProfileModal({ isOpen, onClose, currentUsername, email, role, onUpdate }: ProfileModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(currentUsername);
  const [usernameState, setUsernameState] = useState<UsernameState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // SSR safety — portals need the DOM to exist
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen) {
      setIsEditing(false);
      setUsername(currentUsername || "");
      setUsernameState("idle");
      setErrorMsg("");
    }
  }, [isOpen, currentUsername]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!username) { setUsernameState("idle"); return; }
    if (username.toLowerCase() === currentUsername?.toLowerCase()) { setUsernameState("current"); return; }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) { setUsernameState("invalid"); return; }

    setUsernameState("checking");
    debounceRef.current = setTimeout(async () => {
      const available = await checkUsernameAvailable(username);
      setUsernameState(available ? "available" : "taken");
    }, 500);
  }, [username, currentUsername]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameState !== "available") return;
    setIsSaving(true);
    setErrorMsg("");
    try {
      await updateUsername(username);
      onUpdate(username);
      setIsEditing(false);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const borderColor =
    usernameState === "available" ? "border-emerald-500 focus:ring-emerald-500/50" :
    usernameState === "taken"     ? "border-red-500 focus:ring-red-500/50" :
    usernameState === "invalid"   ? "border-amber-500 focus:ring-amber-500/50" :
    usernameState === "current"   ? "border-indigo-500 focus:ring-indigo-500/50" :
    "border-zinc-800 focus:border-indigo-500 focus:ring-indigo-500/50";

  const modal = (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4">
      {/* Backdrop — fully opaque, above everything including MotionCard transforms */}
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#0a0a0a] border border-white/[0.08] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-widest">Edit Profile</h2>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors p-1 hover:bg-white/[0.05] rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar + identity */}
          <div className="flex flex-col items-center text-center pb-5 border-b border-white/[0.06]">
            <div className="w-16 h-16 bg-gradient-to-tr from-[#9b8af4] to-[#f49b8a] p-[2px] rounded-full mb-4 shadow-lg">
              <div className="w-full h-full bg-[#0a0a0a] rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-zinc-400" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white">@{currentUsername || "unassigned"}</h3>
            <p className="text-xs text-zinc-500 mt-1 font-mono uppercase tracking-widest">{role || "Member"}</p>
          </div>

          {/* Email row */}
          <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.05]">
            <Mail className="w-4 h-4 text-zinc-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest mb-0.5">Email</p>
              <p className="text-sm text-zinc-300 truncate">{email || "Not available"}</p>
            </div>
          </div>

          {/* Edit Username */}
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium text-zinc-500 hover:text-indigo-400 py-2.5 border border-white/[0.05] hover:border-indigo-500/30 hover:bg-indigo-500/5 rounded-xl transition-all"
            >
              <Edit2 className="w-4 h-4" /> Change Username
            </button>
          ) : (
            <form onSubmit={handleSave} className="space-y-4 p-4 border border-white/[0.06] rounded-xl bg-white/[0.02]">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">New Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm select-none">@</span>
                  <input
                    type="text"
                    placeholder="johndoe"
                    autoFocus
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={20}
                    className={`w-full bg-[#050505] border pl-7 pr-10 py-2.5 rounded-xl focus:ring-1 outline-none text-sm transition-all duration-200 text-white ${borderColor}`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameState === "checking" && <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />}
                    {usernameState === "available" && <Check className="w-4 h-4 text-emerald-500" />}
                    {(usernameState === "taken" || usernameState === "invalid") && <X className="w-4 h-4 text-red-500" />}
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
                  {errorMsg}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 font-medium py-2.5 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || usernameState !== "available"}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/[0.05] disabled:text-zinc-600 text-white font-medium py-2.5 rounded-xl transition-all text-sm flex justify-center items-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  // createPortal renders at document.body — completely escapes any transformed ancestor (MotionCard tilt)
  return createPortal(modal, document.body);
}

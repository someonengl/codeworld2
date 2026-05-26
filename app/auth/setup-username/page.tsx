"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, X, Loader2, ChevronRight, Terminal, Shield } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { checkUsernameAvailable } from "@/app/actions/checkUsername";
import { useRouter } from "next/navigation";
import PolicyModal from "@/app/components/PolicyModal";
import { motion, AnimatePresence } from "framer-motion";

type UsernameState = "idle" | "checking" | "available" | "taken" | "invalid";

export default function SetupUsernamePage() {
  const supabase = createClient();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [usernameState, setUsernameState] = useState<UsernameState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [activePolicyModal, setActivePolicyModal] = useState<"terms" | "privacy" | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Redirect away if user already has a username
  useEffect(() => {
    setIsLoading(true);
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/login"); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      if (profile?.username) {
        router.push("/dashboard");
      } else {
        setIsLoading(false);
      }
    });
  }, []);

  // Live availability check
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!username) { setUsernameState("idle"); return; }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) { setUsernameState("invalid"); return; }
    setUsernameState("checking");
    debounceRef.current = setTimeout(async () => {
      const available = await checkUsernameAvailable(username);
      setUsernameState(available ? "available" : "taken");
    }, 500);
  }, [username]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameState !== "available" || !agreedToTerms || !agreedToPrivacy) return;
    setIsSaving(true);
    setErrorMsg("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { error } = await supabase
      .from("profiles")
      .update({ username: username.toLowerCase(), full_name: username })
      .eq("id", user.id);

    if (error) {
      setErrorMsg(error.message);
      setIsSaving(false);
      return;
    }

    router.push("/dashboard");
  };

  const UsernameIndicator = () => {
    if (usernameState === "checking")  return <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />;
    if (usernameState === "available") return <Check className="w-4 h-4 text-emerald-400" />;
    if (usernameState === "taken")     return <X className="w-4 h-4 text-red-400" />;
    if (usernameState === "invalid")   return <X className="w-4 h-4 text-amber-400" />;
    return null;
  };

  const borderColor =
    usernameState === "available" ? "border-emerald-500/40 focus:border-emerald-500 focus:ring-emerald-500/20" :
    usernameState === "taken"     ? "border-red-500/40 focus:border-red-500 focus:ring-red-500/20" :
    usernameState === "invalid"   ? "border-amber-500/40 focus:border-amber-500 focus:ring-amber-500/20" :
    "border-white/[0.08] focus:border-[#00ff00] focus:ring-[#00ff00]/10";

  const hint =
    usernameState === "available" ? <span className="text-emerald-400">@{username.toLowerCase()} is available ✓</span> :
    usernameState === "taken"     ? <span className="text-red-400">Username already taken</span> :
    usernameState === "invalid"   ? <span className="text-amber-400">3–20 chars · letters, numbers, underscores only</span> :
    <span className="text-zinc-500">3–20 chars · letters, numbers, _ only</span>;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4 sm:p-8 bg-zinc-950 relative overflow-hidden font-sans">
      {/* Dynamic Glowing Ambient Blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-500/5 blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-teal-500/5 blur-[130px] pointer-events-none z-0" />

      {/* Vector Tech Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 25 }}
        className="z-10 w-full max-w-md bg-zinc-900/35 backdrop-blur-2xl p-8 sm:p-10 rounded-[32px] border border-white/[0.05] shadow-[0_32px_96px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.03)] flex flex-col gap-6 relative"
      >
        {/* Glow Accent Bar */}
        <div className="absolute top-0 inset-x-12 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />

        {/* Card Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto bg-white/[0.02] border border-white/[0.06] p-3.5 rounded-2xl w-fit mb-2 text-emerald-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <Terminal className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">One Last Step</h1>
          <p className="text-zinc-400 text-xs leading-relaxed font-sans">Configure your unique workspace handle to complete OAuth integration.</p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSave} className="flex flex-col gap-5 w-full">
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-red-400 text-xs px-3.5 py-2.5 bg-red-500/5 border border-red-500/10 rounded-xl flex items-center gap-2 font-mono"
            >
              <span>[!]</span>
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* Username Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pl-1">Handle Identity</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm select-none">@</span>
              <input
                id="username-input"
                type="text"
                placeholder="your_handle"
                autoFocus
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                className={`w-full bg-black/40 border pl-8 pr-10 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500/10 outline-none text-sm text-white font-mono transition-all duration-300 placeholder:text-zinc-700 ${borderColor}`}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
                <UsernameIndicator />
              </span>
            </div>
            <p className="text-[10px] font-mono pl-1 leading-normal">{hint}</p>
          </div>

          {/* CUSTOM BESPOKE CHECKBOX ELEMENTS */}
          <div className="space-y-3 py-1 border-y border-white/[0.02] my-1">
            
            {/* Terms Checkbox */}
            <div className="flex items-start gap-3.5 select-none cursor-pointer group text-left">
              <button
                type="button"
                onClick={() => setAgreedToTerms(!agreedToTerms)}
                className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-300 shrink-0 cursor-pointer ${
                  agreedToTerms
                    ? "bg-emerald-500 border-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                    : "bg-black/50 border-white/[0.08] hover:border-white/[0.15] text-transparent hover:bg-white/[0.02]"
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3px]" />
              </button>
              <span className="text-xs font-sans text-zinc-400 leading-normal">
                I agree to CodeWorld's{" "}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setActivePolicyModal("terms"); }}
                  className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors font-bold font-mono text-[10px] uppercase tracking-wider"
                >
                  User Agreement
                </button>
              </span>
            </div>

            {/* Privacy Checkbox */}
            <div className="flex items-start gap-3.5 select-none cursor-pointer group text-left">
              <button
                type="button"
                onClick={() => setAgreedToPrivacy(!agreedToPrivacy)}
                className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-300 shrink-0 cursor-pointer ${
                  agreedToPrivacy
                    ? "bg-cyan-500 border-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.35)]"
                    : "bg-black/50 border-white/[0.08] hover:border-white/[0.15] text-transparent hover:bg-white/[0.02]"
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[3px]" />
              </button>
              <span className="text-xs font-sans text-zinc-400 leading-normal">
                I agree to the secure{" "}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setActivePolicyModal("privacy"); }}
                  className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors font-bold font-mono text-[10px] uppercase tracking-wider"
                >
                  Privacy Policy
                </button>
              </span>
            </div>

          </div>

          {/* Submit Action */}
          <motion.button
            whileHover={(!isSaving && usernameState === "available" && agreedToTerms && agreedToPrivacy) ? { scale: 1.015, y: -1 } : {}}
            whileTap={(!isSaving && usernameState === "available" && agreedToTerms && agreedToPrivacy) ? { scale: 0.985 } : {}}
            id="save-username-btn"
            type="submit"
            disabled={isSaving || usernameState !== "available" || !agreedToTerms || !agreedToPrivacy}
            className="group w-full mt-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800/50 disabled:text-zinc-600 text-black font-bold px-6 py-3.5 rounded-xl transition-all duration-300 uppercase tracking-widest text-xs flex justify-center items-center gap-2 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Finalizing node...</>
            ) : (
              <>Confirm Username <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
            )}
          </motion.button>
        </form>

      </motion.div>

      {/* Render PolicyModal */}
      <AnimatePresence>
        {activePolicyModal !== null && (
          <PolicyModal 
            type={activePolicyModal}
            isOpen={activePolicyModal !== null}
            onClose={() => setActivePolicyModal(null)}
            onAccept={activePolicyModal === "terms" ? () => setAgreedToTerms(true) : () => setAgreedToPrivacy(true)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

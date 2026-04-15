"use client";

import { useState, useEffect, useRef } from "react";
import { Check, X, Loader2, ChevronRight, Terminal } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { checkUsernameAvailable } from "@/app/actions/checkUsername";
import { useRouter } from "next/navigation";

type UsernameState = "idle" | "checking" | "available" | "taken" | "invalid";

export default function SetupUsernamePage() {
  const supabase = createClient();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [usernameState, setUsernameState] = useState<UsernameState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    if (usernameState !== "available") return;
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

  const borderColor =
    usernameState === "available" ? "border-emerald-500 focus:ring-emerald-500/50" :
    usernameState === "taken"     ? "border-red-500    focus:ring-red-500/50" :
    usernameState === "invalid"   ? "border-amber-500  focus:ring-amber-500/50" :
    "border-zinc-800 focus:border-[#00ff00] focus:ring-[#00ff00]/50";

  const hint =
    usernameState === "available" ? <span className="text-emerald-400">@{username.toLowerCase()} is available ✓</span> :
    usernameState === "taken"     ? <span className="text-red-400">Username already taken</span> :
    usernameState === "invalid"   ? <span className="text-amber-400">3–20 chars · letters, numbers, underscores only</span> :
    <span className="text-zinc-600">3–20 chars · letters, numbers, _ only</span>;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black p-6">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-[0_0_60px_rgba(0,0,0,0.8)] flex flex-col gap-6">
        
        <div className="text-center space-y-2">
          <div className="mx-auto bg-zinc-900 border border-zinc-800 p-3 rounded-full w-fit mb-4 text-emerald-400">
            <Terminal className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">One Last Step</h1>
          <p className="text-zinc-400 text-sm">
            Choose a unique username for your CodeWorld account.
          </p>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {errorMsg && (
            <div className="text-red-400 text-xs px-3 py-2 bg-red-400/10 border border-red-400/20 rounded">
              [!] {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm select-none">@</span>
              <input
                id="username-input"
                type="text"
                placeholder="your_handle"
                autoFocus
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                className={`w-full bg-black/60 border pl-7 pr-10 py-3 rounded-lg focus:ring-1 outline-none text-sm font-mono transition-all ${borderColor}`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameState === "checking"  && <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />}
                {usernameState === "available" && <Check className="w-4 h-4 text-emerald-400" />}
                {(usernameState === "taken" || usernameState === "invalid") && <X className="w-4 h-4 text-red-400" />}
              </span>
            </div>
            <p className="text-[11px] font-mono pl-1">{hint}</p>
          </div>

          <button
            id="save-username-btn"
            type="submit"
            disabled={isSaving || usernameState !== "available"}
            className="group w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-bold px-6 py-3 rounded-lg transition-all duration-200 uppercase tracking-wider text-xs flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.2)] hover:shadow-[0_0_30px_rgba(52,211,153,0.4)] disabled:shadow-none disabled:cursor-not-allowed"
          >
            {isSaving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              : <>Confirm Username <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
            }
          </button>
        </form>
      </div>
    </div>
  );
}

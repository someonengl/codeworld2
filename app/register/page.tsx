"use client";

import { useState, useEffect, useRef } from "react";
import { ShieldAlert, ChevronRight, Check, X, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { checkUsernameAvailable } from "@/app/actions/checkUsername";
import { useRouter } from "next/navigation";
import Link from "next/link";

type UsernameState = "idle" | "checking" | "available" | "taken" | "invalid";

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [usernameState, setUsernameState] = useState<UsernameState>("idle");
  const [errorMsg, setErrorMsg]   = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live username availability check
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

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameState !== "available") {
      setErrorMsg("Please choose a valid, available username.");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");

    // Sign up with username stored in metadata
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.toLowerCase(),
          full_name: username,
        },
        // Skip email confirmation redirect — go straight to dashboard
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (signUpError) {
      setErrorMsg(signUpError.message);
      setIsLoading(false);
      return;
    }

    // Auto sign-in so they don't need to verify email first
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      // If email confirmation is enforced by Supabase settings, this will fail gracefully
      setErrorMsg("Account created! Please sign in.");
      setIsLoading(false);
      router.push("/login");
      return;
    }

    router.push("/dashboard");
  };

  const handleOAuth = async (provider: "google" | "github") => {
    // After OAuth, callback will check for missing username → /setup-username
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/auth/setup-username` },
    });
  };

  // Username UI helpers
  const UsernameIndicator = () => {
    if (usernameState === "checking")  return <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />;
    if (usernameState === "available") return <Check className="w-4 h-4 text-emerald-400" />;
    if (usernameState === "taken")     return <X className="w-4 h-4 text-red-400" />;
    if (usernameState === "invalid")   return <X className="w-4 h-4 text-amber-400" />;
    return null;
  };

  const borderColor =
    usernameState === "available" ? "border-emerald-500 focus:ring-emerald-500/50" :
    usernameState === "taken"     ? "border-red-500    focus:ring-red-500/50" :
    usernameState === "invalid"   ? "border-amber-500  focus:ring-amber-500/50" :
    "border-zinc-800 focus:border-[#00ff00] focus:ring-[#00ff00]/50";

  const hint =
    usernameState === "available" ? <span className="text-emerald-400">@{username.toLowerCase()} is available ✓</span> :
    usernameState === "taken"     ? <span className="text-red-400">Username already taken</span> :
    usernameState === "invalid"   ? <span className="text-amber-400">3–20 chars · letters, numbers, underscores</span> :
    <span className="text-zinc-600">3–20 chars · letters, numbers, _ only</span>;

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] items-center justify-center p-8 bg-[url('https://images.unsplash.com/photo-1635830648400-b6817112ebbd?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center relative">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-0" />

      <div className="z-10 w-full max-w-md bg-zinc-950/80 backdrop-blur-md p-8 rounded-2xl border border-zinc-800 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col gap-5 transition-all duration-500 hover:border-zinc-700">
        <div className="text-center space-y-2">
          <div className="mx-auto bg-zinc-900 border border-zinc-800 p-3 rounded-full w-fit mb-4 text-emerald-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Initialize Identity</h1>
          <p className="text-zinc-400 text-sm">Choose your handle and join the platform.</p>
        </div>

        <form onSubmit={handleEmailRegister} className="flex flex-col gap-4 w-full">
          {errorMsg && (
            <div className="text-red-400 text-xs px-3 py-2 bg-red-400/10 border border-red-400/20 rounded">
              [!] {errorMsg}
            </div>
          )}

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm select-none">@</span>
              <input
                id="username-input"
                type="text"
                placeholder="your_handle"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                className={`w-full bg-black/50 border pl-7 pr-10 py-3 rounded-lg focus:ring-1 outline-none text-sm font-mono transition-all ${borderColor}`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <UsernameIndicator />
              </span>
            </div>
            <p className="text-[11px] font-mono pl-1">{hint}</p>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Email</label>
            <input
              id="email-input"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/50 border border-zinc-800 p-3 rounded-lg focus:border-[#00ff00] focus:ring-1 focus:ring-[#00ff00]/50 outline-none text-sm font-mono transition-all"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Password</label>
            <input
              id="password-input"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/50 border border-zinc-800 p-3 rounded-lg focus:border-[#00ff00] focus:ring-1 focus:ring-[#00ff00]/50 outline-none text-sm font-mono transition-all"
            />
          </div>

          <button
            id="register-btn"
            type="submit"
            disabled={isLoading || usernameState !== "available"}
            className="group w-full mt-1 bg-transparent border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-black font-bold px-6 py-3 rounded-lg transition-all duration-300 uppercase tracking-wider text-xs flex justify-center items-center gap-2 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</>
              : <>Create Account <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
            }
          </button>
        </form>

        <div className="flex items-center gap-4 w-full opacity-40">
          <div className="flex-1 h-px bg-zinc-700" />
          <span className="text-xs text-zinc-400 font-mono">OR</span>
          <div className="flex-1 h-px bg-zinc-700" />
        </div>

        {/* OAuth — username chosen after redirect */}
        <div className="space-y-2">
          <p className="text-[11px] text-zinc-600 font-mono text-center">You'll pick a username after signing in with OAuth</p>
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-zinc-800 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm hover:border-zinc-600"
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("github")}
              className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-zinc-800 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm hover:border-zinc-600"
            >
              GitHub
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-500">
          Already registered?{" "}
          <Link href="/login" className="text-[#00ff00] hover:underline underline-offset-4">Login here.</Link>
        </p>
      </div>
    </div>
  );
}

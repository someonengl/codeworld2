"use client";

import Link from "next/link";
import { Terminal, Shield, LogOut, User } from "lucide-react";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

interface Props {
  initialUser?: any;
  initialProfile?: {
    username?: string;
    is_super_admin?: boolean;
    full_name?: string;
  } | null;
}

export default function Navbar({ initialUser, initialProfile }: Props) {
  const supabase = createClient();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(initialUser || null);
  const [isLoaded, setIsLoaded] = useState(true);
  const [username, setUsername] = useState<string>(initialProfile?.username || "");
  const [isAdmin, setIsAdmin] = useState(initialProfile?.is_super_admin || false);
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    // If we don't have an initial user, check client-side (e.g. on fresh login)
    if (!initialUser) {
      supabase.auth.getUser().then(({ data }) => {
        setUser(data?.user);
        setIsLoaded(true);
        if (data?.user) {
          supabase.from('profiles').select('is_super_admin, username').eq('id', data.user.id).single().then(p => {
            // Hardcoded check for project owner email
            const isOwner = data.user?.email === 'onlinecasur67@gmail.com';
            setIsAdmin(!!p.data?.is_super_admin || isOwner);
            if (p.data?.username) setUsername(p.data.username);
          });
        }
      });
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsLoaded(true);
      } else {
        setUser(null);
        setIsLoaded(true);
        setIsAdmin(false);
        setUsername("");
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [supabase, initialUser]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleJoinGroup = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && joinCode.trim() && user && !isJoining) {
      setIsJoining(true);
      try {
        const { joinGroup } = await import('@/app/actions/joinGroup');
        const { groupId, message } = await joinGroup(joinCode.trim());

        if (message) alert(message);

        setJoinCode("");
        window.location.href = `/group/${groupId}`;
      } catch (err: any) {
        alert(err.message);
      } finally {
        setIsJoining(false);
      }
    } else if (e.key === 'Enter' && !user) {
      alert("You must be signed in to join groups.");
    }
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (pathname === "/") return null;

  return (
    <>
      <nav className="border-b border-zinc-800/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 text-zinc-100 flex items-center justify-between px-6 py-4 sticky top-0 z-50">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 font-bold text-lg hover:text-brand-cyan transition-colors">
            <Terminal className="w-5 h-5 text-brand-cyan" />
            CodeWorld
          </Link>

          {user && (
            <Link
              href={username ? `/profile/${username}` : "/auth/setup-username"}
              className="hidden sm:flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-md hover:border-brand-cyan transition-all group"
            >
              <User className="w-3 h-3 text-zinc-500 group-hover:text-brand-cyan" />
              <span className="text-xs font-medium text-zinc-400 group-hover:text-brand-cyan">Profile</span>
            </Link>
          )}
        </div>

        {/* Middle: Join Code */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            onKeyDown={handleJoinGroup}
            placeholder="Enter Join Code..."
            disabled={isJoining}
            className={`w-full bg-zinc-900/50 border border-zinc-800 focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan focus:outline-none rounded-md px-4 py-1.5 text-sm font-medium placeholder:text-zinc-600 transition-all ${isJoining ? 'opacity-50 cursor-wait' : ''}`}
          />
        </div>

        {/* Right Actions - Desktop */}
        <div className="hidden md:flex items-center gap-6 min-w-[120px] justify-end">
          {!isLoaded ? (
            <div className="w-4 h-4 border-2 border-zinc-800 border-t-brand-cyan rounded-full animate-spin" />
          ) : !user ? (
            <span className="text-sm font-medium text-zinc-500">Unauthenticated</span>
          ) : (
            <>
              <div className="text-xs text-zinc-500 font-medium hidden lg:block">
                {user.email}
              </div>

              <Link
                href="/topics"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border ${pathname.startsWith("/topics")
                    ? "bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30 shadow-[0_0_15px_rgba(0,245,255,0.1)]"
                    : "text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-800/50"
                  }`}
              >
                Topics
              </Link>

              <Link
                href="/archive"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 border ${pathname === "/archive"
                    ? "bg-brand-orange/10 text-brand-orange border-brand-orange/30 shadow-[0_0_15px_rgba(255,107,0,0.1)]"
                    : "text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-800/50"
                  }`}
              >
                Archive
              </Link>

              {isAdmin && (
                <Link href="/admin" className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 text-zinc-300 border border-zinc-700/50 rounded-md hover:bg-zinc-700 hover:text-white transition-all text-xs font-medium">
                  <Shield className="w-3.5 h-3.5" /> Control
                </Link>
              )}

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="flex md:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-zinc-400 hover:text-white"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-xl flex flex-col p-6 pt-24 gap-6 animate-fade-in">
          {user && (
            <div className="flex flex-col gap-4 border-b border-zinc-800/50 pb-6">
              <div className="text-xs text-zinc-500 font-mono">{user.email}</div>
              <Link
                href={username ? `/profile/${username}` : "/auth/setup-username"}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl"
              >
                <User className="w-5 h-5 text-brand-cyan" />
                <span className="font-medium text-zinc-200">View Profile</span>
              </Link>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Link
              href="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-4 text-lg font-bold text-white hover:bg-zinc-800/50 rounded-xl transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/topics"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-4 text-lg font-bold text-white hover:bg-zinc-800/50 rounded-xl transition-colors"
            >
              Topics
            </Link>
            <Link
              href="/archive"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-4 text-lg font-bold text-white hover:bg-zinc-800/50 rounded-xl transition-colors"
            >
              Archive
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-4 text-lg font-bold text-brand-cyan hover:bg-brand-cyan/10 rounded-xl transition-colors"
              >
                Admin Control
              </Link>
            )}
          </div>

          <div className="mt-auto flex flex-col gap-4">
            <div className="relative">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                onKeyDown={handleJoinGroup}
                placeholder="Enter Join Code..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 text-white focus:border-brand-cyan focus:outline-none"
              />
            </div>
            {user && (
              <button
                onClick={() => {
                  handleSignOut();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-3 p-4 bg-red-500/10 text-red-400 rounded-xl font-bold"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

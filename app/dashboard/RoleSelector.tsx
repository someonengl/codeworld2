"use client";

import { setUserRole } from "@/app/actions/setRole";
import { GraduationCap, Users } from "lucide-react";

export default function RoleSelector({ userId }: { userId: string }) {
  const handleSelectRole = async (role: 'student' | 'teacher') => {
    try {
      await setUserRole(role);
      window.location.reload();
    } catch (err: any) {
      alert("Failed to update role: " + err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[50vh] space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-[#00ff00]">ACCOUNT INITIALIZATION</h1>
        <p className="text-zinc-400 font-mono text-sm max-w-md mx-auto">
          Please designate your access clearance level for the CodeWorld environment.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl">
        {/* Student Opt */}
        <button 
          onClick={() => handleSelectRole('student')}
          className="group flex flex-col items-center p-8 bg-zinc-950 border border-zinc-800 hover:border-[#00ff00] rounded-xl transition-all"
        >
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-full group-hover:bg-[#00ff00]/10 group-hover:text-[#00ff00] mb-4 transition-colors">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold tracking-widest uppercase">Student</h2>
          <p className="text-zinc-500 font-mono text-xs mt-2 text-center">
            Solve problems, practice algorithms, and participate in live classrooms.
          </p>
          <div className="mt-6 text-sm font-bold text-zinc-600 group-hover:text-[#00ff00] transition-colors">
            [ SELECT ]
          </div>
        </button>

        {/* Teacher Opt */}
        <button 
          onClick={() => handleSelectRole('teacher')}
          className="group flex flex-col items-center p-8 bg-zinc-950 border border-zinc-800 hover:border-amber-500 rounded-xl transition-all"
        >
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-full group-hover:bg-amber-500/10 group-hover:text-amber-500 mb-4 transition-colors">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold tracking-widest uppercase">Teacher</h2>
          <p className="text-zinc-500 font-mono text-xs mt-2 text-center">
            Create classrooms, monitor student progress, and assign algorithm problems.
          </p>
          <div className="mt-6 text-sm font-bold text-zinc-600 group-hover:text-amber-500 transition-colors">
            [ SELECT ]
          </div>
        </button>
      </div>
    </div>
  );
}

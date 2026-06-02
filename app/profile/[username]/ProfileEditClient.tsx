"use client";
import { useState } from "react";
import { Edit2 } from "lucide-react";
import ProfileModal from "@/app/components/ProfileModal";

interface Props {
  currentUsername: string;
  email?: string | null;
  role: string;
}

export default function ProfileEditClient({ currentUsername, email, role }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 rounded-full transition-all flex items-center justify-center group cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
      >
        <Edit2 className="w-4 h-4" />
      </button>
      
      <ProfileModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentUsername={currentUsername}
        email={email || undefined}
        role={role}
        onUpdate={(newUsername) => {
          // Immediately redirect to the new username's profile page
          window.location.href = `/profile/${newUsername}`;
        }}
      />
    </>
  );
}

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
        className="p-2 bg-white/[0.05] border border-white/10 hover:bg-white/10 rounded-full transition-all flex items-center justify-center group"
      >
        <Edit2 className="w-4 h-4 text-zinc-400 group-hover:text-white" />
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

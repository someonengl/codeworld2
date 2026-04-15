"use client";

import { useState } from "react";
import { Settings, X, GraduationCap, Users, ShieldCheck } from "lucide-react";
import { updateGroupSettings } from "@/app/actions/updateGroupSettings";
import { useRouter } from "next/navigation";

interface Props {
  groupId: string;
  initialSettings: {
    allow_view_testcases: boolean;
    allow_view_others: boolean;
  };
}

export default function GroupSettingsButton({ groupId, initialSettings }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setIsSaving(true);
    try {
      await updateGroupSettings(groupId, settings);
      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      alert("Failed to save: " + err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-mono uppercase tracking-widest rounded border border-zinc-700 transition-all"
      >
        <Settings className="w-3.5 h-3.5 text-zinc-500" />
        Configuration_
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsOpen(false)} />
          
          <div className="relative bg-[#0d0d0d] border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden ring-1 ring-white/10">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500 animate-pulse">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono">GROUP_CORE_SETTINGS</h3>
                  <p className="text-[10px] text-zinc-500 font-mono tracking-tighter uppercase">ID: {groupId}</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-8 bg-[#0a0a0a]">
              
              {/* Setting 1: Hidden Test Cases */}
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0 border border-amber-500/20 group-hover:border-amber-500/50 transition-colors">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wide">Test Case Transparency</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={settings.allow_view_testcases}
                        onChange={(e) => setSettings({ ...settings, allow_view_testcases: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white"></div>
                    </label>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed font-mono italic">Allow students to view full input/expected output for hidden test cases when they fail.</p>
                </div>
              </div>

              {/* Setting 2: Peer Submissions */}
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0 border border-blue-500/20 group-hover:border-blue-500/50 transition-colors">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wide">Peer Activity Visibility</h4>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={settings.allow_view_others}
                        onChange={(e) => setSettings({ ...settings, allow_view_others: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white"></div>
                    </label>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-relaxed font-mono italic">Allow students to see each other's submission history and code in the problem sidebar.</p>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-6 bg-zinc-950 border-t border-zinc-800 flex justify-between items-center">
              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Admin_Overwrites_Enabled</span>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all uppercase tracking-widest active:scale-95 disabled:opacity-50"
              >
                {isSaving ? "Applying..." : "Confirm Settings"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

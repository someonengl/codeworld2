import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/");
  }

  // Verify Superadmin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_super_admin) {
    redirect("/dashboard");
  }

  return (
    <div className="flex-1 w-full bg-[#050505] text-zinc-300 flex flex-col items-center overflow-y-auto">
      <div className="w-full max-w-6xl p-8">
        <div className="mb-8 border-b border-zinc-800 pb-4">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500 uppercase tracking-widest flex items-center gap-3">
            Superadmin Control Center
          </h1>
          <p className="text-zinc-500 font-mono text-sm mt-2">ACCESS LEVEL: OMEGA</p>
        </div>
        {children}
      </div>
    </div>
  );
}

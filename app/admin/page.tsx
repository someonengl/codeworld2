import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Server-side Superadmin Verification
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_super_admin) {
    redirect("/dashboard?error=Unauthorized Access Restricted to Superadmins.");
  }

  return <AdminClient userId={user.id} />;
}

"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/utils/supabase/server";

export async function setUserRole(role: 'student' | 'teacher') {
  // Verify authentic user first
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(cookieStore);
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Use Service Role to bypass RLS and explicitly UPSERT the profile row
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabaseAdmin.from('profiles').upsert({
    id: user.id,
    role: role,
    updated_at: new Date().toISOString()
  });

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

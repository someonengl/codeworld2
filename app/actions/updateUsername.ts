"use server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/utils/supabase/server";

export async function updateUsername(newUsername: string) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(cookieStore);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1. Validate format
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(newUsername)) {
    throw new Error("Invalid username format. Use 3-20 characters: letters, numbers, and underscores.");
  }

  // 2. Check availability
  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('username', newUsername.toLowerCase())
    .maybeSingle();

  if (existing && existing.id !== user.id) {
    throw new Error("Username already taken.");
  }

  // 3. Update profile
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ 
      username: newUsername.toLowerCase(),
      full_name: newUsername,
    })
    .eq('id', user.id);

  if (error) throw new Error(error.message);

  return { success: true };
}

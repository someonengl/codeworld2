"use server";
import { createAdminClient } from "@/utils/supabase/server";

const supabaseAdmin = createAdminClient();

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  if (!username || username.length < 3) return false;
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  return data === null; // null = not found = available
}

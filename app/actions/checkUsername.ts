"use server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  if (!username || username.length < 3) return false;
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("username", username.toLowerCase())
    .maybeSingle();
  return data === null; // null = not found = available
}

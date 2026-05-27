"use server";
import { createAdminClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { decryptSession, encryptSession } from "@/utils/auth";

export async function updateUsername(newUsername: string) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(cookieStore);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const supabaseAdmin = createAdminClient();

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

  // Update session cookie to reflect the new profile data
  const sessionToken = cookieStore.get('session')?.value;
  if (sessionToken) {
    const session = decryptSession(sessionToken);
    if (session) {
      session.username = newUsername.toLowerCase();
      session.full_name = newUsername;
      const newToken = encryptSession(session);
      cookieStore.set('session', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
    }
  }

  return { success: true };
}

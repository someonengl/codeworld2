"use server";

import { createAdminClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { decryptSession, encryptSession } from "@/utils/auth";

export async function setUserRole(role: 'student' | 'teacher') {
  // Verify authentic user first
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(cookieStore);
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // Use Service Role to bypass RLS and check if the profile exists
  const supabaseAdmin = createAdminClient();

  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (existingProfile) {
    const { error } = await supabaseAdmin.from('profiles').update({
      role: role,
      updated_at: new Date().toISOString()
    }).eq('id', user.id);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabaseAdmin.from('profiles').insert({
      id: user.id,
      email: user.email,
      username: user.user_metadata?.username || `user_${user.id.slice(0, 8)}`,
      full_name: user.user_metadata?.full_name || 'Anonymous User',
      role: role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  // Update session cookie to reflect the new role
  const sessionToken = cookieStore.get('session')?.value;
  if (sessionToken) {
    const session = decryptSession(sessionToken);
    if (session) {
      session.role = role;
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

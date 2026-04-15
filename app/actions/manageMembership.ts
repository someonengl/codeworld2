"use server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/utils/supabase/server";

export async function manageMembership(
  groupId: string,
  studentId: string,
  action: 'approve' | 'reject' | 'kick' | 'blacklist' | 'unblacklist'
) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(cookieStore);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify ownership of the group
  const { data: group } = await supabaseAdmin
    .from('groups')
    .select('teacher_id')
    .eq('id', groupId)
    .single();

  if (group?.teacher_id !== user.id) throw new Error("Unauthorized");

  let status: 'approved' | 'rejected' | 'blacklisted' | 'pending' | null = null;
  let deleteRow = false;

  switch (action) {
    case 'approve':
      status = 'approved';
      break;
    case 'reject':
      status = 'rejected';
      break;
    case 'kick':
      // Kicking can either delete the membership or set it to rejected
      // User said "kick them out", I'll set it to rejected so they can re-request if they want
      // but "kick" usually means "remove". Let's use 'rejected'.
      status = 'rejected';
      break;
    case 'blacklist':
      status = 'blacklisted';
      break;
    case 'unblacklist':
      // Un-blacklisting sets them back to rejected so they are no longer blocked but not approved yet
      status = 'rejected';
      break;
  }

  if (status) {
    const { error } = await supabaseAdmin
      .from('memberships')
      .update({ status })
      .eq('group_id', groupId)
      .eq('student_id', studentId);
    
    if (error) throw new Error(error.message);
  }

  return { success: true };
}

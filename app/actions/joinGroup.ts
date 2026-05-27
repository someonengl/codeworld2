"use server";
import { createAdminClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/utils/supabase/server";

export async function joinGroup(joinCode: string) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(cookieStore);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const supabaseAdmin = createAdminClient();
  
  const { data: group } = await supabaseAdmin.from('groups').select('id').eq('join_code', joinCode).single();
  if (!group) throw new Error("Invalid Join Code");

  // Check if already a member or blacklisted
  const { data: existing } = await supabaseAdmin
    .from('memberships')
    .select('status')
    .eq('group_id', group.id)
    .eq('student_id', user.id)
    .maybeSingle();

  if (existing?.status === 'blacklisted') {
    throw new Error("You are blacklisted from this group.");
  }

  if (existing?.status === 'approved') {
    return { groupId: group.id, status: 'approved' };
  }

  if (existing?.status === 'pending') {
    return { groupId: group.id, status: 'pending', message: "Request already pending." };
  }

  const { error } = await supabaseAdmin.from('memberships').insert({ 
    group_id: group.id, 
    student_id: user.id,
    status: 'pending' 
  });
  
  if (error) throw new Error(error.message);

  return { groupId: group.id, status: 'pending', message: "Join request sent to teacher." };
}

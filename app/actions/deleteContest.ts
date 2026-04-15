"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function deleteContest(contestId: string, groupId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // RLS (contests_delete) will verify that the user is the teacher of the group
  const { error } = await supabase
    .from('contests')
    .delete()
    .eq('id', contestId);

  if (error) {
    console.error("Delete Contest Error:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/group/${groupId}`);
  return { success: true };
}

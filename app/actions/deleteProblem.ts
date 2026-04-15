"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function deleteProblem(problemId: string, groupId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // RLS will handle the check, but we can be explicit
  const { error } = await supabase
    .from('problems')
    .delete()
    .eq('id', problemId)
    .eq('teacher_id', user.id);

  if (error) {
    console.error("Delete Problem Error:", error);
    return { success: false, error: error.message };
  }

  revalidatePath(`/group/${groupId}`);
  return { success: true };
}

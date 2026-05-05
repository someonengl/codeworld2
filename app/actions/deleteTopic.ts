"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function deleteTopic(topicId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from('topics')
    .delete()
    .eq('id', topicId)
    .eq('teacher_id', user.id);

  if (error) {
    console.error("Delete Topic Error:", error);
    return { success: false, error: error.message };
  }

  revalidatePath('/topics');
  return { success: true };
}

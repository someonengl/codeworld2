"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function createContest(
  groupId: string,
  title: string,
  description: string,
  startTime: string,
  endTime: string,
  problemIds: string[]
) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 1. Insert Contest Metadata
  const { data: contest, error: contestError } = await supabase
    .from('contests')
    .insert({
      group_id: groupId,
      title,
      description,
      start_time: startTime,
      end_time: endTime
    })
    .select()
    .single();

  if (contestError) {
    throw new Error(`Contest deployment failed: ${contestError.message}`);
  }

  // 2. Link Problems to Contest
  if (problemIds.length > 0) {
    const contestProblems = problemIds.map((pid, idx) => ({
      contest_id: contest.id,
      problem_id: pid,
      order_index: idx
    }));

    const { error: linkingError } = await supabase
      .from('contest_problems')
      .insert(contestProblems);

    if (linkingError) {
      throw new Error(`Problem linking failed: ${linkingError.message}`);
    }
  }

  revalidatePath(`/group/${groupId}`);
  return contest;
}

"use client";

import { createClient } from "@/utils/supabase/client";

export async function updateGroupSettings(groupId: string, settings: { allow_view_testcases?: boolean; allow_view_others?: boolean }) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('groups')
    .update(settings)
    .eq('id', groupId);

  if (error) throw error;
  return data;
}

"use server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/utils/supabase/server";

export async function createMaterial(
  groupId: string,
  title: string,
  description: string,
  linkUrl: string,
  materialType: string
) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(cookieStore);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify ownership
  const { data: group } = await supabaseAdmin
    .from("groups")
    .select("teacher_id")
    .eq("id", groupId)
    .single();

  if (group?.teacher_id !== user.id) throw new Error("Unauthorized");

  // Insert Material
  const { data: material, error } = await supabaseAdmin
    .from("materials")
    .insert({
      teacher_id: user.id,
      group_id: groupId,
      title,
      description,
      link_url: linkUrl,
      material_type: materialType,
    })
    .select()
    .single();

  if (error) throw new Error("Failed to create material: " + error.message);

  return { success: true, materialId: material.id };
}

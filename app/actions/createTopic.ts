"use server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/utils/supabase/server";

interface TopicResource {
  name: string;
  url: string;
}

interface TopicOptions {
  content: string;
  explanation: string;
  code_example?: string;
  difficulty: string;
  category: string;
  visual_type?: string;
  resources?: TopicResource[];
  is_public?: boolean;
}

export async function createTopic(
  groupId: string | null,
  title: string,
  options: TopicOptions
) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(cookieStore);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verify teacher role
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "teacher") {
    throw new Error("Unauthorized: Only teachers can create topics.");
  }

  // If group-specific, verify ownership
  if (groupId) {
    const { data: group } = await supabaseAdmin
      .from("groups")
      .select("teacher_id")
      .eq("id", groupId)
      .single();

    if (group?.teacher_id !== user.id) {
      throw new Error("Unauthorized: Only the group owner can add topics to this hub.");
    }
  }

  // Insert Topic — same verification pattern as problems:
  // Global topics (no groupId) get 'Pending' status and need admin approval
  // Group topics are auto-approved
  const { data: topic, error: tErr } = await supabaseAdmin
    .from("topics")
    .insert({
      teacher_id: user.id,
      group_id: groupId,
      title,
      content: options.content,
      explanation: options.explanation,
      code_example: options.code_example || null,
      difficulty: options.difficulty,
      category: options.category,
      visual_type: options.visual_type || null,
      is_public: options.is_public ?? (groupId === null),
      status: groupId === null ? "Pending" : "Approved",
    })
    .select()
    .single();

  if (tErr || !topic) throw new Error("Failed to create topic: " + tErr?.message);

  // Insert Resources
  if (options.resources && options.resources.length > 0) {
    const resourceRows = options.resources
      .filter((r) => r.name.trim() && r.url.trim())
      .map((r) => ({
        topic_id: topic.id,
        name: r.name,
        url: r.url,
      }));

    if (resourceRows.length > 0) {
      const { error: rErr } = await supabaseAdmin
        .from("topic_resources")
        .insert(resourceRows);
      if (rErr) throw new Error("Failed to insert resources: " + rErr.message);
    }
  }

  return { success: true, topicId: topic.id };
}

export async function updateTopic(
  topicId: string,
  title: string,
  options: TopicOptions
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
  const { data: topic } = await supabaseAdmin
    .from("topics")
    .select("teacher_id")
    .eq("id", topicId)
    .single();

  if (topic?.teacher_id !== user.id) throw new Error("Unauthorized");

  // Update Topic
  const { error: tErr } = await supabaseAdmin
    .from("topics")
    .update({
      title,
      content: options.content,
      explanation: options.explanation,
      code_example: options.code_example || null,
      difficulty: options.difficulty,
      category: options.category,
      visual_type: options.visual_type || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", topicId);

  if (tErr) throw new Error("Failed to update topic: " + tErr.message);

  // Replace resources
  await supabaseAdmin.from("topic_resources").delete().eq("topic_id", topicId);

  if (options.resources && options.resources.length > 0) {
    const resourceRows = options.resources
      .filter((r) => r.name.trim() && r.url.trim())
      .map((r) => ({
        topic_id: topicId,
        name: r.name,
        url: r.url,
      }));

    if (resourceRows.length > 0) {
      await supabaseAdmin.from("topic_resources").insert(resourceRows);
    }
  }

  return { success: true };
}

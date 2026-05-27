import { createAdminClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import TopicDetailClient from "./TopicDetailClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabaseAdmin = createAdminClient();

  const { data: topic } = await supabaseAdmin
    .from("topics")
    .select("title, content")
    .eq("id", id)
    .eq("status", "Approved")
    .single();

  return {
    title: topic ? `${topic.title} | CodeWorld Topics` : "Topic Not Found",
    description: topic?.content || "Explore competitive programming topics on CodeWorld.",
  };
}

export default async function TopicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabaseAdmin = createAdminClient();

  const { data: topic, error } = await supabaseAdmin
    .from("topics")
    .select("*, topic_resources(*), profiles(username, full_name)")
    .eq("id", id)
    .eq("status", "Approved")
    .single();

  if (!topic || error) {
    notFound();
  }

  return <TopicDetailClient topic={topic} />;
}

import { createClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import TopicsClient from "./TopicsClient";

export const metadata = {
  title: "Topics | CodeWorld Learning Path",
  description: "Master competitive programming step-by-step with curated topics covering everything from basic syntax to elite algorithms.",
};

export default async function TopicsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch approved public topics with resources
  const { data: topics } = await supabaseAdmin
    .from("topics")
    .select("*, topic_resources(*), profiles(username, full_name)")
    .eq("status", "Approved")
    .eq("is_public", true)
    .order("created_at", { ascending: true });

  // Check if user is a teacher
  let isTeacher = false;
  if (user) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isTeacher = profile?.role === "teacher";
  }

  return (
    <TopicsClient
      initialTopics={topics || []}
      isTeacher={isTeacher}
      userId={user?.id || null}
    />
  );
}

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SubmitClient from "./SubmitClient";

export default async function SolvePage({ params }: { params: Promise<{ problem_id: string }> }) {
  const { problem_id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const supabaseAdmin = createAdminClient();

  const { data: problem } = await supabaseAdmin
    .from("problems")
    .select("*, group:group_id(allow_view_testcases, allow_view_others)")
    .eq("id", problem_id)
    .single();

  if (!problem) {
    return (
      <div className="p-12 text-zinc-300 font-mono">
        <h1 className="text-xl text-red-500 mb-4 font-bold">PROBLEM NOT FOUND</h1>
        <p>The requested problem ID does not exist in the system.</p>
        <a href="/dashboard" className="text-emerald-500 mt-6 inline-block hover:underline">
          Return to Dashboard
        </a>
      </div>
    );
  }

  const { data: translations } = await supabaseAdmin
    .from("problem_translations")
    .select("*")
    .eq("problem_id", problem_id)
    .eq("status", "Approved");

  if (!translations || translations.length === 0) {
    return (
      <div className="p-12 text-zinc-300 font-mono">
        <h1 className="text-xl text-amber-500 mb-4 font-bold">NO TRANSLATIONS AVAILABLE</h1>
        <p>This problem has no approved translations yet.</p>
        <a href="/dashboard" className="text-emerald-500 mt-6 inline-block hover:underline">
          Return to Dashboard
        </a>
      </div>
    );
  }

  // Fetch all test cases — judges against all of them, shows samples to user
  const { data: testCases } = await supabaseAdmin
    .from("test_cases")
    .select("*")
    .eq("problem_id", problem_id);

  const isTeacher = user.id === problem?.teacher_id;
  const isArchiveProblem = !problem?.group_id;

  // SECURE DATA PARTITIONING: Pass all test cases for background client-side grading. Masking is securely handled by SubmitClient UI.
  const filteredTestCases = testCases || [];

  // Group problems follow group settings, Archive problems follow strict student/teacher split
  const allowViewTestcases = isTeacher || (problem?.group?.allow_view_testcases ?? false);
  
  // Archive problems HIDE other students. Group problems follow group settings.
  const allowViewOthers = !isArchiveProblem && (problem?.group?.allow_view_others ?? false);

  // Fetch student submissions if teacher OR if viewing others is allowed
  const { data: allSubmissions } = (isTeacher || allowViewOthers) ? await supabaseAdmin
    .from("submissions")
    .select("*, profiles:student_id(username, full_name, avatar_url)")
    .eq("problem_id", problem_id)
    .order("created_at", { ascending: false })
    : { data: [] };

  // Fetch current user's own submissions (for student history)
  const { data: userSubmissions } = await supabaseAdmin
    .from("submissions")
    .select("*, profiles:student_id(username, full_name, avatar_url)")
    .eq("problem_id", problem_id)
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-white overflow-hidden">
      <SubmitClient
        problemId={problem_id}
        userId={user.id}
        translations={translations as any}
        testCases={(filteredTestCases || []) as any}
        timeLimitMs={problem.time_limit_ms}
        memoryLimitKb={problem.memory_limit_kb}
        isArchive={isArchiveProblem}
        isTeacher={isTeacher}
        allowViewTestcases={allowViewTestcases}
        allowViewOthers={allowViewOthers}
        allSubmissions={(allSubmissions || []) as any}
        userSubmissions={(userSubmissions || []) as any}
      />
    </div>
  );
}

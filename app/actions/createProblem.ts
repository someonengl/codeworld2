"use server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/utils/supabase/server";

interface TestCaseInput {
  input: string;
  expected_output: string;
  is_sample: boolean;
}

interface ProblemOptions {
  difficulty: "Easy" | "Medium" | "Hard";
  time_limit_ms: number;
  memory_limit_kb: number;
  test_cases: TestCaseInput[];
}

export async function createProblem(
  groupId: string | null, 
  title: string, 
  description: string, 
  options?: ProblemOptions & { is_public?: boolean }
) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(cookieStore);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Verify ownership ONLY if a groupId is provided
  if (groupId) {
    const { data: group } = await supabaseAdmin.from('groups').select('teacher_id').eq('id', groupId).single();
    if (group?.teacher_id !== user.id) {
      // Allow only teachers to post to their groups, but let anyone post to Archive
      throw new Error("Unauthorized: Only teachers can add problems to this group hub.");
    }
  }

  // Insert Problem
  const { data: prob, error: pErr } = await supabaseAdmin.from('problems').insert({
    teacher_id: user.id,
    group_id: groupId,
    is_public: options?.is_public ?? (groupId === null), // Default public if in archive
    time_limit_ms: options?.time_limit_ms ?? 2000,
    memory_limit_kb: options?.memory_limit_kb ?? 256000,
    status: groupId === null ? 'Pending' : 'Approved' // Archive needs moderation, groups are auto-approved
  }).select().single();
  
  if (pErr || !prob) throw new Error("Failed to create problem infrastructure: " + pErr?.message);

  // Insert base English Translation (include difficulty in description metadata)
  const descWithMeta = options?.difficulty 
    ? `[Difficulty: ${options.difficulty}]\n\n${description}` 
    : description;

  const { error: tErr } = await supabaseAdmin.from('problem_translations').insert({
    problem_id: prob.id,
    language_code: 'EN',
    title: title,
    description: descWithMeta,
    author_id: user.id,
    status: 'Approved'
  });

  if (tErr) throw new Error("Failed to create translation layer");

  // Insert Test Cases
  if (options?.test_cases && options.test_cases.length > 0) {
    const testCaseRows = options.test_cases.map(tc => ({
      problem_id: prob.id,
      input: tc.input,
      expected_output: tc.expected_output,
      is_sample: tc.is_sample
    }));

    const { error: tcErr } = await supabaseAdmin.from('test_cases').insert(testCaseRows);
    if (tcErr) throw new Error("Failed to insert test cases: " + tcErr.message);
  }

  return { success: true, problemId: prob.id };
}

export async function updateProblem(
  problemId: string,
  title: string,
  description: string,
  options: ProblemOptions
) {
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(cookieStore);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Verify ownership
  const { data: prob } = await supabaseAdmin.from('problems').select('teacher_id').eq('id', problemId).single();
  if (prob?.teacher_id !== user.id) throw new Error("Unauthorized");

  // Update Problem metadata
  const { error: pErr } = await supabaseAdmin.from('problems').update({
    time_limit_ms: options.time_limit_ms,
    memory_limit_kb: options.memory_limit_kb
  }).eq('id', problemId);
  
  if (pErr) throw new Error("Failed to update problem metadata");

  // Update Translation (difficulty in description)
  const descWithMeta = options.difficulty 
    ? `[Difficulty: ${options.difficulty}]\n\n${description}` 
    : description;

  const { error: tErr } = await supabaseAdmin.from('problem_translations').update({
    title: title,
    description: descWithMeta
  }).eq('problem_id', problemId).eq('language_code', 'EN');

  if (tErr) throw new Error("Failed to update translation layer");

  // Update Test Cases: Simple Replace Strategy
  // 1. Delete old test cases
  const { error: delErr } = await supabaseAdmin.from('test_cases').delete().eq('problem_id', problemId);
  if (delErr) throw new Error("Failed to clear old test cases");

  // 2. Insert new test cases
  if (options.test_cases && options.test_cases.length > 0) {
    const testCaseRows = options.test_cases.map(tc => ({
      problem_id: problemId,
      input: tc.input,
      expected_output: tc.expected_output,
      is_sample: tc.is_sample
    }));

    const { error: tcErr } = await supabaseAdmin.from('test_cases').insert(testCaseRows);
    if (tcErr) throw new Error("Failed to insert new test cases");
  }

  return { success: true };
}

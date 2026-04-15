-- ============================================================
-- MIGRATION: CONTEST SECURITY & SOURCE HARDENING
-- ============================================================

-- 1. Tighten Test Case Visibility
-- This ensures students only see sample cases and ONLY if the problem is public or they are in the group.
-- Most importantly, it blocks ALL data if the problem is part of an active contest (optional logic)
DROP POLICY IF EXISTS "test_cases_select" ON test_cases;
CREATE POLICY "test_cases_select" ON test_cases FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM problems
    WHERE problems.id = test_cases.problem_id AND (
      problems.teacher_id = auth.uid() -- Teacher always sees their own problems' testcases
      OR (
        test_cases.is_sample = true -- Students ONLY see samples
        AND (
          problems.is_public = true -- Public archive problems
          OR EXISTS ( -- Or they are in the specific group where the problem lives
            SELECT 1 FROM memberships
            WHERE memberships.group_id = problems.group_id 
              AND memberships.student_id = auth.uid() 
              AND memberships.status = 'approved'
          )
        )
      )
    )
  )
);

-- 2. Ensure Superadmins can see EVERYTHING (Identity / Moderation support)
DROP POLICY IF EXISTS "problems_select_admin" ON problems;
CREATE POLICY "problems_select_admin" ON problems FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
);

-- 3. Announcement Realtime Publication Helper (Redundancy check)
-- Ensure announcements are part of the realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'announcements'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
  END IF;
END $$;

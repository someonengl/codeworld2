-- ============================================================
-- MIGRATION: CONTEST RLS SECURITY FIX
-- ============================================================

-- 1. Enable teachers to link problems to contests in their groups
DROP POLICY IF EXISTS "contest_problems_insert" ON contest_problems;
CREATE POLICY "contest_problems_insert" ON contest_problems FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM contests
    JOIN groups ON groups.id = contests.group_id
    WHERE contests.id = contest_problems.contest_id
      AND groups.teacher_id = auth.uid()
  )
);

-- 2. Enable teachers to remove problems from contests in their groups
DROP POLICY IF EXISTS "contest_problems_delete" ON contest_problems;
CREATE POLICY "contest_problems_delete" ON contest_problems FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM contests
    JOIN groups ON groups.id = contests.group_id
    WHERE contests.id = contest_problems.contest_id
      AND groups.teacher_id = auth.uid()
  )
);

-- 3. Enable teachers to delete contests they own
DROP POLICY IF EXISTS "contests_delete" ON contests;
CREATE POLICY "contests_delete" ON contests FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM groups 
    WHERE groups.id = contests.group_id AND groups.teacher_id = auth.uid()
  )
);

-- 4. Enable teachers to update contests they own
DROP POLICY IF EXISTS "contests_update" ON contests;
CREATE POLICY "contests_update" ON contests FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM groups 
    WHERE groups.id = contests.group_id AND groups.teacher_id = auth.uid()
  )
);

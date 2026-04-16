-- ============================================================
-- MIGRATION: TRANSLATION VISIBILITY FIX
-- ============================================================

-- This migration updates the RLS policy for problem_translations to ensure
-- that titles and descriptions are visible for public/approved problems,
-- and that superadmins have full access to view them.

DROP POLICY IF EXISTS "translations_select" ON problem_translations;

CREATE POLICY "translations_select" ON problem_translations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM problems
    WHERE problems.id = problem_translations.problem_id AND (
      problems.is_public = true -- Public archive problems
      OR problems.status = 'Approved' -- Moderated problems
      OR problems.teacher_id = auth.uid() -- Problem owner
      OR EXISTS ( -- Superadmin bypass
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true
      )
      OR ( -- Group members
        problems.group_id IS NOT NULL AND EXISTS (
          SELECT 1 FROM memberships
          WHERE memberships.group_id = problems.group_id 
            AND memberships.student_id = auth.uid() 
            AND memberships.status = 'approved'
        )
      )
    )
  )
);

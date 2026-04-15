-- ============================================================
-- MIGRATION: ADMIN MASTER AUTHORITY
-- ============================================================

-- 1. Grant Superadmins full authority on Problems
DROP POLICY IF EXISTS "problems_admin_manage" ON problems;
CREATE POLICY "problems_admin_manage" ON problems FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true)
);

-- 2. Grant Superadmins full authority on Translations
DROP POLICY IF EXISTS "translations_admin_manage" ON problem_translations;
CREATE POLICY "translations_admin_manage" ON problem_translations FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true)
);

-- 3. Grant Superadmins full authority on Test Cases
DROP POLICY IF EXISTS "test_cases_admin_manage" ON test_cases;
CREATE POLICY "test_cases_admin_manage" ON test_cases FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true)
);

-- 4. Ensure Superadmins can manage groups for contest linking
DROP POLICY IF EXISTS "groups_admin_manage" ON groups;
CREATE POLICY "groups_admin_manage" ON groups FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true)
);

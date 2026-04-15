-- ============================================================
-- MIGRATION: SECURITY & MODERATION OVERHAUL
-- ============================================================

-- 1. Update Problems for Moderation
CREATE TYPE problem_status AS ENUM ('Pending', 'Approved', 'Rejected');
ALTER TABLE problems ADD COLUMN status problem_status DEFAULT 'Pending';

-- 2. Create Bans Table
CREATE TABLE bans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_value TEXT NOT NULL, -- email, username, or ip
  type         TEXT NOT NULL, -- 'email', 'username', 'ip'
  reason       TEXT,
  author_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(target_value, type)
);

-- 3. Add Banned Status to Profiles
ALTER TABLE profiles ADD COLUMN is_banned BOOLEAN DEFAULT FALSE;

-- 4. Enable RLS
ALTER TABLE bans ENABLE ROW LEVEL SECURITY;

-- 5. Update Problem Select Policy (Strict Moderation)
DROP POLICY IF EXISTS "problems_select" ON problems;
CREATE POLICY "problems_select" ON problems FOR SELECT USING (
  status = 'Approved'
  OR auth.uid() = teacher_id
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true
  )
  OR (
    group_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.group_id = problems.group_id 
        AND memberships.student_id = auth.uid() 
        AND memberships.status = 'approved'
    )
  )
);

-- 6. Ban RLS Policies
CREATE POLICY "bans_select" ON bans FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true)
);
CREATE POLICY "bans_manage" ON bans FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_super_admin = true)
);

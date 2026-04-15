-- ============================================================
-- MIGRATION: ARCHIVE & CONTESTS
-- ============================================================

-- 1. Decouple Problems from Groups (Make it an 'Archive' entity)
ALTER TABLE problems ALTER COLUMN group_id DROP NOT NULL;
ALTER TABLE problems ADD COLUMN is_public BOOLEAN DEFAULT TRUE;

-- 2. Create Contests Table
CREATE TABLE contests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  start_time   TIMESTAMPTZ NOT NULL,
  end_time     TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- 3. Create Contest Problems Join Table
CREATE TABLE contest_problems (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id    UUID REFERENCES contests(id) ON DELETE CASCADE NOT NULL,
  problem_id    UUID REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
  order_index   INTEGER DEFAULT 0,
  UNIQUE(contest_id, problem_id)
);

-- 4. Track Contest Submissions
ALTER TABLE submissions ADD COLUMN contest_id UUID REFERENCES contests(id) ON DELETE SET NULL;

-- 5. Enable RLS on new tables
ALTER TABLE contests         ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_problems ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for Problems (Archive Support)
-- Update: Allow select if public OR teacher OR group member
DROP POLICY IF EXISTS "problems_select" ON problems;
CREATE POLICY "problems_select" ON problems FOR SELECT USING (
  is_public = true
  OR auth.uid() = teacher_id
  OR EXISTS (
    SELECT 1 FROM memberships
    WHERE memberships.group_id = problems.group_id 
      AND memberships.student_id = auth.uid() 
      AND memberships.status = 'approved'
  )
);

-- Update: Allow anyone to insert (Archive problems)
DROP POLICY IF EXISTS "problems_insert_teacher" ON problems;
CREATE POLICY "problems_insert" ON problems FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 7. RLS Policies for Contests
CREATE POLICY "contests_select" ON contests FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM memberships 
    WHERE memberships.group_id = contests.group_id 
      AND memberships.student_id = auth.uid() 
      AND memberships.status = 'approved'
  )
  OR EXISTS (
    SELECT 1 FROM groups 
    WHERE groups.id = contests.group_id AND groups.teacher_id = auth.uid()
  )
);

CREATE POLICY "contests_insert" ON contests FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM groups 
    WHERE groups.id = contests.group_id AND groups.teacher_id = auth.uid()
  )
);

-- 8. RLS Policies for Contest Problems
CREATE POLICY "contest_problems_select" ON contest_problems FOR SELECT USING (
  EXISTS (SELECT 1 FROM contests WHERE contests.id = contest_problems.contest_id)
);

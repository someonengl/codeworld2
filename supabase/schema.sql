-- ============================================================
-- CODEWORLD FULL RESET MIGRATION
-- Run this in Supabase SQL Editor to wipe and recreate all tables
-- ============================================================

-- ── STEP 1: Drop everything ─────────────────────────────────
DROP TABLE IF EXISTS materials           CASCADE;
DROP TABLE IF EXISTS messages            CASCADE;
DROP TABLE IF EXISTS submissions         CASCADE;
DROP TABLE IF EXISTS test_cases          CASCADE;
DROP TABLE IF EXISTS problem_translations CASCADE;
DROP TABLE IF EXISTS problems            CASCADE;
DROP TABLE IF EXISTS memberships         CASCADE;
DROP TABLE IF EXISTS groups              CASCADE;
DROP TABLE IF EXISTS profiles            CASCADE;

DROP TYPE IF EXISTS user_role            CASCADE;
DROP TYPE IF EXISTS judge_status         CASCADE;
DROP TYPE IF EXISTS translation_status   CASCADE;
DROP TYPE IF EXISTS membership_status    CASCADE;

-- ── STEP 2: Custom Types ─────────────────────────────────────
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'normal');
CREATE TYPE judge_status AS ENUM ('Pending', 'Accepted', 'WA', 'TLE', 'CE', 'RE');
CREATE TYPE translation_status AS ENUM ('Pending', 'Approved', 'Rejected');
CREATE TYPE membership_status AS ENUM ('pending', 'approved', 'rejected', 'blacklisted');

-- ── STEP 3: Tables ───────────────────────────────────────────

-- Profiles (linked to Supabase auth.users)
CREATE TABLE profiles (
  id           UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username     TEXT UNIQUE,
  role         user_role DEFAULT 'normal',
  is_super_admin BOOLEAN DEFAULT FALSE,
  full_name    TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Groups (Teacher Classrooms)
CREATE TABLE groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  join_code   TEXT UNIQUE NOT NULL,
  allow_view_testcases BOOLEAN DEFAULT FALSE,
  allow_view_others    BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Memberships (Students in Groups)
CREATE TABLE memberships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  student_id  UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status      membership_status DEFAULT 'pending',
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, student_id)
);

-- Problems (Core Entity)
CREATE TABLE problems (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id      UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  group_id        UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  time_limit_ms   INTEGER DEFAULT 2000,
  memory_limit_kb INTEGER DEFAULT 256000,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Problem Translations (Community-Driven)
CREATE TABLE problem_translations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id     UUID REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
  language_code  TEXT NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT NOT NULL,
  author_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status         translation_status DEFAULT 'Pending',
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(problem_id, language_code)
);

-- Test Cases (per Problem)
CREATE TABLE test_cases (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id      UUID REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
  input           TEXT NOT NULL DEFAULT '',
  expected_output TEXT NOT NULL DEFAULT '',
  is_sample       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Submissions
CREATE TABLE submissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id        UUID REFERENCES problems(id) ON DELETE CASCADE NOT NULL,
  student_id        UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  code              TEXT NOT NULL,
  language_id       INTEGER NOT NULL,
  status            judge_status DEFAULT 'Pending',
  execution_time_ms INTEGER,
  memory_used_kb    INTEGER,
  result_data       JSONB, -- Detailed case-by-case results
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Messages (Realtime Group Chat)
CREATE TABLE messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materials (Teacher Uploads / Links)
CREATE TABLE materials (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  group_id    UUID REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  link_url    TEXT NOT NULL,
  material_type TEXT NOT NULL, -- 'video', 'pdf', 'image', 'link'
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── STEP 4: Enable RLS on all tables ─────────────────────────
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups               ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships          ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems             ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases           ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages             ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials            ENABLE ROW LEVEL SECURITY;

-- ── STEP 5: RLS Policies ─────────────────────────────────────

-- Profiles
CREATE POLICY "profiles_select"     ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Groups
CREATE POLICY "groups_select"         ON groups FOR SELECT USING (true);
CREATE POLICY "groups_insert_teacher" ON groups FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "groups_update_teacher" ON groups FOR UPDATE USING (auth.uid() = teacher_id);
CREATE POLICY "groups_delete_teacher" ON groups FOR DELETE USING (auth.uid() = teacher_id);

-- Memberships
CREATE POLICY "memberships_select" ON memberships FOR SELECT USING (
  auth.uid() = student_id
  OR EXISTS (
    SELECT 1 FROM groups
    WHERE groups.id = memberships.group_id AND groups.teacher_id = auth.uid()
  )
);
CREATE POLICY "memberships_insert" ON memberships FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Problems
CREATE POLICY "problems_select" ON problems FOR SELECT USING (
  auth.uid() = teacher_id
  OR EXISTS (
    SELECT 1 FROM memberships
    WHERE memberships.group_id = problems.group_id 
      AND memberships.student_id = auth.uid() 
      AND memberships.status = 'approved'
  )
);
CREATE POLICY "problems_insert_teacher" ON problems FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "problems_delete_teacher" ON problems FOR DELETE USING (auth.uid() = teacher_id);

-- Problem Translations
CREATE POLICY "translations_select" ON problem_translations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM problems
    WHERE problems.id = problem_translations.problem_id AND (
      problems.teacher_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM memberships
        WHERE memberships.group_id = problems.group_id 
          AND memberships.student_id = auth.uid() 
          AND memberships.status = 'approved'
      )
    )
  )
);
CREATE POLICY "translations_insert" ON problem_translations FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Test Cases
CREATE POLICY "test_cases_select" ON test_cases FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM problems
    WHERE problems.id = test_cases.problem_id AND (
      problems.teacher_id = auth.uid()
      OR (
        test_cases.is_sample = true
        AND EXISTS (
          SELECT 1 FROM memberships
          WHERE memberships.group_id = problems.group_id 
            AND memberships.student_id = auth.uid() 
            AND memberships.status = 'approved'
        )
      )
    )
  )
);
CREATE POLICY "test_cases_insert_teacher" ON test_cases FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM problems
    WHERE problems.id = test_cases.problem_id AND problems.teacher_id = auth.uid()
  )
);

-- Submissions
CREATE POLICY "submissions_select" ON submissions FOR SELECT USING (
  auth.uid() = student_id
  OR EXISTS (
    SELECT 1 FROM problems
    JOIN groups ON groups.id = problems.group_id
    WHERE problems.id = submissions.problem_id AND groups.teacher_id = auth.uid()
  )
);
CREATE POLICY "submissions_insert" ON submissions FOR INSERT WITH CHECK (auth.uid() = student_id);

-- Messages
CREATE POLICY "messages_select" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM groups WHERE groups.id = messages.group_id AND groups.teacher_id = auth.uid())
  OR EXISTS (
    SELECT 1 FROM memberships 
    WHERE memberships.group_id = messages.group_id 
      AND memberships.student_id = auth.uid() 
      AND memberships.status = 'approved'
  )
);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND (
    EXISTS (SELECT 1 FROM groups WHERE groups.id = messages.group_id AND groups.teacher_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM memberships 
      WHERE memberships.group_id = messages.group_id 
        AND memberships.student_id = auth.uid() 
        AND memberships.status = 'approved'
    )
  )
);

-- Materials
CREATE POLICY "materials_select" ON materials FOR SELECT USING (
  auth.uid() = teacher_id
  OR EXISTS (
    SELECT 1 FROM memberships
    WHERE memberships.group_id = materials.group_id 
      AND memberships.student_id = auth.uid() 
      AND memberships.status = 'approved'
  )
);
CREATE POLICY "materials_insert_teacher" ON materials FOR INSERT WITH CHECK (auth.uid() = teacher_id);
CREATE POLICY "materials_update_teacher" ON materials FOR UPDATE USING (auth.uid() = teacher_id);
CREATE POLICY "materials_delete_teacher" ON materials FOR DELETE USING (auth.uid() = teacher_id);

-- ── STEP 6: Auto-create profile on new user signup ───────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_username TEXT;
  default_full_name TEXT;
BEGIN
  -- Extract username ONLY if it exists in metadata (for manual signups)
  -- If NULL, the /auth/setup-username flow will prompt OAuth users to pick one.
  default_username := NEW.raw_user_meta_data->>'username';
  
  -- Extract full name or use a themed default
  default_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    'Agent ' || initcap(split_part(NEW.email, '@', 1)),
    'Hacker ' || substr(NEW.id::text, 1, 8)
  );

  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    default_username,
    default_full_name,
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── STEP 7: Enable Supabase Realtime on messages ─────────────
-- This is REQUIRED for the chat to receive live updates without reloading.
ALTER PUBLICATION supabase_realtime ADD TABLE messages;


-- ============================================================
-- TOPICS TABLE MIGRATION
-- Adds curriculum-style topics that teachers can create
-- Topics go through the same Pending/Approved/Rejected moderation as problems
-- ============================================================

-- Topics (Curriculum Content created by Teachers)
CREATE TABLE IF NOT EXISTS topics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id      UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  group_id        UUID REFERENCES groups(id) ON DELETE CASCADE,  -- NULL = global/public topic
  title           TEXT NOT NULL,
  content         TEXT NOT NULL,           -- Short summary / card text
  explanation     TEXT,                    -- Full detailed explanation (Markdown)
  code_example    TEXT,                    -- C++ code example
  difficulty      TEXT DEFAULT 'Beginner', -- Beginner, Intermediate, Advanced, Elite
  category        TEXT DEFAULT 'General',  -- e.g. "Sorting", "Graph Theory", "DP", etc.
  visual_type     TEXT,                    -- Optional visualizer hint
  status          translation_status DEFAULT 'Pending',  -- Reuse existing enum: Pending, Approved, Rejected
  is_public       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Topic Resources (external links per topic)
CREATE TABLE IF NOT EXISTS topic_resources (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id   UUID REFERENCES topics(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  url        TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE topics           ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_resources  ENABLE ROW LEVEL SECURITY;

-- Topics RLS Policies
-- Everyone can read approved public topics
CREATE POLICY "topics_select_public" ON topics FOR SELECT USING (
  (status = 'Approved' AND is_public = true)
  OR auth.uid() = teacher_id
  OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- Teachers can insert their own topics
CREATE POLICY "topics_insert_teacher" ON topics FOR INSERT WITH CHECK (
  auth.uid() = teacher_id
);

-- Teachers can update their own topics
CREATE POLICY "topics_update_teacher" ON topics FOR UPDATE USING (
  auth.uid() = teacher_id
  OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- Teachers can delete their own topics
CREATE POLICY "topics_delete_teacher" ON topics FOR DELETE USING (
  auth.uid() = teacher_id
  OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true
  )
);

-- Topic Resources RLS
CREATE POLICY "topic_resources_select" ON topic_resources FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM topics
    WHERE topics.id = topic_resources.topic_id
    AND (
      (topics.status = 'Approved' AND topics.is_public = true)
      OR topics.teacher_id = auth.uid()
      OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = true)
    )
  )
);

CREATE POLICY "topic_resources_insert" ON topic_resources FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM topics
    WHERE topics.id = topic_resources.topic_id AND topics.teacher_id = auth.uid()
  )
);

CREATE POLICY "topic_resources_delete" ON topic_resources FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM topics
    WHERE topics.id = topic_resources.topic_id AND topics.teacher_id = auth.uid()
  )
);

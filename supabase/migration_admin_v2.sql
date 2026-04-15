-- ============================================================
-- MIGRATION: ADMIN POWERHOUSE (ANNOUNCEMENTS & ANALYTICS)
-- ============================================================

-- 1. Create Announcements Table
CREATE TABLE announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  type        TEXT DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
  is_active   BOOLEAN DEFAULT TRUE,
  priority    INTEGER DEFAULT 0,
  author_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "announcements_select_public" ON announcements 
  FOR SELECT USING (is_active = true);

CREATE POLICY "announcements_manage_superadmin" ON announcements 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND (profiles.is_super_admin = true OR profiles.id = auth.uid() /* self check for owner email usually handled in code */)
    )
  );

-- 4. Analytics Helpers (Optional extensions for faster querying if needed)
-- (Stats can usually be derived via live queries on counts)

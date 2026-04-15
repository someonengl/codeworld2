-- ============================================================
-- MIGRATION: REALTIME ANNOUNCEMENTS
-- ============================================================

-- Enable Realtime for the announcements table
-- This allows clients to subscribe to changes via supabase.channel()
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;

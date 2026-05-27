-- ============================================================
-- CODEWORLD FULL RESET MIGRATION (MARIADB COMPATIBLE)
-- Run this to wipe and recreate all tables in MariaDB
-- ============================================================

-- Disable foreign key checks to allow dropping tables in any order
SET FOREIGN_KEY_CHECKS = 0;

-- ── STEP 1: Drop everything ─────────────────────────────────
DROP TABLE IF EXISTS bans;
DROP TABLE IF EXISTS topic_resources;
DROP TABLE IF EXISTS topics;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS materials;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS contest_problems;
DROP TABLE IF EXISTS contests;
DROP TABLE IF EXISTS test_cases;
DROP TABLE IF EXISTS problem_translations;
DROP TABLE IF EXISTS problems;
DROP TABLE IF EXISTS memberships;
DROP TABLE IF EXISTS groups;
DROP TABLE IF EXISTS profiles;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ── STEP 2: Tables ───────────────────────────────────────────

-- Profiles (independent local profiles table, removed Supabase auth reference)
CREATE TABLE profiles (
  id             VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  username       VARCHAR(255) UNIQUE,
  email          VARCHAR(255) UNIQUE,
  password_hash  VARCHAR(255),
  role           ENUM('student', 'teacher', 'normal') DEFAULT 'normal',
  is_super_admin BOOLEAN DEFAULT FALSE,
  is_banned      BOOLEAN DEFAULT FALSE,
  full_name      VARCHAR(255),
  avatar_url     TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Groups (Teacher Classrooms)
CREATE TABLE groups (
  id                   VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  teacher_id           VARCHAR(36) NOT NULL,
  name                 VARCHAR(255) NOT NULL,
  join_code            VARCHAR(255) NOT NULL UNIQUE,
  allow_view_testcases BOOLEAN DEFAULT FALSE,
  allow_view_others    BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Memberships (Students in Groups)
CREATE TABLE memberships (
  id          VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  group_id    VARCHAR(36) NOT NULL,
  student_id  VARCHAR(36) NOT NULL,
  status      ENUM('pending', 'approved', 'rejected', 'blacklisted') DEFAULT 'pending',
  joined_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_group_student (group_id, student_id),
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Problems (Core Entity)
CREATE TABLE problems (
  id              VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  teacher_id      VARCHAR(36) NOT NULL,
  group_id        VARCHAR(36) DEFAULT NULL, -- NULL = global/public archive problem
  time_limit_ms   INTEGER DEFAULT 2000,
  memory_limit_kb INTEGER DEFAULT 256000,
  is_public       BOOLEAN DEFAULT TRUE,
  status          ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Problem Translations (Community-Driven)
CREATE TABLE problem_translations (
  id             VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  problem_id     VARCHAR(36) NOT NULL,
  language_code  VARCHAR(50) NOT NULL,
  title          VARCHAR(255) NOT NULL,
  description    TEXT NOT NULL,
  author_id      VARCHAR(36),
  status         ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_problem_lang (problem_id, language_code),
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Test Cases (per Problem)
CREATE TABLE test_cases (
  id              VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  problem_id      VARCHAR(36) NOT NULL,
  input           TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_sample       BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contests
CREATE TABLE contests (
  id           VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  group_id     VARCHAR(36) NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  start_time   TIMESTAMP NOT NULL,
  end_time     TIMESTAMP NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contest Problems Join Table
CREATE TABLE contest_problems (
  id            VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  contest_id    VARCHAR(36) NOT NULL,
  problem_id    VARCHAR(36) NOT NULL,
  order_index   INTEGER DEFAULT 0,
  UNIQUE KEY uq_contest_problem (contest_id, problem_id),
  FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Submissions
CREATE TABLE submissions (
  id                VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  problem_id        VARCHAR(36) NOT NULL,
  student_id        VARCHAR(36) NOT NULL,
  contest_id        VARCHAR(36) DEFAULT NULL,
  code              TEXT NOT NULL,
  language_id       INTEGER NOT NULL,
  status            ENUM('Pending', 'Accepted', 'WA', 'TLE', 'CE', 'RE') DEFAULT 'Pending',
  execution_time_ms INTEGER,
  memory_used_kb    INTEGER,
  result_data       JSON, -- Detailed case-by-case results
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages (Realtime Group Chat)
CREATE TABLE messages (
  id         VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  group_id   VARCHAR(36) NOT NULL,
  user_id    VARCHAR(36) NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Materials (Teacher Uploads / Links)
CREATE TABLE materials (
  id            VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  teacher_id    VARCHAR(36) NOT NULL,
  group_id      VARCHAR(36) NOT NULL,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  link_url      TEXT NOT NULL,
  material_type VARCHAR(50) NOT NULL, -- 'video', 'pdf', 'image', 'link'
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Announcements
CREATE TABLE announcements (
  id          VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  type        VARCHAR(50) DEFAULT 'info', -- 'info', 'warning', 'success', 'error'
  is_active   BOOLEAN DEFAULT TRUE,
  priority    INTEGER DEFAULT 0,
  author_id   VARCHAR(36),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Topics
CREATE TABLE topics (
  id              VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  teacher_id      VARCHAR(36) NOT NULL,
  group_id        VARCHAR(36) DEFAULT NULL,  -- NULL = global/public topic
  title           TEXT NOT NULL,
  content         TEXT NOT NULL,           -- Short summary / card text
  explanation     TEXT,                    -- Full detailed explanation (Markdown)
  code_example    TEXT,                    -- C++ code example
  difficulty      VARCHAR(50) DEFAULT 'Beginner', -- Beginner, Intermediate, Advanced, Elite
  category        VARCHAR(50) DEFAULT 'General',  -- e.g. "Sorting", "Graph Theory", "DP", etc.
  visual_type     VARCHAR(50),                    -- Optional visualizer hint
  status          VARCHAR(50) DEFAULT 'Pending',  -- Pending, Approved, Rejected
  is_public       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Topic Resources (external links per topic)
CREATE TABLE topic_resources (
  id         VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  topic_id   VARCHAR(36) NOT NULL,
  name       TEXT NOT NULL,
  url        TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bans
CREATE TABLE bans (
  id           VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
  target_value VARCHAR(255) NOT NULL, -- email, username, or ip
  type         VARCHAR(50) NOT NULL, -- 'email', 'username', 'ip'
  reason       TEXT,
  author_id    VARCHAR(36),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_ban_target (target_value, type),
  FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

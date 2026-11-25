-- ==============================================================================
-- TrainTrack Complete Database Schema & Seed Data for Supabase
-- Target Database: nahpxisgnkacnwktbdsh.supabase.co
-- Date: 2026-11-24
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('trainee', 'mentor', 'lead', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE work_log_status AS ENUM ('draft', 'pending_mentor', 'pending_lead', 'revision_required', 'approved');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE approval_action_type AS ENUM ('submit', 'approve', 'request_revision');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. DROP EXISTING TABLES IF NEEDED (Cascading drop for clean rebuild)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS approval_actions CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS work_logs CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- 4. TABLES DEFINITION

-- 4.1 Teams
CREATE TABLE teams (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  department TEXT,
  lead_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.2 Profiles
CREATE TABLE profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'trainee',
  team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
  mentor_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  avatar_url TEXT,
  position TEXT,
  password_hash TEXT,
  must_change_password BOOLEAN NOT NULL DEFAULT true,
  password_changed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.3 Categories
CREATE TABLE categories (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.4 Work Logs
CREATE TABLE work_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  trainee_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_mentor_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  work_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  hours_spent NUMERIC(4, 2) NOT NULL CHECK (hours_spent > 0),
  status work_log_status NOT NULL DEFAULT 'draft',
  category TEXT NOT NULL DEFAULT 'พัฒนาระบบ (Development)',
  revision_count INT NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4.5 Attachments
CREATE TABLE attachments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  work_log_id TEXT NOT NULL REFERENCES work_logs(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'image',
  file_size INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.6 Comments
CREATE TABLE comments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  work_log_id TEXT NOT NULL REFERENCES work_logs(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.7 Approval Actions (Audit Trail)
CREATE TABLE approval_actions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  work_log_id TEXT NOT NULL REFERENCES work_logs(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action approval_action_type NOT NULL,
  from_status work_log_status NOT NULL,
  to_status work_log_status NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.8 Notifications
CREATE TABLE notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'approval',
  reference_id TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4.9 Password Reset Tokens
CREATE TABLE password_reset_tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. INDEXES
CREATE INDEX idx_work_logs_trainee ON work_logs(trainee_id, status);
CREATE INDEX idx_work_logs_status ON work_logs(status);
CREATE INDEX idx_work_logs_mentor ON work_logs(assigned_mentor_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);
CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens(user_id);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- Enabling RLS on all tables with permissive policies for anon & authenticated roles
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Permissive policies for web application operation (Anon & Authenticated)
CREATE POLICY "Public read/write teams" ON teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write work_logs" ON work_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write attachments" ON attachments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write comments" ON comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write approval_actions" ON approval_actions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write password_reset_tokens" ON password_reset_tokens FOR ALL USING (true) WITH CHECK (true);

-- 7. STORAGE BUCKET FOR WORK LOG ATTACHMENTS
INSERT INTO storage.buckets (id, name, public)
VALUES ('work-log-attachments', 'work-log-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for anon upload & read
DO $$ BEGIN
  CREATE POLICY "Public Access for work-log-attachments"
    ON storage.objects FOR ALL
    USING (bucket_id = 'work-log-attachments')
    WITH CHECK (bucket_id = 'work-log-attachments');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 8. SEED DATA (ข้อมูลเริ่มต้นระบบ TrainTrack)
-- ==============================================================================

-- 8.1 Teams
INSERT INTO teams (id, name, department) VALUES
('team-mobile-1', 'Mobile & Web Development', 'Engineering')
ON CONFLICT (id) DO NOTHING;

-- 8.2 Profiles (บัญชี Demo ตั้งค่า must_change_password = false เพื่อให้ทดลองเข้าใช้งานได้ทันที)
INSERT INTO profiles (id, full_name, email, role, team_id, mentor_id, avatar_url, position, must_change_password) VALUES
-- Admin
('user-admin-1', 'ผู้ดูแลระบบสูงสุด (System Admin)', 'admin@traintrack.app', 'admin', NULL, NULL, 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150', 'System Administrator', false),
-- Lead
('user-lead-1', 'หัวหน้าวีระ ชัยชนะ (หัวหน้าพี่เลี้ยง)', 'veera.lead@traintrack.app', 'lead', 'team-mobile-1', NULL, 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 'Engineering Lead', false),
-- Mentors
('user-mentor-1', 'พี่สมชาย ชูใจ (พี่เลี้ยงฝั่ง Frontend)', 'somchai.frontend@traintrack.app', 'mentor', 'team-mobile-1', NULL, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'Senior Frontend Developer', false),
('user-mentor-2', 'พี่วิภาดา ศรีกุล (พี่เลี้ยงฝั่ง Backend & Database)', 'vipada.backend@traintrack.app', 'mentor', 'team-mobile-1', NULL, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', 'Lead Backend Engineer', false),
('user-mentor-3', 'พี่อานนท์ มั่นคง (พี่เลี้ยงฝั่ง DevOps & Native Plugin)', 'arnon.devops@traintrack.app', 'mentor', 'team-mobile-1', NULL, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'DevOps & Mobile Specialist', false),
-- Trainees
('user-trainee-1', 'กิตติศักดิ์ พัฒนาดี (นักศึกษาฝึกงาน)', 'kittisak.trainee@traintrack.app', 'trainee', 'team-mobile-1', 'user-mentor-1', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'Frontend Developer Intern', false),
('user-trainee-2', 'ณิชา มณีรัตน์ (นักศึกษาฝึกงาน)', 'nicha.backend@traintrack.app', 'trainee', 'team-mobile-1', 'user-mentor-2', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'Backend Developer Intern', false),
('user-trainee-3', 'ธนกฤต สุขเกษม (นักศึกษาฝึกงาน)', 'thanakrit.devops@traintrack.app', 'trainee', 'team-mobile-1', 'user-mentor-3', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'Mobile DevOps Intern', false)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  position = EXCLUDED.position,
  must_change_password = EXCLUDED.must_change_password;

-- 8.3 Categories
INSERT INTO categories (name) VALUES
('พัฒนาระบบ (Development)'),
('ออกแบบ (Design/UI)'),
('ประชุม/อัปเดตงาน'),
('ค้นคว้าข้อมูล/เรียนรู้'),
('ทดสอบระบบ (Testing)'),
('จัดทำเอกสาร (Documentation)'),
('อื่นๆ')
ON CONFLICT (name) DO NOTHING;

-- 8.4 Work Logs
INSERT INTO work_logs (
  id, trainee_id, assigned_mentor_id, work_date, title, description,
  hours_spent, status, category, revision_count, submitted_at, approved_at, created_at, updated_at
) VALUES
(
  'log-1',
  'user-trainee-1',
  'user-mentor-3',
  (CURRENT_DATE - INTERVAL '2 days'),
  'ศึกษาโครงสร้าง Capacitor และทำความเข้าใจ Native Plugin',
  'ได้ลองทดสอบติดตั้ง Camera plugin และ Geolocation บนระบบจำลอง Android พร้อมจดสรุปข้อจำกัดเรื่อง Permission',
  7.0,
  'approved',
  'ค้นคว้าข้อมูล/เรียนรู้',
  0,
  (now() - INTERVAL '2 days'),
  (now() - INTERVAL '1 day'),
  (now() - INTERVAL '2 days'),
  (now() - INTERVAL '1 day')
),
(
  'log-2',
  'user-trainee-1',
  'user-mentor-1',
  (CURRENT_DATE - INTERVAL '1 day'),
  'เชื่อมต่อหน้าเข้าสู่ระบบและสร้างหน้าบันทึกประจำวัน',
  'เขียนฟอร์มบันทึกการทำงาน เพิ่มระบบอัปโหลดรูปภาพตัวอย่าง และจัดการสถานะฟอร์มตามที่กำหนด',
  8.0,
  'pending_mentor',
  'พัฒนาระบบ (Development)',
  0,
  (now() - INTERVAL '1 day'),
  NULL,
  (now() - INTERVAL '1 day'),
  (now() - INTERVAL '1 day')
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  status = EXCLUDED.status;

-- 8.5 Attachments
INSERT INTO attachments (id, work_log_id, file_name, file_url, file_type, file_size) VALUES
(
  'att-1',
  'log-1',
  'capacitor_test_screenshot.png',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600',
  'image',
  460800
)
ON CONFLICT (id) DO NOTHING;

-- 8.6 Comments
INSERT INTO comments (id, work_log_id, author_id, content, is_system, created_at) VALUES
(
  'c-1',
  'log-1',
  'user-mentor-3',
  'พี่อานนท์ตรวจแล้ว สรุปได้ละเอียดดีมากครับ ส่งต่อให้หัวหน้า',
  false,
  (now() - INTERVAL '36 hours')
),
(
  'c-2',
  'log-1',
  'user-lead-1',
  'อนุมัติเรียบร้อย เริ่มลงมือเขียนโค้ดจริงในสปรินต์นี้ได้เลย',
  false,
  (now() - INTERVAL '24 hours')
)
ON CONFLICT (id) DO NOTHING;

-- 8.7 Approval Actions
INSERT INTO approval_actions (id, work_log_id, actor_id, action, from_status, to_status, note, created_at) VALUES
(
  'act-1',
  'log-1',
  'user-trainee-1',
  'submit',
  'draft',
  'pending_mentor',
  NULL,
  (now() - INTERVAL '48 hours')
),
(
  'act-2',
  'log-1',
  'user-mentor-3',
  'approve',
  'pending_mentor',
  'pending_lead',
  'ผ่านการตรวจขั้นแรก',
  (now() - INTERVAL '36 hours')
),
(
  'act-2-1',
  'log-2',
  'user-trainee-1',
  'submit',
  'draft',
  'pending_mentor',
  NULL,
  (now() - INTERVAL '24 hours')
)
ON CONFLICT (id) DO NOTHING;

-- 8.8 Notifications
INSERT INTO notifications (id, user_id, title, body, type, reference_id, is_read, created_at) VALUES
(
  'notif-1',
  'user-trainee-1',
  'งานได้รับการอนุมัติแล้ว',
  'งาน "ศึกษาโครงสร้าง Capacitor" ได้รับการอนุมัติขั้นสุดท้ายจากหัวหน้าพี่เลี้ยงแล้ว',
  'approval',
  'log-1',
  false,
  now()
)
ON CONFLICT (id) DO NOTHING;

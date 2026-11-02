-- 001_create_tables.sql
-- TrainTrack Database Schema

CREATE TYPE user_role AS ENUM ('trainee', 'mentor', 'lead', 'admin');
CREATE TYPE work_log_status AS ENUM ('draft', 'pending_mentor', 'pending_lead', 'revision_required', 'approved');
CREATE TYPE work_category AS ENUM ('development', 'design', 'meeting', 'research', 'testing', 'other');
CREATE TYPE approval_action_type AS ENUM ('submit', 'approve', 'request_revision');

-- 1. ตารางทีม / แผนก
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  department TEXT,
  lead_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ข้อมูลโปรไฟล์ผู้ใช้
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'trainee',
  team_id UUID REFERENCES teams(id),
  mentor_id UUID REFERENCES profiles(id),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ตารางบันทึกงานของนักศึกษา
CREATE TABLE work_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  hours_spent NUMERIC(4, 2) NOT NULL CHECK (hours_spent > 0),
  status work_log_status NOT NULL DEFAULT 'draft',
  category work_category NOT NULL DEFAULT 'development',
  revision_count INT NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. รูปภาพและไฟล์แนบ
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_log_id UUID NOT NULL REFERENCES work_logs(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ความคิดเห็นและการสื่อสาร
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_log_id UUID NOT NULL REFERENCES work_logs(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. ลำดับการอนุมัติ (Audit Trail)
CREATE TABLE approval_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_log_id UUID NOT NULL REFERENCES work_logs(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES profiles(id),
  action approval_action_type NOT NULL,
  from_status work_log_status NOT NULL,
  to_status work_log_status NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. การแจ้งเตือน (Notifications)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  reference_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes เพื่อความรวดเร็วในการ Query
CREATE INDEX idx_work_logs_trainee ON work_logs(trainee_id, status);
CREATE INDEX idx_work_logs_status ON work_logs(status);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);


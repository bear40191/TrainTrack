-- 002_row_level_security.sql
-- TrainTrack Row Level Security (RLS) Policies
-- Implements OWASP Top 10 A01:2021 - Broken Access Control & Defense-in-Depth

-- 1. เปิดใช้งาน RLS ทุกตาราง
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function: ตรวจสอบว่าผู้ใช้ปัจจุบันมี role ใด
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================================
-- 1. PROFILES POLICIES
-- ============================================================================
-- ทุกคนสามารถอ่านโปรไฟล์ของสมาชิกในระบบได้ (สำหรับแสดงชื่อผู้ส่ง/พี่เลี้ยง)
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- ผู้ใช้สามารถแก้ไขโปรไฟล์ของตนเองได้
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- ไม่อนุญาตให้ผู้ใช้ทั่วไปยกระดับ Role ตนเอง (Privilege Escalation Prevention)
    AND (role = (SELECT role FROM profiles WHERE id = auth.uid()) OR current_user_role() = 'admin')
  );

-- ผู้ดูแลระบบ (Admin) มีสิทธิ์จัดการโปรไฟล์ทั้งหมด
CREATE POLICY "Admins have full access to profiles"
  ON profiles FOR ALL
  TO authenticated
  USING (current_user_role() = 'admin');

-- ============================================================================
-- 2. WORK LOGS POLICIES
-- ============================================================================
-- สิทธิ์การอ่าน Work Logs:
-- นักศึกษา: อ่านงานของตัวเอง
-- พี่เลี้ยง: อ่านงานของนักศึกษาที่ตนรับผิดชอบ หรืออยู่ในทีมเดียวกัน
-- หัวหน้า & แอดมิน: อ่านงานได้ทั้งหมด
CREATE POLICY "Work logs viewable based on role and ownership"
  ON work_logs FOR SELECT
  TO authenticated
  USING (
    trainee_id = auth.uid()
    OR current_user_role() IN ('lead', 'admin')
    OR (
      current_user_role() = 'mentor' 
      AND (
        trainee_id IN (SELECT id FROM profiles WHERE mentor_id = auth.uid())
        OR status != 'draft'
      )
    )
  );

-- นักศึกษาสามารถสร้างบันทึกงานของตนเองได้เท่านั้น
CREATE POLICY "Trainees can insert own work logs"
  ON work_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    trainee_id = auth.uid()
    AND status IN ('draft', 'pending_mentor')
  );

-- นักศึกษาอัปเดตงานตนเองได้เมื่อเป็น draft หรือ revision_required
CREATE POLICY "Trainees can update draft or revision logs"
  ON work_logs FOR UPDATE
  TO authenticated
  USING (
    trainee_id = auth.uid() 
    AND status IN ('draft', 'revision_required')
  )
  WITH CHECK (
    trainee_id = auth.uid()
    AND status IN ('draft', 'pending_mentor')
  );

-- พี่เลี้ยงและหัวหน้าสามารถเปลี่ยนสถานะงานที่ส่งมาตรวจได้
CREATE POLICY "Mentors and Leads can review work logs"
  ON work_logs FOR UPDATE
  TO authenticated
  USING (
    current_user_role() IN ('mentor', 'lead', 'admin')
  )
  WITH CHECK (
    current_user_role() IN ('mentor', 'lead', 'admin')
  );

-- เฉพาะ Admin หรือเจ้าของงาน (กรณีเป็น draft) ที่สามารถลบได้
CREATE POLICY "Delete work logs restricted"
  ON work_logs FOR DELETE
  TO authenticated
  USING (
    current_user_role() = 'admin'
    OR (trainee_id = auth.uid() AND status = 'draft')
  );

-- ============================================================================
-- 3. ATTACHMENTS POLICIES
-- ============================================================================
CREATE POLICY "Attachments inherit work log read access"
  ON attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM work_logs
      WHERE work_logs.id = attachments.work_log_id
    )
  );

CREATE POLICY "Users can insert attachments for their own work logs"
  ON attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM work_logs
      WHERE work_logs.id = attachments.work_log_id
      AND work_logs.trainee_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. COMMENTS & AUDIT TRAIL POLICIES
-- ============================================================================
CREATE POLICY "Comments viewable by participants"
  ON comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM work_logs
      WHERE work_logs.id = comments.work_log_id
    )
  );

CREATE POLICY "Authenticated users can comment on accessible logs"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM work_logs
      WHERE work_logs.id = comments.work_log_id
    )
  );

-- Audit Trail (approval_actions) เป็น Append-Only ห้ามแก้ไขหรือลบ
CREATE POLICY "Approval actions are readable by participants"
  ON approval_actions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM work_logs
      WHERE work_logs.id = approval_actions.work_log_id
    )
  );

CREATE POLICY "Reviewers can record approval action"
  ON approval_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND current_user_role() IN ('mentor', 'lead', 'admin')
  );

-- ============================================================================
-- 5. NOTIFICATIONS POLICIES
-- ============================================================================
CREATE POLICY "Users only access own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can mark own notifications as read"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

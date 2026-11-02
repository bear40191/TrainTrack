export type Role = 'trainee' | 'mentor' | 'lead' | 'admin';

export type WorkLogStatus = 
  | 'draft'              // นักศึกษาบันทึกแบบร่าง
  | 'pending_mentor'     // ส่งให้พี่เลี้ยงตรวจสอบ
  | 'pending_lead'       // พี่เลี้ยงอนุมัติแล้ว รอหัวหน้าพี่เลี้ยงอนุมัติขั้นสุดท้าย
  | 'revision_required'  // มีการส่งกลับให้แก้ไข
  | 'approved';          // หัวหน้าพี่เลี้ยงอนุมัติเรียบร้อย

export type ApprovalActionType = 'submit' | 'approve' | 'request_revision';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  team_id: string | null;
  mentor_id: string | null;
  avatar_url: string | null;
  position?: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  work_log_id: string;
  file_name: string;
  file_url: string;
  file_type: 'image' | 'document' | 'other';
  file_size: number;
  created_at: string;
}

export interface Comment {
  id: string;
  work_log_id: string;
  author_id: string;
  content: string;
  is_system: boolean;
  created_at: string;
  author?: Profile;
}

export interface ApprovalAction {
  id: string;
  work_log_id: string;
  actor_id: string;
  action: ApprovalActionType;
  from_status: WorkLogStatus;
  to_status: WorkLogStatus;
  note: string | null;
  created_at: string;
  actor?: Profile;
}

export interface WorkLog {
  id: string;
  trainee_id: string;
  assigned_mentor_id?: string; // พี่เลี้ยงที่มอบหมายงาน หรือผู้ที่ต้องตรวจงานนี้
  work_date: string;
  title: string;
  description: string;
  hours_spent: number;
  status: WorkLogStatus;
  category: string;
  revision_count: number;
  submitted_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  trainee?: Profile;
  assigned_mentor?: Profile;
  attachments?: Attachment[];
  comments?: Comment[];
  approval_actions?: ApprovalAction[];
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'approval' | 'revision' | 'comment';
  reference_id: string;
  is_read: boolean;
  created_at: string;
}

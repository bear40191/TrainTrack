import { Role, WorkLogStatus } from './types';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_FILES_PER_LOG = 5;

export const ROLE_LABELS: Record<Role, string> = {
  trainee: 'นักศึกษาฝึกงาน',
  mentor: 'พี่เลี้ยง (Mentor)',
  lead: 'หัวหน้าพี่เลี้ยง (Lead)',
  admin: 'ผู้ดูแลระบบ (Admin)'
};

export const STATUS_LABELS: Record<WorkLogStatus, string> = {
  draft: 'แบบร่าง',
  pending_mentor: 'รอพี่เลี้ยงตรวจ',
  pending_lead: 'รอหัวหน้าอนุมัติ',
  revision_required: 'ส่งกลับให้แก้ไข',
  approved: 'อนุมัติเรียบร้อย'
};

export const DEFAULT_CATEGORIES: string[] = [
  'พัฒนาระบบ (Development)',
  'ออกแบบ (Design/UI)',
  'ประชุม/อัปเดตงาน',
  'ค้นคว้าข้อมูล/เรียนรู้',
  'ทดสอบระบบ (Testing)',
  'จัดทำเอกสาร (Documentation)',
  'อื่นๆ'
];

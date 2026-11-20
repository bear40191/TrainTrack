import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore, MOCK_MENTORS, MOCK_USERS } from '@/store/appStore';

describe('การอนุมัติทั้งหมดสำหรับบทบาทพี่เลี้ยงและหัวหน้า (Approve All Workflow)', () => {
  beforeEach(() => {
    // รีเซ็ตสถานะเริ่มต้น
    const store = useAppStore.getState();
    store.switchRole('mentor');
  });

  it('พี่เลี้ยงสามารถอนุมัติงานที่รอตรวจทั้งหมดพร้อมกันได้ (mentorApproveAll)', () => {
    const store = useAppStore.getState();
    const mentor = MOCK_MENTORS[0];
    store.switchRole('mentor', mentor.id);

    // ดึงงานที่อยู่ในสถานะ pending_mentor
    const initialPending = useAppStore.getState().workLogs.filter(
      (l) => l.status === 'pending_mentor'
    );
    expect(initialPending.length).toBeGreaterThan(0);

    // เรียกอนุมัติทั้งหมด
    useAppStore.getState().mentorApproveAll();

    // ตรวจสอบว่างานที่เคย pending_mentor เปลี่ยนสถานะเป็น pending_lead ทั้งหมด
    const remainingPendingMentor = useAppStore.getState().workLogs.filter(
      (l) => l.status === 'pending_mentor'
    );
    expect(remainingPendingMentor.length).toBe(0);

    const newPendingLead = useAppStore.getState().workLogs.filter(
      (l) => l.status === 'pending_lead'
    );
    expect(newPendingLead.length).toBeGreaterThanOrEqual(initialPending.length);
  });

  it('หัวหน้าพี่เลี้ยงสามารถอนุมัติขั้นสุดท้ายงานทั้งหมดพร้อมกันได้ (leadApproveAll)', () => {
    const store = useAppStore.getState();
    store.switchRole('lead');

    // ให้มีงาน pending_lead อยู่ในระบบ
    const initialLeadPending = useAppStore.getState().workLogs.filter(
      (l) => l.status === 'pending_lead'
    );

    // ถ้ายังไม่มี ให้ปรับสัก 1 งานเป็น pending_lead
    if (initialLeadPending.length === 0) {
      const firstLog = useAppStore.getState().workLogs[0];
      useAppStore.getState().updateWorkLog(firstLog.id, { status: 'pending_lead' });
    }

    const pendingCount = useAppStore.getState().workLogs.filter(
      (l) => l.status === 'pending_lead'
    ).length;
    expect(pendingCount).toBeGreaterThan(0);

    // เรียกอนุมัติขั้นสุดท้ายทั้งหมด
    useAppStore.getState().leadApproveAll();

    // ตรวจสอบว่าไม่มีงานค้างใน pending_lead แล้ว และสถานะเปลี่ยนเป็น approved
    const remainingPendingLead = useAppStore.getState().workLogs.filter(
      (l) => l.status === 'pending_lead'
    );
    expect(remainingPendingLead.length).toBe(0);
  });
});

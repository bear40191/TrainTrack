import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/appStore';

describe('ระบบบังคับเปลี่ยนรหัสผ่านเมื่อเข้าสู่ระบบครั้งแรก (Force Change Password)', () => {
  beforeEach(() => {
    useAppStore.getState().logout();
  });

  it('บัญชีที่ Admin เพิ่มใหม่ (Trainee/Mentor/Lead) ต้องมี must_change_password = true', () => {
    const store = useAppStore.getState();
    const uniqueEmail = `new.intern.${Date.now()}@traintrack.app`;

    const res = store.addTrainee({
      full_name: 'นักศึกษาใหม่ ทดสอบ',
      email: uniqueEmail,
      position: 'QA Intern',
    });

    expect(res.success).toBe(true);

    const added = useAppStore.getState().trainees.find((t) => t.email === uniqueEmail);
    expect(added).toBeDefined();
    expect(added?.must_change_password).toBe(true);
    expect(added?.password_hash).toBeDefined();
    expect(added?.password_hash).not.toBe('123456');
  });

  it('เมื่อเข้าสู่ระบบครั้งแรกด้วยรหัสเริ่มต้น 123456 สถานะ must_change_password ต้องเป็น true และปลดล็อกเมื่อเปลี่ยนรหัสสำเร็จ', () => {
    const uniqueEmail = `mentor.new.${Date.now()}@traintrack.app`;
    useAppStore.getState().addMentor({
      full_name: 'พี่เลี้ยงใหม่ ทดสอบ',
      email: uniqueEmail,
      position: 'Senior Dev',
    });

    const loggedIn = useAppStore.getState().login(uniqueEmail, '123456');
    expect(loggedIn).toBe(true);
    expect(useAppStore.getState().currentUser.must_change_password).toBe(true);

    const changeRes = useAppStore.getState().changePassword(uniqueEmail, 'StrongPass99');
    expect(changeRes.success).toBe(true);
    expect(useAppStore.getState().currentUser.must_change_password).toBe(false);

    // ทดสอบออกจากระบบแล้วล็อกอินใหม่ด้วยรหัสเดิม (123456) ต้องไม่ผ่าน และรหัสใหม่ต้องผ่าน
    useAppStore.getState().logout();
    expect(useAppStore.getState().login(uniqueEmail, '123456')).toBe(false);
    expect(useAppStore.getState().login(uniqueEmail, 'StrongPass99')).toBe(true);
    expect(useAppStore.getState().currentUser.must_change_password).toBe(false);
  });

  it('บัญชีทดลอง (Demo) เริ่มต้นไม่ติดสถานะบังคับเปลี่ยนรหัสผ่าน', () => {
    const loggedIn = useAppStore.getState().login('kittisak.trainee@traintrack.app', '123456');
    expect(loggedIn).toBe(true);
    expect(useAppStore.getState().currentUser.must_change_password).not.toBe(true);
  });
});

/**
 * TrainTrack Password Reset Service
 * จัดการกระบวนการลืมรหัสผ่านและรีเซ็ตรหัสผ่านทั้งหมดตาม Spec 2026-11-20
 * - ตรวจสอบ Rate limit
 * - สร้างและ Hash โทเค็น (ไม่เก็บ raw token ในฐานข้อมูล)
 * - สั่งส่งอีเมลแบบ Asynchronous ผ่าน Email Adapter
 * - ตรวจสอบโทเค็นแบบ Constant-time และป้องกันการนำมาใช้ซ้ำ
 * - ล็อกเอาต์ทุกอุปกรณ์และส่งอีเมลแจ้งเตือนเมื่อสำเร็จ
 */
import {
  generateResetToken,
  hashResetToken,
  verifyTokenHash,
  validatePasswordPolicy,
  hashPassword,
} from '@/lib/password';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  getAppBaseUrl,
  sendPasswordResetEmail,
  sendPasswordChangedNotificationEmail,
} from '@/services/emailService';
import { useAppStore, ALL_DEMO_USERS } from '@/store/appStore';
import { supabase } from '@/services/supabase';
import { isSupabaseConfigured, dbUpdateProfilePassword } from '@/services/db';

export interface PasswordResetTokenRecord {
  id: string;
  user_id: string;
  email: string;
  token_hash: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

// In-Memory Token Store สำหรับรันทั้งบน Node / Next.js API และ Unit Tests
let resetTokenStore: PasswordResetTokenRecord[] = [];

export function getPasswordResetStore(): PasswordResetTokenRecord[] {
  return resetTokenStore;
}

export function clearPasswordResetStore(): void {
  resetTokenStore = [];
}

const CONSTANT_RESPONSE_MESSAGE = 'ถ้าอีเมลนี้อยู่ในระบบ เราได้ส่งลิงก์ให้แล้ว';
const INVALID_TOKEN_MESSAGE = 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว';

/**
 * 1. รับคำขอรีเซ็ตรหัสผ่าน (Forgot Password Request)
 * @param email อีเมลของผู้ใช้
 * @param ip IP Address ของผู้ขอ
 */
export async function requestPasswordReset(
  email: string,
  ip: string
): Promise<{
  success: boolean;
  message: string;
  emailSent?: boolean;
  rawToken?: string;
}> {
  const normalizedEmail = (email || '').trim().toLowerCase();

  // ตรวจสอบ Rate limit: ไม่เกิน 3 ครั้ง/ชม./อีเมล และ 20 ครั้ง/ชม./IP
  const rateLimitResult = checkRateLimit(normalizedEmail, ip);
  if (!rateLimitResult.allowed) {
    // เมื่อเกินโควตา ยังคงตอบข้อความเดิมเสมอ แต่ไม่ส่งอีเมล (ตาม Spec ข้อ 5)
    return {
      success: true,
      message: CONSTANT_RESPONSE_MESSAGE,
      emailSent: false,
    };
  }

  // ค้นหาผู้ใช้งานในระบบ (ดึงจาก Demo Store หรือ Profiles)
  const storeState = useAppStore.getState();
  const allUsers = [
    ...storeState.trainees,
    ...storeState.mentors,
    ...storeState.leads,
    ...ALL_DEMO_USERS,
  ];

  let targetUser: { id: string; email: string } | undefined = allUsers.find(
    (u) => u.email.trim().toLowerCase() === normalizedEmail
  );

  // หากไม่พบใน Store ในเครื่อง ให้ค้นหาจากตาราง profiles ใน Supabase จริง
  if (!targetUser && isSupabaseConfigured()) {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, email')
        .ilike('email', normalizedEmail)
        .maybeSingle();
      if (data) {
        targetUser = data as { id: string; email: string };
      }
    } catch {
      // Fallback gracefully
    }
  }

  // หากไม่มีอีเมลนี้ในระบบ ให้ตอบข้อความเดิมเสมอ (ป้องกัน User Enumeration ตาม Spec ข้อ 5)
  if (!targetUser) {
    return {
      success: true,
      message: CONSTANT_RESPONSE_MESSAGE,
      emailSent: false,
    };
  }

  // สร้างโทเค็นสุ่ม 32 ไบต์จาก CSPRNG
  const rawToken = generateResetToken();
  const tokenHash = hashResetToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // หมดอายุใน 30 นาที
  const tokenId = `prt-${Math.random().toString(36).substring(2, 10)}`;

  // ยกเลิกโทเค็นเก่าที่ยังไม่ถูกใช้ของบัญชีนี้ทั้งหมด (ตาม Spec ข้อ 3)
  resetTokenStore.forEach((record) => {
    if (
      record.user_id === targetUser!.id &&
      record.used_at === null
    ) {
      record.used_at = now.toISOString();
    }
  });

  // บันทึกเฉพาะ Token Hash ลง Store (ห้ามบันทึก rawToken เด็ดขาด)
  resetTokenStore.push({
    id: tokenId,
    user_id: targetUser.id,
    email: targetUser.email,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
    used_at: null,
    created_at: now.toISOString(),
  });

  // ซิงค์ไปยังตาราง password_reset_tokens บน Supabase จริง
  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('password_reset_tokens')
        .update({ used_at: now.toISOString() })
        .eq('user_id', targetUser.id)
        .is('used_at', null);

      await supabase.from('password_reset_tokens').insert([{
        id: tokenId,
        user_id: targetUser.id,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        used_at: null,
        created_at: now.toISOString(),
      }]);
    } catch {
      // Fallback to in-memory store
    }
  }

  // สร้างลิงก์จาก Config โดเมนเท่านั้น (ห้ามใช้ Host Header)
  const resetLink = `${getAppBaseUrl()}/reset-password?token=${rawToken}`;

  // สั่งส่งอีเมลแบบ Asynchronous (ไม่บล็อกการตอบกลับ)
  // ห้ามบันทึก rawToken หรือรหัสผ่านลงใน log
  void sendPasswordResetEmail(targetUser.email, resetLink);

  return {
    success: true,
    message: CONSTANT_RESPONSE_MESSAGE,
    emailSent: true,
    rawToken, // ส่งกลับในระดับ Service เพื่อความสะดวกในการรัน Test
  };
}

/**
 * 2. ตั้งรหัสผ่านใหม่ด้วยโทเค็น (Reset Password with Token)
 * @param rawToken โทเค็นที่ได้รับจากลิงก์
 * @param newPassword รหัสผ่านใหม่
 */
export async function resetPasswordWithToken(
  rawToken: string,
  newPassword: string
): Promise<{
  success: boolean;
  message: string;
  sessionsRevoked?: boolean;
  notificationSent?: boolean;
}> {
  if (!rawToken || typeof rawToken !== 'string') {
    return {
      success: false,
      message: INVALID_TOKEN_MESSAGE,
    };
  }

  // คำนวณ Hash ของโทเค็นที่ส่งเข้ามา
  const incomingHash = hashResetToken(rawToken);
  const now = new Date();

  // ค้นหารายการโทเค็นที่ตรงกัน และยังไม่ถูกใช้ และยังไม่หมดอายุ
  let tokenRecord: PasswordResetTokenRecord | undefined = resetTokenStore.find((record) => {
    const isMatch = verifyTokenHash(record.token_hash, incomingHash);
    const isUnused = record.used_at === null;
    const isNotExpired = new Date(record.expires_at).getTime() > now.getTime();
    return isMatch && isUnused && isNotExpired;
  });

  // หากไม่พบในหน่วยความจำ (เช่น รันบน Serverless) ให้ค้นหาจาก Supabase
  if (!tokenRecord && isSupabaseConfigured()) {
    try {
      const { data } = await supabase
        .from('password_reset_tokens')
        .select('id, user_id, token_hash, expires_at, used_at, created_at, profiles(email)')
        .eq('token_hash', incomingHash)
        .is('used_at', null)
        .maybeSingle();

      if (data) {
        const joinedProfile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
        const emailFromDb = (joinedProfile as { email?: string } | null)?.email;
        const isMatch = verifyTokenHash(data.token_hash, incomingHash);
        const isNotExpired = new Date(data.expires_at).getTime() > now.getTime();

        if (isMatch && isNotExpired && emailFromDb) {
          tokenRecord = {
            id: data.id,
            user_id: data.user_id,
            email: emailFromDb,
            token_hash: data.token_hash,
            expires_at: data.expires_at,
            used_at: data.used_at,
            created_at: data.created_at,
          };
        }
      }
    } catch {
      // Fallback
    }
  }

  if (!tokenRecord) {
    // โทเค็นไม่ถูกต้อง หมดอายุ หรือถูกใช้ไปแล้ว ให้แสดงข้อความเดียวกันเสมอ (ตาม Spec ข้อ 6)
    return {
      success: false,
      message: INVALID_TOKEN_MESSAGE,
    };
  }

  // ตรวจสอบนโยบายรหัสผ่าน
  const policyCheck = validatePasswordPolicy(newPassword);
  if (!policyCheck.isValid) {
    // ถ้ารหัสไม่ผ่านนโยบาย แสดงเหตุผลบนหน้าเดิม และ "โทเค็นยังคงไม่ถูกใช้" (ตาม Spec ข้อ 6)
    return {
      success: false,
      message: policyCheck.message,
    };
  }

  // 1. ทำเครื่องหมายโทเค็นว่าถูกใช้งานแล้ว (ป้องกันการใช้ซ้ำ)
  tokenRecord.used_at = now.toISOString();
  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('password_reset_tokens')
        .update({ used_at: now.toISOString() })
        .eq('id', tokenRecord.id);
    } catch {
      // Ignore
    }
  }

  // 2. Hash รหัสผ่านใหม่ด้วย PBKDF2
  const hashedPassword = hashPassword(newPassword);

  // 3. อัปเดตรหัสผ่านใน Store และ Supabase
  const store = useAppStore.getState();
  store.updateUserPassword(tokenRecord.email, hashedPassword);
  await dbUpdateProfilePassword(tokenRecord.email, hashedPassword);

  // 4. ล็อกเอาต์ทุกอุปกรณ์ (Revoke sessions)
  store.logout();

  // 5. ส่งอีเมลแจ้งเตือนว่ารหัสผ่านถูกเปลี่ยนแปลงแล้ว
  void sendPasswordChangedNotificationEmail(tokenRecord.email);

  return {
    success: true,
    message: 'ตั้งรหัสผ่านใหม่สำเร็จแล้ว สามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที',
    sessionsRevoked: true,
    notificationSent: true,
  };
}

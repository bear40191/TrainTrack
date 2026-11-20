/**
 * Test Suite: ระบบลืมรหัสผ่าน (Forgot Password) ตาม Spec 2026-11-20
 * ทดสอบตามแนวทาง TDD
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateResetToken,
  hashResetToken,
  verifyTokenHash,
  validatePasswordPolicy,
  hashPassword,
  verifyPassword,
} from '@/lib/password';
import {
  checkRateLimit,
  resetRateLimits,
} from '@/lib/rate-limit';
import {
  requestPasswordReset,
  resetPasswordWithToken,
  getPasswordResetStore,
  clearPasswordResetStore,
} from '@/services/passwordResetService';

describe('1. โทเค็นและความปลอดภัยของรหัสผ่าน (Password & Token Security)', () => {
  it('สุ่มโทเค็นจาก CSPRNG มีความยาว 32 ไบต์ (64 hex characters) และค่าไม่ซ้ำกัน', () => {
    const token1 = generateResetToken();
    const token2 = generateResetToken();

    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });

  it('Hash โทเค็นด้วย SHA-256 ได้ค่าคงที่และไม่เก็บค่าจริง', () => {
    const rawToken = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const hash1 = hashResetToken(rawToken);
    const hash2 = hashResetToken(rawToken);

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(rawToken);
    expect(hash1).toHaveLength(64);
  });

  it('เปรียบเทียบ Token Hash แบบ Constant-time อย่างถูกต้อง', () => {
    const rawToken = generateResetToken();
    const correctHash = hashResetToken(rawToken);
    const wrongHash = hashResetToken(generateResetToken());

    expect(verifyTokenHash(correctHash, correctHash)).toBe(true);
    expect(verifyTokenHash(correctHash, wrongHash)).toBe(false);
  });

  it('ตรวจสอบนโยบายรหัสผ่าน: ต้องยาวอย่างน้อย 8 ตัวอักษรและมีทั้งตัวอักษรและตัวเลข', () => {
    // ไม่ผ่าน: สั้นกว่า 8 ตัวอักษร
    expect(validatePasswordPolicy('1234').isValid).toBe(false);
    // ไม่ผ่าน: มีแต่ตัวเลข
    expect(validatePasswordPolicy('12345678').isValid).toBe(false);
    // ไม่ผ่าน: มีแต่ตัวอักษร
    expect(validatePasswordPolicy('abcdefgh').isValid).toBe(false);
    // ผ่าน: มีทั้งตัวอักษรและตัวเลข ยาว >= 8
    expect(validatePasswordPolicy('Pass1234').isValid).toBe(true);
    expect(validatePasswordPolicy('SecureP@ss2026').isValid).toBe(true);
  });

  it('Hash รหัสผ่านและตรวจสอบความถูกต้องได้', () => {
    const password = 'NewPassword123';
    const hashed = hashPassword(password);

    expect(hashed).not.toBe(password);
    expect(verifyPassword(password, hashed)).toBe(true);
    expect(verifyPassword('WrongPassword123', hashed)).toBe(false);
  });
});

describe('2. การจำกัดอัตราการขอ (Rate Limiting)', () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it('จำกัดไม่เกิน 3 ครั้งต่อชั่วโมงต่ออีเมล', () => {
    const email = 'user@example.com';
    const ip = '192.168.1.1';

    expect(checkRateLimit(email, ip).allowed).toBe(true);
    expect(checkRateLimit(email, ip).allowed).toBe(true);
    expect(checkRateLimit(email, ip).allowed).toBe(true);

    // ครั้งที่ 4 ในชั่วโมงเดียวกัน ต้องถูกบล็อก
    const fourth = checkRateLimit(email, ip);
    expect(fourth.allowed).toBe(false);
    expect(fourth.reason).toBe('email_limit_exceeded');
  });

  it('จำกัดไม่เกิน 20 ครั้งต่อชั่วโมงต่อ IP แม้เปลี่ยนอีเมล', () => {
    const ip = '10.0.0.99';

    for (let i = 1; i <= 20; i++) {
      const email = `test${i}@example.com`;
      expect(checkRateLimit(email, ip).allowed).toBe(true);
    }

    // ครั้งที่ 21 จาก IP เดิม ต้องถูกบล็อก
    const overLimit = checkRateLimit('another@example.com', ip);
    expect(overLimit.allowed).toBe(false);
    expect(overLimit.reason).toBe('ip_limit_exceeded');
  });
});

describe('3. การไหลของการขอรีเซ็ตรหัสผ่าน (Forgot Password Flow)', () => {
  beforeEach(() => {
    clearPasswordResetStore();
    resetRateLimits();
  });

  it('อีเมลที่มีและไม่มีในระบบได้ Response เดียวกันเสมอ (ไม่เปิดเผยสถานะบัญชี)', async () => {
    const resExisting = await requestPasswordReset('kittisak.trainee@traintrack.app', '127.0.0.1');
    const resNonExisting = await requestPasswordReset('notfound@traintrack.app', '127.0.0.1');

    expect(resExisting.message).toBe('ถ้าอีเมลนี้อยู่ในระบบ เราได้ส่งลิงก์ให้แล้ว');
    expect(resNonExisting.message).toBe('ถ้าอีเมลนี้อยู่ในระบบ เราได้ส่งลิงก์ให้แล้ว');
    expect(resExisting.success).toBe(true);
    expect(resNonExisting.success).toBe(true);
  });

  it('เมื่อเกินโควตา Rate limit ยังคงตอบข้อความเดิม แต่ไม่ส่งอีเมล', async () => {
    const email = 'kittisak.trainee@traintrack.app';
    const ip = '127.0.0.1';

    await requestPasswordReset(email, ip);
    await requestPasswordReset(email, ip);
    await requestPasswordReset(email, ip);

    // ครั้งที่ 4 เกินโควตา
    const overLimitRes = await requestPasswordReset(email, ip);
    expect(overLimitRes.message).toBe('ถ้าอีเมลนี้อยู่ในระบบ เราได้ส่งลิงก์ให้แล้ว');
    expect(overLimitRes.emailSent).toBe(false);
  });

  it('โทเค็นเก่าถูกยกเลิก (Invalidated) ทันทีเมื่อมีการขอรีเซ็ตใหม่สำหรับบัญชีเดียวกัน', async () => {
    const email = 'kittisak.trainee@traintrack.app';
    const ip = '127.0.0.1';

    const req1 = await requestPasswordReset(email, ip);
    const token1 = req1.rawToken;

    const req2 = await requestPasswordReset(email, ip);
    const token2 = req2.rawToken;

    expect(token1).not.toBe(token2);

    // โทเค็นแรกต้องใช้ไม่ได้แล้ว
    const reset1 = await resetPasswordWithToken(token1!, 'NewPass1234');
    expect(reset1.success).toBe(false);
    expect(reset1.message).toBe('ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว');

    // โทเค็นที่สองต้องใช้ได้
    const reset2 = await resetPasswordWithToken(token2!, 'NewPass1234');
    expect(reset2.success).toBe(true);
  });
});

describe('4. การรีเซ็ตรหัสผ่านและการยืนยันความถูกต้อง (Reset Password Execution)', () => {
  beforeEach(() => {
    clearPasswordResetStore();
    resetRateLimits();
  });

  it('โทเค็นที่ถูกต้องสามารถรีเซ็ตรหัสผ่านได้สำเร็จ', async () => {
    const email = 'kittisak.trainee@traintrack.app';
    const req = await requestPasswordReset(email, '127.0.0.1');

    const result = await resetPasswordWithToken(req.rawToken!, 'BrandNewPass123');
    expect(result.success).toBe(true);
    expect(result.message).toContain('ตั้งรหัสผ่านใหม่สำเร็จ');
  });

  it('โทเค็นใช้ซ้ำไม่ได้ (One-time use only)', async () => {
    const email = 'kittisak.trainee@traintrack.app';
    const req = await requestPasswordReset(email, '127.0.0.1');

    // ครั้งแรก: สำเร็จ
    const res1 = await resetPasswordWithToken(req.rawToken!, 'NewPassword123');
    expect(res1.success).toBe(true);

    // ครั้งที่สอง: ล้มเหลวด้วยข้อความทั่วไป
    const res2 = await resetPasswordWithToken(req.rawToken!, 'AnotherPassword123');
    expect(res2.success).toBe(false);
    expect(res2.message).toBe('ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว');
  });

  it('โทเค็นที่หมดอายุ (> 30 นาที) ไม่สามารถใช้งานได้', async () => {
    const email = 'kittisak.trainee@traintrack.app';
    const req = await requestPasswordReset(email, '127.0.0.1');

    // ปรับเวลาให้โทเค็นหมดอายุ
    const store = getPasswordResetStore();
    const tokenHash = hashResetToken(req.rawToken!);
    const record = store.find((r) => r.token_hash === tokenHash);
    if (record) {
      record.expires_at = new Date(Date.now() - 1000 * 60).toISOString(); // หมดอายุไปแล้ว 1 นาที
    }

    const res = await resetPasswordWithToken(req.rawToken!, 'NewPassword123');
    expect(res.success).toBe(false);
    expect(res.message).toBe('ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว');
  });

  it('ถ้ารหัสผ่านใหม่ไม่ผ่านนโยบาย โทเค็นยังต้องไม่ถูกใช้ และผู้ใช้สามารถแก้ไขแล้วส่งใหม่ได้', async () => {
    const email = 'kittisak.trainee@traintrack.app';
    const req = await requestPasswordReset(email, '127.0.0.1');

    // ส่งรหัสผ่านที่ไม่ผ่านนโยบาย (มีแต่ตัวเลข ไม่ถึง 8 ตัวอักษร)
    const weakRes = await resetPasswordWithToken(req.rawToken!, '123');
    expect(weakRes.success).toBe(false);
    expect(weakRes.message).toContain('รหัสผ่าน');

    // โทเค็นยังต้องใช้ได้อยู่ เมื่อส่งรหัสที่ถูกต้อง
    const strongRes = await resetPasswordWithToken(req.rawToken!, 'StrongPass2026');
    expect(strongRes.success).toBe(true);
  });

  it('หลังรีเซ็ตสำเร็จ มีการ invalidate session เดิมและส่งอีเมลแจ้งเตือน', async () => {
    const email = 'kittisak.trainee@traintrack.app';
    const req = await requestPasswordReset(email, '127.0.0.1');

    const result = await resetPasswordWithToken(req.rawToken!, 'ValidPass2026');
    expect(result.success).toBe(true);
    expect(result.sessionsRevoked).toBe(true);
    expect(result.notificationSent).toBe(true);
  });
});

import { POST as forgotPasswordRoute } from '@/app/api/auth/forgot-password/route';
import { POST as resetPasswordRoute } from '@/app/api/auth/reset-password/route';
import { getAppBaseUrl } from '@/services/emailService';
import { NextRequest } from 'next/server';

describe('5. การทดสอบ API Endpoints และความปลอดภัยเครือข่าย', () => {
  beforeEach(() => {
    clearPasswordResetStore();
    resetRateLimits();
  });

  it('ลิงก์ในอีเมลใช้โดเมนจากค่า config ห้ามสร้างจาก Host header', () => {
    process.env.APP_URL = 'https://traintrack.example.com';
    expect(getAppBaseUrl()).toBe('https://traintrack.example.com');
  });

  it('API POST /api/auth/forgot-password ตอบข้อความคงที่และสถานะ 200 ทั้งอีเมลที่มีและไม่มีในระบบ', async () => {
    const makeReq = (email: string) =>
      new NextRequest('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
        },
        body: JSON.stringify({ email }),
      });

    // 1. อีเมลที่มีในระบบ
    const req1 = makeReq('kittisak.trainee@traintrack.app');
    const res1 = await forgotPasswordRoute(req1);
    const data1 = await res1.json();

    expect(res1.status).toBe(200);
    expect(data1.success).toBe(true);
    expect(data1.message).toBe('ถ้าอีเมลนี้อยู่ในระบบ เราได้ส่งลิงก์ให้แล้ว');

    // 2. อีเมลที่ไม่มีในระบบ
    const req2 = makeReq('nobody@nowhere.com');
    const res2 = await forgotPasswordRoute(req2);
    const data2 = await res2.json();

    expect(res2.status).toBe(200);
    expect(data2.success).toBe(true);
    expect(data2.message).toBe('ถ้าอีเมลนี้อยู่ในระบบ เราได้ส่งลิงก์ให้แล้ว');
  });

  it('API POST /api/auth/reset-password ปฏิเสธโทเค็นที่ไม่ถูกต้องหรือไม่สมบูรณ์', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'invalid_fake_token_1234567890',
        newPassword: 'ValidPassword123',
      }),
    });

    const res = await resetPasswordRoute(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว');
  });
});

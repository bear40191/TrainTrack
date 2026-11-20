/**
 * API Route: POST /api/auth/forgot-password
 * รับคำขอรีเซ็ตรหัสผ่านและส่งลิงก์ทางอีเมลตาม Spec 2026-11-20
 * - ตอบข้อความเดียวกันเสมอ ไม่ว่าอีเมลจะมีอยู่ในระบบหรือไม่
 * - ตรวจสอบ Rate limit (ไม่เกิน 3 ครั้ง/ชม./อีเมล, ไม่เกิน 20 ครั้ง/ชม./IP)
 * - ส่งอีเมลแบบ Asynchronous ไม่เปิดเผยข้อมูลบัญชี
 */
import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordReset } from '@/services/passwordResetService';
import { isValidEmail } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !body.email || typeof body.email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกอีเมล' },
        { status: 400 }
      );
    }

    const email = body.email.trim();
    if (!isValidEmail(email)) {
      // แม้ format ผิด ก็ยังตอบกลับแบบปลอดภัย หรือแจ้งเตือนรูปแบบอีเมล
      return NextResponse.json(
        { success: false, message: 'รูปแบบอีเมลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // ดึง IP ของ Client จาก Header (รองรับ Reverse Proxy / Cloudflare / Vercel)
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = (forwarded ? forwarded.split(',')[0] : realIp) || '127.0.0.1';

    // เรียกใช้ Service เพื่อจัดการ Rate limit, สร้าง Token hash และส่งอีเมลแบบ Asynchronous
    const result = await requestPasswordReset(email, clientIp.trim());

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    // ห้าม leak stack trace หรือข้อมูลลับใน log
    console.error('[TrainTrack Auth] Forgot password error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}

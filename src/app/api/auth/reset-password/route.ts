/**
 * API Route: POST /api/auth/reset-password
 * ตั้งรหัสผ่านใหม่ด้วย Token ตาม Spec 2026-11-20
 * - ตรวจสอบความถูกต้องของโทเค็น (ไม่หมดอายุ, ยังไม่ถูกใช้)
 * - ตรวจสอบนโยบายรหัสผ่าน
 * - อัปเดตรหัสผ่านใหม่แบบ Hashed
 * - มาร์กโทเค็นว่าถูกใช้งานแล้ว
 * - ล็อกเอาต์ทุกอุปกรณ์และส่งอีเมลแจ้งเตือน
 */
import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordWithToken } from '@/services/passwordResetService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || !body.token || !body.newPassword) {
      return NextResponse.json(
        { success: false, message: 'ข้อมูลไม่ครบถ้วน กรุณากรอกโทเค็นและรหัสผ่านใหม่' },
        { status: 400 }
      );
    }

    const { token, newPassword } = body;

    const result = await resetPasswordWithToken(token, newPassword);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('[TrainTrack Auth] Reset password error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}

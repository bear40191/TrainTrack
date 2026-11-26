/**
 * API Route: POST /api/auth/login
 * ตรวจสอบการเข้าสู่ระบบฝั่ง Server เพื่อให้:
 * 1. Query เฉพาะ profile ของอีเมลที่ล็อกอิน (ไม่ต้องโหลดทุกตารางก่อนเข้าแอป)
 * 2. รัน PBKDF2 ผ่าน Node.js native C++ (เร็วกว่า JS polyfill บน browser หลายสิบเท่า)
 * 3. ไม่ส่ง password_hash กลับไปยัง browser
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/services/supabase';
import { isSupabaseConfigured } from '@/services/db';
import { verifyPassword } from '@/lib/password';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกอีเมล' },
        { status: 400 }
      );
    }

    // โหมด Dev/Offline ที่ยังไม่ได้ตั้งค่า Supabase: ให้ client fallback ไปใช้ local mock state
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: false, fallbackLocal: true });
    }

    // Query เฉพาะแถวที่ตรงกับอีเมล (เร็วกว่าการดึงทั้งตารางและไม่ต้องรอ work_logs)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', email)
      .maybeSingle();

    if (error) {
      console.warn('[TrainTrack Auth] Supabase login query error:', error.message);
      return NextResponse.json({ success: false, fallbackLocal: true });
    }

    if (!profile) {
      return NextResponse.json(
        { success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    const expectedPassword = profile.password_hash || '123456';
    if (!password || !verifyPassword(password, expectedPassword)) {
      return NextResponse.json(
        { success: false, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // ตัด password_hash ออกก่อนส่งกลับ client เพื่อความปลอดภัย
    const safeProfile = { ...profile };
    delete (safeProfile as Record<string, unknown>).password_hash;

    return NextResponse.json({
      success: true,
      profile: safeProfile,
    });
  } catch (error) {
    console.error('[TrainTrack Auth] Login error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง' },
      { status: 500 }
    );
  }
}

/**
 * API Route: POST /api/auth/logout
 * ล้าง HttpOnly Session Cookie ออกจากเบราว์เซอร์เมื่อผู้ใช้ออกจากระบบ
 */
import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/session';

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response);
  return response;
}

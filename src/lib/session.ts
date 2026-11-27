/**
 * TrainTrack Signed Session Cookie Helper
 * สร้างและตรวจสอบ HttpOnly Session Cookie ด้วย HMAC-SHA256 และ Constant-time comparison
 */
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Role } from '@/lib/types';

export const SESSION_COOKIE_NAME = 'traintrack_session';
const SESSION_TTL_SECONDS = 72 * 60 * 60; // 72 ชั่วโมง

export interface SessionPayload {
  id: string;
  email: string;
  role: Role;
  exp: number;
}

function getSessionSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'traintrack-dev-session-secret-change-in-prod'
  );
}

/**
 * สร้าง Token ที่เซ็นด้วย HMAC-SHA256 (รูปแบบ base64urlPayload.hexSignature)
 */
export function signSessionToken(payload: Omit<SessionPayload, 'exp'>): string {
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getSessionSecret()).update(encoded).digest('hex');
  return `${encoded}.${sig}`;
}

/**
 * ตรวจสอบลายเซ็นและวันหมดอายุของ Session Token
 */
export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;

  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;

  const expectedSig = crypto.createHmac('sha256', getSessionSecret()).update(encoded).digest('hex');
  const bufA = Buffer.from(sig, 'utf8');
  const bufB = Buffer.from(expectedSig, 'utf8');
  if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed?.id || !parsed?.email || !parsed?.role || !parsed?.exp) return null;
    if (parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * ดึง Session จาก HttpOnly Cookie ใน NextRequest
 */
export function getSessionFromRequest(request: NextRequest): SessionPayload | null {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(cookie);
}

/**
 * แนบ Session Cookie ลงใน NextResponse
 */
export function attachSessionCookie(response: NextResponse, payload: Omit<SessionPayload, 'exp'>): void {
  const token = signSessionToken(payload);
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

/**
 * ลบ Session Cookie ออกจาก NextResponse
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * ดึง Client IP Address จาก Header อย่างปลอดภัย
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return ((forwarded ? forwarded.split(',')[0] : realIp) || '127.0.0.1').trim();
}

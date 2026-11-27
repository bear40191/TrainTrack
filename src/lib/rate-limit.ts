/**
 * TrainTrack In-Memory Rate Limiter
 * จำกัดการขอรีเซ็ตรหัสผ่านตาม Spec 2026-11-20:
 * - ไม่เกิน 3 ครั้งต่อชั่วโมงต่ออีเมล
 * - ไม่เกิน 20 ครั้งต่อชั่วโมงต่อ IP
 */

interface RateLimitRecord {
  timestamps: number[];
}

const EMAIL_LIMIT = 3;
const IP_LIMIT = 20;
const WINDOW_MS = 60 * 60 * 1000; // 1 ชั่วโมง

const emailStore = new Map<string, RateLimitRecord>();
const ipStore = new Map<string, RateLimitRecord>();
const loginEmailStore = new Map<string, RateLimitRecord>();
const loginIpStore = new Map<string, RateLimitRecord>();
const notifUserStore = new Map<string, RateLimitRecord>();
const notifIpStore = new Map<string, RateLimitRecord>();

/**
 * ล้างข้อมูลประวัติที่เก่ากว่าหน้าต่างเวลาที่กำหนด
 */
function cleanExpiredTimestamps(record: RateLimitRecord, now: number, windowMs: number): void {
  const cutoff = now - windowMs;
  record.timestamps = record.timestamps.filter((ts) => ts > cutoff);
}

/**
 * ตรวจสอบ Sliding Window Rate Limit แบบใช้ซ้ำได้
 */
function checkStoreLimit(
  store: Map<string, RateLimitRecord>,
  key: string,
  limit: number,
  windowMs: number,
  now: number
): { allowed: boolean; retryAfterSeconds?: number } {
  if (!key) return { allowed: true };
  let record = store.get(key);
  if (!record) {
    record = { timestamps: [] };
    store.set(key, record);
  }
  cleanExpiredTimestamps(record, now, windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(0, retryAfter) };
  }
  return { allowed: true };
}

function recordHit(store: Map<string, RateLimitRecord>, key: string, now: number): void {
  if (!key) return;
  const record = store.get(key);
  if (record) record.timestamps.push(now);
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: 'email_limit_exceeded' | 'ip_limit_exceeded';
  retryAfterSeconds?: number;
}

/**
 * ตรวจสอบโควตาการขอรีเซ็ตรหัสผ่าน
 * @param email อีเมลที่ต้องการรีเซ็ต
 * @param ip IP Address ของผู้ขอ
 */
export function checkRateLimit(email: string, ip: string): RateLimitResult {
  const now = Date.now();
  const normalizedEmail = (email || '').trim().toLowerCase();
  const normalizedIp = (ip || '').trim();

  const emailCheck = checkStoreLimit(emailStore, normalizedEmail, EMAIL_LIMIT, WINDOW_MS, now);
  if (!emailCheck.allowed) {
    return { allowed: false, reason: 'email_limit_exceeded', retryAfterSeconds: emailCheck.retryAfterSeconds };
  }

  const ipCheck = checkStoreLimit(ipStore, normalizedIp, IP_LIMIT, WINDOW_MS, now);
  if (!ipCheck.allowed) {
    return { allowed: false, reason: 'ip_limit_exceeded', retryAfterSeconds: ipCheck.retryAfterSeconds };
  }

  recordHit(emailStore, normalizedEmail, now);
  recordHit(ipStore, normalizedIp, now);
  return { allowed: true };
}

/**
 * ตรวจสอบโควตาการเข้าสู่ระบบ (ป้องกัน Brute-force: 10 ครั้ง/15 นาที ต่ออีเมล, 30 ครั้ง/15 นาที ต่อ IP)
 */
export function checkLoginRateLimit(email: string, ip: string): RateLimitResult {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const normalizedEmail = (email || '').trim().toLowerCase();
  const normalizedIp = (ip || '').trim();

  const emailCheck = checkStoreLimit(loginEmailStore, normalizedEmail, 10, windowMs, now);
  if (!emailCheck.allowed) {
    return { allowed: false, reason: 'email_limit_exceeded', retryAfterSeconds: emailCheck.retryAfterSeconds };
  }

  const ipCheck = checkStoreLimit(loginIpStore, normalizedIp, 30, windowMs, now);
  if (!ipCheck.allowed) {
    return { allowed: false, reason: 'ip_limit_exceeded', retryAfterSeconds: ipCheck.retryAfterSeconds };
  }

  recordHit(loginEmailStore, normalizedEmail, now);
  recordHit(loginIpStore, normalizedIp, now);
  return { allowed: true };
}

/**
 * ตรวจสอบโควตาการส่งอีเมลแจ้งเตือน (30 ครั้ง/ชม.)
 */
export function checkNotificationRateLimit(userKey: string, ip: string): RateLimitResult {
  const now = Date.now();
  const normalizedUser = (userKey || '').trim().toLowerCase();
  const normalizedIp = (ip || '').trim();

  const userCheck = checkStoreLimit(notifUserStore, normalizedUser, 30, WINDOW_MS, now);
  if (!userCheck.allowed) {
    return { allowed: false, reason: 'email_limit_exceeded', retryAfterSeconds: userCheck.retryAfterSeconds };
  }

  const ipCheck = checkStoreLimit(notifIpStore, normalizedIp, 60, WINDOW_MS, now);
  if (!ipCheck.allowed) {
    return { allowed: false, reason: 'ip_limit_exceeded', retryAfterSeconds: ipCheck.retryAfterSeconds };
  }

  recordHit(notifUserStore, normalizedUser, now);
  recordHit(notifIpStore, normalizedIp, now);
  return { allowed: true };
}

/**
 * ล้างข้อมูล Rate limit ทั้งหมด (สำหรับ Unit Test)
 */
export function resetRateLimits(): void {
  emailStore.clear();
  ipStore.clear();
  loginEmailStore.clear();
  loginIpStore.clear();
  notifUserStore.clear();
  notifIpStore.clear();
}

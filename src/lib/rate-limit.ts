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

/**
 * ล้างข้อมูลประวัติที่เก่ากว่าหน้าต่างเวลา 1 ชั่วโมง
 */
function cleanExpiredTimestamps(record: RateLimitRecord, now: number): void {
  const cutoff = now - WINDOW_MS;
  record.timestamps = record.timestamps.filter((ts) => ts > cutoff);
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

  // 1. ตรวจสอบ Rate limit ของอีเมล
  if (normalizedEmail) {
    let emailRecord = emailStore.get(normalizedEmail);
    if (!emailRecord) {
      emailRecord = { timestamps: [] };
      emailStore.set(normalizedEmail, emailRecord);
    }
    cleanExpiredTimestamps(emailRecord, now);

    if (emailRecord.timestamps.length >= EMAIL_LIMIT) {
      const oldest = emailRecord.timestamps[0];
      const retryAfter = Math.ceil((oldest + WINDOW_MS - now) / 1000);
      return {
        allowed: false,
        reason: 'email_limit_exceeded',
        retryAfterSeconds: Math.max(0, retryAfter),
      };
    }
  }

  // 2. ตรวจสอบ Rate limit ของ IP Address
  if (normalizedIp) {
    let ipRecord = ipStore.get(normalizedIp);
    if (!ipRecord) {
      ipRecord = { timestamps: [] };
      ipStore.set(normalizedIp, ipRecord);
    }
    cleanExpiredTimestamps(ipRecord, now);

    if (ipRecord.timestamps.length >= IP_LIMIT) {
      const oldest = ipRecord.timestamps[0];
      const retryAfter = Math.ceil((oldest + WINDOW_MS - now) / 1000);
      return {
        allowed: false,
        reason: 'ip_limit_exceeded',
        retryAfterSeconds: Math.max(0, retryAfter),
      };
    }
  }

  // 3. บันทึก timestamp การใช้งานรอบปัจจุบัน
  if (normalizedEmail) {
    emailStore.get(normalizedEmail)!.timestamps.push(now);
  }
  if (normalizedIp) {
    ipStore.get(normalizedIp)!.timestamps.push(now);
  }

  return { allowed: true };
}

/**
 * ล้างข้อมูล Rate limit ทั้งหมด (สำหรับ Unit Test)
 */
export function resetRateLimits(): void {
  emailStore.clear();
  ipStore.clear();
}

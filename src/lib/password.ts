/**
 * TrainTrack Password & Token Security Utilities
 * จัดการเรื่องความปลอดภัยของรหัสผ่านและโทเค็นตามมาตรฐาน OWASP และ Spec 2026-11-20
 * คอมเมนต์เป็นภาษาไทย / ชื่อตัวแปรและฟังก์ชันเป็นภาษาอังกฤษ
 */
import crypto from 'crypto';

/**
 * 1. สุ่มโทเค็นจาก CSPRNG ขนาด 32 ไบต์ (64 hex characters)
 * ห้ามใช้ Math.random เด็ดขาด
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 2. Hash โทเค็นด้วย SHA-256 เพื่อเก็บลงฐานข้อมูล (ห้ามเก็บ raw token)
 */
export function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * 3. เปรียบเทียบ Token Hash แบบ Constant-time ป้องกัน Timing Attacks
 */
export function verifyTokenHash(hashA: string, hashB: string): boolean {
  if (!hashA || !hashB) return false;
  const bufA = Buffer.from(hashA, 'utf8');
  const bufB = Buffer.from(hashB, 'utf8');

  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * 4. ตรวจสอบนโยบายรหัสผ่าน (Password Policy)
 * - ความยาวอย่างน้อย 8 ตัวอักษร
 * - ต้องมีทั้งตัวอักษรภาษาอังกฤษ (a-z หรือ A-Z) และตัวเลข (0-9)
 */
export function validatePasswordPolicy(password: string): { isValid: boolean; message: string } {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'กรุณากรอกรหัสผ่าน' };
  }

  if (password.length < 8) {
    return { isValid: false, message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร' };
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);

  if (!hasLetter || !hasDigit) {
    return { isValid: false, message: 'รหัสผ่านต้องประกอบด้วยตัวอักษรและตัวเลขอย่างน้อยอย่างละ 1 ตัว' };
  }

  return { isValid: true, message: 'รหัสผ่านถูกต้องตามนโยบายความปลอดภัย' };
}

/**
 * 5. Hash รหัสผ่านด้วย PBKDF2 (100,000 rounds, SHA-256) พร้อม Salt 16 ไบต์
 * รูปแบบผลลัพธ์: salt:hash
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
  return `${salt}:${derivedKey}`;
}

/**
 * 6. ตรวจสอบรหัสผ่านกับค่าที่บันทึกไว้
 * รองรับทั้ง hashed password (salt:hash) และ legacy plain text เดิมในระบบ
 */
export function verifyPassword(password: string, storedHashOrPlain: string): boolean {
  if (!password || !storedHashOrPlain) return false;

  // ตรวจสอบว่าเป็นรูปแบบ salt:hash หรือไม่
  if (storedHashOrPlain.includes(':')) {
    const [salt, key] = storedHashOrPlain.split(':');
    if (!salt || !key) return false;

    const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
    const bufA = Buffer.from(derivedKey, 'utf8');
    const bufB = Buffer.from(key, 'utf8');

    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  // Fallback สำหรับ legacy plain text (เช่น '123456' ของบัญชี mock เดิม)
  return password === storedHashOrPlain;
}

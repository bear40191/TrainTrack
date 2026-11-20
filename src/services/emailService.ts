/**
 * TrainTrack Email Service
 * โมดูลส่งอีเมลระบบลืมรหัสผ่านและการแจ้งเตือน (Adapter Pattern)
 * ทำงานแบบ Asynchronous และอ่านโดเมนจากค่า Config เท่านั้น (ห้ามอ่านจาก Host header)
 */
import { Resend } from 'resend';
import { sanitizeHtml, sanitizeText, isValidEmail } from '@/lib/security';

const resendApiKey = process.env.RESEND_API_KEY;
const isResendConfigured = Boolean(
  resendApiKey && resendApiKey !== 're_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
);
const resend = isResendConfigured ? new Resend(resendApiKey) : null;
const FROM_EMAIL = process.env.EMAIL_FROM || 'TrainTrack <onboarding@resend.dev>';

/**
 * ดึง App URL จากค่า Config/Environment เท่านั้น (ป้องกัน Host Header Injection ตาม Spec ข้อ 5)
 */
export function getAppBaseUrl(): string {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

export interface EmailSenderResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * 1. ส่งอีเมลลิงก์รีเซ็ตรหัสผ่าน
 * @param toEmail อีเมลผู้รับ
 * @param resetLink ลิงก์สำหรับตั้งรหัสผ่านใหม่
 */
export async function sendPasswordResetEmail(
  toEmail: string,
  resetLink: string
): Promise<EmailSenderResult> {
  if (!isValidEmail(toEmail)) {
    return { success: false, error: 'Invalid email address' };
  }

  const safeEmail = sanitizeHtml(sanitizeText(toEmail, 100));

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>รีเซ็ตรหัสผ่าน TrainTrack</title>
      <meta name="referrer" content="no-referrer">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="background: #19705F; padding: 28px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">TrainTrack</h1>
          <p style="color: #6FD098; margin: 6px 0 0; font-size: 14px;">ระบบติดตามและประเมินผลการฝึกงาน</p>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">คำขอรีเซ็ตรหัสผ่าน</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.6;">
            สวัสดีครับ เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชี <strong>${safeEmail}</strong>
          </p>
          <p style="color: #475569; font-size: 15px; line-height: 1.6;">
            คุณสามารถคลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่ได้ทันที (ลิงก์นี้มีอายุ 30 นาที และใช้ได้เพียงครั้งเดียว):
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetLink}" rel="noreferrer" style="display: inline-block; background: #19705F; color: #ffffff; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; box-shadow: 0 2px 4px rgba(25, 112, 95, 0.2);">
              ตั้งรหัสผ่านใหม่
            </a>
          </div>
          <p style="color: #64748b; font-size: 13px; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 20px;">
            หากคุณไม่ได้เป็นผู้ส่งคำขอนี้ สามารถเพิกเฉยต่ออีเมลฉบับนี้ได้ รหัสผ่านเดิมของคุณจะยังคงปลอดภัยและไม่มีการเปลี่ยนแปลงใดๆ
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  // ทำงานแบบ Asynchronous / Background (ไม่ขัดขวางการทำงานหากไม่มี API key ในโหมด dev)
  if (!resend) {
    // โหมด Dev / Test: จำลองการส่งสำเร็จโดยไม่บันทึก token หรือ log ข้อมูลลับ
    return { success: true, messageId: 'mock-dev-email-id' };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: '🔐 คำขอรีเซ็ตรหัสผ่านสำหรับบัญชี TrainTrack',
      html,
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }
    return { success: true, messageId: result.data?.id };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * 2. ส่งอีเมลแจ้งเตือนเมื่อรหัสผ่านถูกเปลี่ยนสำเร็จ (ตาม Spec ข้อ 5)
 */
export async function sendPasswordChangedNotificationEmail(
  toEmail: string
): Promise<EmailSenderResult> {
  if (!isValidEmail(toEmail)) {
    return { success: false, error: 'Invalid email address' };
  }

  const safeEmail = sanitizeHtml(sanitizeText(toEmail, 100));

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>รหัสผ่านของคุณถูกเปลี่ยนแล้ว</title>
      <meta name="referrer" content="no-referrer">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
        <div style="background: #19705F; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px;">TrainTrack</h1>
        </div>
        <div style="padding: 32px 24px;">
          <h2 style="color: #0f172a; margin-top: 0; font-size: 18px;">รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว</h2>
          <p style="color: #475569; font-size: 15px; line-height: 1.6;">
            บัญชี <strong>${safeEmail}</strong> ได้รับการตั้งรหัสผ่านใหม่เรียบร้อยแล้ว ระบบได้ทำการออกจากระบบ (Logout) ในทุกอุปกรณ์เพื่อความปลอดภัย
          </p>
          <p style="color: #ef4444; font-size: 13px; line-height: 1.5; margin-top: 24px;">
            ⚠️ หากคุณไม่ได้เป็นผู้ทำรายการนี้ กรุณาติดต่อผู้ดูแลระบบทันที
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!resend) {
    return { success: true, messageId: 'mock-dev-notify-id' };
  }

  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: '🛡️ รหัสผ่านบัญชี TrainTrack ของคุณถูกเปลี่ยนแปลงแล้ว',
      html,
    });
    return { success: !result.error, messageId: result.data?.id };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

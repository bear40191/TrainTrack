import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/services/emailService';
import { checkNotificationRateLimit } from '@/lib/rate-limit';
import { getSessionFromRequest, getClientIp } from '@/lib/session';
import {
  sanitizeHtml,
  sanitizeText,
  isValidEmail,
  isAllowedNotificationType,
  AllowedNotificationType
} from '@/lib/security';

// ประเภทของ Notification ที่ส่งได้
export type NotificationType = AllowedNotificationType;

interface SendNotificationRequest {
  type: NotificationType;
  toEmail: string;
  toName: string;
  workLogTitle: string;
  traineeName: string;
  mentorName?: string;
  note?: string;
}

// Template email แต่ละประเภท (พร้อม XSS / HTML Injection Sanitization)
function buildEmailContent(data: SendNotificationRequest): {
  subject: string;
  html: string;
} {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Sanitize all inputs to prevent HTML/Email Injection
  const safeToName = sanitizeHtml(sanitizeText(data.toName, 100));
  const safeTitle = sanitizeHtml(sanitizeText(data.workLogTitle, 200));
  const safeTrainee = sanitizeHtml(sanitizeText(data.traineeName, 100));
  const safeMentor = data.mentorName ? sanitizeHtml(sanitizeText(data.mentorName, 100)) : '';
  const safeNote = data.note ? sanitizeHtml(sanitizeText(data.note, 1000)) : '';
  const plainTitle = sanitizeText(data.workLogTitle, 150);

  const baseStyle = `
    font-family: 'Sarabun', 'Noto Sans Thai', sans-serif;
    max-width: 600px;
    margin: 0 auto;
    background: #ffffff;
  `;

  const buttonStyle = `
    display: inline-block;
    padding: 12px 24px;
    background: #10b981;
    color: #ffffff;
    text-decoration: none;
    border-radius: 8px;
    font-weight: bold;
    margin-top: 16px;
  `;

  switch (data.type) {
    case 'pending_mentor':
      return {
        subject: `🔔 มีงานรออนุมัติใหม่: "${plainTitle}"`,
        html: `
          <div style="${baseStyle}">
            <div style="background: #10b981; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📋 TrainTrack</h1>
              <p style="color: #d1fae5; margin: 4px 0 0;">ระบบติดตามการฝึกงาน</p>
            </div>
            <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <h2 style="color: #111827; margin-top: 0;">สวัสดีคุณ ${safeToName} 👋</h2>
              <p style="color: #374151; line-height: 1.6;">
                นักศึกษา <strong>${safeTrainee}</strong> ได้ส่งบันทึกการทำงานเพื่อรออนุมัติจากคุณ
              </p>
              <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 4px; margin: 16px 0;">
                <p style="margin: 0; color: #065f46;"><strong>📄 งานที่ส่ง:</strong> ${safeTitle}</p>
              </div>
              <p style="color: #374151;">กรุณาเข้าสู่ระบบเพื่อตรวจสอบและอนุมัติงาน</p>
              <a href="${appUrl}" style="${buttonStyle}">เปิด TrainTrack เพื่อตรวจงาน →</a>
              <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;" />
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                อีเมลนี้ส่งโดยอัตโนมัติจากระบบ TrainTrack • หากมีคำถามติดต่อผู้ดูแลระบบ
              </p>
            </div>
          </div>
        `,
      };

    case 'pending_lead':
      return {
        subject: `✅ งานผ่านพี่เลี้ยงแล้ว รออนุมัติขั้นสุดท้าย: "${plainTitle}"`,
        html: `
          <div style="${baseStyle}">
            <div style="background: #3b82f6; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📋 TrainTrack</h1>
              <p style="color: #bfdbfe; margin: 4px 0 0;">ระบบติดตามการฝึกงาน</p>
            </div>
            <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <h2 style="color: #111827; margin-top: 0;">สวัสดีคุณ ${safeToName} 👋</h2>
              <p style="color: #374151; line-height: 1.6;">
                บันทึกการทำงานของ <strong>${safeTrainee}</strong> ผ่านการตรวจจากพี่เลี้ยง
                ${safeMentor ? `(<strong>${safeMentor}</strong>)` : ''} แล้ว รอการอนุมัติขั้นสุดท้ายจากคุณ
              </p>
              <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin: 16px 0;">
                <p style="margin: 0; color: #1e40af;"><strong>📄 งาน:</strong> ${safeTitle}</p>
              </div>
              <a href="${appUrl}" style="${buttonStyle.replace('#10b981', '#3b82f6')}">อนุมัติงานขั้นสุดท้าย →</a>
            </div>
          </div>
        `,
      };

    case 'approved':
      return {
        subject: `🎉 งานของคุณได้รับการอนุมัติแล้ว: "${plainTitle}"`,
        html: `
          <div style="${baseStyle}">
            <div style="background: #059669; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🎉 ยินดีด้วย!</h1>
              <p style="color: #a7f3d0; margin: 4px 0 0;">งานของคุณได้รับการอนุมัติแล้ว</p>
            </div>
            <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <h2 style="color: #111827; margin-top: 0;">สวัสดีคุณ ${safeToName} 👋</h2>
              <p style="color: #374151; line-height: 1.6;">
                บันทึกการทำงานของคุณได้รับการอนุมัติขั้นสุดท้ายเรียบร้อยแล้ว!
              </p>
              <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; border-radius: 4px; margin: 16px 0;">
                <p style="margin: 0; color: #065f46;"><strong>📄 งานที่ผ่านการอนุมัติ:</strong> ${safeTitle}</p>
                ${safeNote ? `<p style="margin: 8px 0 0; color: #047857;"><strong>หมายเหตุ:</strong> ${safeNote}</p>` : ''}
              </div>
              <a href="${appUrl}" style="${buttonStyle}">ดูรายละเอียดงาน →</a>
            </div>
          </div>
        `,
      };

    case 'revision_required':
      return {
        subject: `⚠️ กรุณาแก้ไขงาน: "${plainTitle}"`,
        html: `
          <div style="${baseStyle}">
            <div style="background: #f59e0b; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ ต้องแก้ไขงาน</h1>
              <p style="color: #fef3c7; margin: 4px 0 0;">กรุณาแก้ไขตามข้อเสนอแนะด้านล่าง</p>
            </div>
            <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <h2 style="color: #111827; margin-top: 0;">สวัสดีคุณ ${safeToName} 👋</h2>
              <p style="color: #374151; line-height: 1.6;">
                ${safeMentor ? `<strong>${safeMentor}</strong>` : 'พี่เลี้ยง'} ส่งงานกลับมาให้คุณแก้ไข
              </p>
              <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 16px 0;">
                <p style="margin: 0; color: #92400e;"><strong>📄 งาน:</strong> ${safeTitle}</p>
                ${safeNote ? `<p style="margin: 8px 0 0; color: #92400e;"><strong>💬 ข้อเสนอแนะ:</strong> ${safeNote}</p>` : ''}
              </div>
              <a href="${appUrl}" style="${buttonStyle.replace('#10b981', '#f59e0b')}">แก้ไขงาน →</a>
            </div>
          </div>
        `,
      };

    default:
      return {
        subject: `TrainTrack แจ้งเตือน`,
        html: `<p>มีการอัปเดตสถานะงาน "${safeTitle}"</p>`,
      };
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. ตรวจสอบสิทธิ์ผู้ใช้จาก Signed HttpOnly Session Cookie
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: กรุณาเข้าสู่ระบบก่อนส่งการแจ้งเตือน' },
        { status: 401 }
      );
    }

    // 2. ตรวจสอบ Rate Limit ป้องกันการยิงสแปมอีเมล
    const rate = checkNotificationRateLimit(session.email, getClientIp(request));
    if (!rate.allowed) {
      return NextResponse.json(
        { success: false, message: 'ส่งการแจ้งเตือนเกินโควตาที่กำหนด กรุณาลองใหม่ภายหลัง' },
        { status: 429 }
      );
    }

    // 3. Parse และตรวจสอบ Request Body
    const body: SendNotificationRequest = await request.json();

    // 2. ตรวจสอบ required fields
    if (!body.toEmail || !body.type || !body.workLogTitle) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: toEmail, type, workLogTitle' },
        { status: 400 }
      );
    }

    // 3. Validate Email format and block CRLF injection
    if (!isValidEmail(body.toEmail)) {
      return NextResponse.json(
        { success: false, message: 'Invalid recipient email format' },
        { status: 400 }
      );
    }

    // 4. Validate Notification Type against strict whitelist
    if (!isAllowedNotificationType(body.type)) {
      return NextResponse.json(
        { success: false, message: 'Invalid notification type' },
        { status: 400 }
      );
    }

    // 5. Build sanitized email content และส่งผ่าน EmailService (รองรับ Gmail SMTP + Resend)
    const { subject, html } = buildEmailContent(body);
    const result = await sendEmail(body.toEmail, subject, html);

    if (!result.success) {
      console.error('[TrainTrack] Email send error:', result.error);
      return NextResponse.json(
        { success: false, message: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    console.log(`[TrainTrack] Email sent to ${body.toEmail} (${body.type}) ID: ${result.messageId}`);
    return NextResponse.json({ success: true, id: result.messageId });

  } catch (error) {
    console.error('[TrainTrack] Send notification error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}



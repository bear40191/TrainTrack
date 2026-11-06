import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.EMAIL_FROM || 'TrainTrack <onboarding@resend.dev>';

// ประเภทของ Notification ที่ส่งได้
export type NotificationType = 'pending_mentor' | 'pending_lead' | 'approved' | 'revision_required';

interface SendNotificationRequest {
  type: NotificationType;
  toEmail: string;
  toName: string;
  workLogTitle: string;
  traineeName: string;
  mentorName?: string;
  note?: string;
}

// Template email แต่ละประเภท
function buildEmailContent(data: SendNotificationRequest): {
  subject: string;
  html: string;
} {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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
        subject: `🔔 มีงานรออนุมัติใหม่: "${data.workLogTitle}"`,
        html: `
          <div style="${baseStyle}">
            <div style="background: #10b981; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📋 TrainTrack</h1>
              <p style="color: #d1fae5; margin: 4px 0 0;">ระบบติดตามการฝึกงาน</p>
            </div>
            <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <h2 style="color: #111827; margin-top: 0;">สวัสดีคุณ ${data.toName} 👋</h2>
              <p style="color: #374151; line-height: 1.6;">
                นักศึกษา <strong>${data.traineeName}</strong> ได้ส่งบันทึกการทำงานเพื่อรออนุมัติจากคุณ
              </p>
              <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 4px; margin: 16px 0;">
                <p style="margin: 0; color: #065f46;"><strong>📄 งานที่ส่ง:</strong> ${data.workLogTitle}</p>
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
        subject: `✅ งานผ่านพี่เลี้ยงแล้ว รออนุมัติขั้นสุดท้าย: "${data.workLogTitle}"`,
        html: `
          <div style="${baseStyle}">
            <div style="background: #3b82f6; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">📋 TrainTrack</h1>
              <p style="color: #bfdbfe; margin: 4px 0 0;">ระบบติดตามการฝึกงาน</p>
            </div>
            <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <h2 style="color: #111827; margin-top: 0;">สวัสดีคุณ ${data.toName} 👋</h2>
              <p style="color: #374151; line-height: 1.6;">
                บันทึกการทำงานของ <strong>${data.traineeName}</strong> ผ่านการตรวจจากพี่เลี้ยง
                ${data.mentorName ? `(<strong>${data.mentorName}</strong>)` : ''} แล้ว รอการอนุมัติขั้นสุดท้ายจากคุณ
              </p>
              <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin: 16px 0;">
                <p style="margin: 0; color: #1e40af;"><strong>📄 งาน:</strong> ${data.workLogTitle}</p>
              </div>
              <a href="${appUrl}" style="${buttonStyle.replace('#10b981', '#3b82f6')}">อนุมัติงานขั้นสุดท้าย →</a>
            </div>
          </div>
        `,
      };

    case 'approved':
      return {
        subject: `🎉 งานของคุณได้รับการอนุมัติแล้ว: "${data.workLogTitle}"`,
        html: `
          <div style="${baseStyle}">
            <div style="background: #059669; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🎉 ยินดีด้วย!</h1>
              <p style="color: #a7f3d0; margin: 4px 0 0;">งานของคุณได้รับการอนุมัติแล้ว</p>
            </div>
            <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <h2 style="color: #111827; margin-top: 0;">สวัสดีคุณ ${data.toName} 👋</h2>
              <p style="color: #374151; line-height: 1.6;">
                บันทึกการทำงานของคุณได้รับการอนุมัติขั้นสุดท้ายเรียบร้อยแล้ว!
              </p>
              <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 16px; border-radius: 4px; margin: 16px 0;">
                <p style="margin: 0; color: #065f46;"><strong>📄 งานที่ผ่านการอนุมัติ:</strong> ${data.workLogTitle}</p>
                ${data.note ? `<p style="margin: 8px 0 0; color: #047857;"><strong>หมายเหตุ:</strong> ${data.note}</p>` : ''}
              </div>
              <a href="${appUrl}" style="${buttonStyle}">ดูรายละเอียดงาน →</a>
            </div>
          </div>
        `,
      };

    case 'revision_required':
      return {
        subject: `⚠️ กรุณาแก้ไขงาน: "${data.workLogTitle}"`,
        html: `
          <div style="${baseStyle}">
            <div style="background: #f59e0b; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">⚠️ ต้องแก้ไขงาน</h1>
              <p style="color: #fef3c7; margin: 4px 0 0;">กรุณาแก้ไขตามข้อเสนอแนะด้านล่าง</p>
            </div>
            <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <h2 style="color: #111827; margin-top: 0;">สวัสดีคุณ ${data.toName} 👋</h2>
              <p style="color: #374151; line-height: 1.6;">
                ${data.mentorName ? `<strong>${data.mentorName}</strong>` : 'พี่เลี้ยง'} ส่งงานกลับมาให้คุณแก้ไข
              </p>
              <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 16px 0;">
                <p style="margin: 0; color: #92400e;"><strong>📄 งาน:</strong> ${data.workLogTitle}</p>
                ${data.note ? `<p style="margin: 8px 0 0; color: #92400e;"><strong>💬 ข้อเสนอแนะ:</strong> ${data.note}</p>` : ''}
              </div>
              <a href="${appUrl}" style="${buttonStyle.replace('#10b981', '#f59e0b')}">แก้ไขงาน →</a>
            </div>
          </div>
        `,
      };

    default:
      return {
        subject: `TrainTrack แจ้งเตือน`,
        html: `<p>มีการอัปเดตสถานะงาน "${data.workLogTitle}"</p>`,
      };
  }
}

export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบ API Key
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
      console.warn('[TrainTrack] RESEND_API_KEY ยังไม่ได้ตั้งค่า — ข้ามการส่ง email');
      return NextResponse.json(
        { success: false, message: 'Email service not configured — set RESEND_API_KEY in .env.local' },
        { status: 503 }
      );
    }

    const body: SendNotificationRequest = await request.json();

    // ตรวจสอบ required fields
    if (!body.toEmail || !body.type || !body.workLogTitle) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: toEmail, type, workLogTitle' },
        { status: 400 }
      );
    }

    const { subject, html } = buildEmailContent(body);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [body.toEmail],
      subject,
      html,
    });

    if (result.error) {
      console.error('[TrainTrack] Resend error:', result.error);
      return NextResponse.json(
        { success: false, message: result.error.message },
        { status: 500 }
      );
    }

    console.log(`[TrainTrack] Email sent to ${body.toEmail} (${body.type}) ID: ${result.data?.id}`);
    return NextResponse.json({ success: true, id: result.data?.id });

  } catch (error) {
    console.error('[TrainTrack] Send notification error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}


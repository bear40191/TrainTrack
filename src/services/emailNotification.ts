/**
 * TrainTrack Email Notification Service
 * เรียกใช้ API Route /api/send-notification เพื่อส่ง email ผ่าน Resend
 */

export type NotificationType = 'pending_mentor' | 'pending_lead' | 'approved' | 'revision_required';

interface SendEmailOptions {
  type: NotificationType;
  toEmail: string;
  toName: string;
  workLogTitle: string;
  traineeName: string;
  mentorName?: string;
  note?: string;
}

/**
 * ส่ง email notification ผ่าน /api/send-notification
 * - ถ้า RESEND_API_KEY ยังไม่ตั้งค่า จะ log คำเตือนและข้ามไป (ไม่ crash app)
 * - ทำงาน fire-and-forget (ไม่ block UI)
 */
export async function sendEmailNotification(options: SendEmailOptions): Promise<void> {
  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    const data = await response.json();

    if (!response.ok) {
      // ไม่ใช่ error ร้ายแรง — แค่ log เตือน ไม่ throw
      if (response.status === 503) {
        console.info('[TrainTrack Email] Service not configured yet. Set RESEND_API_KEY to enable emails.');
      } else {
        console.warn('[TrainTrack Email] Failed to send email:', data.message);
      }
      return;
    }

    console.info(`[TrainTrack Email] Sent "${options.type}" to ${options.toEmail} (ID: ${data.id})`);
  } catch (error) {
    // Network error หรือ server down — ไม่ crash app
    console.warn('[TrainTrack Email] Email service unavailable:', error);
  }
}

/**
 * แจ้ง Mentor เมื่อนักศึกษาส่งงานใหม่มาให้ตรวจ
 */
export function notifyMentorPendingReview(
  mentor: { email: string; full_name: string },
  trainee: { full_name: string },
  workLogTitle: string
) {
  return sendEmailNotification({
    type: 'pending_mentor',
    toEmail: mentor.email,
    toName: mentor.full_name,
    workLogTitle,
    traineeName: trainee.full_name,
  });
}

/**
 * แจ้ง Lead เมื่อ Mentor อนุมัติงานแล้ว
 */
export function notifyLeadPendingApproval(
  lead: { email: string; full_name: string },
  trainee: { full_name: string },
  mentor: { full_name: string },
  workLogTitle: string
) {
  return sendEmailNotification({
    type: 'pending_lead',
    toEmail: lead.email,
    toName: lead.full_name,
    workLogTitle,
    traineeName: trainee.full_name,
    mentorName: mentor.full_name,
  });
}

/**
 * แจ้งนักศึกษาเมื่องานได้รับการอนุมัติสำเร็จ
 */
export function notifyTraineeApproved(
  trainee: { email: string; full_name: string },
  workLogTitle: string,
  note?: string
) {
  return sendEmailNotification({
    type: 'approved',
    toEmail: trainee.email,
    toName: trainee.full_name,
    workLogTitle,
    traineeName: trainee.full_name,
    note,
  });
}

/**
 * แจ้งนักศึกษาเมื่องานถูกส่งกลับให้แก้ไข
 */
export function notifyTraineeRevisionRequired(
  trainee: { email: string; full_name: string },
  mentor: { full_name: string },
  workLogTitle: string,
  note: string
) {
  return sendEmailNotification({
    type: 'revision_required',
    toEmail: trainee.email,
    toName: trainee.full_name,
    workLogTitle,
    traineeName: trainee.full_name,
    mentorName: mentor.full_name,
    note,
  });
}


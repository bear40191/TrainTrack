import { supabase } from './supabase';
import { WorkLog, Profile, Comment as AppComment, ApprovalAction } from '@/lib/types';

/**
 * ตรวจสอบว่า Supabase ได้รับการตั้งค่า Key จริงและพร้อมเรียกใช้งานหรือไม่
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(
    url &&
    key &&
    !url.includes('mock.supabase.co') &&
    !key.includes('mock-anon-key')
  );
}

/**
 * ดึงรายการบันทึกงานทั้งหมดพร้อมข้อมูลสัมพันธ์ (Profiles, Attachments, Comments, ApprovalActions)
 */
export async function fetchWorkLogsFromDb(): Promise<WorkLog[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('work_logs')
      .select(`
        *,
        trainee:profiles!work_logs_trainee_id_fkey(*),
        assigned_mentor:profiles!work_logs_assigned_mentor_id_fkey(*),
        attachments(*),
        comments(*, author:profiles(*)),
        approval_actions(*, actor:profiles(*))
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] fetchWorkLogs error (fallback to local):', error.message);
      return null;
    }

    return (data as unknown as WorkLog[]) || [];
  } catch (err) {
    console.warn('[Supabase] Exception in fetchWorkLogs (fallback to local):', err);
    return null;
  }
}

/**
 * ดึงข้อมูลผู้ใช้งานทั้งหมดจาก profiles table
 */
export async function fetchProfilesFromDb(): Promise<Profile[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('[Supabase] fetchProfiles error (fallback to local):', error.message);
      return null;
    }

    return (data as Profile[]) || [];
  } catch (err) {
    console.warn('[Supabase] Exception in fetchProfiles:', err);
    return null;
  }
}

/**
 * ดึงหมวดหมู่งานจาก categories table
 */
export async function fetchCategoriesFromDb(): Promise<string[] | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('name')
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
      return null;
    }

    return data.map((c: { name: string }) => c.name);
  } catch {
    return null;
  }
}

/**
 * บันทึก Work Log ใหม่ลง Supabase (รวม attachments และ initial approval action)
 */
export async function dbCreateWorkLog(log: WorkLog): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    // 1. บันทึก work_logs table
    const logPayload = {
      id: log.id,
      trainee_id: log.trainee_id,
      assigned_mentor_id: log.assigned_mentor_id || null,
      work_date: log.work_date,
      title: log.title,
      description: log.description,
      hours_spent: log.hours_spent,
      status: log.status,
      category: log.category,
      revision_count: log.revision_count || 0,
      submitted_at: log.submitted_at || null,
      approved_at: log.approved_at || null,
      created_at: log.created_at || new Date().toISOString(),
      updated_at: log.updated_at || new Date().toISOString()
    };

    const { error: logError } = await supabase.from('work_logs').insert([logPayload]);
    if (logError) {
      console.error('[Supabase] dbCreateWorkLog error:', logError);
      return false;
    }

    // 2. บันทึก attachments ถ้ามี
    if (log.attachments && log.attachments.length > 0) {
      const attPayloads = log.attachments.map((att) => ({
        id: att.id,
        work_log_id: log.id,
        file_name: att.file_name,
        file_url: att.file_url,
        file_type: att.file_type,
        file_size: att.file_size,
        created_at: att.created_at || new Date().toISOString()
      }));
      const { error: attError } = await supabase.from('attachments').insert(attPayloads);
      if (attError) console.warn('[Supabase] attachments insert error:', attError);
    }

    // 3. บันทึก approval_actions ถ้ามี
    if (log.approval_actions && log.approval_actions.length > 0) {
      const actPayloads = log.approval_actions.map((act) => ({
        id: act.id,
        work_log_id: log.id,
        actor_id: act.actor_id,
        action: act.action,
        from_status: act.from_status,
        to_status: act.to_status,
        note: act.note,
        created_at: act.created_at || new Date().toISOString()
      }));
      const { error: actError } = await supabase.from('approval_actions').insert(actPayloads);
      if (actError) console.warn('[Supabase] approval_actions insert error:', actError);
    }

    return true;
  } catch (err) {
    console.error('[Supabase] Exception in dbCreateWorkLog:', err);
    return false;
  }
}

/**
 * อัปเดตข้อมูล Work Log ใน Supabase
 */
export async function dbUpdateWorkLog(
  id: string,
  updates: Partial<WorkLog>
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.hours_spent !== undefined) payload.hours_spent = updates.hours_spent;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.work_date !== undefined) payload.work_date = updates.work_date;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.revision_count !== undefined) payload.revision_count = updates.revision_count;
    if (updates.submitted_at !== undefined) payload.submitted_at = updates.submitted_at;
    if (updates.approved_at !== undefined) payload.approved_at = updates.approved_at;
    if (updates.assigned_mentor_id !== undefined) payload.assigned_mentor_id = updates.assigned_mentor_id;

    const { error } = await supabase
      .from('work_logs')
      .update(payload)
      .eq('id', id);

    if (error) {
      console.error('[Supabase] dbUpdateWorkLog error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Exception in dbUpdateWorkLog:', err);
    return false;
  }
}

/**
 * ลบ Work Log จาก Supabase
 */
export async function dbDeleteWorkLog(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase.from('work_logs').delete().eq('id', id);
    if (error) {
      console.error('[Supabase] dbDeleteWorkLog error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Supabase] Exception in dbDeleteWorkLog:', err);
    return false;
  }
}

/**
 * บันทึก Approval Action ใหม่
 */
export async function dbAddApprovalAction(action: ApprovalAction): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase.from('approval_actions').insert([{
      id: action.id,
      work_log_id: action.work_log_id,
      actor_id: action.actor_id,
      action: action.action,
      from_status: action.from_status,
      to_status: action.to_status,
      note: action.note,
      created_at: action.created_at || new Date().toISOString()
    }]);

    if (error) {
      console.warn('[Supabase] dbAddApprovalAction error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Exception in dbAddApprovalAction:', err);
    return false;
  }
}

/**
 * เพิ่ม Comment ใหม่
 */
export async function dbAddComment(comment: AppComment): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase.from('comments').insert([{
      id: comment.id,
      work_log_id: comment.work_log_id,
      author_id: comment.author_id,
      content: comment.content,
      is_system: comment.is_system || false,
      created_at: comment.created_at || new Date().toISOString()
    }]);

    if (error) {
      console.warn('[Supabase] dbAddComment error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Exception in dbAddComment:', err);
    return false;
  }
}

/**
 * เพิ่มโปรไฟล์ใหม่ หรืออัปเดตโปรไฟล์
 */
export async function dbUpsertProfile(profile: Profile): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase.from('profiles').upsert([{
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      role: profile.role,
      team_id: profile.team_id || null,
      mentor_id: profile.mentor_id || null,
      avatar_url: profile.avatar_url || null,
      position: profile.position || null,
      created_at: profile.created_at || new Date().toISOString()
    }]);

    if (error) {
      console.warn('[Supabase] dbUpsertProfile error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Exception in dbUpsertProfile:', err);
    return false;
  }
}

/**
 * อัปโหลดไฟล์รูปภาพหรือเอกสารขึ้น Supabase Storage (Bucket: work-log-attachments)
 */
export async function uploadAttachmentToStorage(
  fileOrBase64: File | Blob | string,
  fileName: string
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    let uploadBody: Blob | File;
    let contentType = 'application/octet-stream';

    if (typeof fileOrBase64 === 'string') {
      if (fileOrBase64.startsWith('data:')) {
        const response = await fetch(fileOrBase64);
        uploadBody = await response.blob();
        contentType = uploadBody.type || contentType;
      } else {
        // Raw URL
        return fileOrBase64;
      }
    } else {
      uploadBody = fileOrBase64;
      contentType = fileOrBase64.type || contentType;
    }

    const uniquePath = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { data, error } = await supabase.storage
      .from('work-log-attachments')
      .upload(uniquePath, uploadBody, {
        contentType,
        upsert: true
      });

    if (error || !data) {
      console.warn('[Supabase Storage] Upload error:', error?.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from('work-log-attachments')
      .getPublicUrl(data.path);

    return publicUrlData?.publicUrl || null;
  } catch (err) {
    console.warn('[Supabase Storage] Exception uploading file:', err);
    return null;
  }
}

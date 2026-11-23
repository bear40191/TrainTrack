'use client';

import React, { useState } from 'react';
import { WorkLog } from '@/lib/types';
import { useAppStore } from '@/store/appStore';
import { StatusBadge } from '@/components/work-log/StatusBadge';
import { STATUS_LABELS } from '@/lib/constants';
import { formatDate, formatDateTime } from '@/lib/utils';
import { sanitizeText } from '@/lib/security';
import { 
  X, Calendar, CheckCircle2, RotateCcw, 
  Send, MessageCircle, ArrowRight, UserCheck, AlertCircle,
  Pencil, Trash2, Save, AlertTriangle
} from 'lucide-react';

interface Props {
  log: WorkLog;
  onClose: () => void;
}

export const WorkLogDetailModal: React.FC<Props> = ({ log, onClose }) => {
  const { 
    currentUser, 
    categories,
    mentors,
    updateWorkLog,
    deleteWorkLog,
    submitWorkLog, 
    mentorApprove, 
    mentorReject, 
    leadApprove, 
    leadReject, 
    addComment 
  } = useAppStore();

  const [commentText, setCommentText] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(log.title);
  const [editWorkDate, setEditWorkDate] = useState(log.work_date);
  const [editCategory, setEditCategory] = useState(log.category);
  const [editAssignedMentorId, setEditAssignedMentorId] = useState(log.assigned_mentor_id || (mentors[0]?.id || ''));
  const [editDescription, setEditDescription] = useState(log.description);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Permissions: นักศึกษาสามารถแก้ไขและลบงานได้ (เฉพาะงานของตนเอง และเฉพาะสถานะ draft หรือ revision_required) หรือ admin
  const isOwnLog = log.trainee_id === currentUser.id;
  const isEditableStatus = log.status === 'draft' || log.status === 'revision_required';
  const canEditOrDelete = (currentUser.role === 'trainee' && isOwnLog && isEditableStatus) || currentUser.role === 'admin';

  const canTraineeSubmit = 
    currentUser.role === 'trainee' && 
    isOwnLog &&
    isEditableStatus;

  const isAssignedMentor = !log.assigned_mentor_id || log.assigned_mentor_id === currentUser.id;
  const canMentorReview = 
    currentUser.role === 'mentor' && log.status === 'pending_mentor';

  const canLeadReview = 
    currentUser.role === 'lead' && log.status === 'pending_lead';

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      alert('กรุณากรอกหัวข้องาน');
      return;
    }
    if (!editDescription.trim()) {
      alert('กรุณากรอกรายละเอียดผลการปฏิบัติงาน');
      return;
    }

    updateWorkLog(log.id, {
      title: sanitizeText(editTitle.trim()),
      work_date: editWorkDate,
      category: editCategory,
      assigned_mentor_id: editAssignedMentorId,
      description: sanitizeText(editDescription.trim()),
    });

    setIsEditing(false);
  };

  const handleDeleteLog = () => {
    deleteWorkLog(log.id);
    onClose();
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(log.id, sanitizeText(commentText.trim()));
    setCommentText('');
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      alert('กรุณาระบุสิ่งที่ต้องการให้นักศึกษาแก้ไข');
      return;
    }

    if (currentUser.role === 'mentor') {
      mentorReject(log.id, sanitizeText(rejectReason.trim()));
    } else if (currentUser.role === 'lead') {
      leadReject(log.id, sanitizeText(rejectReason.trim()));
    }
    setIsRejecting(false);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5 flex-wrap">
            <StatusBadge status={log.status} />
            <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-sm">
              {log.category}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* ปุ่มแก้ไข & ลบ สำหรับนักศึกษา หรือ admin */}
            {canEditOrDelete && !isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95"
                  title="แก้ไขข้อมูลงาน"
                >
                  <Pencil className="w-3.5 h-3.5 text-emerald-600" />
                  <span>แก้ไข</span>
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95"
                  title="ลบบันทึกงานนี้"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>ลบ</span>
                </button>
              </>
            )}

            <button
              onClick={onClose}
              aria-label="ปิดหน้าต่าง"
              className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Banner */}
        {showDeleteConfirm && (
          <div className="bg-rose-50 border-b border-rose-200 p-4 sm:p-5 animate-in slide-in-from-top duration-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-rose-900">
                  ยืนยันการลบบันทึกงานนี้?
                </h4>
                <p className="text-xs text-rose-700 mt-1">
                  เมื่อลบแล้ว ข้อมูลบันทึกงานนี้ รวมถึงประวัติการตรวจและความคิดเห็นจะถูกลบออกจากระบบอย่างถาวร
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={handleDeleteLog}
                    className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm active:scale-95 transition"
                  >
                    ยืนยันลบข้อมูล
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-rose-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm transition"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Edit Mode Form */}
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-2 text-xs font-semibold text-emerald-900">
                <Pencil className="w-4 h-4 text-emerald-600" />
                <span>โหมดแก้ไขบันทึกการปฏิบัติงาน — คุณสามารถปรับปรุงข้อมูลแล้วบันทึกได้ทันที</span>
              </div>

              {/* หัวข้องาน */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  หัวข้องาน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  placeholder="เช่น พัฒนาระบบ API..."
                  required
                />
              </div>

              {/* วันที่ และ หมวดหมู่ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    วันที่ปฏิบัติงาน
                  </label>
                  <input
                    type="date"
                    value={editWorkDate}
                    onChange={(e) => setEditWorkDate(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    หมวดหมู่งาน
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* พี่เลี้ยงที่รับผิดชอบ */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  พี่เลี้ยงที่รับผิดชอบตรวจสอบ
                </label>
                <select
                  value={editAssignedMentorId}
                  onChange={(e) => setEditAssignedMentorId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.position || 'พี่เลี้ยง'})
                    </option>
                  ))}
                </select>
              </div>

              {/* รายละเอียดการทำงาน */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  รายละเอียดการปฏิบัติงาน <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-3.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                  placeholder="ระบุรายละเอียดงานที่ได้ปฏิบัติ..."
                  required
                />
              </div>

              {/* ปุ่มบันทึกการแก้ไข */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditTitle(log.title);
                    setEditWorkDate(log.work_date);
                    setEditCategory(log.category);
                    setEditAssignedMentorId(log.assigned_mentor_id || '');
                    setEditDescription(log.description);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>บันทึกการแก้ไข</span>
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* หัวข้องาน */}
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">{log.title}</h2>
                <div className="flex items-center gap-4 text-xs text-slate-500 font-medium flex-wrap">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    {formatDate(log.work_date)}
                  </span>
                  <span>
                    ผู้บันทึก: <strong className="text-slate-800">{log.trainee?.full_name || 'นักศึกษา'}</strong>
                  </span>
                </div>

                {/* พี่เลี้ยงที่ได้รับมอบหมาย */}
                {log.assigned_mentor ? (
                  <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50/80 border border-emerald-200/90 text-emerald-900 text-xs font-semibold">
                    <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>พี่เลี้ยงผู้ดูแลงานนี้: <strong>{log.assigned_mentor.full_name}</strong> ({log.assigned_mentor.position || 'พี่เลี้ยง'})</span>
                  </div>
                ) : null}
              </div>

              {/* รายละเอียด */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                <h4 className="text-xs font-bold text-emerald-800 mb-2 uppercase tracking-wider">
                  รายละเอียดผลการปฏิบัติงาน
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {log.description}
                </p>
              </div>

              {/* รูปภาพแนบ */}
              {log.attachments && log.attachments.length > 0 ? (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2.5">
                    รูปภาพประกอบ ({log.attachments.length} รูป)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {log.attachments.map((att) => (
                      <div key={att.id} className="rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 shadow-sm relative group">
                        <img 
                          src={att.file_url} 
                          alt={att.file_name} 
                          className="w-full h-full object-cover transition duration-200 group-hover:scale-105" 
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Timeline ลำดับการอนุมัติ */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                <h4 className="text-xs font-bold text-slate-700 mb-3.5">
                  ประวัติการอนุมัติ (Approval Chain Timeline)
                </h4>

                <div className="space-y-3.5">
                  {log.approval_actions && log.approval_actions.length > 0 ? (
                    log.approval_actions.map((act, index) => (
                      <div key={act.id || index} className="flex items-start gap-3 text-xs">
                        <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                          {act.action === 'approve' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : act.action === 'request_revision' ? (
                            <RotateCcw className="w-4 h-4 text-rose-500" />
                          ) : (
                            <Send className="w-3.5 h-3.5 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1 bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-slate-800">
                              {act.actor?.full_name || 'ผู้ใช้งาน'}
                            </span>
                            <span className="text-[11px] text-slate-600">
                              {formatDateTime(act.created_at)}
                            </span>
                          </div>
                          <div className="text-slate-600 flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-slate-500">{STATUS_LABELS[act.from_status]}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="font-bold text-emerald-700">{STATUS_LABELS[act.to_status]}</span>
                          </div>
                          {act.note && (
                            <div className="mt-2 text-rose-700 bg-rose-50 border border-rose-100 rounded-lg p-2 text-xs font-medium">
                              <strong>หมายเหตุ:</strong> {act.note}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-600 italic">ยังไม่มีประวัติการส่งตรวจสอบ</p>
                  )}
                </div>
              </div>

              {/* ข้อเสนอแนะ / ความคิดเห็น */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
                <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>ความคิดเห็น / ข้อเสนอแนะ ({log.comments?.length || 0})</span>
                </h4>

                <div className="space-y-3 mb-4 max-h-48 overflow-y-auto pr-1">
                  {log.comments && log.comments.length > 0 ? (
                    log.comments.map((comment) => (
                      <div key={comment.id} className="bg-white border border-slate-200 rounded-xl p-3 text-xs shadow-xs">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-slate-800">
                            {comment.author?.full_name || 'ผู้ใช้งาน'}
                          </span>
                          <span className="text-[11px] text-slate-600">
                            {formatDateTime(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                          {comment.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-600 italic py-2 text-center">
                      ยังไม่มีความคิดเห็นในรายการนี้
                    </p>
                  )}
                </div>

                {/* Form เพิ่มความคิดเห็น */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="พิมพ์ความคิดเห็นหรือข้อเสนอแนะ..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ส่ง</span>
                  </button>
                </form>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer สำหรับการ Action ตามบทบาท */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70">
          {/* กรณีนักศึกษา: ส่งงานไปให้พี่เลี้ยงตรวจ (เมื่อสถานะเป็น draft หรือ revision_required) */}
          {canTraineeSubmit ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-600 font-medium">
                งานนี้พร้อมส่งให้พี่เลี้ยงตรวจสอบแล้ว
              </span>
              <button
                onClick={() => {
                  submitWorkLog(log.id);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95 transition"
              >
                <Send className="w-4 h-4" />
                ส่งบันทึกงานให้พี่เลี้ยง
              </button>
            </div>
          ) : null}

          {/* กรณีพี่เลี้ยงตรวจงาน */}
          {canMentorReview ? (
            <div>
              {!isAssignedMentor ? (
                <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-2.5 mb-3 font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>คุณไม่ใช่พี่เลี้ยงที่ได้รับเลือกโดยตรง แต่คุณมีสิทธิ์ช่วยตรวจสอบและยืนยันงานนี้ได้</span>
                </div>
              ) : null}
              {isRejecting ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="ระบุสิ่งที่ต้องการให้นักศึกษาแก้ไข (จำเป็น)..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full bg-white border border-rose-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsRejecting(false)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleRejectConfirm}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm active:scale-95 transition"
                    >
                      ยืนยันส่งกลับแก้ไข
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => setIsRejecting(true)}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    ส่งกลับให้แก้ไข
                  </button>

                  <button
                    onClick={() => {
                      mentorApprove(log.id);
                      onClose();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    พี่เลี้ยงกดยืนยัน & ส่งต่อหัวหน้า
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* กรณีหัวหน้าพี่เลี้ยงอนุมัติขั้นสุดท้าย */}
          {canLeadReview ? (
            <div>
              {isRejecting ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="ระบุเหตุผลที่หัวหน้าสั่งแก้ไข..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full bg-white border border-rose-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsRejecting(false)}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleRejectConfirm}
                      className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm active:scale-95 transition"
                    >
                      ยืนยันส่งกลับแก้ไข
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => setIsRejecting(true)}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition"
                  >
                    <RotateCcw className="w-4 h-4" />
                    ส่งกลับให้แก้ไข
                  </button>

                  <button
                    onClick={() => {
                      leadApprove(log.id);
                      onClose();
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    หัวหน้าพี่เลี้ยงกดอนุมัติขั้นสุดท้าย
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {!canTraineeSubmit && !canMentorReview && !canLeadReview ? (
            <div className="flex items-center justify-between text-xs text-slate-500 py-1 font-medium">
              <span>สถานะ: <strong className="text-slate-800 font-bold">{STATUS_LABELS[log.status]}</strong></span>
              {canEditOrDelete && (
                <span className="text-emerald-700 font-semibold">สามารถแก้ไขหรือลบงานได้ตลอดเวลาที่ปุ่มด้านบน</span>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

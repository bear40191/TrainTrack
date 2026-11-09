'use client';

import React, { useState } from 'react';
import { WorkLog } from '@/lib/types';
import { useAppStore } from '@/store/appStore';
import { StatusBadge } from '@/components/work-log/StatusBadge';
import { STATUS_LABELS } from '@/lib/constants';
import { formatDate, formatDateTime } from '@/lib/utils';
import { 
  X, Calendar, CheckCircle2, RotateCcw, 
  Send, MessageCircle, ArrowRight, UserCheck, AlertCircle 
} from 'lucide-react';

interface Props {
  log: WorkLog;
  onClose: () => void;
}

export const WorkLogDetailModal: React.FC<Props> = ({ log, onClose }) => {
  const { 
    currentUser, 
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

  const canTraineeSubmit = 
    currentUser.role === 'trainee' && 
    (log.status === 'draft' || log.status === 'revision_required');

  const isAssignedMentor = !log.assigned_mentor_id || log.assigned_mentor_id === currentUser.id;
  const canMentorReview = 
    currentUser.role === 'mentor' && log.status === 'pending_mentor';

  const canLeadReview = 
    currentUser.role === 'lead' && log.status === 'pending_lead';

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment(log.id, commentText.trim());
    setCommentText('');
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      alert('กรุณาระบุสิ่งที่ต้องการให้นักศึกษาแก้ไข');
      return;
    }

    if (currentUser.role === 'mentor') {
      mentorReject(log.id, rejectReason.trim());
    } else if (currentUser.role === 'lead') {
      leadReject(log.id, rejectReason.trim());
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
          <div className="flex items-center gap-3">
            <StatusBadge status={log.status} />
            <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-sm">
              {log.category}
            </span>
          </div>

          <button
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
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
                        <RotateCcw className="w-4 h-4 text-rose-600" />
                      ) : (
                        <Send className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">
                          {act.actor?.full_name || 'ผู้ใช้งาน'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {formatDateTime(act.created_at)}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs mt-0.5">
                        สถานะ: <span className="font-medium text-slate-700">{STATUS_LABELS[act.from_status]}</span>
                        {' '}<ArrowRight className="inline w-3 h-3 text-emerald-600 mx-1" />{' '}
                        <span className="text-emerald-700 font-bold">{STATUS_LABELS[act.to_status]}</span>
                      </p>
                      {act.note ? (
                        <p className="mt-1 p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs italic shadow-sm">
                          &ldquo;{act.note}&rdquo;
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">ยังไม่มีประวัติการส่ง</p>
              )}
            </div>
          </div>

          {/* ความคิดเห็น (Comments) */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              ความคิดเห็นและการสื่อสาร ({log.comments?.length || 0})
            </h4>

            {log.comments && log.comments.length > 0 ? (
              <div className="space-y-2.5">
                {log.comments.map((cmt) => (
                  <div key={cmt.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-emerald-800">
                        {cmt.author?.full_name || 'ผู้ใช้งาน'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {formatDateTime(cmt.created_at)}
                      </span>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed">{cmt.content}</p>
                  </div>
                ))}
              </div>
            ) : null}

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="พิมพ์ข้อความแนะนำ หรือความคิดเห็น..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
              >
                ส่งข้อความ
              </button>
            </form>
          </div>
        </div>

        {/* Modal Footer / Action Bar */}
        <div className="p-4 bg-[#EFEFEF] border-t border-slate-200 safe-bottom">
          {/* กรณีนักศึกษา: ส่งงาน / ส่งแก้ไข */}
          {canTraineeSubmit ? (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500 font-medium">
                สถานะปัจจุบัน: <strong className="text-amber-600">{STATUS_LABELS[log.status]}</strong>
              </p>
              <button
                onClick={() => {
                  submitWorkLog(log.id);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 active:scale-95 transition"
              >
                <Send className="w-4 h-4" />
                ส่งให้พี่เลี้ยงตรวจ
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
            <div className="text-center text-xs text-slate-500 py-1 font-medium">
              สถานะ: <span className="text-slate-800 font-bold">{STATUS_LABELS[log.status]}</span> (อ่านอย่างเดียว)
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

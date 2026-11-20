'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { WorkLog } from '@/lib/types';
import { WorkLogCard } from '@/components/work-log/WorkLogCard';
import { CheckSquare, UserCheck, Users, ShieldAlert, Sparkles, CheckCheck, Check, CheckCircle2 } from 'lucide-react';

interface Props {
  onSelectLog: (log: WorkLog) => void;
}

export const ReviewListView: React.FC<Props> = ({ onSelectLog }) => {
  const { currentUser, workLogs, mentorApproveAll, leadApproveAll } = useAppStore();
  const [confirmModalData, setConfirmModalData] = useState<{
    ids: string[];
    title: string;
    description: string;
  } | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const isMentor = currentUser.role === 'mentor';
  const isLead = currentUser.role === 'lead';

  const handleExecuteApproveAll = () => {
    if (!confirmModalData) return;
    const { ids } = confirmModalData;
    const count = ids.length;

    if (isMentor) {
      mentorApproveAll(ids);
    } else {
      leadApproveAll(ids);
    }

    setConfirmModalData(null);
    setSuccessToast(`อนุมัติงานทั้งหมด ${count} รายการเรียบร้อยแล้ว`);
    setTimeout(() => {
      setSuccessToast(null);
    }, 3500);
  };

  // ถ้าเป็น mentor: กรองงานที่ระบุถึงพี่เลี้ยงคนนี้เป็นพิเศษ
  const myAssignedPending = isMentor 
    ? workLogs.filter((l) => l.status === 'pending_mentor' && l.assigned_mentor_id === currentUser.id)
    : [];

  const otherPending = isMentor
    ? workLogs.filter((l) => l.status === 'pending_mentor' && l.assigned_mentor_id !== currentUser.id)
    : [];

  const leadPendingLogs = isLead
    ? workLogs.filter((l) => l.status === 'pending_lead')
    : [];

  const historyLogs = isMentor
    ? workLogs.filter((l) => (l.status === 'pending_lead' || l.status === 'approved') && l.assigned_mentor_id === currentUser.id)
    : isLead
      ? workLogs.filter((l) => l.status === 'approved')
      : [];

  return (
    <div className="space-y-6 pb-24">
      {/* Banner ข้อมูล Role ปัจจุบัน */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-sm shrink-0">
            {isMentor ? <UserCheck className="w-6 h-6" /> : <Users className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isMentor ? 'ศูนย์ตรวจงานประจำวันของพี่เลี้ยง' : 'ศูนย์อนุมัติงานขั้นสุดท้าย (หัวหน้าพี่เลี้ยง)'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {isMentor
                ? `กำลังปฏิบัติหน้าที่ในฐานะ: ${currentUser.full_name}`
                : 'ตรวจสอบงานที่พี่เลี้ยงยืนยันแล้ว และกดอนุมัติขั้นสุดท้าย'}
            </p>
          </div>
        </div>
      </div>

      {/* กรณีพี่เลี้ยง (Mentor): แยกส่วนงานที่มอบหมายถึงเราโดยตรง กับงานที่ช่วยตรวจได้ */}
      {isMentor ? (
        <div className="space-y-6">
          {/* งานที่มอบหมายถึงเรา */}
          <div>
            <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                งานที่ส่งถึงคุณโดยตรง ({myAssignedPending.length})
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">งานที่คุณเป็นพี่เลี้ยงผู้ดูแล</span>
                {myAssignedPending.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmModalData({
                        ids: myAssignedPending.map((l) => l.id),
                        title: 'ยืนยันอนุมัติงานที่ส่งถึงคุณทั้งหมด?',
                        description: `คุณต้องการอนุมัติและส่งต่องานทั้งหมด ${myAssignedPending.length} รายการไปยังหัวหน้าพี่เลี้ยงใช่หรือไม่?`,
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-[#19705F] hover:bg-[#145C4E] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>อนุมัติทั้งหมด ({myAssignedPending.length})</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3.5">
              {myAssignedPending.length > 0 ? (
                myAssignedPending.map((log) => (
                  <WorkLogCard key={log.id} log={log} onClick={() => onSelectLog(log)} />
                ))
              ) : (
                <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
                  <p className="text-sm font-semibold text-slate-700">ไม่มีงานที่ส่งถึงคุณโดยตรงในขณะนี้</p>
                </div>
              )}
            </div>
          </div>

          {/* งานของพี่เลี้ยงท่านอื่นที่สามารถช่วยตรวจได้ */}
          {otherPending.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  งานที่ส่งถึงพี่เลี้ยงท่านอื่น (ช่วยตรวจสอบได้) ({otherPending.length})
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmModalData({
                      ids: otherPending.map((l) => l.id),
                      title: 'ยืนยันอนุมัติงานของพี่เลี้ยงท่านอื่นทั้งหมด?',
                      description: `คุณต้องการช่วยอนุมัติและส่งต่องานทั้งหมด ${otherPending.length} รายการไปยังหัวหน้าพี่เลี้ยงใช่หรือไม่?`,
                    })
                  }
                  className="px-3 py-1.5 rounded-xl bg-[#2BA185] hover:bg-[#19705F] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>อนุมัติทั้งหมด ({otherPending.length})</span>
                </button>
              </div>

              <div className="space-y-3.5">
                {otherPending.map((log) => (
                  <WorkLogCard key={log.id} log={log} onClick={() => onSelectLog(log)} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* กรณีหัวหน้าพี่เลี้ยง (Lead): รายการรออนุมัติขั้นสุดท้าย */}
      {isLead ? (
        <div>
          <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              งานที่รออนุมัติขั้นสุดท้าย ({leadPendingLogs.length})
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">พี่เลี้ยงตรวจผ่านเกณฑ์แล้ว</span>
              {leadPendingLogs.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setConfirmModalData({
                      ids: leadPendingLogs.map((l) => l.id),
                      title: 'ยืนยันอนุมัติขั้นสุดท้ายทั้งหมด?',
                      description: `คุณต้องการอนุมัติขั้นสุดท้ายสำหรับงานทั้งหมด ${leadPendingLogs.length} รายการใช่หรือไม่?`,
                    })
                  }
                  className="px-3.5 py-1.5 rounded-xl bg-[#19705F] hover:bg-[#145C4E] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>อนุมัติขั้นสุดท้ายทั้งหมด ({leadPendingLogs.length})</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3.5">
            {leadPendingLogs.length > 0 ? (
              leadPendingLogs.map((log) => (
                <WorkLogCard key={log.id} log={log} onClick={() => onSelectLog(log)} />
              ))
            ) : (
              <div className="p-10 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
                <p className="text-sm text-emerald-700 font-bold mb-1">ยอดเยี่ยมมาก! ไม่มีงานค้างรออนุมัติ</p>
                <p className="text-xs text-slate-500">เมื่องานผ่านการยืนยันจากพี่เลี้ยงแล้ว รายการจะมาปรากฏที่นี่</p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* ประวัติงานที่เคยตรวจแล้ว */}
      {historyLogs.length > 0 ? (
        <div className="pt-2">
          <h3 className="text-base font-bold text-slate-700 mb-3.5">
            ประวัติงานที่ผ่านการตรวจแล้ว ({historyLogs.length})
          </h3>
          <div className="space-y-3.5">
            {historyLogs.map((log) => (
              <WorkLogCard key={log.id} log={log} onClick={() => onSelectLog(log)} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Modal ยืนยันอนุมัติทั้งหมด */}
      {confirmModalData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setConfirmModalData(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#19705F] flex items-center justify-center mb-4 mx-auto shadow-xs">
              <CheckCheck className="w-6 h-6" />
            </div>

            <div className="text-center mb-5">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {confirmModalData.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                {confirmModalData.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmModalData(null)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleExecuteApproveAll}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#19705F] hover:bg-[#145C4E] text-white font-bold text-xs shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>ยืนยันอนุมัติ ({confirmModalData.ids.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#19705F] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-bold animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-[#6FD098]" />
          <span>{successToast}</span>
        </div>
      )}
    </div>
  );
};

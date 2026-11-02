'use client';

import React from 'react';
import { useAppStore } from '@/store/appStore';
import { WorkLog } from '@/lib/types';
import { WorkLogCard } from '@/components/work-log/WorkLogCard';
import { CheckSquare, UserCheck, Users, ShieldAlert, Sparkles } from 'lucide-react';

interface Props {
  onSelectLog: (log: WorkLog) => void;
}

export const ReviewListView: React.FC<Props> = ({ onSelectLog }) => {
  const { currentUser, workLogs } = useAppStore();

  const isMentor = currentUser.role === 'mentor';
  const isLead = currentUser.role === 'lead';

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
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                งานที่ส่งถึงคุณโดยตรง ({myAssignedPending.length})
              </h3>
              <span className="text-xs text-slate-500 font-medium">งานที่คุณเป็นพี่เลี้ยงผู้ดูแล</span>
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
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  งานที่ส่งถึงพี่เลี้ยงท่านอื่น (ช่วยตรวจสอบได้) ({otherPending.length})
                </h3>
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
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              งานที่รออนุมัติขั้นสุดท้าย ({leadPendingLogs.length})
            </h3>
            <span className="text-xs text-slate-500 font-medium">พี่เลี้ยงตรวจผ่านเกณฑ์แล้ว</span>
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
    </div>
  );
};

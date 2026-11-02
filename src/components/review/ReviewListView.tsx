'use client';

import React from 'react';
import { useAppStore } from '@/store/appStore';
import { WorkLog } from '@/lib/types';
import { WorkLogCard } from '@/components/work-log/WorkLogCard';
import { CheckSquare, UserCheck, Users } from 'lucide-react';

interface Props {
  onSelectLog: (log: WorkLog) => void;
}

export const ReviewListView: React.FC<Props> = ({ onSelectLog }) => {
  const { currentUser, workLogs } = useAppStore();

  const isMentor = currentUser.role === 'mentor';
  const isLead = currentUser.role === 'lead';

  const pendingLogs = isMentor
    ? workLogs.filter((l) => l.status === 'pending_mentor')
    : isLead
      ? workLogs.filter((l) => l.status === 'pending_lead')
      : [];

  const historyLogs = isMentor
    ? workLogs.filter((l) => l.status === 'pending_lead' || l.status === 'approved')
    : isLead
      ? workLogs.filter((l) => l.status === 'approved')
      : [];

  return (
    <div className="space-y-6 pb-24">
      {/* Banner ข้อมูล Role ปัจจุบัน */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-sm">
            {isMentor ? <UserCheck className="w-6 h-6" /> : <Users className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isMentor ? 'ศูนย์ตรวจงานประจำวันของพี่เลี้ยง' : 'ศูนย์อนุมัติงานขั้นสุดท้าย (หัวหน้าพี่เลี้ยง)'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {isMentor
                ? 'ตรวจและยืนยันงานเพื่อส่งต่อให้หัวหน้าพี่เลี้ยง'
                : 'ตรวจสอบงานที่พี่เลี้ยงยืนยันแล้ว และกดอนุมัติขั้นสุดท้าย'}
            </p>
          </div>
        </div>
      </div>

      {/* รายการที่รอดำเนินการ */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-600" />
            งานที่รอดำเนินการ ({pendingLogs.length})
          </h3>
          <span className="text-xs text-slate-500 font-medium">คลิกที่การ์ดเพื่อตรวจสอบและกดยืนยัน</span>
        </div>

        <div className="space-y-3.5">
          {pendingLogs.length > 0 ? (
            pendingLogs.map((log) => (
              <WorkLogCard key={log.id} log={log} onClick={() => onSelectLog(log)} />
            ))
          ) : (
            <div className="p-10 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
              <p className="text-sm text-emerald-700 font-bold mb-1">ยอดเยี่ยมมาก! ไม่มีงานค้างตรวจในขณะนี้</p>
              <p className="text-xs text-slate-500">เมื่อนักศึกษาฝึกงานส่งบันทึกงานใหม่ รายการจะมาปรากฏที่นี่</p>
            </div>
          )}
        </div>
      </div>

      {/* ประวัติงานที่เคยตรวจแล้ว */}
      {historyLogs.length > 0 && (
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
      )}
    </div>
  );
};

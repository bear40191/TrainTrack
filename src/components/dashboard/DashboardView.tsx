'use client';

import React from 'react';
import { useAppStore } from '@/store/appStore';
import { WorkLog } from '@/lib/types';
import { WorkLogCard } from '@/components/work-log/WorkLogCard';
import { 
  CheckCircle2, Clock, AlertTriangle, FileText, 
  TrendingUp, Plus 
} from 'lucide-react';

interface Props {
  onOpenCreate: () => void;
  onSelectLog: (log: WorkLog) => void;
}

export const DashboardView: React.FC<Props> = ({ onOpenCreate, onSelectLog }) => {
  const { currentUser, workLogs } = useAppStore();

  const myLogs = currentUser.role === 'trainee' 
    ? workLogs.filter((l) => l.trainee_id === currentUser.id)
    : workLogs;

  const totalLogs = myLogs.length;
  const pendingLogs = myLogs.filter((l) => l.status === 'pending_mentor' || l.status === 'pending_lead').length;
  const approvedLogs = myLogs.filter((l) => l.status === 'approved').length;
  const revisionLogs = myLogs.filter((l) => l.status === 'revision_required').length;
  const totalHours = myLogs.reduce((acc, curr) => acc + (curr.hours_spent || 0), 0);
  const approvalRate = totalLogs > 0 ? Math.round((approvedLogs / totalLogs) * 100) : 0;

  return (
    <div className="space-y-6 pb-24">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ยินดีต้อนรับเข้าสู่ระบบ
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {currentUser.full_name}
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">
              {currentUser.role === 'trainee' 
                ? 'ติดตามชั่วโมงฝึกงาน ตรวจสอบสถานะการอนุมัติ และบันทึกผลงานประจำวัน'
                : 'ตรวจสอบรายงานผลการปฏิบัติงานของนักศึกษาในสังกัด'}
            </p>
          </div>

          {currentUser.role === 'trainee' && (
            <button
              onClick={onOpenCreate}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition active:scale-95 shrink-0"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              บันทึกงานใหม่วันนี้
            </button>
          )}
        </div>
      </div>

      {/* สถิติ 4 ช่อง */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs sm:text-sm font-medium">บันทึกทั้งหมด</span>
            <div className="p-2 bg-slate-50 rounded-xl text-slate-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{totalLogs}</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">รวม {totalHours} ชั่วโมง</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs sm:text-sm font-medium">รออนุมัติ</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">{pendingLogs}</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">พี่เลี้ยง/หัวหน้า</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs sm:text-sm font-medium">อนุมัติแล้ว</span>
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{approvedLogs}</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">สำเร็จ {approvalRate}%</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs sm:text-sm font-medium">ส่งกลับแก้ไข</span>
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600">{revisionLogs}</div>
          <div className="text-xs text-slate-500 mt-1 font-medium">ต้องปรับปรุง</div>
        </div>
      </div>

      {/* สะสมชั่วโมงฝึกงาน */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-card">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">เป้าหมายสะสมชั่วโมงฝึกงาน</h3>
          </div>
          <span className="text-sm font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {totalHours} / 300 ชม. ({Math.min(100, Math.round((totalHours / 300) * 100))}%)
          </span>
        </div>

        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (totalHours / 300) * 100)}%` }}
          />
        </div>
        <p className="text-xs sm:text-sm text-slate-500 mt-3 font-medium">
          เป้าหมายหลักสูตรสหกิจศึกษา / ฝึกงาน 300 ชั่วโมง (ต้องการอีก {Math.max(0, 300 - totalHours)} ชม.)
        </p>
      </div>

      {/* รายการงาน */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            {currentUser.role === 'trainee' ? 'รายการงานล่าสุดของคุณ' : 'รายการงานทั้งหมดในระบบ'}
          </h3>
          <span className="text-xs sm:text-sm text-slate-500 font-medium">{myLogs.length} รายการ</span>
        </div>

        <div className="space-y-3.5">
          {myLogs.length > 0 ? (
            myLogs.slice(0, 5).map((log) => (
              <WorkLogCard key={log.id} log={log} onClick={() => onSelectLog(log)} />
            ))
          ) : (
            <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
              <p className="text-sm text-slate-500">ยังไม่มีบันทึกงาน กดปุ่ม &quot;บันทึกงานใหม่วันนี้&quot; เพื่อเริ่มต้น</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

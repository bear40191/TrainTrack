'use client';

import React from 'react';
import { useAppStore } from '@/store/appStore';
import { WorkLog } from '@/lib/types';
import { WorkLogCard } from '@/components/work-log/WorkLogCard';
import { 
  CheckCircle2, Clock, AlertTriangle, FileText, 
  Plus, Users, CheckSquare, ArrowRight
} from 'lucide-react';

interface Props {
  onOpenCreate: () => void;
  onSelectLog: (log: WorkLog) => void;
  onNavigateTab?: (tab: 'reviews' | 'my-logs') => void;
}

export const DashboardView: React.FC<Props> = ({ onOpenCreate, onSelectLog, onNavigateTab }) => {
  const { currentUser, workLogs, mentors } = useAppStore();

  const isTrainee = currentUser.role === 'trainee';
  const isMentor = currentUser.role === 'mentor';
  const isLead = currentUser.role === 'lead';
  const isAdmin = currentUser.role === 'admin';

  // ข้อมูลของนักศึกษา
  const myTraineeLogs = workLogs.filter((l) => l.trainee_id === currentUser.id);
  const traineeTotalLogs = myTraineeLogs.length;
  const traineePendingLogs = myTraineeLogs.filter((l) => l.status === 'pending_mentor' || l.status === 'pending_lead').length;
  const traineeApprovedLogs = myTraineeLogs.filter((l) => l.status === 'approved').length;
  const traineeRevisionLogs = myTraineeLogs.filter((l) => l.status === 'revision_required').length;
  const traineeApprovalRate = traineeTotalLogs > 0 ? Math.round((traineeApprovedLogs / traineeTotalLogs) * 100) : 0;

  // ข้อมูลของพี่เลี้ยง (Mentor): ดึงงานเฉพาะที่ส่งให้พี่เลี้ยงคนนี้ หรือพี่เลี้ยงช่วยตรวจ
  const mentorPendingLogs = workLogs.filter(
    (l) => l.status === 'pending_mentor' && (!l.assigned_mentor_id || l.assigned_mentor_id === currentUser.id)
  );
  const mentorApprovedLogs = workLogs.filter(
    (l) => (l.status === 'pending_lead' || l.status === 'approved') && l.assigned_mentor_id === currentUser.id
  );
  const mentorRevisionLogs = workLogs.filter(
    (l) => l.status === 'revision_required' && l.assigned_mentor_id === currentUser.id
  );

  // ข้อมูลของหัวหน้าพี่เลี้ยง (Lead): ตรวจสอบภาพรวมทั้งทีม
  const leadPendingLogs = workLogs.filter((l) => l.status === 'pending_lead');
  const leadApprovedLogs = workLogs.filter((l) => l.status === 'approved');
  const leadRevisionLogs = workLogs.filter((l) => l.status === 'revision_required');
  const totalSystemLogs = workLogs.length;

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
              {isTrainee && 'ตรวจสอบสถานะการอนุมัติ ส่งงานใหม่ และติดตามผลการปฏิบัติงาน'}
              {isMentor && 'ศูนย์ตรวจและยืนยันงานของนักศึกษาฝึกงานเพื่อส่งต่อให้หัวหน้าพี่เลี้ยง'}
              {isLead && 'ภาพรวมการอนุมัติงานขั้นสุดท้ายและการประเมินนักศึกษาฝึกงานทั้งทีม'}
              {isAdmin && 'ระบบจัดการผู้ใช้งาน แผนก และรายงานบันทึกการฝึกงาน'}
            </p>
          </div>

          {isTrainee && (
            <button
              onClick={onOpenCreate}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition active:scale-95 shrink-0"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              บันทึกงานใหม่วันนี้
            </button>
          )}

          {(isMentor || isLead) && onNavigateTab && (
            <button
              onClick={() => onNavigateTab('reviews')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition active:scale-95 shrink-0"
            >
              <CheckSquare className="w-5 h-5 stroke-[2.5]" />
              {isMentor ? 'เปิดหน้าตรวจงาน' : 'เปิดหน้าอนุมัติงาน'}
            </button>
          )}
        </div>
      </div>

      {/* ======================= 1. DASHBOARD สำหรับ นักศึกษาฝึกงาน (Trainee) ======================= */}
      {isTrainee && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs sm:text-sm font-medium">บันทึกทั้งหมด</span>
                <div className="p-2 bg-slate-50 rounded-xl text-slate-600">
                  <FileText className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{traineeTotalLogs}</div>
              <div className="text-xs text-slate-400 mt-1">รายการงานที่ส่ง</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs sm:text-sm font-medium">รออนุมัติ</span>
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">{traineePendingLogs}</div>
              <div className="text-xs text-slate-400 mt-1">พี่เลี้ยง/หัวหน้า</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs sm:text-sm font-medium">อนุมัติแล้ว</span>
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{traineeApprovedLogs}</div>
              <div className="text-xs text-slate-400 mt-1">สำเร็จ {traineeApprovalRate}%</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs sm:text-sm font-medium">ส่งกลับแก้ไข</span>
                <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-600">{traineeRevisionLogs}</div>
              <div className="text-xs text-slate-400 mt-1">ต้องปรับปรุง</div>
            </div>
          </div>

          {/* รายการงานล่าสุดของนักศึกษา */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                รายการงานล่าสุดของคุณ
              </h3>
              <span className="text-xs sm:text-sm text-slate-500 font-medium">{myTraineeLogs.length} รายการ</span>
            </div>

            <div className="space-y-3.5">
              {myTraineeLogs.length > 0 ? (
                myTraineeLogs.slice(0, 5).map((log) => (
                  <WorkLogCard key={log.id} log={log} onClick={() => onSelectLog(log)} />
                ))
              ) : (
                <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
                  <p className="text-sm text-slate-500">ยังไม่มีบันทึกงาน กดปุ่ม &quot;บันทึกงานใหม่วันนี้&quot; เพื่อเริ่มต้น</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ======================= 2. DASHBOARD สำหรับ พี่เลี้ยง (Mentor) ======================= */}
      {isMentor && (
        <>
          {/* การ์ดสถิติของพี่เลี้ยง (ไม่มีช่องบันทึกทั้งหมด และไม่มีเรื่องชั่วโมง) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs sm:text-sm font-medium">งานที่รอตรวจ</span>
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">{mentorPendingLogs.length}</div>
              <div className="text-xs text-slate-400 mt-1">รอยืนยันเพื่อส่งต่อหัวหน้า</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs sm:text-sm font-medium">ยืนยันแล้ว</span>
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{mentorApprovedLogs.length}</div>
              <div className="text-xs text-slate-400 mt-1">ผ่านเกณฑ์พี่เลี้ยงเรียบร้อย</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs sm:text-sm font-medium">ส่งกลับให้นักศึกษาแก้ไข</span>
                <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-600">{mentorRevisionLogs.length}</div>
              <div className="text-xs text-slate-400 mt-1">รอนักศึกษาปรับปรุงส่งใหม่</div>
            </div>
          </div>

          {/* รายการงานที่รอพี่เลี้ยงตรวจ */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                งานที่รอนักศึกษาได้รับการตรวจสอบ ({mentorPendingLogs.length})
              </h3>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('reviews')}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <span>ดูทั้งหมด</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-3.5">
              {mentorPendingLogs.length > 0 ? (
                mentorPendingLogs.map((log) => (
                  <WorkLogCard key={log.id} log={log} onClick={() => onSelectLog(log)} />
                ))
              ) : (
                <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">ไม่มีงานค้างตรวจในขณะนี้</p>
                  <p className="text-xs text-slate-400 mt-1">เมื่องานใหม่ส่งมาถึงคุณ ระบบจะแสดงขึ้นที่นี่ทันที</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ======================= 3. DASHBOARD สำหรับ หัวหน้าพี่เลี้ยง (Lead) ======================= */}
      {isLead && (
        <>
          {/* การ์ดสถิติของหัวหน้าพี่เลี้ยง (ไม่มีช่องบันทึกทั้งหมด และไม่มีเรื่องชั่วโมง) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs sm:text-sm font-medium">รออนุมัติขั้นสุดท้าย</span>
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">{leadPendingLogs.length}</div>
              <div className="text-xs text-slate-400 mt-1">พี่เลี้ยงกดยืนยันแล้ว</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs sm:text-sm font-medium">อนุมัติเสร็จสิ้นแล้ว</span>
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{leadApprovedLogs.length}</div>
              <div className="text-xs text-slate-400 mt-1">ผ่านเกณฑ์สมบูรณ์ทั้งระบบ</div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs sm:text-sm font-medium">ส่งกลับให้แก้ไข</span>
                <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-600">{leadRevisionLogs.length}</div>
              <div className="text-xs text-slate-400 mt-1">งานที่ต้องแก้ไขในทีม</div>
            </div>
          </div>

          {/* ภาพรวมทีมพี่เลี้ยงและนักศึกษา */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-card">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              ทีมพี่เลี้ยงผู้ดูแล ({mentors.length} ท่าน)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {mentors.map((m) => {
                const assignedCount = workLogs.filter((l) => l.assigned_mentor_id === m.id).length;
                return (
                  <div key={m.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                    <p className="font-bold text-sm text-slate-800">{m.full_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{m.position || 'พี่เลี้ยง'}</p>
                    <div className="mt-2.5 inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                      ดูแล {assignedCount} รายการงาน
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* รายการงานที่รอหัวหน้าอนุมัติ */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                งานที่รอหัวหน้าพี่เลี้ยงอนุมัติขั้นสุดท้าย ({leadPendingLogs.length})
              </h3>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('reviews')}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <span>ดูทั้งหมด</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-3.5">
              {leadPendingLogs.length > 0 ? (
                leadPendingLogs.map((log) => (
                  <WorkLogCard key={log.id} log={log} onClick={() => onSelectLog(log)} />
                ))
              ) : (
                <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">ไม่มีงานรออนุมัติขั้นสุดท้าย</p>
                  <p className="text-xs text-slate-400 mt-1">เมื่อพี่เลี้ยงกดยืนยันงานแล้ว รายการจะปรากฏที่นี่</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ======================= 4. DASHBOARD สำหรับ ผู้ดูแลระบบ (Admin) ======================= */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
            <span className="text-xs sm:text-sm text-slate-500 font-medium">บันทึกในระบบทั้งหมด</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">{totalSystemLogs}</div>
            <div className="text-xs text-slate-400 mt-1">รายการงานทุกสถานะ</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
            <span className="text-xs sm:text-sm text-slate-500 font-medium">พี่เลี้ยงในระบบ</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-2">{mentors.length}</div>
            <div className="text-xs text-slate-400 mt-1">พร้อมปฏิบัติงาน</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
            <span className="text-xs sm:text-sm text-slate-500 font-medium">นักศึกษาในระบบ</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 mt-2">1 คน</div>
            <div className="text-xs text-slate-400 mt-1">Demo Profile</div>
          </div>
        </div>
      )}
    </div>
  );
};

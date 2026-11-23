'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import { WorkLog } from '@/lib/types';
import { formatToDMY } from '@/lib/utils';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowRight,
  FileText,
  UserCheck,
  Users,
  Award,
  ShieldCheck,
  ChevronRight,
  Inbox,
  CheckCheck,
  Check
} from 'lucide-react';

interface Props {
  onSelectLog: (log: WorkLog) => void;
  onNavigateTab?: (tab: 'reviews' | 'my-logs') => void;
}

export const MentorLeadDashboard: React.FC<Props> = ({ onSelectLog, onNavigateTab }) => {
  const { currentUser, workLogs, trainees, mentors, mentorApproveAll, leadApproveAll } = useAppStore();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const isMentor = currentUser.role === 'mentor';
  const isLead = currentUser.role === 'lead';

  // 1. กรองงานที่รอตรวจตามบทบาท
  // พี่เลี้ยง: ตรวจงานที่สถานะเป็น pending_mentor
  // หัวหน้า: ตรวจงานที่สถานะเป็น pending_lead
  const pendingQueue = useMemo(() => {
    if (isMentor) {
      return workLogs.filter((l) => l.status === 'pending_mentor');
    }
    if (isLead) {
      return workLogs.filter((l) => l.status === 'pending_lead');
    }
    return [];
  }, [workLogs, isMentor, isLead]);

  const handleApproveAllConfirm = () => {
    const count = pendingQueue.length;
    const ids = pendingQueue.map((l) => l.id);
    if (isMentor) {
      mentorApproveAll(ids);
    } else {
      leadApproveAll(ids);
    }
    setShowConfirmModal(false);
    setSuccessToast(`อนุมัติงานทั้งหมด ${count} รายการเรียบร้อยแล้ว`);
    setTimeout(() => {
      setSuccessToast(null);
    }, 3500);
  };

  // สถิติรวม
  const approvedCount = useMemo(() => {
    return workLogs.filter((l) => l.status === 'approved').length;
  }, [workLogs]);

  const revisionCount = useMemo(() => {
    return workLogs.filter((l) => l.status === 'revision_required').length;
  }, [workLogs]);

  // 2. ข้อมูลสรุปนักศึกษาในความดูแล (ดึงจาก trainees ใน store ร่วมกับ workLogs)
  const traineesList = useMemo(() => {
    return trainees.map((t) => {
      const studentLogs = workLogs.filter((l) => l.trainee_id === t.id);
      const totalLogs = studentLogs.length;
      const approvedLogs = studentLogs.filter((l) => l.status === 'approved').length;
      const pendingLogs = studentLogs.filter((l) => l.status === 'pending_mentor' || l.status === 'pending_lead').length;
      const assignedMentor = mentors.find((m) => m.id === t.mentor_id);

      return {
        id: t.id,
        full_name: t.full_name,
        email: t.email,
        avatar_url: t.avatar_url,
        position: t.position || 'นักศึกษาฝึกงาน (Intern)',
        mentor_id: t.mentor_id,
        mentor_name: assignedMentor?.full_name?.split(' ')[0] || null,
        isMyTrainee: isMentor && t.mentor_id === currentUser.id,
        totalLogs,
        approvedLogs,
        pendingLogs,
      };
    });
  }, [trainees, workLogs, mentors, isMentor, currentUser.id]);

  // 3. กิจกรรมล่าสุด (เรียงจากบนลงล่าง: รายการล่าสุดอยู่บนสุดเสมอ)
  const recentActivities = useMemo(() => {
    return [...workLogs]
      .sort((a, b) => {
        const dateA = new Date(a.work_date || a.created_at).getTime();
        const dateB = new Date(b.work_date || b.created_at).getTime();
        if (dateB !== dateA) return dateB - dateA;
        return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
      })
      .slice(0, 3);
  }, [workLogs]);

  return (
    <div className="h-full flex flex-col justify-between font-sans gap-3">
      {/* =========================================================================
          หัวข้อที่ 1: WELCOME HERO & QUICK METRICS BAR (การ์ดต้อนรับและสถิติด่วน)
          ========================================================================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs relative overflow-hidden animate-fade-in-up [animation-delay:50ms] hover:shadow-md transition-all duration-300">
        {/* Subtle decorative glowing background blur */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-[#6FD098]/15 via-[#2BA185]/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          {/* Left: Role Info & Greeting */}
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#19705F] to-[#2BA185] flex items-center justify-center text-white shadow-md shadow-[#19705F]/20 group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
                {isMentor ? <UserCheck className="w-6 h-6 stroke-[2.2]" /> : <ShieldCheck className="w-6 h-6 stroke-[2.2]" />}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#6FD098] border-2 border-white shadow-xs" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  สวัสดี, {currentUser.full_name?.split(' ')[0] || (isMentor ? 'พี่เลี้ยง' : 'หัวหน้า')}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-extrabold bg-[#E2F4EB] text-[#19705F] border border-[#C2EAD6] animate-pulse-glow">
                  <Sparkles className="w-3 h-3 text-[#2BA185]" />
                  {isMentor ? 'พี่เลี้ยงประจำทีม' : 'หัวหน้าพี่เลี้ยง (Lead)'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                {isMentor
                  ? 'ตรวจสอบและให้คำแนะนำบันทึกการปฏิบัติงานของนักศึกษาฝึกงาน'
                  : 'ศูนย์พิจารณาและอนุมัติขั้นสุดท้ายสำหรับผลการฝึกงาน'}
              </p>
            </div>
          </div>

          {/* Right: Quick Action Button to Review Hub */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              onClick={() => onNavigateTab && onNavigateTab('reviews')}
              className="px-4.5 py-2.5 rounded-xl bg-[#19705F] hover:bg-[#145C4E] active:scale-95 text-white font-bold text-sm shadow-md shadow-[#19705F]/25 hover:shadow-lg hover:shadow-[#19705F]/35 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 group cursor-pointer"
            >
              <span>เปิดศูนย์ตรวจงาน</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>
        </div>

        {/* 3 Quick Metric Badges with Staggered Entrance */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100/90">
          
          {/* Stat 1: รอตรวจทันที (Pending Action) */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('reviews')}
            className={`p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer group hover:-translate-y-1 ${
              pendingQueue.length > 0
                ? 'bg-gradient-to-r from-[#19705F] to-[#145C4E] text-white border-[#125447] shadow-sm hover:shadow-md'
                : 'bg-[#EFEFEF]/80 text-slate-700 border-slate-200 hover:bg-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-xs sm:text-sm font-bold ${pendingQueue.length > 0 ? 'text-[#C2EAD6]' : 'text-slate-500'}`}>
                {isMentor ? 'งานที่รอพี่เลี้ยงตรวจ' : 'งานที่รอยืนยันอนุมัติ'}
              </span>
              {pendingQueue.length > 0 ? (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6FD098] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#6FD098]" />
                </span>
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#2BA185]" />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black tracking-tight">
                {pendingQueue.length}
              </span>
              <span className={`text-xs font-semibold ${pendingQueue.length > 0 ? 'text-white/80' : 'text-slate-500'}`}>
                {pendingQueue.length > 0 ? 'รายการที่ต้องจัดการด่วน' : 'ไม่มีงานค้างตรวจ 🎉'}
              </span>
            </div>
          </div>

          {/* Stat 2: อนุมัติสำเร็จแล้ว (Approved) */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-[#2BA185]/60 hover:shadow-xs transition-all duration-300 hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs sm:text-sm font-bold text-slate-500">
                อนุมัติสำเร็จแล้ว
              </span>
              <Award className="w-4 h-4 text-[#2BA185] group-hover:scale-110 transition-transform duration-200" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {approvedCount}
              </span>
              <span className="text-xs font-bold text-[#2BA185] bg-[#E2F4EB] px-2.5 py-0.5 rounded-full border border-[#C2EAD6]">
                ผ่านเกณฑ์
              </span>
            </div>
          </div>

          {/* Stat 3: ส่งกลับแก้ไข (Revision Required) */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-300 hover:shadow-xs transition-all duration-300 hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs sm:text-sm font-bold text-slate-500">
                ส่งกลับแก้ไข
              </span>
              <AlertCircle className="w-4 h-4 text-amber-500 group-hover:rotate-12 transition-transform duration-200" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {revisionCount}
              </span>
              <span className="text-xs font-medium text-slate-500">
                รายการที่แจ้งน้องปรับปรุง
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================================
          MAIN 2-COLUMN SECTION (คิวงานรอตรวจ + สรุปนักศึกษาในความดูแล)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch flex-1 min-h-0">
        
        {/* =========================================================================
            หัวข้อที่ 2: คิวงานรอการตรวจสอบ (PENDING REVIEW QUEUE - 8 COLS)
            ========================================================================= */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col justify-between min-h-0 overflow-hidden animate-fade-in-up [animation-delay:140ms] hover:shadow-md transition-shadow duration-300">
          
          {/* Header of Queue */}
          <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E2F4EB] text-[#19705F] flex items-center justify-center font-bold">
                <Clock className="w-4.5 h-4.5 text-[#2BA185]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {isMentor ? 'คิวงานที่รอคุณตรวจสอบ' : 'คิวงานที่รอยืนยันอนุมัติขั้นสุดท้าย'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  {isMentor ? 'คลิก "ตรวจงาน" เพื่อดูรายละเอียด บันทึกความคิดเห็น หรืออนุมัติ' : 'ตรวจสอบความถูกต้องและกดยืนยันผลการประเมิน'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black px-2.5 py-1 rounded-xl bg-[#EFEFEF] text-slate-700 border border-slate-200">
                {pendingQueue.length} งาน
              </span>
              {pendingQueue.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#19705F] hover:bg-[#145C4E] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition cursor-pointer"
                  title={isMentor ? 'อนุมัติงานทั้งหมดในคิว' : 'อนุมัติขั้นสุดท้ายงานทั้งหมดในคิว'}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>อนุมัติทั้งหมด</span>
                </button>
              )}
            </div>
          </div>

          {/* List of Pending Items */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-0">
            {pendingQueue.length > 0 ? (
              pendingQueue.map((log, index) => (
                <div
                  key={log.id}
                  onClick={() => onSelectLog(log)}
                  style={{
                    animationDelay: `${index * 60 + 100}ms`
                  }}
                  className="p-3.5 sm:p-4 rounded-2xl bg-[#EFEFEF]/50 hover:bg-[#EFEFEF] border border-slate-200/80 hover:border-[#2BA185]/60 hover:shadow-xs transition-all duration-200 cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in-up"
                >
                  {/* Left: Info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/90 text-[#19705F] flex items-center justify-center font-extrabold text-sm shadow-2xs shrink-0 group-hover:bg-[#19705F] group-hover:text-white group-hover:scale-105 transition-all duration-200">
                      {log.trainee?.full_name?.charAt(0) || 'U'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-extrabold text-[#19705F] bg-[#E2F4EB] px-2.5 py-0.5 rounded-md border border-[#C2EAD6]">
                          {log.trainee?.full_name?.split(' ')[0] || 'นักศึกษา'}
                        </span>
                        <span className="text-xs font-semibold text-slate-600">
                          {formatToDMY(log.work_date)}
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          • {log.category}
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#19705F] transition-colors truncate">
                        {log.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-1 mt-0.5">
                        {log.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Quick Action Button */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLog(log);
                      }}
                      className="px-4 py-2 rounded-xl bg-white group-hover:bg-[#19705F] text-slate-700 group-hover:text-white border border-slate-200 group-hover:border-[#19705F] font-bold text-sm shadow-2xs hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1.5"
                    >
                      <span>กดตรวจงาน</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              /* Empty State - Friendly Clean Illustration */
              <div className="h-full flex flex-col items-center justify-center text-center py-10 px-4">
                <div className="w-16 h-16 rounded-3xl bg-[#E2F4EB] border border-[#C2EAD6] flex items-center justify-center text-[#19705F] mb-3 animate-float-slow shadow-xs">
                  <Inbox className="w-8 h-8 text-[#2BA185]" />
                </div>
                <h4 className="text-base font-bold text-slate-800">
                  ไม่มีงานค้างรอตรวจสอบในขณะนี้
                </h4>
                <p className="text-sm text-slate-500 max-w-sm mt-1">
                  ยอดเยี่ยมมาก! คุณได้ตรวจสอบงานของนักศึกษาครบถ้วนแล้ว ระบบจะแจ้งเตือนทันทีเมื่อมีงานใหม่ส่งเข้ามา
                </p>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('reviews')}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#EFEFEF] hover:bg-slate-200 text-slate-700 font-bold text-sm border border-slate-200/90 transition shadow-2xs"
                >
                  ดูประวัติการตรวจที่ผ่านมา
                </button>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm text-slate-500 font-medium shrink-0">
            <span>* คลิกที่งานเพื่อเปิดหน้าต่างตรวจสอบและลงความเห็น</span>
            <button
              onClick={() => onNavigateTab && onNavigateTab('reviews')}
              className="text-[#19705F] hover:text-[#145C4E] font-bold inline-flex items-center gap-1 hover:underline"
            >
              <span>ดูงานทั้งหมดในระบบ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* =========================================================================
            RIGHT COLUMN: หัวข้อที่ 3 (นักศึกษาในความดูแล) & หัวข้อที่ 4 (กิจกรรมล่าสุด) (4 COLS)
            ========================================================================= */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-3 min-h-0">
          
          {/* หัวข้อที่ 3: สรุปนักศึกษาในความดูแล (Supervised Trainees) */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex-1 flex flex-col justify-between min-h-0 animate-fade-in-right [animation-delay:180ms] hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#E2F4EB] text-[#19705F] flex items-center justify-center font-bold">
                  <Users className="w-4 h-4 text-[#2BA185]" />
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  นักศึกษาในความดูแล
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-[#EFEFEF] px-2.5 py-0.5 rounded-lg border border-slate-200">
                {traineesList.length} คน
              </span>
            </div>

            {/* Trainee Card List */}
            <div className="space-y-2.5 overflow-y-auto pr-0.5 flex-1 min-h-0">
              {traineesList.map((t) => {
                const passRate = t.totalLogs > 0 ? Math.round((t.approvedLogs / t.totalLogs) * 100) : 0;
                return (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-2xl bg-[#EFEFEF]/50 hover:bg-[#EFEFEF] border border-slate-200/80 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#19705F] to-[#2BA185] text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform duration-200">
                        {t.full_name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-sm font-bold text-slate-900 truncate group-hover:text-[#19705F] transition-colors">
                            {t.full_name}
                          </p>
                          {t.isMyTrainee && (
                            <span className="px-2 py-0.2 rounded text-[10px] font-extrabold bg-[#E2F4EB] text-[#19705F] border border-[#C2EAD6]">
                              ดูแลโดยคุณ
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {t.position || t.email} {t.mentor_name && !t.isMyTrainee ? `• พี่เลี้ยง: ${t.mentor_name}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar of Trainee */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-600">ความคืบหน้างาน</span>
                        <span className="text-[#19705F]">{t.approvedLogs}/{t.totalLogs} ผ่าน ({passRate}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden p-0.5">
                        <div
                          className="h-full rounded-full bg-[#2BA185] transition-all duration-700 ease-out"
                          style={{ width: `${Math.max(passRate, 10)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2.5 text-right shrink-0">
              <span className="text-xs text-slate-400 font-medium">
                * ข้อมูลประเมินผลการฝึกงานอัปเดตแบบ Realtime
              </span>
            </div>
          </div>

          {/* หัวข้อที่ 4: กิจกรรมล่าสุด (Recent Activities) */}
          <div className="bg-white rounded-3xl p-4.5 border border-slate-200/90 shadow-2xs shrink-0 animate-fade-in-right [animation-delay:260ms] hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2BA185]" />
                <span>กิจกรรมล่าสุดในทีม</span>
              </h4>
              <span className="text-xs text-slate-400 font-semibold">อัปเดตล่าสุด</span>
            </div>

            <div className="space-y-2">
              {recentActivities.map((log) => (
                <div
                  key={log.id}
                  onClick={() => onSelectLog(log)}
                  className="flex items-center justify-between gap-2.5 p-2 rounded-xl hover:bg-[#EFEFEF] transition-all duration-150 cursor-pointer group"
                >
                  <div className="min-w-0 flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs group-hover:bg-[#19705F] group-hover:text-white transition-colors duration-150 shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 truncate group-hover:text-[#19705F] transition-colors">
                        {log.title}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {log.trainee?.full_name?.split(' ')[0]} • {formatToDMY(log.work_date)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-transform group-hover:scale-105 ${
                      log.status === 'approved'
                        ? 'bg-[#E2F4EB] text-[#19705F] border-[#C2EAD6]'
                        : log.status === 'revision_required'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {log.status === 'approved' ? 'อนุมัติ' : log.status === 'revision_required' ? 'แก้ไข' : 'รอตรวจ'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Modal ยืนยันอนุมัติทั้งหมด */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowConfirmModal(false)}
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
                ยืนยันการอนุมัติทั้งหมด?
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                {isMentor
                  ? `คุณต้องการอนุมัติและส่งต่องานในคิวทั้งหมด ${pendingQueue.length} รายการไปยังหัวหน้าพี่เลี้ยงใช่หรือไม่?`
                  : `คุณต้องการยืนยันอนุมัติขั้นสุดท้ายสำหรับงานทั้งหมด ${pendingQueue.length} รายการใช่หรือไม่?`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleApproveAllConfirm}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#19705F] hover:bg-[#145C4E] text-white font-bold text-xs shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>ยืนยันอนุมัติ ({pendingQueue.length})</span>
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

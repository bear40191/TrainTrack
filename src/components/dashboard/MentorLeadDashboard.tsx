'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import { WorkLog } from '@/lib/types';
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
  Inbox
} from 'lucide-react';

interface Props {
  onSelectLog: (log: WorkLog) => void;
  onNavigateTab?: (tab: 'reviews' | 'my-logs') => void;
}

export const MentorLeadDashboard: React.FC<Props> = ({ onSelectLog, onNavigateTab }) => {
  const { currentUser, workLogs } = useAppStore();

  const isMentor = currentUser.role === 'mentor';
  const isLead = currentUser.role === 'lead';

  // Animation trigger state
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

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

  // สถิติรวม
  const approvedCount = useMemo(() => {
    return workLogs.filter((l) => l.status === 'approved').length;
  }, [workLogs]);

  const revisionCount = useMemo(() => {
    return workLogs.filter((l) => l.status === 'revision_required').length;
  }, [workLogs]);

  // 2. ข้อมูลสรุปนักศึกษาในความดูแล
  const traineesList = useMemo(() => {
    const map = new Map<string, {
      id: string;
      full_name: string;
      email: string;
      avatar_url?: string | null;
      position?: string;
      totalLogs: number;
      approvedLogs: number;
      pendingLogs: number;
      lastDate?: string;
    }>();

    workLogs.forEach((l) => {
      if (l.trainee) {
        const t = map.get(l.trainee_id) || {
          id: l.trainee_id,
          full_name: l.trainee.full_name || 'นักศึกษาฝึกงาน',
          email: l.trainee.email || '',
          avatar_url: l.trainee.avatar_url,
          position: 'นักศึกษาฝึกงาน (Intern)',
          totalLogs: 0,
          approvedLogs: 0,
          pendingLogs: 0,
          lastDate: l.work_date,
        };
        t.totalLogs += 1;
        if (l.status === 'approved') t.approvedLogs += 1;
        if (l.status === 'pending_mentor' || l.status === 'pending_lead') t.pendingLogs += 1;
        map.set(l.trainee_id, t);
      }
    });

    // กรณีไม่มีข้อมูลให้แสดงตัวอย่าง default
    if (map.size === 0) {
      map.set('user-trainee-1', {
        id: 'user-trainee-1',
        full_name: 'กิตติศักดิ์ พัฒนาดี',
        email: 'kittisak.trainee@traintrack.app',
        position: 'Frontend Developer Intern',
        totalLogs: 2,
        approvedLogs: 1,
        pendingLogs: 1,
        lastDate: '2026-11-05',
      });
    }

    return Array.from(map.values());
  }, [workLogs]);

  // 3. กิจกรรมล่าสุด
  const recentActivities = useMemo(() => {
    return workLogs.slice(0, 3);
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
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#19705F] to-[#2BA185] flex items-center justify-center text-white shadow-md shadow-[#19705F]/20 group-hover:scale-105 group-hover:rotate-3 transition-transform duration-300">
                {isMentor ? <UserCheck className="w-6 h-6 stroke-[2.2]" /> : <ShieldCheck className="w-6 h-6 stroke-[2.2]" />}
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#6FD098] border-2 border-white shadow-xs" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  สวัสดี, {currentUser.full_name?.split(' ')[0] || (isMentor ? 'พี่เลี้ยง' : 'หัวหน้า')}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E2F4EB] text-[#19705F] border border-[#C2EAD6] animate-pulse-glow">
                  <Sparkles className="w-2.5 h-2.5 text-[#2BA185]" />
                  {isMentor ? 'พี่เลี้ยงประจำทีม' : 'หัวหน้าพี่เลี้ยง (Lead)'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
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
              className="px-4 py-2 rounded-xl bg-[#19705F] hover:bg-[#145C4E] active:scale-95 text-white font-bold text-xs shadow-md shadow-[#19705F]/25 hover:shadow-lg hover:shadow-[#19705F]/35 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2 group cursor-pointer"
            >
              <span>เปิดศูนย์ตรวจงาน</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>
        </div>

        {/* 3 Quick Metric Badges with Staggered Entrance */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 pt-3.5 border-t border-slate-100/90">
          
          {/* Stat 1: รอตรวจทันที (Pending Action) */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('reviews')}
            className={`p-3 rounded-2xl border transition-all duration-300 cursor-pointer group hover:-translate-y-1 ${
              pendingQueue.length > 0
                ? 'bg-gradient-to-r from-[#19705F] to-[#145C4E] text-white border-[#125447] shadow-sm hover:shadow-md'
                : 'bg-[#EFEFEF]/80 text-slate-700 border-slate-200 hover:bg-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[11px] font-bold ${pendingQueue.length > 0 ? 'text-[#C2EAD6]' : 'text-slate-500'}`}>
                {isMentor ? 'งานที่รอพี่เลี้ยงตรวจ' : 'งานที่รอยืนยันอนุมัติ'}
              </span>
              {pendingQueue.length > 0 ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6FD098] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6FD098]" />
                </span>
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2BA185]" />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black tracking-tight">
                {pendingQueue.length}
              </span>
              <span className={`text-[10px] font-semibold ${pendingQueue.length > 0 ? 'text-white/80' : 'text-slate-500'}`}>
                {pendingQueue.length > 0 ? 'รายการที่ต้องจัดการด่วน' : 'ไม่มีงานค้างตรวจ 🎉'}
              </span>
            </div>
          </div>

          {/* Stat 2: อนุมัติสำเร็จแล้ว (Approved) */}
          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 hover:border-[#2BA185]/60 hover:shadow-xs transition-all duration-300 hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500">
                อนุมัติสำเร็จแล้ว
              </span>
              <Award className="w-3.5 h-3.5 text-[#2BA185] group-hover:scale-110 transition-transform duration-200" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {approvedCount}
              </span>
              <span className="text-[10px] font-bold text-[#2BA185] bg-[#E2F4EB] px-2 py-0.5 rounded-full border border-[#C2EAD6]">
                ผ่านเกณฑ์
              </span>
            </div>
          </div>

          {/* Stat 3: ส่งกลับแก้ไข (Revision Required) */}
          <div className="p-3 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-300 hover:shadow-xs transition-all duration-300 hover:-translate-y-0.5 group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-slate-500">
                ส่งกลับแก้ไข
              </span>
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-12 transition-transform duration-200" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {revisionCount}
              </span>
              <span className="text-[10px] font-medium text-slate-500">
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
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#E2F4EB] text-[#19705F] flex items-center justify-center font-bold">
                <Clock className="w-4 h-4 text-[#2BA185]" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  {isMentor ? 'คิวงานที่รอคุณตรวจสอบ' : 'คิวงานที่รอยืนยันอนุมัติขั้นสุดท้าย'}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  {isMentor ? 'คลิก "ตรวจงาน" เพื่อดูรายละเอียด บันทึกความคิดเห็น หรืออนุมัติ' : 'ตรวจสอบความถูกต้องและกดยืนยันผลการประเมิน'}
                </p>
              </div>
            </div>

            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-[#EFEFEF] text-slate-700 border border-slate-200">
              {pendingQueue.length} งาน
            </span>
          </div>

          {/* List of Pending Items */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0">
            {pendingQueue.length > 0 ? (
              pendingQueue.map((log, index) => (
                <div
                  key={log.id}
                  onClick={() => onSelectLog(log)}
                  style={{
                    animationDelay: `${index * 60 + 100}ms`
                  }}
                  className="p-3 sm:p-3.5 rounded-2xl bg-[#EFEFEF]/50 hover:bg-[#EFEFEF] border border-slate-200/80 hover:border-[#2BA185]/60 hover:shadow-xs transition-all duration-200 cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in-up"
                >
                  {/* Left: Info */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/90 text-[#19705F] flex items-center justify-center font-extrabold text-xs shadow-2xs shrink-0 group-hover:bg-[#19705F] group-hover:text-white group-hover:scale-105 transition-all duration-200">
                      {log.trainee?.full_name?.charAt(0) || 'U'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-[10px] font-extrabold text-[#19705F] bg-[#E2F4EB] px-2 py-0.5 rounded-md border border-[#C2EAD6]">
                          {log.trainee?.full_name?.split(' ')[0] || 'นักศึกษา'}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {log.work_date}
                        </span>
                        <span className="text-[10px] font-medium text-slate-400">
                          • {log.category}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#19705F] transition-colors truncate">
                        {log.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
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
                      className="px-3.5 py-1.5 rounded-xl bg-white group-hover:bg-[#19705F] text-slate-700 group-hover:text-white border border-slate-200 group-hover:border-[#19705F] font-bold text-xs shadow-2xs hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1.5"
                    >
                      <span>กดตรวจงาน</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              /* Empty State - Friendly Clean Illustration */
              <div className="h-full flex flex-col items-center justify-center text-center py-10 px-4">
                <div className="w-14 h-14 rounded-3xl bg-[#E2F4EB] border border-[#C2EAD6] flex items-center justify-center text-[#19705F] mb-3 animate-float-slow shadow-xs">
                  <Inbox className="w-7 h-7 text-[#2BA185]" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  ไม่มีงานค้างรอตรวจสอบในขณะนี้
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  ยอดเยี่ยมมาก! คุณได้ตรวจสอบงานของนักศึกษาครบถ้วนแล้ว ระบบจะแจ้งเตือนทันทีเมื่อมีงานใหม่ส่งเข้ามา
                </p>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('reviews')}
                  className="mt-3.5 px-3 py-1.5 rounded-xl bg-[#EFEFEF] hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200/90 transition shadow-2xs"
                >
                  ดูประวัติการตรวจที่ผ่านมา
                </button>
              </div>
            )}
          </div>

          {/* Footer note */}
          <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium shrink-0">
            <span>* คลิกที่งานเพื่อเปิดหน้าต่างตรวจสอบและลงความเห็น</span>
            <button
              onClick={() => onNavigateTab && onNavigateTab('reviews')}
              className="text-[#19705F] hover:text-[#145C4E] font-bold inline-flex items-center gap-1 hover:underline"
            >
              <span>ดูงานทั้งหมดในระบบ</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

        </div>

        {/* =========================================================================
            RIGHT COLUMN: หัวข้อที่ 3 (นักศึกษาในความดูแล) & หัวข้อที่ 4 (กิจกรรมล่าสุด) (4 COLS)
            ========================================================================= */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-3 min-h-0">
          
          {/* หัวข้อที่ 3: สรุปนักศึกษาในความดูแล (Supervised Trainees) */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex-1 flex flex-col justify-between min-h-0 animate-fade-in-right [animation-delay:180ms] hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#E2F4EB] text-[#19705F] flex items-center justify-center font-bold">
                  <Users className="w-3.5 h-3.5 text-[#2BA185]" />
                </div>
                <h3 className="text-xs font-extrabold text-slate-900 tracking-tight">
                  นักศึกษาในความดูแล
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-[#EFEFEF] px-2 py-0.5 rounded-lg border border-slate-200">
                {traineesList.length} คน
              </span>
            </div>

            {/* Trainee Card List */}
            <div className="space-y-2 overflow-y-auto pr-0.5 flex-1 min-h-0">
              {traineesList.map((t) => {
                const passRate = t.totalLogs > 0 ? Math.round((t.approvedLogs / t.totalLogs) * 100) : 0;
                return (
                  <div
                    key={t.id}
                    className="p-3 rounded-2xl bg-[#EFEFEF]/50 hover:bg-[#EFEFEF] border border-slate-200/80 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#19705F] to-[#2BA185] text-white flex items-center justify-center font-bold text-xs shadow-xs group-hover:scale-105 transition-transform duration-200">
                        {t.full_name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate group-hover:text-[#19705F] transition-colors">
                          {t.full_name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {t.position || t.email}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar of Trainee */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-500">ความคืบหน้างาน</span>
                        <span className="text-[#19705F]">{t.approvedLogs}/{t.totalLogs} ผ่าน ({passRate}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden p-0.5">
                        <div
                          className="h-full rounded-full bg-[#2BA185] transition-all duration-1000 ease-out"
                          style={{ width: isMounted ? `${Math.max(passRate, 10)}%` : '0%' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-right shrink-0">
              <span className="text-[10px] text-slate-400 font-medium">
                * ข้อมูลประเมินผลการฝึกงานอัปเดตแบบ Realtime
              </span>
            </div>
          </div>

          {/* หัวข้อที่ 4: กิจกรรมล่าสุด (Recent Activities) */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-2xs shrink-0 animate-fade-in-right [animation-delay:260ms] hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
              <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2BA185]" />
                <span>กิจกรรมล่าสุดในทีม</span>
              </h4>
              <span className="text-[9px] text-slate-400 font-semibold">อัปเดตล่าสุด</span>
            </div>

            <div className="space-y-1.5">
              {recentActivities.map((log) => (
                <div
                  key={log.id}
                  onClick={() => onSelectLog(log)}
                  className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-[#EFEFEF] transition-all duration-150 cursor-pointer group"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[9px] group-hover:bg-[#19705F] group-hover:text-white transition-colors duration-150 shrink-0">
                      <FileText className="w-3 h-3" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-800 truncate group-hover:text-[#19705F] transition-colors">
                        {log.title}
                      </p>
                      <p className="text-[9px] text-slate-400 truncate">
                        {log.trainee?.full_name?.split(' ')[0]} • {log.work_date}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold border transition-transform group-hover:scale-105 ${
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
    </div>
  );
};

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import { WorkLog } from '@/lib/types';
import { TabKey } from '@/components/layout/TabBar';
import {
  ShieldCheck,
  UserCheck,
  GraduationCap,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Download,
  Plus,
  ChevronRight,
  Users
} from 'lucide-react';

interface Props {
  onSelectLog: (log: WorkLog) => void;
  onNavigateTab?: (tab: TabKey) => void;
}

export const AdminDashboardView: React.FC<Props> = ({ onSelectLog, onNavigateTab }) => {
  const { currentUser, workLogs, trainees, mentors } = useAppStore();

  // Animation trigger state
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 40);
    return () => clearTimeout(timer);
  }, []);

  // Filter state for System Work Logs Table
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'revision_required'>('all');

  // Statistics
  const totalLogs = workLogs.length;
  const approvedLogs = useMemo(() => workLogs.filter((l) => l.status === 'approved').length, [workLogs]);
  const pendingMentorLogs = useMemo(() => workLogs.filter((l) => l.status === 'pending_mentor').length, [workLogs]);
  const pendingLeadLogs = useMemo(() => workLogs.filter((l) => l.status === 'pending_lead').length, [workLogs]);
  const totalPending = pendingMentorLogs + pendingLeadLogs;
  const revisionLogs = useMemo(() => workLogs.filter((l) => l.status === 'revision_required').length, [workLogs]);

  const approvalRate = totalLogs > 0 ? Math.round((approvedLogs / totalLogs) * 100) : 0;
  const pendingRate = totalLogs > 0 ? Math.round((totalPending / totalLogs) * 100) : 0;
  const revisionRate = totalLogs > 0 ? 100 - approvalRate - pendingRate : 0;

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    if (statusFilter === 'all') return workLogs;
    if (statusFilter === 'pending') {
      return workLogs.filter((l) => l.status === 'pending_mentor' || l.status === 'pending_lead');
    }
    return workLogs.filter((l) => l.status === statusFilter);
  }, [workLogs, statusFilter]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const csvContent = [
      ['ID', 'Date', 'Trainee', 'Mentor', 'Title', 'Hours', 'Status', 'Category'],
      ...workLogs.map((l) => [
        l.id,
        l.work_date,
        `"${l.trainee?.full_name || 'Trainee'}"`,
        `"${l.assigned_mentor?.full_name || 'Mentor'}"`,
        `"${l.title.replace(/"/g, '""')}"`,
        l.hours_spent,
        l.status,
        `"${l.category.replace(/"/g, '""')}"`,
      ]),
    ]
      .map((e) => e.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `traintrack_admin_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col justify-between font-sans gap-2.5">
      {/* =========================================================================
          SECTION 1: HERO BANNER & 4 KEY METRIC CARDS (ภาพรวมผู้ดูแลระบบ)
          ========================================================================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-4.5 border border-slate-200/90 shadow-2xs relative overflow-hidden animate-fade-in-up [animation-delay:40ms] hover:shadow-md transition-all duration-300">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-[#6FD098]/15 via-[#2BA185]/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#19705F] to-[#2BA185] flex items-center justify-center text-white shadow-md shadow-[#19705F]/20 shrink-0">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  สวัสดี, {currentUser.full_name?.split(' ')[0] || 'ผู้ดูแลระบบ'}
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E2F4EB] text-[#19705F] border border-[#C2EAD6] animate-pulse-glow">
                  <Sparkles className="w-2.5 h-2.5 text-[#2BA185]" />
                  System Overview
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                ภาพรวมสถานะการฝึกงานของนักศึกษา พี่เลี้ยงผู้ดูแล และสถิติงานทั้งระบบ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              onClick={() => onNavigateTab && onNavigateTab('admin')}
              className="px-3.5 py-1.5 rounded-xl bg-[#19705F] hover:bg-[#145C4E] active:scale-95 text-white font-bold text-xs shadow-md shadow-[#19705F]/20 hover:shadow-lg hover:shadow-[#19705F]/30 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
            >
              <span>จัดการนักศึกษา & พี่เลี้ยง</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleExportCSV}
              className="p-1.5 rounded-xl bg-[#EFEFEF] hover:bg-slate-200 text-slate-700 font-bold transition border border-slate-200"
              title="ส่งออกรายงาน CSV"
            >
              <Download className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        {/* 4 Stat Badges Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-slate-100">
          {/* Stat 1: นักศึกษาทั้งหมด */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('admin')}
            className="p-2.5 rounded-2xl bg-[#EFEFEF]/60 hover:bg-[#EFEFEF] border border-slate-200/80 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-bold text-slate-500">นักศึกษาในระบบ</span>
              <GraduationCap className="w-3.5 h-3.5 text-[#19705F] group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900 tracking-tight">{trainees.length}</span>
              <span className="text-[9px] font-semibold text-slate-400">คน</span>
              <span className="ml-auto text-[9px] font-extrabold text-[#19705F] bg-[#E2F4EB] px-1.5 py-0.2 rounded">
                อัตราผ่าน {approvalRate}%
              </span>
            </div>
          </div>

          {/* Stat 2: พี่เลี้ยงผู้ดูแล */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('admin')}
            className="p-2.5 rounded-2xl bg-[#EFEFEF]/60 hover:bg-[#EFEFEF] border border-slate-200/80 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-bold text-slate-500">พี่เลี้ยงประจำทีม</span>
              <UserCheck className="w-3.5 h-3.5 text-[#2BA185] group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-slate-900 tracking-tight">{mentors.length}</span>
              <span className="text-[9px] font-semibold text-slate-400">คน</span>
              <span className="ml-auto text-[9px] font-bold text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                พร้อมดูแล
              </span>
            </div>
          </div>

          {/* Stat 3: งานรอการตรวจในระบบ */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('reviews')}
            className={`p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer group ${
              totalPending > 0
                ? 'bg-gradient-to-r from-[#19705F] to-[#145C4E] text-white border-[#125447] shadow-xs'
                : 'bg-[#EFEFEF]/60 text-slate-700 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className={`text-[10px] font-bold ${totalPending > 0 ? 'text-[#C2EAD6]' : 'text-slate-500'}`}>
                งานที่อยู่ระหว่างตรวจ
              </span>
              {totalPending > 0 ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6FD098] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6FD098]" />
                </span>
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2BA185]" />
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black tracking-tight">{totalPending}</span>
              <span className={`text-[9px] font-semibold ${totalPending > 0 ? 'text-white/80' : 'text-slate-400'}`}>
                งาน (รอพี่เลี้ยง {pendingMentorLogs} / รอหัวหน้า {pendingLeadLogs})
              </span>
            </div>
          </div>

          {/* Stat 4: อนุมัติสำเร็จ */}
          <div className="p-2.5 rounded-2xl bg-[#EFEFEF]/60 hover:bg-[#EFEFEF] border border-slate-200/80 transition-all duration-200">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-bold text-slate-500">อนุมัติเสร็จสมบูรณ์</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2BA185]" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-[#19705F] tracking-tight">{approvedLogs}</span>
              <span className="text-[9px] font-semibold text-slate-400">/{totalLogs} รายการ</span>
              <span className="ml-auto text-[9px] font-bold text-[#2BA185] bg-[#E2F4EB] px-1.5 py-0.2 rounded border border-[#C2EAD6]">
                ผ่านเกณฑ์
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: MAIN 2-COLUMN GRID (ซ้าย: คิวงานทั้งระบบ / ขวา: สรุปนักศึกษา + สัดส่วน)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch flex-1 min-h-0">
        
        {/* ======================= LEFT: SYSTEM WORK LOGS (8 COLS) ======================= */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between min-h-0 overflow-hidden animate-fade-in-up [animation-delay:120ms] hover:shadow-md transition-shadow duration-300">
          
          {/* Header of Logs */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 shrink-0 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#E2F4EB] text-[#19705F] flex items-center justify-center font-bold">
                <FileText className="w-3.5 h-3.5 text-[#2BA185]" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>บันทึกงานทั้งหมดในระบบ</span>
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-[#EFEFEF] text-slate-700 border border-slate-200">
                    {filteredLogs.length} รายการ
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  คลิกที่รายการเพื่อดูรายละเอียด ตรวจสอบประวัติ หรือดูข้อเสนอแนะ
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 text-[10px] font-bold">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-0.5 rounded-lg transition ${
                  statusFilter === 'all'
                    ? 'bg-[#19705F] text-white shadow-2xs'
                    : 'bg-[#EFEFEF] text-slate-600 hover:bg-slate-200'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-2 py-0.5 rounded-lg transition flex items-center gap-1 ${
                  statusFilter === 'pending'
                    ? 'bg-[#2BA185] text-white shadow-2xs'
                    : 'bg-[#EFEFEF] text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Clock className="w-2.5 h-2.5" />
                รอตรวจ ({totalPending})
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                className={`px-2 py-0.5 rounded-lg transition flex items-center gap-1 ${
                  statusFilter === 'approved'
                    ? 'bg-[#19705F] text-white shadow-2xs'
                    : 'bg-[#EFEFEF] text-slate-600 hover:bg-slate-200'
                }`}
              >
                <CheckCircle2 className="w-2.5 h-2.5 text-[#6FD098]" />
                ผ่าน ({approvedLogs})
              </button>
              <button
                onClick={() => setStatusFilter('revision_required')}
                className={`px-2 py-0.5 rounded-lg transition flex items-center gap-1 ${
                  statusFilter === 'revision_required'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-[#EFEFEF] text-slate-600 hover:bg-slate-200'
                }`}
              >
                <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
                แก้ไข ({revisionLogs})
              </button>
            </div>
          </div>

          {/* Table / List */}
          <div className="flex-1 overflow-y-auto pr-0.5 space-y-1.5 min-h-0">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => onSelectLog(log)}
                  className="p-2.5 rounded-2xl bg-[#EFEFEF]/50 hover:bg-[#EFEFEF] border border-slate-200/80 hover:border-[#2BA185]/60 hover:shadow-xs transition-all duration-150 cursor-pointer group flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-[#19705F] flex items-center justify-center font-extrabold text-[10px] shrink-0 group-hover:bg-[#19705F] group-hover:text-white transition-colors">
                      {log.trainee?.full_name?.charAt(0) || 'U'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-[9px] font-extrabold text-[#19705F] bg-[#E2F4EB] px-1.5 py-0.2 rounded border border-[#C2EAD6]">
                          {log.trainee?.full_name?.split(' ')[0] || 'นักศึกษา'}
                        </span>
                        <span className="text-[9px] text-slate-500 font-medium">
                          {log.work_date}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          • พี่เลี้ยง: {log.assigned_mentor?.full_name?.split(' ')[0] || 'ยังไม่ระบุ'}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#19705F] transition-colors truncate">
                        {log.title}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition-transform group-hover:scale-105 ${
                        log.status === 'approved'
                          ? 'bg-[#E2F4EB] text-[#19705F] border-[#C2EAD6]'
                          : log.status === 'revision_required'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {log.status === 'approved'
                        ? 'อนุมัติแล้ว'
                        : log.status === 'revision_required'
                        ? 'ส่งกลับแก้ไข'
                        : log.status === 'pending_mentor'
                        ? 'รอพี่เลี้ยงตรวจ'
                        : 'รอหัวหน้าอนุมัติ'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-slate-400">
                <FileText className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
                <p className="text-xs font-semibold">ไม่พบบันทึกงานในเงื่อนไขที่เลือก</p>
              </div>
            )}
          </div>

          <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium shrink-0">
            <span>* คลิกที่รายการงานเพื่อดูรายละเอียดเอกสารและประวัติการอนุมัติ</span>
            <button
              onClick={() => onNavigateTab && onNavigateTab('reviews')}
              className="text-[#19705F] hover:text-[#145C4E] font-bold inline-flex items-center gap-1 hover:underline"
            >
              <span>ไปที่ศูนย์ตรวจงาน</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* ======================= RIGHT: TRAINEES ROSTER & STATUS DONUT (4 COLS) ======================= */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-2.5 min-h-0">
          
          {/* Card: นักศึกษาและการมอบหมายพี่เลี้ยง (Trainees Roster) */}
          <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs flex-1 flex flex-col justify-between min-h-0 animate-fade-in-right [animation-delay:160ms] hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-[#E2F4EB] text-[#19705F] flex items-center justify-center font-bold">
                  <Users className="w-3.5 h-3.5 text-[#2BA185]" />
                </div>
                <h3 className="text-xs font-extrabold text-slate-900 tracking-tight">
                  รายชื่อนักศึกษาและพี่เลี้ยง
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab && onNavigateTab('admin')}
                className="text-[10px] font-bold text-[#19705F] hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                <span>จัดการ</span>
              </button>
            </div>

            <div className="space-y-1.5 overflow-y-auto pr-0.5 flex-1 min-h-0">
              {trainees.map((t) => {
                const studentLogs = workLogs.filter((l) => l.trainee_id === t.id);
                const studentApproved = studentLogs.filter((l) => l.status === 'approved').length;
                const passRate = studentLogs.length > 0 ? Math.round((studentApproved / studentLogs.length) * 100) : 0;
                const assignedMentor = mentors.find((m) => m.id === t.mentor_id);

                return (
                  <div
                    key={t.id}
                    className="p-2 rounded-xl bg-[#EFEFEF]/50 hover:bg-[#EFEFEF] border border-slate-200/80 transition-all duration-150 group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="min-w-0 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#19705F] to-[#2BA185] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                          {t.full_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate group-hover:text-[#19705F] transition-colors">
                            {t.full_name}
                          </p>
                          <p className="text-[9px] text-slate-400 truncate">
                            พี่เลี้ยง: <span className="font-semibold text-slate-600">{assignedMentor?.full_name?.split(' ')[0] || 'ยังไม่มอบหมาย'}</span>
                          </p>
                        </div>
                      </div>

                      <span className="text-[9px] font-extrabold text-[#19705F] bg-[#E2F4EB] px-1.5 py-0.2 rounded border border-[#C2EAD6] shrink-0">
                        {studentApproved}/{studentLogs.length} ผ่าน
                      </span>
                    </div>

                    {/* Mini Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#2BA185] transition-all duration-1000 ease-out"
                        style={{ width: isMounted ? `${Math.max(passRate, 8)}%` : '0%' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 text-right shrink-0">
              <button
                onClick={() => onNavigateTab && onNavigateTab('admin')}
                className="text-[10px] text-[#19705F] font-bold hover:underline inline-flex items-center gap-1"
              >
                <span>เปิดหน้าจัดการนักศึกษาแบบเต็ม</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Card: สัดส่วนสถานะงานทั้งระบบ (Status Breakdown Donut) */}
          <div className="bg-white rounded-3xl p-3.5 border border-slate-200/90 shadow-2xs shrink-0 animate-fade-in-right [animation-delay:220ms] hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100">
              <h4 className="text-xs font-extrabold text-slate-900">
                สัดส่วนสถานะงานทั้งระบบ
              </h4>
              <span className="text-[10px] text-slate-400 font-semibold">{totalLogs} งาน</span>
            </div>

            <div className="flex items-center justify-around gap-2">
              {/* Donut Graphic */}
              <div className="relative group cursor-default">
                <svg className="w-16 h-16 -rotate-90 group-hover:scale-105 transition-transform duration-300" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="38" fill="transparent" stroke="#EFEFEF" strokeWidth="11" />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#19705F"
                    strokeWidth="11"
                    strokeDasharray={`${isMounted ? Math.max(approvalRate * 2.38, 15) : 0} 238`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.15s' }}
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#6FD098"
                    strokeWidth="11"
                    strokeDasharray={`${isMounted ? Math.max(pendingRate * 2.38, 10) : 0} 238`}
                    strokeDashoffset={`-${isMounted ? Math.max(approvalRate * 2.38, 15) : 0}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.35s' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-black text-[#19705F] leading-none">{approvalRate}%</span>
                  <span className="text-[8px] text-slate-400 font-medium">อนุมัติ</span>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-1 text-[10px]">
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#19705F]" />
                  <span>ผ่าน: {approvedLogs} ({approvalRate}%)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#6FD098]" />
                  <span>รอตรวจ: {totalPending} ({pendingRate}%)</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span>แก้ไข: {revisionLogs} ({revisionRate}%)</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

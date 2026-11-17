'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { WorkLog } from '@/lib/types';
import { TabKey } from '@/components/layout/TabBar';
import { MentorLeadDashboard } from './MentorLeadDashboard';
import { AdminDashboardView } from './AdminDashboardView';
import {
  TrendingUp,
  Plus,
  ArrowRight,
  ChevronDown,
  Sparkles,
  CheckSquare,
  FileText,
  Search,
  Filter,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface Props {
  onOpenCreate: () => void;
  onSelectLog: (log: WorkLog) => void;
  onNavigateTab?: (tab: TabKey) => void;
}

export const DashboardView: React.FC<Props> = ({ onOpenCreate, onSelectLog, onNavigateTab }) => {
  const { currentUser, workLogs, mentors } = useAppStore();

  // Trigger state สำหรับการโหลด Animation ชาร์ตและกราฟิก
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 40);
    return () => clearTimeout(timer);
  }, []);

  // State สำหรับระบบฟิลเตอร์ของ "รายการงานล่าสุด"
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'revision_required'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const isTrainee = currentUser.role === 'trainee';
  const isMentor = currentUser.role === 'mentor';

  // ข้อมูลสถิติ
  const myTraineeLogs = workLogs.filter((l) => l.trainee_id === currentUser.id);
  const totalLogs = isTrainee ? myTraineeLogs.length : workLogs.length;
  const approvedLogs = isTrainee
    ? myTraineeLogs.filter((l) => l.status === 'approved').length
    : workLogs.filter((l) => l.status === 'approved').length;
  const pendingLogs = isTrainee
    ? myTraineeLogs.filter((l) => l.status === 'pending_mentor' || l.status === 'pending_lead').length
    : isMentor
    ? workLogs.filter((l) => l.status === 'pending_mentor').length
    : workLogs.filter((l) => l.status === 'pending_lead').length;

  const approvalRate = totalLogs > 0 ? Math.round((approvedLogs / totalLogs) * 100) : 0;
  const pendingRate = totalLogs > 0 ? Math.round((pendingLogs / totalLogs) * 100) : 0;
  const revisionRate = totalLogs > 0 ? 100 - approvalRate - pendingRate : 0;

  // รายการหมวดหมู่ทั้งหมดที่มีในระบบ
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    workLogs.forEach((l) => {
      if (l.category) set.add(l.category);
    });
    return Array.from(set);
  }, [workLogs]);

  // ประมวลผล Filter ของตารางรายการงานล่าสุด (เรียงจากบนลงล่าง: รายการล่าสุดอยู่บนสุด)
  const filteredLogs = useMemo(() => {
    const list = workLogs.filter((log) => {
      // 1. ค้นหาจากชื่อ หรือรายละเอียด หรือชื่อผู้บันทึก
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = log.title.toLowerCase().includes(q);
        const matchTrainee = log.trainee?.full_name?.toLowerCase().includes(q);
        const matchDesc = log.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchTrainee && !matchDesc) return false;
      }

      // 2. กรองตามสถานะ
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending') {
          if (log.status !== 'pending_mentor' && log.status !== 'pending_lead') return false;
        } else if (log.status !== statusFilter) {
          return false;
        }
      }

      // 3. กรองตามหมวดหมู่
      if (categoryFilter !== 'all') {
        if (log.category !== categoryFilter) return false;
      }

      return true;
    });

    // เรียงจากบนลงล่าง: ล่าสุดอยู่บนสุดเสมอ
    return list.sort((a, b) => {
      const dateA = new Date(a.work_date || a.created_at).getTime();
      const dateB = new Date(b.work_date || b.created_at).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
    });
  }, [workLogs, searchQuery, statusFilter, categoryFilter]);

  // กิจกรรมล่าสุดของนักศึกษา เรียงจากบนลงล่าง (ล่าสุดอยู่บนสุดเสมอ)
  const recentTraineeActivities = useMemo(() => {
    const list = isTrainee ? myTraineeLogs : workLogs;
    return [...list].sort((a, b) => {
      const dateA = new Date(a.work_date || a.created_at).getTime();
      const dateB = new Date(b.work_date || b.created_at).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
    });
  }, [isTrainee, myTraineeLogs, workLogs]);

  // ถ้าเป็นพี่เลี้ยง (mentor) หรือหัวหน้า (lead) ให้แสดงแดชบอร์ดแบบง่ายๆ มีไม่กี่หัวข้อ พร้อมอนิเมชั่น
  if (currentUser.role === 'mentor' || currentUser.role === 'lead') {
    return (
      <MentorLeadDashboard
        onSelectLog={onSelectLog}
        onNavigateTab={onNavigateTab}
      />
    );
  }

  // ถ้าเป็นผู้ดูแลระบบ (admin) ให้แสดงแดชบอร์ดภาพรวมระบบ
  if (currentUser.role === 'admin') {
    return (
      <AdminDashboardView
        onSelectLog={onSelectLog}
        onNavigateTab={onNavigateTab}
      />
    );
  }

  return (
    <div className="h-full flex flex-col justify-between font-sans">
      {/* Bento Grid Layout - Fit to screen without outer page scrolling */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch h-full">
        
        {/* ======================= LEFT / CENTER MAJOR COLUMN (8 COLS) ======================= */}
        {/* ดันส่วนบน (Donut + Last Activity) ขึ้นมาด้านบน และขยายตารางรายงานล่าสุด (Card 4) ให้เต็มพื้นที่ */}
        <div className="lg:col-span-8 flex flex-col gap-3 h-full min-h-0">
          
          {/* Top Row: สัดส่วนสถานะงาน (Donut Chart) & กิจกรรมล่าสุด (Last Activity) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
            
            {/* Card 2: Donut Chart (Status) with SVG Stroke Drawing Animation */}
            <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs flex flex-col justify-between animate-fade-in-up [animation-delay:60ms] hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-extrabold text-slate-900">
                  สัดส่วนสถานะงาน (Status)
                </h4>
                <span className="text-xs text-slate-400 font-semibold">{totalLogs} รายการ</span>
              </div>

              {/* Donut Graphic */}
              <div className="flex items-center justify-center py-1 relative group cursor-default">
                <svg className="w-18 h-18 sm:w-22 sm:h-22 -rotate-90 group-hover:scale-105 transition-transform duration-300" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#EFEFEF"
                    strokeWidth="11"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#2BA185"
                    strokeWidth="11"
                    strokeDasharray={`${isMounted ? Math.max(approvalRate * 2.38, 20) : 0} 238`}
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
                    strokeDasharray={`${isMounted ? Math.max(pendingRate * 2.38, 15) : 0} 238`}
                    strokeDashoffset={`-${isMounted ? Math.max(approvalRate * 2.38, 20) : 0}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.35s, stroke-dashoffset 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.35s' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className={`text-base sm:text-lg font-black text-[#19705F] leading-none transition-all duration-700 ${isMounted ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
                    {approvalRate || 65}%
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5">อนุมัติ</span>
                </div>
              </div>

              {/* Donut Legend */}
              <div className="flex items-center justify-around gap-1.5 pt-2 border-t border-slate-100 text-xs">
                <span className="flex items-center gap-1.5 text-slate-700 font-semibold hover:text-[#2BA185] transition-colors cursor-default">
                  <span className="w-2 h-2 rounded-full bg-[#2BA185]" />
                  ผ่าน {approvalRate}%
                </span>
                <span className="flex items-center gap-1.5 text-slate-700 font-semibold hover:text-[#6FD098] transition-colors cursor-default">
                  <span className="w-2 h-2 rounded-full bg-[#6FD098]" />
                  รอ {pendingRate}%
                </span>
                <span className="flex items-center gap-1.5 text-slate-700 font-semibold hover:text-rose-500 transition-colors cursor-default">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  แก้ {revisionRate}%
                </span>
              </div>
            </div>

            {/* Card 3: Last Activity with Interactive Avatars & List Hover */}
            <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs flex flex-col justify-between animate-fade-in-up [animation-delay:190ms] hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#2BA185]" />
                  <span>กิจกรรมล่าสุด (Last Activity)</span>
                </h4>
                <div className="flex -space-x-1 overflow-hidden p-0.5">
                  {mentors.slice(0, 3).map((m, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full bg-emerald-100 border-2 border-white text-emerald-800 text-[10px] font-bold flex items-center justify-center hover:scale-125 hover:z-20 transition-transform duration-200 cursor-pointer shadow-xs"
                      title={m.full_name}
                    >
                      {m.full_name.charAt(0)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity rows - เรียงจากบนลงล่าง: รายการล่าสุดอยู่บนสุดเสมอ */}
              <div className="space-y-1.5">
                {recentTraineeActivities.slice(0, 2).map((log, i) => (
                  <div
                    key={log.id || i}
                    onClick={() => onSelectLog(log)}
                    className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-[#EFEFEF]/70 hover:translate-x-1 transition-all duration-150 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 font-bold text-xs group-hover:bg-[#19705F] group-hover:text-white transition-colors duration-150 relative">
                        {log.trainee?.full_name?.charAt(0) || 'U'}
                        {i === 0 && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#6FD098] border border-white" title="กิจกรรมล่าสุด" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs sm:text-sm font-bold text-slate-800 truncate group-hover:text-[#19705F] transition-colors duration-150">
                            {log.title}
                          </p>
                          {i === 0 && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 shrink-0">
                              ล่าสุด
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {log.work_date} • {log.assigned_mentor?.full_name?.split(' ')[0] || 'พี่เลี้ยง'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-transform duration-150 group-hover:scale-105 ${
                        log.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
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

              <div className="pt-1 text-right">
                <button
                  onClick={() => onNavigateTab && onNavigateTab(isTrainee ? 'my-logs' : 'reviews')}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 group/btn transition-colors"
                >
                  <span>ดูกิจกรรมทั้งหมด</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform duration-150" />
                </button>
              </div>
            </div>

          </div>

          {/* Card 4: ขยายรายงานล่าสุด (Work Logs Table) ขึ้น พร้อมระบบฟิลเตอร์ครบวงจร! */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-2xs flex-1 flex flex-col min-h-0 overflow-hidden animate-fade-in-up [animation-delay:250ms]">
            {/* Header + Filter Bar */}
            <div className="space-y-2.5 mb-2 pb-2.5 border-b border-slate-100 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>รายการงานล่าสุด (Work Logs Table)</span>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      แสดง {filteredLogs.length} จาก {workLogs.length}
                    </span>
                  </h4>
                </div>

                {/* Search Bar Input */}
                <div className="relative w-48 sm:w-60">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่องาน..."
                    className="w-full pl-8 pr-6 py-1.5 bg-[#EFEFEF] border border-slate-200 hover:border-slate-300 focus:border-[#2BA185] rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#6FD098] transition"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2 pointer-events-none" />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Pills & Category Dropdown */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5">
                {/* Status Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition ${
                      statusFilter === 'all'
                        ? 'bg-[#19705F] text-white shadow-2xs'
                        : 'bg-[#EFEFEF] text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                    }`}
                  >
                    ทั้งหมด
                  </button>

                  <button
                    onClick={() => setStatusFilter('approved')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                      statusFilter === 'approved'
                        ? 'bg-[#2BA185] text-white shadow-2xs'
                        : 'bg-[#EFEFEF] text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#6FD098]" />
                    อนุมัติแล้ว
                  </button>

                  <button
                    onClick={() => setStatusFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                      statusFilter === 'pending'
                        ? 'bg-[#6FD098] text-[#0E3E35] font-black shadow-2xs'
                        : 'bg-[#EFEFEF] text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-[#19705F]" />
                    รอตรวจ
                  </button>

                  <button
                    onClick={() => setStatusFilter('revision_required')}
                    className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                      statusFilter === 'revision_required'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-[#EFEFEF] text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    ต้องแก้ไข
                  </button>
                </div>

                {/* Category Dropdown Filter */}
                <div className="relative inline-flex items-center text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="appearance-none bg-[#EFEFEF] border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1.5 pr-6 font-bold text-slate-700 focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="all">ทุกหมวดหมู่</option>
                    {allCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Table Area - Expanded & Scrollable */}
            <div className="flex-1 overflow-y-auto -mx-1 min-h-0 pr-1">
              {filteredLogs.length > 0 ? (
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-slate-100 text-slate-500 font-bold text-xs">
                      <th className="pb-2 px-2.5">หัวข้องาน</th>
                      <th className="pb-2 px-2.5">หมวดหมู่</th>
                      <th className="pb-2 px-2.5">วันที่</th>
                      <th className="pb-2 px-2.5">สถานะ</th>
                      <th className="pb-2 px-2.5 text-right">การกระทำ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => onSelectLog(log)}
                        className="hover:bg-[#EFEFEF]/60 transition-colors duration-150 cursor-pointer group"
                      >
                        <td className="py-2.5 px-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-[#19705F] group-hover:text-white transition-colors duration-150">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 group-hover:text-[#19705F] line-clamp-1 text-xs sm:text-sm transition-colors duration-150">
                                {log.title}
                              </p>
                              <p className="text-xs text-slate-400">
                                โดย: {log.trainee?.full_name?.split(' ')[0] || 'นักศึกษา'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-2.5 text-slate-600 font-medium">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-xs font-semibold text-slate-700">
                            {log.category.split(' ')[0]}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5 text-slate-600 font-medium whitespace-nowrap text-xs">
                          {log.work_date}
                        </td>
                        <td className="py-2.5 px-2.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border transition-transform duration-150 group-hover:scale-105 ${
                              log.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : log.status === 'revision_required'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                log.status === 'approved'
                                  ? 'bg-emerald-500'
                                  : log.status === 'revision_required'
                                  ? 'bg-rose-500'
                                  : 'bg-amber-500'
                              }`}
                            />
                            {log.status === 'approved' ? 'อนุมัติ' : log.status === 'revision_required' ? 'แก้ไข' : 'รอตรวจ'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectLog(log);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-white group-hover:bg-[#19705F] group-hover:text-white border border-slate-200 group-hover:border-[#19705F] text-slate-700 font-bold text-xs transition-all duration-150 shadow-2xs hover:scale-105 active:scale-95"
                          >
                            ดูรายละเอียด
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <p className="text-sm font-semibold">ไม่พบรายการงานที่ตรงกับเงื่อนไขการค้นหา</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setCategoryFilter('all');
                    }}
                    className="mt-2 text-xs text-emerald-600 font-bold hover:underline"
                  >
                    ล้างตัวกรองทั้งหมด
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ======================= RIGHT COLUMN CARDS (4 COLS) ======================= */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-2.5 h-full">
          
          {/* Card A: Dark Card (Total Logs) - 30% Secondary structure with Staggered Entrance & Sparkle Pulse */}
          <div className="bg-[#19705F] text-white rounded-2xl p-4 sm:p-4.5 shadow-pine border border-[#145C4E] relative overflow-hidden flex flex-col justify-between animate-fade-in-right [animation-delay:100ms] hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs sm:text-sm font-bold text-white/80 uppercase tracking-wider">
                จำนวนบันทึกงานรวม
              </span>
              <span className="p-1 rounded-lg bg-[#145C4E] text-[#6FD098] animate-pulse-glow">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                {totalLogs > 0 ? totalLogs : 12}
              </span>
              <span className="inline-flex items-center text-xs font-bold text-[#6FD098] bg-[#0E3E35] px-2 py-0.5 rounded-full border border-[#2BA185]/40 hover:scale-105 transition-transform duration-150 cursor-default">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                +15%
              </span>
            </div>
            <p className="text-xs sm:text-sm text-white/80 mb-3">
              รายการบันทึกการฝึกงานในระบบ
            </p>

            {/* Segmented Dual Bar with smooth width transition */}
            <div className="space-y-1.5">
              <div className="w-full h-7 flex rounded-lg overflow-hidden p-0.5 bg-[#145C4E] border border-[#125447]">
                <div
                  className="h-full rounded-md bg-[#6FD098] flex items-center justify-center text-xs font-black text-[#0E3E35] px-1.5 shadow-xs transition-all duration-1000 ease-out"
                  style={{ width: isMounted ? `${Math.max(approvalRate, 40)}%` : '0%' }}
                >
                  {approvalRate || 45}%
                </div>
                <div
                  className="h-full rounded-md bg-white flex items-center justify-center text-xs font-black text-[#19705F] px-1.5 ml-1 transition-all duration-1000 ease-out"
                  style={{ width: isMounted ? `${100 - Math.max(approvalRate, 40)}%` : '0%' }}
                >
                  {100 - (approvalRate || 45)}%
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-white/80 font-semibold px-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#6FD098]" />
                  อนุมัติสำเร็จ
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white" />
                  รอตรวจ/แก้ไข
                </span>
              </div>
            </div>
          </div>

          {/* Card B: Fresh Mint/Teal Gradient Card with Animated Mini Bars & Floating Tooltip */}
          <div className="bg-gradient-to-br from-[#E2F5EC] via-[#EDF9F3] to-[#F7FCF9] text-slate-900 rounded-2xl p-4 sm:p-4.5 shadow-2xs border border-[#C2EAD6] flex flex-col justify-between animate-fade-in-right [animation-delay:180ms] hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs sm:text-sm font-bold text-[#19705F]">
                งานที่รอการตรวจสอบ
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white text-[#19705F] text-xs font-bold border border-[#C2EAD6]">
                Pending
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl sm:text-3xl font-black text-[#19705F] tracking-tight">
                {pendingLogs} งาน
              </span>
              <span className="text-xs font-bold text-[#2BA185]">
                รอพี่เลี้ยง/หัวหน้า
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-2">
              {pendingLogs > 0 ? 'มีรายการรอการยืนยันในคิว' : 'ไม่มีงานค้างตรวจในขณะนี้'}
            </p>

            {/* Mini Bar Sparklines with staggered height grow */}
            <div className="h-10 flex items-end justify-between gap-1 pt-1 px-1 relative">
              {[25, 45, 60, 35, 75, 90, 50, 40].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                  {i === 5 && (
                    <div className="absolute -top-6 bg-[#19705F] text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-md animate-float-slow">
                      {pendingLogs} งาน
                    </div>
                  )}
                  <div
                    className={`w-full rounded-sm transition-all duration-500 cursor-pointer ${
                      i === 5 ? 'bg-[#19705F] group-hover:bg-[#145C4E]' : 'bg-white/90 group-hover:bg-white'
                    }`}
                    style={{
                      height: isMounted ? `${h}%` : '8%',
                      transition: `height 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 35 + 250}ms`
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Card C: Soft Mint Cream Card with Wave Stroke Drawing & Glowing Dot */}
          <div className="bg-gradient-to-br from-[#F0FAF5] via-[#F8FCFA] to-white text-slate-900 rounded-2xl p-4 sm:p-4.5 shadow-2xs border border-[#C2EAD6] flex flex-col justify-between animate-fade-in-right [animation-delay:260ms] hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs sm:text-sm font-bold text-[#19705F]">
                อนุมัติสำเร็จแล้ว (Approved)
              </span>
              <span className="text-xs font-bold text-[#19705F] bg-[#E2F4EB] px-2 py-0.5 rounded-full border border-[#C2EAD6] hover:scale-105 transition-transform duration-150 cursor-default">
                +100%
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {approvedLogs} รายการ
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-1.5">
              ผ่านเกณฑ์การประเมินเรียบร้อย
            </p>

            {/* Wave Sparkline with drawing animation & pulsing point */}
            <div className="h-9 w-full relative pt-1">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 200 40" preserveAspectRatio="none">
                <path
                  d="M 0,28 Q 30,36 60,24 T 120,30 T 170,14 T 200,9"
                  fill="none"
                  stroke="#2BA185"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="250"
                  strokeDashoffset={isMounted ? 0 : 250}
                  style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.3s' }}
                />
                {/* Glowing pulse ring behind the end point */}
                <circle cx="200" cy="9" r="6" fill="#6FD098" className="animate-ping-slow origin-center opacity-60" />
                <circle cx="200" cy="9" r="3.5" fill="#19705F" stroke="#6FD098" strokeWidth="2" />
              </svg>
              <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                <span>1 Jul</span>
                <span>15 Jul</span>
                <span>30 Jul</span>
              </div>
            </div>
          </div>

          {/* Card D: Action Button with Hover Lift & Rotating Icon */}
          <div className="animate-fade-in-right [animation-delay:340ms]">
            {isTrainee ? (
              <button
                onClick={onOpenCreate}
                className="w-full py-3 px-4 rounded-xl bg-[#19705F] hover:bg-[#145C4E] active:bg-[#0E3E35] text-white font-bold text-sm shadow-md shadow-[#19705F]/20 hover:shadow-lg hover:shadow-[#19705F]/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer group"
              >
                <Plus className="w-4 h-4 stroke-[3] group-hover:rotate-90 group-hover:scale-110 transition-transform duration-200" />
                <span>บันทึกงานใหม่วันนี้</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigateTab && onNavigateTab('reviews')}
                className="w-full py-3 px-4 rounded-xl bg-[#19705F] hover:bg-[#145C4E] active:bg-[#0E3E35] text-white font-bold text-sm shadow-md shadow-[#19705F]/20 hover:shadow-lg hover:shadow-[#19705F]/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer group"
              >
                <CheckSquare className="w-4 h-4 stroke-[3] group-hover:scale-110 transition-transform duration-200" />
                <span>เปิดหน้าตรวจสอบงาน</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

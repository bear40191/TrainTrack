'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import { WorkLog } from '@/lib/types';
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
  onNavigateTab?: (tab: 'reviews' | 'my-logs') => void;
}

export const DashboardView: React.FC<Props> = ({ onOpenCreate, onSelectLog, onNavigateTab }) => {
  const { currentUser, workLogs, mentors } = useAppStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'This year' | 'This month' | 'This week'>('This year');

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

  // ประมวลผล Filter ของตารางรายการงานล่าสุด
  const filteredLogs = useMemo(() => {
    return workLogs.filter((log) => {
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
  }, [workLogs, searchQuery, statusFilter, categoryFilter]);

  // 12 เดือนสำหรับ Bar Chart
  const monthsData = [
    { name: 'Jan', approved: 40, pending: 20 },
    { name: 'Feb', approved: 65, pending: 35 },
    { name: 'Mar', approved: 45, pending: 25 },
    { name: 'Apr', approved: 75, pending: 30 },
    { name: 'May', approved: 55, pending: 20 },
    { name: 'Jun', approved: 85, pending: 40 },
    { name: 'Jul', approved: 95, pending: 15, isHighlighted: true },
    { name: 'Aug', approved: 60, pending: 30 },
    { name: 'Sep', approved: 70, pending: 25 },
    { name: 'Oct', approved: 50, pending: 20 },
    { name: 'Nov', approved: 80, pending: 35 },
    { name: 'Dec', approved: 65, pending: 25 },
  ];

  return (
    <div className="h-full flex flex-col justify-between font-sans">
      {/* Bento Grid Layout - Fit to screen without outer page scrolling */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch h-full">
        
        {/* ======================= LEFT / CENTER MAJOR COLUMN (8 COLS) ======================= */}
        {/* ใช้ flex-col และดันส่วนบนให้ชิดกัน (gap-2.5) แล้วขยาย Card 4 ด้วย flex-1 */}
        <div className="lg:col-span-8 flex flex-col gap-2.5 h-full min-h-0">
          
          {/* Card 1: Work Analytics Bar Chart */}
          <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs relative shrink-0">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>สถิติการส่งงาน (Work Analytics)</span>
                </h3>
                <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-500 font-semibold">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#2BA185]" />
                    อนุมัติแล้ว
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#6FD098]" />
                    รอตรวจ
                  </span>
                </div>
              </div>

              {/* Timeframe Dropdown */}
              <div className="relative inline-flex items-center">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as 'This year' | 'This month' | 'This week')}
                  className="appearance-none bg-[#EFEFEF] border border-slate-200 hover:border-slate-300 rounded-lg px-2.5 py-1 pr-6 text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="This year">This year</option>
                  <option value="This month">This month</option>
                  <option value="This week">This week</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
              </div>
            </div>

            {/* Bar Chart Visualization */}
            <div className="h-24 sm:h-28 w-full flex items-end justify-between gap-1 sm:gap-2 pt-2 pb-0.5 px-1 relative">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-30">
                <div className="border-b border-dashed border-slate-200 w-full" />
                <div className="border-b border-dashed border-slate-200 w-full" />
                <div className="border-b border-dashed border-slate-200 w-full" />
              </div>

              {monthsData.map((m, idx) => {
                const totalHeight = m.approved + m.pending;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end relative group">
                    {m.isHighlighted && (
                      <div className="absolute -top-8 z-10 bg-[#19705F] text-white px-2 py-0.5 rounded-lg shadow-lg text-[9px] font-bold whitespace-nowrap border border-[#145C4E] pointer-events-none">
                        <span className="text-[#6FD098]">● 10 ผ่าน</span> • <span className="text-[#C2EAD6]">○ 2 รอ</span>
                      </div>
                    )}

                    <div
                      className={`w-full max-w-[20px] rounded-t-lg transition-all duration-300 flex flex-col justify-end overflow-hidden ${
                        m.isHighlighted
                          ? 'ring-2 ring-[#6FD098] shadow-xs'
                          : 'opacity-90 group-hover:opacity-100'
                      }`}
                      style={{ height: `${totalHeight * 0.78}%` }}
                    >
                      <div
                        className={`w-full ${m.isHighlighted ? 'bg-[#6FD098]' : 'bg-[#E2F4EB]'}`}
                        style={{ height: `${(m.pending / totalHeight) * 100}%` }}
                      />
                      <div
                        className={`w-full ${m.isHighlighted ? 'bg-[#2BA185]' : 'bg-[#C2EAD6]'}`}
                        style={{ height: `${(m.approved / totalHeight) * 100}%` }}
                      />
                    </div>

                    <span
                      className={`text-[9px] mt-0.5 font-medium ${
                        m.isHighlighted ? 'text-[#19705F] font-extrabold' : 'text-slate-400'
                      }`}
                    >
                      {m.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Middle Row: ดันขึ้นมาชิดด้านบน (gap-2.5) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 shrink-0">
            
            {/* Card 2: Donut Chart (Status) */}
            <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-0.5">
                <h4 className="text-xs font-extrabold text-slate-900">
                  สัดส่วนสถานะงาน (Status)
                </h4>
                <span className="text-[10px] text-slate-400 font-semibold">{totalLogs} รายการ</span>
              </div>

              {/* Donut Graphic */}
              <div className="flex items-center justify-center py-0.5 relative">
                <svg className="w-16 h-16 sm:w-20 sm:h-20 -rotate-90" viewBox="0 0 100 100">
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
                    strokeDasharray={`${Math.max(approvalRate * 2.38, 20)} 238`}
                    strokeLinecap="round"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#6FD098"
                    strokeWidth="11"
                    strokeDasharray={`${Math.max(pendingRate * 2.38, 15)} 238`}
                    strokeDashoffset={`-${Math.max(approvalRate * 2.38, 20)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-sm font-black text-[#19705F] leading-none">
                    {approvalRate || 65}%
                  </span>
                  <span className="text-[8px] text-slate-400 font-medium">อนุมัติ</span>
                </div>
              </div>

              {/* Donut Legend */}
              <div className="flex items-center justify-around gap-1 pt-1.5 border-t border-slate-100 text-[9px] sm:text-[10px]">
                <span className="flex items-center gap-1 text-slate-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2BA185]" />
                  ผ่าน {approvalRate}%
                </span>
                <span className="flex items-center gap-1 text-slate-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6FD098]" />
                  รอ {pendingRate}%
                </span>
                <span className="flex items-center gap-1 text-slate-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  แก้ {revisionRate}%
                </span>
              </div>
            </div>

            {/* Card 3: Last Activity */}
            <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-extrabold text-slate-900">
                  กิจกรรมล่าสุด (Last Activity)
                </h4>
                <div className="flex -space-x-1 overflow-hidden">
                  {mentors.slice(0, 3).map((m, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full bg-emerald-100 border border-white text-emerald-800 text-[8px] font-bold flex items-center justify-center"
                      title={m.full_name}
                    >
                      {m.full_name.charAt(0)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity rows */}
              <div className="space-y-1">
                {workLogs.slice(0, 2).map((log, i) => (
                  <div
                    key={log.id || i}
                    onClick={() => onSelectLog(log)}
                    className="flex items-center justify-between gap-2 p-1 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 font-bold text-[9px]">
                        {log.trainee?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-800 truncate">
                          {log.title}
                        </p>
                        <p className="text-[8px] text-slate-400 truncate">
                          {log.work_date} • {log.assigned_mentor?.full_name?.split(' ')[0] || 'พี่เลี้ยง'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-[8px] font-bold border ${
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

              <div className="pt-0.5 text-right">
                <button
                  onClick={() => onNavigateTab && onNavigateTab(isTrainee ? 'my-logs' : 'reviews')}
                  className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
                >
                  <span>ดูกิจกรรมทั้งหมด</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

          </div>

          {/* Card 4: ขยายรายงานล่าสุด (Work Logs Table) ขึ้น พร้อมระบบฟิลเตอร์ครบวงจร! */}
          <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Header + Filter Bar */}
            <div className="space-y-2 mb-2 pb-2 border-b border-slate-100 shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>รายการงานล่าสุด (Work Logs Table)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      แสดง {filteredLogs.length} จาก {workLogs.length}
                    </span>
                  </h4>
                </div>

                {/* Search Bar Input */}
                <div className="relative w-44 sm:w-56">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่องาน..."
                    className="w-full pl-7 pr-6 py-1 bg-[#EFEFEF] border border-slate-200 hover:border-slate-300 focus:border-[#2BA185] rounded-xl text-[11px] text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#6FD098] transition"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1.5 pointer-events-none" />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Pills & Category Dropdown */}
              <div className="flex items-center justify-between flex-wrap gap-1.5 pt-0.5">
                {/* Status Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-bold">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      statusFilter === 'all'
                        ? 'bg-[#19705F] text-white shadow-2xs'
                        : 'bg-[#EFEFEF] text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                    }`}
                  >
                    ทั้งหมด
                  </button>

                  <button
                    onClick={() => setStatusFilter('approved')}
                    className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                      statusFilter === 'approved'
                        ? 'bg-[#2BA185] text-white shadow-2xs'
                        : 'bg-[#EFEFEF] text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                    }`}
                  >
                    <CheckCircle2 className="w-2.5 h-2.5 text-[#6FD098]" />
                    อนุมัติแล้ว
                  </button>

                  <button
                    onClick={() => setStatusFilter('pending')}
                    className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                      statusFilter === 'pending'
                        ? 'bg-[#6FD098] text-[#0E3E35] font-black shadow-2xs'
                        : 'bg-[#EFEFEF] text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                    }`}
                  >
                    <Clock className="w-2.5 h-2.5 text-[#19705F]" />
                    รอตรวจ
                  </button>

                  <button
                    onClick={() => setStatusFilter('revision_required')}
                    className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                      statusFilter === 'revision_required'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-[#EFEFEF] text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                    }`}
                  >
                    <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
                    ต้องแก้ไข
                  </button>
                </div>

                {/* Category Dropdown Filter */}
                <div className="relative inline-flex items-center text-[10px]">
                  <Filter className="w-3 h-3 text-slate-400 mr-1" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="appearance-none bg-[#EFEFEF] border border-slate-200 hover:border-slate-300 rounded-lg px-2 py-1 pr-5 font-bold text-slate-700 focus:outline-none cursor-pointer text-[10px]"
                  >
                    <option value="all">ทุกหมวดหมู่</option>
                    {allCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-2.5 h-2.5 text-slate-400 absolute right-1.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Table Area - Expanded & Scrollable */}
            <div className="flex-1 overflow-y-auto -mx-1 min-h-0 pr-1">
              {filteredLogs.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[10px]">
                      <th className="pb-1.5 px-2">หัวข้องาน</th>
                      <th className="pb-1.5 px-2">หมวดหมู่</th>
                      <th className="pb-1.5 px-2">วันที่</th>
                      <th className="pb-1.5 px-2">สถานะ</th>
                      <th className="pb-1.5 px-2 text-right">การกระทำ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        onClick={() => onSelectLog(log)}
                        className="hover:bg-slate-50/80 transition cursor-pointer group"
                      >
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 group-hover:text-emerald-900 line-clamp-1 text-[11px] transition">
                                {log.title}
                              </p>
                              <p className="text-[9px] text-slate-400">
                                โดย: {log.trainee?.full_name?.split(' ')[0] || 'นักศึกษา'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-slate-600 font-medium">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[9px] font-semibold text-slate-700">
                            {log.category.split(' ')[0]}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-slate-500 font-medium whitespace-nowrap text-[10px]">
                          {log.work_date}
                        </td>
                        <td className="py-2 px-2 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              log.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : log.status === 'revision_required'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            <span
                              className={`w-1 h-1 rounded-full ${
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
                        <td className="py-2 px-2 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectLog(log);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white group-hover:bg-emerald-600 group-hover:text-white border border-slate-200 group-hover:border-emerald-600 text-slate-700 font-bold text-[10px] transition shadow-2xs"
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
                  <p className="text-xs font-semibold">ไม่พบรายการงานที่ตรงกับเงื่อนไขการค้นหา</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setCategoryFilter('all');
                    }}
                    className="mt-2 text-[10px] text-emerald-600 font-bold hover:underline"
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
          
          {/* Card A: Dark Card (Total Logs) - 30% Secondary structure */}
          <div className="bg-[#19705F] text-white rounded-2xl p-3 sm:p-3.5 shadow-pine border border-[#145C4E] relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">
                จำนวนบันทึกงานรวม
              </span>
              <span className="p-1 rounded-lg bg-[#145C4E] text-[#6FD098]">
                <Sparkles className="w-3 h-3" />
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {totalLogs > 0 ? totalLogs : 12}
              </span>
              <span className="inline-flex items-center text-[10px] font-bold text-[#6FD098] bg-[#0E3E35] px-1.5 py-0.5 rounded-full border border-[#2BA185]/40">
                <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                +15%
              </span>
            </div>
            <p className="text-[10px] text-white/70 mb-2.5">
              รายการบันทึกการฝึกงานในระบบ
            </p>

            {/* Segmented Dual Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-6 flex rounded-lg overflow-hidden p-0.5 bg-[#145C4E] border border-[#125447]">
                <div
                  className="h-full rounded-md bg-[#6FD098] flex items-center justify-center text-[9px] font-black text-[#0E3E35] px-1.5 transition-all shadow-xs"
                  style={{ width: `${Math.max(approvalRate, 40)}%` }}
                >
                  {approvalRate || 45}%
                </div>
                <div
                  className="h-full rounded-md bg-white flex items-center justify-center text-[9px] font-black text-[#19705F] px-1.5 ml-1 transition-all"
                  style={{ width: `${100 - Math.max(approvalRate, 40)}%` }}
                >
                  {100 - (approvalRate || 45)}%
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-white/70 font-medium px-1">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6FD098]" />
                  อนุมัติสำเร็จ
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  รอตรวจ/แก้ไข
                </span>
              </div>
            </div>
          </div>

          {/* Card B: Fresh Mint/Teal Gradient Card (Pending Reviews) */}
          <div className="bg-gradient-to-br from-[#E2F5EC] via-[#EDF9F3] to-[#F7FCF9] text-slate-900 rounded-2xl p-3 sm:p-3.5 shadow-2xs border border-[#C2EAD6] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-[#19705F]">
                งานที่รอการตรวจสอบ
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-white text-[#19705F] text-[9px] font-bold border border-[#C2EAD6]">
                Pending
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-xl sm:text-2xl font-black text-[#19705F] tracking-tight">
                {pendingLogs} งาน
              </span>
              <span className="text-[10px] font-bold text-[#2BA185]">
                รอพี่เลี้ยง/หัวหน้า
              </span>
            </div>
            <p className="text-[10px] text-slate-600 mb-1.5">
              {pendingLogs > 0 ? 'มีรายการรอการยืนยันในคิว' : 'ไม่มีงานค้างตรวจในขณะนี้'}
            </p>

            {/* Mini Bar Sparklines */}
            <div className="h-9 flex items-end justify-between gap-1 pt-1 px-1 relative">
              {[25, 45, 60, 35, 75, 90, 50, 40].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative">
                  {i === 5 && (
                    <div className="absolute -top-5 bg-[#19705F] text-white px-1.5 py-0.5 rounded text-[8px] font-bold shadow-md">
                      {pendingLogs} งาน
                    </div>
                  )}
                  <div
                    className={`w-full rounded-sm transition-all ${
                      i === 5 ? 'bg-[#19705F]' : 'bg-white/90'
                    }`}
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Card C: Soft Mint Cream Card (Approved Logs) */}
          <div className="bg-gradient-to-br from-[#F0FAF5] via-[#F8FCFA] to-white text-slate-900 rounded-2xl p-3 sm:p-3.5 shadow-2xs border border-[#C2EAD6] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-[#19705F]">
                อนุมัติสำเร็จแล้ว (Approved)
              </span>
              <span className="text-[9px] font-bold text-[#19705F] bg-[#E2F4EB] px-1.5 py-0.5 rounded-full border border-[#C2EAD6]">
                +100%
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-0.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {approvedLogs} รายการ
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mb-1">
              ผ่านเกณฑ์การประเมินเรียบร้อย
            </p>

            {/* Wave Sparkline */}
            <div className="h-8 w-full relative pt-1">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 200 40" preserveAspectRatio="none">
                <path
                  d="M 0,28 Q 30,36 60,24 T 120,30 T 170,14 T 200,9"
                  fill="none"
                  stroke="#2BA185"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="200" cy="9" r="3.5" fill="#19705F" stroke="#6FD098" strokeWidth="2" />
              </svg>
              <div className="flex justify-between text-[8px] text-slate-400 font-semibold">
                <span>1 Jul</span>
                <span>15 Jul</span>
                <span>30 Jul</span>
              </div>
            </div>
          </div>

          {/* Card D: Action Button in 30% Secondary Dark Pine */}
          <div>
            {isTrainee ? (
              <button
                onClick={onOpenCreate}
                className="w-full py-2.5 px-4 rounded-xl bg-[#19705F] hover:bg-[#145C4E] active:bg-[#0E3E35] text-white font-bold text-xs shadow-md shadow-[#19705F]/20 transition flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>บันทึกงานใหม่วันนี้</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigateTab && onNavigateTab('reviews')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#19705F] hover:bg-[#145C4E] active:bg-[#0E3E35] text-white font-bold text-xs shadow-md shadow-[#19705F]/20 transition flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5 stroke-[3]" />
                <span>เปิดหน้าตรวจสอบงาน</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

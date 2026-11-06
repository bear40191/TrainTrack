'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { WorkLog } from '@/lib/types';
import {
  TrendingUp,
  Plus,
  ArrowRight,
  ChevronDown,
  Sparkles,
  CheckSquare,
  FileText
} from 'lucide-react';

interface Props {
  onOpenCreate: () => void;
  onSelectLog: (log: WorkLog) => void;
  onNavigateTab?: (tab: 'reviews' | 'my-logs') => void;
}

export const DashboardView: React.FC<Props> = ({ onOpenCreate, onSelectLog, onNavigateTab }) => {
  const { currentUser, workLogs, mentors } = useAppStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'This year' | 'This month' | 'This week'>('This year');

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

  // รายชื่อ 12 เดือนสำหรับ Bar Chart ในการ์ด Sales Analytics สไตล์ในภาพ
  const monthsData = [
    { name: 'Jan', approved: 40, pending: 20 },
    { name: 'Feb', approved: 65, pending: 35 },
    { name: 'Mar', approved: 45, pending: 25 },
    { name: 'Apr', approved: 75, pending: 30 },
    { name: 'May', approved: 55, pending: 20 },
    { name: 'Jun', approved: 85, pending: 40 },
    { name: 'Jul', approved: 95, pending: 15, isHighlighted: true }, // Highlighted Month
    { name: 'Aug', approved: 60, pending: 30 },
    { name: 'Sep', approved: 70, pending: 25 },
    { name: 'Oct', approved: 50, pending: 20 },
    { name: 'Nov', approved: 80, pending: 35 },
    { name: 'Dec', approved: 65, pending: 25 },
  ];

  return (
    <div className="space-y-5 pb-24 font-sans">
      {/* Bento Grid Layout matching the uploaded reference image */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ======================= LEFT / CENTER MAJOR COLUMN (8 COLS) ======================= */}
        <div className="lg:col-span-8 space-y-5">
          
          {/* Card 1: Sales Analytics style -> Work Log Activity Analytics */}
          <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-slate-200/80 shadow-xs relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  สถิติการส่งงาน (Work Analytics)
                </h3>
                <div className="flex items-center gap-4 mt-1 text-xs text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    ผ่านการอนุมัติ (Approved)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-300" />
                    รอตรวจ (Pending)
                  </span>
                </div>
              </div>

              {/* Timeframe Dropdown Pill */}
              <div className="relative inline-flex items-center self-start sm:self-auto">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as 'This year' | 'This month' | 'This week')}
                  className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-1.5 pr-8 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="This year">This year</option>
                  <option value="This month">This month</option>
                  <option value="This week">This week</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Bar Chart Visualization with Hover Tooltip like July 14 */}
            <div className="h-56 w-full flex items-end justify-between gap-1.5 sm:gap-2.5 pt-6 pb-2 px-1 relative">
              {/* Background horizontal guide lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                <div className="border-b border-dashed border-slate-200 w-full" />
                <div className="border-b border-dashed border-slate-200 w-full" />
                <div className="border-b border-dashed border-slate-200 w-full" />
                <div className="border-b border-dashed border-slate-200 w-full" />
              </div>

              {/* Monthly Bars */}
              {monthsData.map((m, idx) => {
                const totalHeight = m.approved + m.pending;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end relative group">
                    {/* Active Tooltip Bubble on July */}
                    {m.isHighlighted && (
                      <div className="absolute -top-12 z-10 bg-[#161922] text-white px-3 py-1.5 rounded-xl shadow-xl text-[11px] font-bold whitespace-nowrap animate-bounce duration-1000 border border-slate-700/60">
                        <p className="text-[10px] text-slate-400">สัปดาห์นี้ • ก.ค.</p>
                        <p className="text-emerald-400">● อนุมัติ 10 รายการ</p>
                        <p className="text-indigo-300">○ รอตรวจ 2 รายการ</p>
                      </div>
                    )}

                    {/* Dual Segmented Bar with rounded top */}
                    <div
                      className={`w-full max-w-[26px] rounded-t-xl transition-all duration-300 flex flex-col justify-end overflow-hidden ${
                        m.isHighlighted
                          ? 'ring-2 ring-emerald-400 shadow-md shadow-emerald-500/20'
                          : 'opacity-90 group-hover:opacity-100'
                      }`}
                      style={{ height: `${totalHeight * 0.9}%` }}
                    >
                      {/* Top Pending Segment */}
                      <div
                        className={`w-full transition-all ${
                          m.isHighlighted ? 'bg-indigo-400' : 'bg-[#d8dbf3]'
                        }`}
                        style={{ height: `${(m.pending / totalHeight) * 100}%` }}
                      />
                      {/* Bottom Approved Segment */}
                      <div
                        className={`w-full transition-all ${
                          m.isHighlighted ? 'bg-emerald-500' : 'bg-[#bac2ea]'
                        }`}
                        style={{ height: `${(m.approved / totalHeight) * 100}%` }}
                      />
                    </div>

                    {/* Month Label */}
                    <span
                      className={`text-[10px] sm:text-xs mt-2 font-medium ${
                        m.isHighlighted ? 'text-slate-900 font-extrabold' : 'text-slate-400'
                      }`}
                    >
                      {m.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Middle Row: Two Asymmetric Cards (Donut Chart & Last Activity) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Card 2: Donut Chart (Top sales by country style -> Status Breakdown) */}
            <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-extrabold text-slate-900">
                  สัดส่วนสถานะงาน (Status)
                </h4>
                <span className="text-[11px] text-slate-400 font-semibold">{totalLogs} รายการ</span>
              </div>

              {/* Circular Gauge / Donut Graphic */}
              <div className="flex items-center justify-center py-2 relative">
                <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="11"
                  />
                  {/* Segment 1: Approved (Emerald) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="11"
                    strokeDasharray={`${Math.max(approvalRate * 2.38, 20)} 238`}
                    strokeLinecap="round"
                  />
                  {/* Segment 2: Pending (Indigo/Lavender) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#818cf8"
                    strokeWidth="11"
                    strokeDasharray={`${Math.max(pendingRate * 2.38, 15)} 238`}
                    strokeDashoffset={`-${Math.max(approvalRate * 2.38, 20)}`}
                    strokeLinecap="round"
                  />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-slate-900 leading-none">
                    {approvalRate || 65}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">อนุมัติแล้ว</span>
                </div>
              </div>

              {/* Donut Legend */}
              <div className="flex items-center justify-around gap-2 pt-3 border-t border-slate-100 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>ผ่าน {approvalRate}%</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span>รอตรวจ {pendingRate}%</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span>แก้ไข {revisionRate}%</span>
                </div>
              </div>
            </div>

            {/* Card 3: Last Activity style -> กิจกรรมล่าสุด */}
            <div className="bg-white rounded-[28px] p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-extrabold text-slate-900">
                  กิจกรรมล่าสุด (Last Activity)
                </h4>
                <div className="flex -space-x-1.5 overflow-hidden">
                  {mentors.slice(0, 3).map((m, i) => (
                    <div
                      key={i}
                      className="w-5 h-5 rounded-full bg-emerald-100 border border-white text-emerald-800 text-[9px] font-bold flex items-center justify-center"
                      title={m.full_name}
                    >
                      {m.full_name.charAt(0)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity rows */}
              <div className="space-y-3">
                {workLogs.slice(0, 3).map((log, i) => (
                  <div
                    key={log.id || i}
                    onClick={() => onSelectLog(log)}
                    className="flex items-center justify-between gap-3 p-2 rounded-2xl hover:bg-slate-50 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 font-bold text-xs">
                        {log.trainee?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {log.title}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {log.work_date} • {log.assigned_mentor?.full_name?.split(' ')[0] || 'พี่เลี้ยง'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
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

              {/* View all activity link */}
              <div className="pt-2 text-right">
                <button
                  onClick={() => onNavigateTab && onNavigateTab(isTrainee ? 'my-logs' : 'reviews')}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center justify-end gap-1"
                >
                  <span>ดูกิจกรรมทั้งหมด</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

          {/* Card 4: Product Sales style Table -> ตารางรายการบันทึกงานล่าสุด */}
          <div className="bg-white rounded-[28px] p-6 sm:p-7 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-extrabold text-slate-900 tracking-tight">
                  รายการงานล่าสุด (Work Logs Table)
                </h4>
                <p className="text-xs text-slate-400 font-medium">รายการบันทึกการทำงานและการอนุมัติล่าสุด</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-600">
                {workLogs.length} รายการ
              </span>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                    <th className="pb-3 px-3">หัวข้องาน (Work Title)</th>
                    <th className="pb-3 px-3">หมวดหมู่</th>
                    <th className="pb-3 px-3">วันที่</th>
                    <th className="pb-3 px-3">สถานะ</th>
                    <th className="pb-3 px-3 text-right">การกระทำ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {workLogs.slice(0, 4).map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => onSelectLog(log)}
                      className="hover:bg-slate-50/80 transition cursor-pointer group"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-emerald-50 text-slate-600 group-hover:text-emerald-600 flex items-center justify-center shrink-0 transition">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-emerald-900 transition line-clamp-1">
                              {log.title}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              โดย: {log.trainee?.full_name?.split(' ')[0] || 'นักศึกษา'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-700">
                          {log.category.split(' ')[0]}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-medium whitespace-nowrap">
                        {log.work_date}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
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
                          {log.status === 'approved'
                            ? 'อนุมัติเรียบร้อย'
                            : log.status === 'revision_required'
                            ? 'ต้องแก้ไข'
                            : 'รอตรวจ'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectLog(log);
                          }}
                          className="px-3 py-1 rounded-xl bg-white group-hover:bg-emerald-600 group-hover:text-white border border-slate-200 group-hover:border-emerald-600 text-slate-700 font-bold text-[11px] transition shadow-2xs"
                        >
                          ดูรายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* ======================= RIGHT COLUMN CARDS (4 COLS) ======================= */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Card A: Dark Card (Total Customers style -> Total System Logs) */}
          <div className="bg-[#141720] text-white rounded-[28px] p-6 shadow-xl border border-slate-800/80 relative overflow-hidden">
            {/* Background ambient glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                จำนวนบันทึกงานรวม
              </span>
              <span className="p-1.5 rounded-xl bg-slate-800/80 text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                {totalLogs > 0 ? totalLogs : 12}
              </span>
              <span className="inline-flex items-center text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/50">
                <TrendingUp className="w-3 h-3 mr-0.5" />
                +15%
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              รายการบันทึกการฝึกงานในระบบ
            </p>

            {/* Segmented Dual Bar like the screenshot */}
            <div className="space-y-2">
              <div className="w-full h-8 flex rounded-xl overflow-hidden p-1 bg-slate-800/80 border border-slate-700/60">
                {/* 1st segment: Patterned/Stripe */}
                <div
                  className="h-full rounded-lg bg-emerald-500/90 flex items-center justify-center text-[10px] font-black text-white px-2 transition-all"
                  style={{ width: `${Math.max(approvalRate, 40)}%` }}
                >
                  {approvalRate || 45}%
                </div>
                {/* 2nd segment: Clean White Pill */}
                <div
                  className="h-full rounded-lg bg-white flex items-center justify-center text-[10px] font-black text-slate-900 px-2 ml-1 transition-all"
                  style={{ width: `${100 - Math.max(approvalRate, 40)}%` }}
                >
                  {100 - (approvalRate || 45)}%
                </div>
              </div>

              {/* Segmented Labels */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  อนุมัติสำเร็จ
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white" />
                  รอตรวจ/แก้ไข
                </span>
              </div>
            </div>
          </div>

          {/* Card B: Lavender/Periwinkle Gradient Card (Total Revenue style -> Pending Reviews) */}
          <div className="bg-gradient-to-br from-[#c9cfec] via-[#dde1f7] to-[#ede7f8] text-slate-900 rounded-[28px] p-6 shadow-xs border border-indigo-200/50 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">
                งานที่รอการตรวจสอบ
              </span>
              <span className="p-1 rounded-lg bg-white/60 text-slate-700 text-xs font-bold">
                Pending
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {pendingLogs} งาน
              </span>
              <span className="text-xs font-bold text-indigo-700">
                รอพี่เลี้ยง/หัวหน้า
              </span>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              {pendingLogs > 0 ? 'มีรายการรอการยืนยันในคิว' : 'ไม่มีงานค้างตรวจในขณะนี้'}
            </p>

            {/* Mini Bar Sparklines inside Card B like in the screenshot */}
            <div className="h-16 flex items-end justify-between gap-1.5 pt-2 px-1 relative">
              {[25, 45, 60, 35, 75, 90, 50, 40].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative">
                  {i === 5 && (
                    <div className="absolute -top-6 bg-[#161922] text-white px-2 py-0.5 rounded-lg text-[9px] font-bold shadow-md">
                      {pendingLogs} งาน
                    </div>
                  )}
                  <div
                    className={`w-full rounded-md transition-all ${
                      i === 5 ? 'bg-[#161922]' : 'bg-white/80'
                    }`}
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Card C: Warm Cream Card (Total Orders style -> Approved Logs with Wave Sparkline) */}
          <div className="bg-gradient-to-br from-[#fff7ee] via-[#fffbf6] to-white text-slate-900 rounded-[28px] p-6 shadow-xs border border-amber-200/60 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">
                อนุมัติสำเร็จแล้ว (Approved)
              </span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                +100%
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {approvedLogs} รายการ
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              ผ่านเกณฑ์การประเมินเรียบร้อย
            </p>

            {/* Smooth SVG Wave Sparkline with Dot endpoint like in the screenshot */}
            <div className="h-14 w-full relative pt-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 200 50" preserveAspectRatio="none">
                <path
                  d="M 0,35 Q 30,45 60,30 T 120,38 T 170,18 T 200,12"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Dot at endpoint */}
                <circle cx="200" cy="12" r="4.5" fill="#1e293b" stroke="#ffffff" strokeWidth="2" />
              </svg>
              <div className="flex justify-between text-[9px] text-slate-400 font-semibold mt-1">
                <span>1 Jul</span>
                <span>15 Jul</span>
                <span>30 Jul</span>
              </div>
            </div>
          </div>

          {/* Card D: Dark Action Button (Export statistics style -> Create Log or Review) */}
          <div className="pt-1">
            {isTrainee ? (
              <button
                onClick={onOpenCreate}
                className="w-full py-4 px-5 rounded-2xl bg-[#141720] hover:bg-slate-800 text-white font-bold text-sm shadow-lg shadow-slate-900/15 transition flex items-center justify-center gap-2.5 active:scale-98 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>บันทึกงานใหม่วันนี้</span>
              </button>
            ) : (
              <button
                onClick={() => onNavigateTab && onNavigateTab('reviews')}
                className="w-full py-4 px-5 rounded-2xl bg-[#141720] hover:bg-slate-800 text-white font-bold text-sm shadow-lg shadow-slate-900/15 transition flex items-center justify-center gap-2.5 active:scale-98 cursor-pointer"
              >
                <CheckSquare className="w-4 h-4 stroke-[3]" />
                <span>เปิดหน้าตรวจสอบงาน</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

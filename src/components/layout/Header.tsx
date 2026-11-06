'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Bell, ChevronDown, X, Users2 } from 'lucide-react';
import { RoleSelector } from './RoleSelector';
import { ROLE_LABELS } from '@/lib/constants';
import { TabKey } from './TabBar';

interface HeaderProps {
  activeTab?: TabKey;
  onOpenNotif?: () => void;
  onOpenProfile?: () => void;
}

function getHeaderContent(tab: TabKey = 'dashboard', role: string) {
  switch (tab) {
    case 'create':
      return {
        title: 'บันทึกงานใหม่',
        badge: 'New Work Log',
        subtitle: 'กรอกรายละเอียดการปฏิบัติงานประจำวัน แนบหลักฐาน และส่งให้พี่เลี้ยงตรวจสอบ',
      };
    case 'my-logs':
      return {
        title: 'งานของฉัน',
        badge: 'My Work Logs',
        subtitle: 'ตรวจสอบประวัติ ติดตามสถานะงานที่ส่ง และดูข้อเสนอแนะจากพี่เลี้ยง',
      };
    case 'reviews':
      if (role === 'mentor') {
        return {
          title: 'ตรวจงานนักศึกษา',
          badge: 'Mentor Review',
          subtitle: 'ตรวจสอบรายละเอียดงาน ยืนยันความถูกต้อง หรือส่งกลับให้นักศึกษาแก้ไข',
        };
      }
      if (role === 'lead') {
        return {
          title: 'อนุมัติขั้นสุดท้าย',
          badge: 'Lead Approval',
          subtitle: 'ตรวจสอบและอนุมัติผลงานขั้นสุดท้าย เพื่อประเมินผลการฝึกงานสมบูรณ์',
        };
      }
      return {
        title: 'รายการตรวจงาน',
        badge: 'Reviews',
        subtitle: 'รายการบันทึกงานที่รอการตรวจสอบและอนุมัติในระบบ',
      };
    case 'admin':
      return {
        title: 'การจัดการระบบ',
        badge: 'Administration',
        subtitle: 'จัดการรายชื่อผู้ใช้ กำหนดบทบาทพี่เลี้ยง/นักศึกษา และหมวดหมู่งาน',
      };
    case 'dashboard':
    default:
      if (role === 'mentor') {
        return {
          title: 'Overview',
          badge: 'Mentor Dashboard',
          subtitle: 'ภาพรวมงานของนักศึกษาฝึกงานที่รอการตรวจสอบและส่งต่อหัวหน้า',
        };
      }
      if (role === 'lead') {
        return {
          title: 'Overview',
          badge: 'Lead Dashboard',
          subtitle: 'ภาพรวมการอนุมัติงานขั้นสุดท้ายและการประเมินนักศึกษาทั้งทีม',
        };
      }
      if (role === 'admin') {
        return {
          title: 'Overview',
          badge: 'Admin Dashboard',
          subtitle: 'ภาพรวมระบบ บัญชีผู้ใช้งาน และรายงานสถิติทั้งหมด',
        };
      }
      return {
        title: 'Overview',
        badge: 'TrainTrack',
        subtitle: 'Detailed information about your internship & work logs',
      };
  }
}

export const Header: React.FC<HeaderProps> = ({ activeTab = 'dashboard', onOpenNotif, onOpenProfile }) => {
  const { currentUser, notifications } = useAppStore();
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  // ดึงหัวข้อและคำอธิบายตามแท็บปัจจุบันและบทบาทของผู้ใช้งาน
  const headerInfo = getHeaderContent(activeTab, currentUser.role);

  return (
    <header className="px-4 sm:px-6 pt-2 pb-1 transition-all z-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Dynamic Page Title & Subtitle based on Active Tab and Role */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight transition-all">
                {headerInfo.title}
              </h1>
              {headerInfo.badge && (
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 transition-all">
                  {headerInfo.badge}
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 font-medium transition-all">
              {headerInfo.subtitle}
            </p>
          </div>

          {/* Right: Role Switcher, Notification Bell, User Avatar */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Role Switcher Pill */}
            <button
              onClick={() => setShowRoleSelector(!showRoleSelector)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition shadow-2xs ${
                showRoleSelector
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-700'
              }`}
              title="สลับสิทธิ์การใช้งาน (Role Switcher)"
            >
              <Users2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">สลับสิทธิ์</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Notification Bell with green indicator */}
            <button
              onClick={onOpenNotif}
              className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-slate-200/80 hover:border-slate-300 text-slate-500 hover:text-slate-800 flex items-center justify-center transition shadow-2xs"
              title="การแจ้งเตือน"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 ? (
                <span className="absolute 1.5 top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
              ) : (
                <span className="absolute 1.5 top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>

            {/* User Avatar with status dot */}
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 p-1 pr-2 rounded-xl bg-white border border-slate-200/80 hover:border-emerald-300 transition shadow-2xs group cursor-pointer"
              title="คลิกเพื่อดูโปรไฟล์"
            >
              <div className="relative">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow-2xs group-hover:scale-105 transition-transform">
                  {currentUser.full_name ? currentUser.full_name.charAt(0) : 'U'}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-[11px] font-bold text-slate-900 group-hover:text-emerald-900 leading-tight">
                  {currentUser.full_name.split(' ')[0]}
                </p>
                <p className="text-[9px] text-slate-400 group-hover:text-emerald-700 leading-tight">
                  {ROLE_LABELS[currentUser.role]?.split(' ')[0]}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Popover / Collapsible Role Switcher */}
        {showRoleSelector && (
          <div className="mt-2 p-2 bg-white rounded-2xl border border-slate-200 shadow-xl relative animate-fadeIn z-30">
            <div className="flex items-center justify-between px-2 pb-1.5 mb-1.5 border-b border-slate-100">
              <span className="text-[11px] font-bold text-slate-700">สลับสิทธิ์การทดสอบ</span>
              <button
                onClick={() => setShowRoleSelector(false)}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <RoleSelector />
          </div>
        )}
      </div>
    </header>
  );
};

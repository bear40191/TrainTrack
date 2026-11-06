'use client';

import React from 'react';
import { useAppStore } from '@/store/appStore';
import { Bell, Briefcase, ChevronDown } from 'lucide-react';
import { RoleSelector } from './RoleSelector';
import { ROLE_LABELS } from '@/lib/constants';

interface HeaderProps {
  onOpenNotif?: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotif, onOpenProfile }) => {
  const { currentUser, notifications } = useAppStore();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 pt-4 pb-3 shadow-sm">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-3.5">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
                TrainTrack
                <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                  Hybrid
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">ระบบบันทึก & อนุมัติงานฝึกงาน</p>
            </div>
          </div>

          {/* Action buttons: Notifications & User Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Notification button */}
            <button
              onClick={onOpenNotif}
              className="relative p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 transition"
              title="การแจ้งเตือน"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Profile Clickable Pill/Avatar */}
            <div className="pl-1 sm:pl-2 border-l border-slate-200">
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200 hover:border-emerald-300 transition group cursor-pointer text-left"
                title="คลิกเพื่อดูโปรไฟล์และจัดการบัญชี"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform">
                  {currentUser.full_name ? currentUser.full_name.charAt(0) : 'U'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-900 leading-tight">
                    {currentUser.full_name.split(' ')[0]}
                  </p>
                  <p className="text-[10px] text-slate-500 group-hover:text-emerald-700 leading-tight">
                    {ROLE_LABELS[currentUser.role]?.split(' ')[0] || 'โปรไฟล์'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 hidden sm:block" />
              </button>
            </div>
          </div>
        </div>

        {/* Role Switcher */}
        <RoleSelector />
      </div>
    </header>
  );
};

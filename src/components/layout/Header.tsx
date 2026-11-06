'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Bell, Search, ChevronDown } from 'lucide-react';
import { RoleSelector } from './RoleSelector';
import { ROLE_LABELS } from '@/lib/constants';

interface HeaderProps {
  onOpenNotif?: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotif, onOpenProfile }) => {
  const { currentUser, notifications } = useAppStore();
  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  return (
    <header className="px-4 sm:px-6 pt-4 pb-2 transition-all">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-2">
          {/* Left: Overview Title & Subtitle like in the photo */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Overview
              </h1>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                TrainTrack
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">
              Detailed information about your internship & work logs
            </p>
          </div>

          {/* Right: Search, Notification Bell, User Avatar like in the photo */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Search Pill */}
            <button
              onClick={() => setShowRoleSelector(!showRoleSelector)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 text-slate-500 hover:text-slate-800 flex items-center justify-center transition shadow-xs"
              title="สลับสิทธิ์ผู้ใช้งาน"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notification Bell with green indicator */}
            <button
              onClick={onOpenNotif}
              className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 text-slate-500 hover:text-slate-800 flex items-center justify-center transition shadow-xs"
              title="การแจ้งเตือน"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 ? (
                <span className="absolute 1.5 top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
              ) : (
                <span className="absolute 2 top-2 right-2 w-2 h-2 rounded-full bg-emerald-400/80" />
              )}
            </button>

            {/* User Avatar with status dot */}
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2.5 p-1 sm:p-1.5 pr-2.5 rounded-2xl bg-white border border-slate-200/80 hover:border-emerald-300 transition shadow-xs group cursor-pointer"
              title="คลิกเพื่อดูโปรไฟล์"
            >
              <div className="relative">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-xs shadow-xs group-hover:scale-105 transition-transform">
                  {currentUser.full_name ? currentUser.full_name.charAt(0) : 'U'}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-900 leading-tight">
                  {currentUser.full_name.split(' ')[0]}
                </p>
                <p className="text-[10px] text-slate-400 group-hover:text-emerald-700 leading-tight">
                  {ROLE_LABELS[currentUser.role]?.split(' ')[0]}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 hidden sm:block" />
            </button>
          </div>
        </div>

        {/* Quick Role Switcher (Toggleable or always visible for demo) */}
        <div className="pt-1">
          <RoleSelector />
        </div>
      </div>
    </header>
  );
};

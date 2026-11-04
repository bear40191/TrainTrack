'use client';

import React from 'react';
import { useAppStore } from '@/store/appStore';
import { Bell, Briefcase } from 'lucide-react';
import { RoleSelector } from './RoleSelector';

export const Header: React.FC<{ onOpenNotif?: () => void }> = ({ onOpenNotif }) => {
  const { currentUser, notifications } = useAppStore();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 lg:px-12 pt-4 pb-3 shadow-sm">
      <div className="w-full mx-auto">
        <div className="flex items-center justify-between mb-3.5">
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

          <div className="flex items-center gap-3">
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

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-bold text-sm">
                {currentUser.full_name ? currentUser.full_name.charAt(0) : 'U'}
              </div>
            </div>
          </div>
        </div>

        {/* Role Switcher */}
        <RoleSelector />
      </div>
    </header>
  );
};

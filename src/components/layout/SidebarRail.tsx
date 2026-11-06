'use client';

import React from 'react';
import { useAppStore } from '@/store/appStore';
import { TabKey } from './TabBar';
import {
  LayoutDashboard,
  PlusCircle,
  ClipboardList,
  CheckSquare,
  Shield,
  User,
  LogOut,
  Sparkles
} from 'lucide-react';

interface Props {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export const SidebarRail: React.FC<Props> = ({
  activeTab,
  onTabChange,
  onOpenProfile,
  onLogout,
}) => {
  const { currentUser, workLogs } = useAppStore();

  const isTrainee = currentUser.role === 'trainee';
  const isMentor = currentUser.role === 'mentor';
  const isLead = currentUser.role === 'lead';
  const isAdmin = currentUser.role === 'admin';

  const pendingReviewCount =
    isMentor
      ? workLogs.filter((l) => l.status === 'pending_mentor').length
      : isLead
      ? workLogs.filter((l) => l.status === 'pending_lead').length
      : 0;

  return (
    <aside className="hidden lg:flex flex-col items-center justify-between w-16 py-5 my-4 ml-4 bg-[#14171f] text-white rounded-[28px] shadow-2xl shrink-0 z-20 border border-slate-800/80">
      {/* Brand Logo Top */}
      <div className="flex flex-col items-center gap-6">
        <button
          onClick={() => onTabChange('dashboard')}
          className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/30 transition hover:scale-105"
          title="TrainTrack"
        >
          <Sparkles className="w-5 h-5 text-white" />
        </button>

        {/* Navigation Items (White box highlight like in the screenshot) */}
        <nav className="flex flex-col items-center gap-3">
          {/* Dashboard / Overview */}
          <button
            onClick={() => onTabChange('dashboard')}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
              activeTab === 'dashboard'
                ? 'bg-white text-slate-900 shadow-md shadow-white/10 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Overview (ภาพรวม)"
          >
            <LayoutDashboard className="w-5 h-5" />
          </button>

          {/* Create Log (Trainee only) */}
          {isTrainee && (
            <button
              onClick={() => onTabChange('create')}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                activeTab === 'create'
                  ? 'bg-white text-slate-900 shadow-md shadow-white/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="บันทึกงานใหม่"
            >
              <PlusCircle className="w-5 h-5" />
            </button>
          )}

          {/* My Logs (Trainee only) */}
          {isTrainee && (
            <button
              onClick={() => onTabChange('my-logs')}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                activeTab === 'my-logs'
                  ? 'bg-white text-slate-900 shadow-md shadow-white/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="งานของฉัน"
            >
              <ClipboardList className="w-5 h-5" />
            </button>
          )}

          {/* Reviews (Mentor / Lead) */}
          {(isMentor || isLead) && (
            <button
              onClick={() => onTabChange('reviews')}
              className={`relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                activeTab === 'reviews'
                  ? 'bg-white text-slate-900 shadow-md shadow-white/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="ตรวจงาน"
            >
              <CheckSquare className="w-5 h-5" />
              {pendingReviewCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingReviewCount}
                </span>
              )}
            </button>
          )}

          {/* Admin */}
          {isAdmin && (
            <button
              onClick={() => onTabChange('admin')}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                activeTab === 'admin'
                  ? 'bg-white text-slate-900 shadow-md shadow-white/10'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="ผู้ดูแลระบบ"
            >
              <Shield className="w-5 h-5" />
            </button>
          )}
        </nav>
      </div>

      {/* Bottom Actions: Profile & Logout */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={onOpenProfile}
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          title="โปรไฟล์ผู้ใช้"
        >
          <User className="w-5 h-5" />
        </button>

        <button
          onClick={onLogout}
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
          title="ออกจากระบบ"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
};

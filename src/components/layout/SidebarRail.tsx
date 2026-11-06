'use client';

import React from 'react';
import { useAppStore } from '@/store/appStore';
import { TabKey } from './TabBar';
import {
  PanelsTopLeft,
  PlusCircle,
  ClipboardList,
  CheckSquare,
  Shield,
  User,
  LogOut,
  Asterisk
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
    <aside className="hidden lg:flex flex-col items-center justify-between w-14 py-4 my-2.5 ml-3 bg-[#131620] text-white rounded-[24px] shadow-2xl shrink-0 z-20 border border-slate-800/80 h-[calc(100vh-20px)]">
      {/* Brand Logo Top - Asterisk / Star icon matching the reference image */}
      <div className="flex flex-col items-center gap-5">
        <button
          onClick={() => onTabChange('dashboard')}
          className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 transition hover:scale-105 active:scale-95"
          title="TrainTrack"
        >
          <Asterisk className="w-5 h-5 stroke-[2.8] text-white" />
        </button>

        {/* Navigation Items (White box highlight like in the screenshot) */}
        <nav className="flex flex-col items-center gap-2.5">
          {/* Dashboard / Overview - Changed Icon to PanelsTopLeft matching the screenshot */}
          <button
            onClick={() => onTabChange('dashboard')}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              activeTab === 'dashboard'
                ? 'bg-white text-slate-900 shadow-md shadow-white/10 font-bold scale-105'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
            title="Overview (ภาพรวม Dashboard)"
          >
            <PanelsTopLeft className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* Create Log (Trainee only) */}
          {isTrainee && (
            <button
              onClick={() => onTabChange('create')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                activeTab === 'create'
                  ? 'bg-white text-slate-900 shadow-md shadow-white/10 font-bold scale-105'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="บันทึกงานใหม่"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          )}

          {/* My Logs (Trainee only) */}
          {isTrainee && (
            <button
              onClick={() => onTabChange('my-logs')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                activeTab === 'my-logs'
                  ? 'bg-white text-slate-900 shadow-md shadow-white/10 font-bold scale-105'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="งานของฉัน"
            >
              <ClipboardList className="w-4 h-4" />
            </button>
          )}

          {/* Reviews (Mentor / Lead) */}
          {(isMentor || isLead) && (
            <button
              onClick={() => onTabChange('reviews')}
              className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                activeTab === 'reviews'
                  ? 'bg-white text-slate-900 shadow-md shadow-white/10 font-bold scale-105'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="ตรวจงาน"
            >
              <CheckSquare className="w-4 h-4" />
              {pendingReviewCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {pendingReviewCount}
                </span>
              )}
            </button>
          )}

          {/* Admin */}
          {isAdmin && (
            <button
              onClick={() => onTabChange('admin')}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                activeTab === 'admin'
                  ? 'bg-white text-slate-900 shadow-md shadow-white/10 font-bold scale-105'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="ผู้ดูแลระบบ"
            >
              <Shield className="w-4 h-4" />
            </button>
          )}
        </nav>
      </div>

      {/* Bottom Actions: Profile & Logout */}
      <div className="flex flex-col items-center gap-2.5">
        <button
          onClick={onOpenProfile}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          title="โปรไฟล์ผู้ใช้"
        >
          <User className="w-4 h-4" />
        </button>

        <button
          onClick={onLogout}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
          title="ออกจากระบบ"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

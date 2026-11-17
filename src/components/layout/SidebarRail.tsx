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

interface NavTooltipProps {
  en: string;
  th: string;
  badge?: number;
}

const NavTooltip: React.FC<NavTooltipProps> = ({ en, th, badge }) => (
  <div className="pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-150 ease-out z-50 whitespace-nowrap">
    {/* Clean light pill matching reference image */}
    <div className="px-2.5 py-1 rounded-md bg-[#EDEBE6] text-[#111111] shadow-md border border-[#D5D2CA] flex items-center gap-1.5">
      <span className="text-[11px] font-black uppercase tracking-wider text-[#111111]">
        {en}
      </span>
      {th && (
        <>
          <span className="w-1 h-1 rounded-full bg-[#99968E]" />
          <span className="text-[10px] text-[#55524A] font-semibold tracking-normal normal-case">
            {th}
          </span>
        </>
      )}
      {badge !== undefined && badge > 0 && (
        <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#19705F] text-white text-[9px] font-black">
          {badge}
        </span>
      )}
    </div>
  </div>
);

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
    <aside className="hidden lg:flex flex-col items-center justify-between w-14 py-4 my-2.5 ml-3 bg-[#19705F] text-white rounded-[24px] shadow-pine shrink-0 z-40 border border-[#145C4E] h-[calc(100vh-20px)]">
      {/* Brand Logo Top - Asterisk / Star icon matching the reference image */}
      <div className="flex flex-col items-center gap-5">
        <button
          onClick={() => onTabChange('dashboard')}
          className="relative group w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6FD098] to-[#2BA185] flex items-center justify-center text-white shadow-md shadow-[#6FD098]/30 transition hover:scale-105 active:scale-95"
          aria-label="TrainTrack Home"
        >
          <Asterisk className="w-5 h-5 stroke-[2.8] text-white" />
          <NavTooltip en="TRAINTRACK" th="หน้าหลัก" />
        </button>

        {/* Navigation Items (Accent Mint highlight against Dark Pine) */}
        <nav className="flex flex-col items-center gap-2.5">
          {/* Dashboard / Overview */}
          <button
            onClick={() => onTabChange('dashboard')}
            className={`relative group w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              activeTab === 'dashboard'
                ? 'bg-[#6FD098] text-[#0E3E35] shadow-md shadow-[#6FD098]/30 font-bold scale-105'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            aria-label="Overview"
          >
            <PanelsTopLeft className="w-4 h-4 stroke-[2.2]" />
            <NavTooltip en="OVERVIEW" th="ภาพรวม" />
          </button>

          {/* Create Log (Trainee only) */}
          {isTrainee && (
            <button
              onClick={() => onTabChange('create')}
              className={`relative group w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                activeTab === 'create'
                  ? 'bg-[#6FD098] text-[#0E3E35] shadow-md shadow-[#6FD098]/30 font-bold scale-105'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              aria-label="New Work Log"
            >
              <PlusCircle className="w-4 h-4" />
              <NavTooltip en="NEW LOG" th="บันทึกงานใหม่" />
            </button>
          )}

          {/* My Logs (Trainee only) */}
          {isTrainee && (
            <button
              onClick={() => onTabChange('my-logs')}
              className={`relative group w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                activeTab === 'my-logs'
                  ? 'bg-[#6FD098] text-[#0E3E35] shadow-md shadow-[#6FD098]/30 font-bold scale-105'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              aria-label="My Work Logs"
            >
              <ClipboardList className="w-4 h-4" />
              <NavTooltip en="MY LOGS" th="งานของฉัน" />
            </button>
          )}

          {/* Reviews (Mentor / Lead) */}
          {(isMentor || isLead) && (
            <button
              onClick={() => onTabChange('reviews')}
              className={`relative group w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                activeTab === 'reviews'
                  ? 'bg-[#6FD098] text-[#0E3E35] shadow-md shadow-[#6FD098]/30 font-bold scale-105'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              aria-label="Reviews"
            >
              <CheckSquare className="w-4 h-4" />
              {pendingReviewCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#6FD098] text-[#0E3E35] text-[9px] font-bold flex items-center justify-center shadow">
                  {pendingReviewCount}
                </span>
              )}
              <NavTooltip en="REVIEWS" th="ตรวจงาน" badge={pendingReviewCount} />
            </button>
          )}

          {/* Admin */}
          {isAdmin && (
            <button
              onClick={() => onTabChange('admin')}
              className={`relative group w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                activeTab === 'admin'
                  ? 'bg-[#6FD098] text-[#0E3E35] shadow-md shadow-[#6FD098]/30 font-bold scale-105'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              aria-label="Admin Console"
            >
              <Shield className="w-4 h-4" />
              <NavTooltip en="ADMIN" th="ดูแลระบบ" />
            </button>
          )}
        </nav>
      </div>

      {/* Bottom Actions: Profile & Logout */}
      <div className="flex flex-col items-center gap-2.5">
        <button
          onClick={onOpenProfile}
          className="relative group w-9 h-9 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition"
          aria-label="User Profile"
        >
          <User className="w-4 h-4" />
          <NavTooltip en="PROFILE" th="ข้อมูลส่วนตัว" />
        </button>

        <button
          onClick={onLogout}
          className="relative group w-9 h-9 rounded-xl flex items-center justify-center text-white/70 hover:text-rose-300 hover:bg-rose-900/30 transition"
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4" />
          <NavTooltip en="LOGOUT" th="ออกจากระบบ" />
        </button>
      </div>
    </aside>
  );
};

'use client';

import React from 'react';
import { useAppStore } from '@/store/appStore';
import { PanelsTopLeft, PlusCircle, CheckSquare, ClipboardList, Shield } from 'lucide-react';

export type TabKey = 'dashboard' | 'create' | 'my-logs' | 'reviews' | 'admin';

interface Props {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const TabBar: React.FC<Props> = ({ activeTab, onTabChange }) => {
  const { currentUser, workLogs } = useAppStore();

  const pendingMentorCount = workLogs.filter((l) => l.status === 'pending_mentor').length;
  const pendingLeadCount = workLogs.filter((l) => l.status === 'pending_lead').length;

  const reviewBadgeCount =
    currentUser.role === 'mentor'
      ? pendingMentorCount
      : currentUser.role === 'lead'
        ? pendingLeadCount
        : 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 pb-6 safe-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="max-w-xl mx-auto flex items-center justify-around gap-2">
        {/* หน้าหลัก / ภาพรวม */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-200 ${activeTab === 'dashboard'
              ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
        >
          <PanelsTopLeft className="w-5 h-5 mb-1" />
          <span className="text-xs font-semibold">ภาพรวม</span>
        </button>

        {/* บันทึกงานใหม่ (เฉพาะนักศึกษา) */}
        {currentUser.role === 'trainee' && (
          <button
            onClick={() => onTabChange('create')}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-200 ${activeTab === 'create'
                ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30'
                : 'text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200'
              }`}
          >
            <PlusCircle className="w-5 h-5 mb-1" />
            <span className="text-xs font-bold">บันทึกงาน</span>
          </button>
        )}

        {/* งานของฉัน (เฉพาะนักศึกษา) */}
        {currentUser.role === 'trainee' && (
          <button
            onClick={() => onTabChange('my-logs')}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-200 ${activeTab === 'my-logs'
                ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            <ClipboardList className="w-5 h-5 mb-1" />
            <span className="text-xs font-semibold">งานของฉัน</span>
          </button>
        )}

        {/* เมนูตรวจงาน (สำหรับ พี่เลี้ยง และ หัวหน้าพี่เลี้ยง) */}
        {(currentUser.role === 'mentor' || currentUser.role === 'lead') && (
          <button
            onClick={() => onTabChange('reviews')}
            className={`flex-1 relative flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-200 ${activeTab === 'reviews'
                ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            <div className="relative">
              <CheckSquare className="w-5 h-5 mb-1" />
              {reviewBadgeCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-emerald-600 text-white text-[11px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
                  {reviewBadgeCount}
                </span>
              )}
            </div>
            <span className="text-xs font-semibold">
              {currentUser.role === 'mentor' ? 'รอตรวจงาน' : 'รออนุมัติ'}
            </span>
          </button>
        )}

        {/* ผู้ดูแลระบบ */}
        {currentUser.role === 'admin' && (
          <button
            onClick={() => onTabChange('admin')}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-200 ${activeTab === 'admin'
                ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
          >
            <Shield className="w-5 h-5 mb-1" />
            <span className="text-xs font-semibold">ผู้ดูแล</span>
          </button>
        )}
      </div>
    </nav>
  );
};

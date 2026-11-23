'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { WorkLog } from '@/lib/types';
import { Header } from '@/components/layout/Header';
import { TabBar, TabKey } from '@/components/layout/TabBar';
import { SidebarRail } from '@/components/layout/SidebarRail';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { WorkLogForm } from '@/components/work-log/WorkLogForm';
import { MyLogsView } from '@/components/work-log/MyLogsView';
import { ReviewListView } from '@/components/review/ReviewListView';
import { AdminView } from '@/components/admin/AdminView';
import { WorkLogDetailModal } from '@/components/work-log/WorkLogDetailModal';
import { NotificationModal } from '@/components/layout/NotificationModal';
import { ProfileModal } from '@/components/profile/ProfileModal';
import { LoginPage } from '@/components/auth/LoginPage';

export default function HomePage() {
  const { currentUser, workLogs, isAuthenticated, logout, restoreSession } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [selectedLog, setSelectedLog] = useState<WorkLog | null>(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);

  // กู้คืนเซสชันเมื่อเปิดแอปหรือรีเฟรชหน้า (จดจำเซสชัน 72 ชั่วโมง)
  useEffect(() => {
    restoreSession();
    setIsSessionLoaded(true);
  }, [restoreSession]);

  const isTrainee = currentUser?.role === 'trainee';
  const isMentor = currentUser?.role === 'mentor';
  const isLead = currentUser?.role === 'lead';
  const isAdmin = currentUser?.role === 'admin';

  // ตรวจสอบและบังคับสิทธิ์การเข้าถึงแท็บตามบทบาทของผู้ใช้ (Role Tab Guard)
  useEffect(() => {
    if (!currentUser?.role) return;

    const allowedTabs: Record<string, TabKey[]> = {
      trainee: ['dashboard', 'create', 'my-logs'],
      mentor: ['dashboard', 'reviews'],
      lead: ['dashboard', 'reviews'],
      admin: ['dashboard', 'admin'],
    };

    const permitted = allowedTabs[currentUser.role] || ['dashboard'];
    if (!permitted.includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [currentUser?.role, activeTab]);

  const handleSelectLogById = (logId: string) => {
    const found = workLogs.find((l) => l.id === logId);
    if (found) {
      setSelectedLog(found);
    }
  };

  // รอตรวจสอบเซสชันใน localStorage ก่อนแสดงผลเพื่อป้องกันการกระพริบหน้า
  if (!isSessionLoaded) {
    return (
      <div className="min-h-screen bg-[#EFEFEF] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  // ถ้ายังไม่ได้ล็อกอิน ให้แสดงหน้า Login
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setActiveTab('dashboard')} />;
  }

  return (
    <div className="h-screen overflow-hidden bg-[#EFEFEF] text-slate-800 flex font-sans">
      {/* Left Navigation Rail (Floating dark pill sidebar like in the reference image) */}
      <SidebarRail
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={logout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          onOpenNotif={() => setIsNotifOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
        />

        {/* Dynamic Tab Views */}
        <main
          className={`flex-1 w-full min-h-0 ${
            activeTab === 'dashboard' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'
          }`}
        >
          <div
            className={`w-full max-w-7xl mx-auto px-3 sm:px-5 pt-1 min-h-0 ${
              activeTab === 'dashboard' ? 'flex-1 flex flex-col pb-2' : 'pb-24'
            }`}
          >
            {activeTab === 'dashboard' && (
              <DashboardView
                onOpenCreate={() => setActiveTab('create')}
                onSelectLog={(log) => setSelectedLog(log)}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {/* บันทึกงานใหม่ (เฉพาะนักศึกษา) */}
            {activeTab === 'create' && isTrainee && (
              <div className="pb-20 max-w-3xl mx-auto">
                <WorkLogForm onSuccess={() => setActiveTab('my-logs')} />
              </div>
            )}

            {/* งานของฉัน (เฉพาะนักศึกษา) */}
            {activeTab === 'my-logs' && isTrainee && (
              <MyLogsView onSelectLog={(log) => setSelectedLog(log)} />
            )}

            {/* ตรวจงาน / อนุมัติ (เฉพาะพี่เลี้ยง และ หัวหน้าพี่เลี้ยง) */}
            {activeTab === 'reviews' && (isMentor || isLead) && (
              <ReviewListView onSelectLog={(log) => setSelectedLog(log)} />
            )}

            {/* จัดการระบบ (เฉพาะผู้ดูแลระบบ Admin) */}
            {activeTab === 'admin' && isAdmin && <AdminView />}
          </div>
        </main>
      </div>

      {/* Bottom Tab Navigation (Mobile/Tablet only) */}
      <div className="lg:hidden">
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <WorkLogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}

      {/* Notification Modal */}
      {isNotifOpen && (
        <NotificationModal
          onClose={() => setIsNotifOpen(false)}
          onSelectLog={handleSelectLogById}
        />
      )}

      {/* Profile Modal */}
      {isProfileOpen && (
        <ProfileModal
          onClose={() => setIsProfileOpen(false)}
          onLogout={logout}
        />
      )}
    </div>
  );
}

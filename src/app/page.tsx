'use client';

import React, { useState } from 'react';
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
  const { workLogs, isAuthenticated, logout } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [selectedLog, setSelectedLog] = useState<WorkLog | null>(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleSelectLogById = (logId: string) => {
    const found = workLogs.find((l) => l.id === logId);
    if (found) {
      setSelectedLog(found);
    }
  };

  // ถ้ายังไม่ได้ล็อกอิน ให้แสดงหน้า Login
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setActiveTab('dashboard')} />;
  }

  return (
    <div className="h-screen overflow-hidden bg-[#f3f5fa] text-slate-800 flex font-sans">
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
          onOpenNotif={() => setIsNotifOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
        />

        {/* Dynamic Tab Views */}
        <main
          className={`flex-1 max-w-7xl w-full mx-auto px-3 sm:px-5 pt-1 pb-2 min-h-0 ${
            activeTab === 'dashboard' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto pb-24'
          }`}
        >
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenCreate={() => setActiveTab('create')}
              onSelectLog={(log) => setSelectedLog(log)}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'create' && (
            <div className="pb-20 max-w-3xl mx-auto">
              <WorkLogForm onSuccess={() => setActiveTab('my-logs')} />
            </div>
          )}

          {activeTab === 'my-logs' && (
            <MyLogsView onSelectLog={(log) => setSelectedLog(log)} />
          )}

          {activeTab === 'reviews' && (
            <ReviewListView onSelectLog={(log) => setSelectedLog(log)} />
          )}

          {activeTab === 'admin' && <AdminView />}
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

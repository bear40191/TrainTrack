'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { WorkLog } from '@/lib/types';
import { Header } from '@/components/layout/Header';
import { TabBar, TabKey } from '@/components/layout/TabBar';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { WorkLogForm } from '@/components/work-log/WorkLogForm';
import { MyLogsView } from '@/components/work-log/MyLogsView';
import { ReviewListView } from '@/components/review/ReviewListView';
import { AdminView } from '@/components/admin/AdminView';
import { WorkLogDetailModal } from '@/components/work-log/WorkLogDetailModal';
import { NotificationModal } from '@/components/layout/NotificationModal';

export default function HomePage() {
  const { workLogs } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [selectedLog, setSelectedLog] = useState<WorkLog | null>(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const handleSelectLogById = (logId: string) => {
    const found = workLogs.find((l) => l.id === logId);
    if (found) {
      setSelectedLog(found);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Header & Role Switcher */}
      <Header onOpenNotif={() => setIsNotifOpen(true)} />

      {/* Main Content Area - max-w-6xl (สมดุล พอดีสายตา ไม่ยืดจนเกินไป) */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-4 sm:pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            onOpenCreate={() => setActiveTab('create')}
            onSelectLog={(log) => setSelectedLog(log)}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'create' && (
          <div className="pb-24 max-w-3xl mx-auto">
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

      {/* Bottom Tab Navigation */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

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
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { WorkLog, WorkLogStatus } from '@/lib/types';
import { WorkLogCard } from '@/components/work-log/WorkLogCard';
import { STATUS_LABELS } from '@/lib/constants';

interface Props {
  onSelectLog: (log: WorkLog) => void;
}

export const MyLogsView: React.FC<Props> = ({ onSelectLog }) => {
  const { currentUser, workLogs } = useAppStore();
  const [filter, setFilter] = useState<'all' | WorkLogStatus>('all');

  const myLogs = workLogs.filter((l) => l.trainee_id === currentUser.id);

  const filteredLogs = filter === 'all' 
    ? myLogs 
    : myLogs.filter((l) => l.status === filter);

  const filterTabs: { key: 'all' | WorkLogStatus; label: string }[] = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'draft', label: STATUS_LABELS.draft },
    { key: 'pending_mentor', label: STATUS_LABELS.pending_mentor },
    { key: 'pending_lead', label: STATUS_LABELS.pending_lead },
    { key: 'revision_required', label: STATUS_LABELS.revision_required },
    { key: 'approved', label: STATUS_LABELS.approved },
  ];

  return (
    <div className="space-y-5 pb-24">
      {/* Filter Tabs แนวนอน */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {filterTabs.map((tab) => {
          const isActive = filter === tab.key;
          const count = tab.key === 'all' 
            ? myLogs.length 
            : myLogs.filter((l) => l.status === tab.key).length;

          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-card'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* รายการงาน */}
      <div className="space-y-3.5">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <WorkLogCard key={log.id} log={log} onClick={() => onSelectLog(log)} />
          ))
        ) : (
          <div className="p-10 text-center bg-white border border-dashed border-slate-200 rounded-3xl">
            <p className="text-sm text-slate-500 font-medium">ไม่พบงานในสถานะนี้</p>
          </div>
        )}
      </div>
    </div>
  );
};

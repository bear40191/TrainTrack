'use client';

import React from 'react';
import { WorkLog } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { formatDate } from '@/lib/utils';
import { MessageSquare, ChevronRight, UserCheck, Calendar } from 'lucide-react';

interface Props {
  log: WorkLog;
  onClick: () => void;
}

export const WorkLogCard: React.FC<Props> = ({ log, onClick }) => {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-emerald-300/80 rounded-2xl p-5 transition-all duration-200 cursor-pointer shadow-card hover:shadow-soft group active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-lg">
              {log.category}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {formatDate(log.work_date)}
            </span>
            {log.assigned_mentor ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                <UserCheck className="w-3 h-3 text-emerald-600" />
                {log.assigned_mentor.full_name.split(' ')[0]} {log.assigned_mentor.full_name.split(' ')[1]}
              </span>
            ) : null}
          </div>
          <h3 className="text-base font-bold text-slate-800 group-hover:text-emerald-700 transition line-clamp-1">
            {log.title}
          </h3>
        </div>

        <StatusBadge status={log.status} />
      </div>

      <p className="text-sm text-slate-600 line-clamp-2 mb-4 leading-relaxed">
        {log.description}
      </p>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span className="text-slate-500 font-medium">
            ผู้ส่ง: <strong className="text-slate-700">{log.trainee?.full_name?.split(' ')[0] || 'นักศึกษา'}</strong>
          </span>

          {log.comments && log.comments.length > 0 ? (
            <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
              <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
              {log.comments.length} ความคิดเห็น
            </span>
          ) : null}
        </div>

        <div className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold group-hover:translate-x-1 transition-transform">
          <span>ตรวจสอบงาน</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

'use client';

import React from 'react';
import { useAppStore } from '@/store/appStore';
import { X, CheckCircle, Bell, ArrowRight } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface Props {
  onClose: () => void;
  onSelectLog: (logId: string) => void;
}

export const NotificationModal: React.FC<Props> = ({ onClose, onSelectLog }) => {
  const { notifications, markNotificationAsRead } = useAppStore();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-800">การแจ้งเตือนทั้งหมด</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-2.5">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  markNotificationAsRead(n.id);
                  if (n.reference_id) {
                    onSelectLog(n.reference_id);
                    onClose();
                  }
                }}
                className={`p-4 rounded-2xl border transition cursor-pointer ${
                  n.is_read
                    ? 'bg-slate-50 border-slate-200 text-slate-500'
                    : 'bg-emerald-50/40 border-emerald-200 text-slate-800 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-2">
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />}
                    {n.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">{formatDateTime(n.created_at)}</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-600 mb-2.5">{n.body}</p>
                <div className="flex items-center gap-1 text-xs font-bold text-emerald-700">
                  <span>เปิดดูงานที่เกี่ยวข้อง</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-xs text-slate-400">
              <CheckCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              ไม่มีการแจ้งเตือนใหม่ในขณะนี้
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

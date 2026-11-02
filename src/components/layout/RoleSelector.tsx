'use client';

import React from 'react';
import { useAppStore } from '@/store/appStore';
import { Role } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/constants';
import { ShieldCheck, UserCheck, Users, Briefcase } from 'lucide-react';

export const RoleSelector: React.FC = () => {
  const { currentUser, mentors, switchRole, selectSpecificMentor } = useAppStore();

  const roles: { role: Role; label: string; icon: React.ReactNode }[] = [
    { role: 'trainee', label: ROLE_LABELS.trainee, icon: <Briefcase className="w-4 h-4" /> },
    { role: 'mentor', label: ROLE_LABELS.mentor, icon: <UserCheck className="w-4 h-4" /> },
    { role: 'lead', label: ROLE_LABELS.lead, icon: <Users className="w-4 h-4" /> },
    { role: 'admin', label: ROLE_LABELS.admin, icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-3">
      <div className="text-xs font-semibold text-slate-700 px-1 pb-2 flex items-center justify-between flex-wrap gap-1">
        <span>สลับสิทธิ์การใช้งาน (จำลองการทดสอบ)</span>
        <span className="text-slate-500 font-normal">
          กำลังใช้งาน: <strong className="text-emerald-700 font-bold">{currentUser.full_name}</strong>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
        {roles.map((r) => {
          const isActive = currentUser.role === r.role;
          return (
            <button
              key={r.role}
              onClick={() => switchRole(r.role)}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {r.icon}
              <span className="truncate">{r.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* ถ้าผู้ใช้เลือก Role เป็น Mentor ให้มี Dropdown เลือกบุคคลได้ว่ากำลังเป็นพี่เลี้ยงคนไหน */}
      {currentUser.role === 'mentor' && (
        <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600 shrink-0">เลือกบุคคลพี่เลี้ยง:</span>
          <select
            value={currentUser.id}
            onChange={(e) => selectSpecificMentor(e.target.value)}
            className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {mentors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name} ({m.position})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

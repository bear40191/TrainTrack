'use client';

import React from 'react';
import { useAppStore } from '@/store/appStore';
import { Shield, Users, Building, Download, Database } from 'lucide-react';

export const AdminView: React.FC = () => {
  const { workLogs } = useAppStore();

  const handleExportCSV = () => {
    const csvContent = [
      ['ID', 'Date', 'Trainee', 'Title', 'Hours', 'Status', 'Category'],
      ...workLogs.map(l => [
        l.id,
        l.work_date,
        l.trainee?.full_name || 'Trainee',
        `"${l.title.replace(/"/g, '""')}"`,
        l.hours_spent,
        l.status,
        `"${l.category.replace(/"/g, '""')}"`
      ])
    ].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `traintrack_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-card">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">แผงควบคุมผู้ดูแลระบบ (Admin Dashboard)</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">จัดการข้อมูลผู้ใช้ แผนกฝึกงาน และส่งออกรายงาน</p>
          </div>
        </div>
      </div>

      {/* สถิติระบบ */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-2 text-slate-500 text-xs sm:text-sm mb-1.5 font-medium">
            <Users className="w-4 h-4 text-emerald-600" />
            ผู้ใช้งานในระบบ
          </div>
          <div className="text-2xl font-extrabold text-slate-900">4 คน (Demo Users)</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-card">
          <div className="flex items-center gap-2 text-slate-500 text-xs sm:text-sm mb-1.5 font-medium">
            <Building className="w-4 h-4 text-emerald-600" />
            แผนกฝึกงาน
          </div>
          <div className="text-2xl font-extrabold text-slate-900">1 แผนก (Mobile Team)</div>
        </div>
      </div>

      {/* ส่งออกข้อมูล */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-card space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-600" />
          ส่งออกรายงานบันทึกการฝึกงาน
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          ดาวน์โหลดข้อมูลบันทึกงานของนักศึกษาฝึกงานทั้งหมดในรูปแบบไฟล์ CSV เพื่อนำไปใช้ตัดเกรดหรือส่งให้อาจารย์ที่ปรึกษา
        </p>

        <button
          onClick={handleExportCSV}
          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
        >
          <Download className="w-4 h-4" />
          ส่งออกข้อมูลบันทึกงาน (Export CSV)
        </button>
      </div>
    </div>
  );
};

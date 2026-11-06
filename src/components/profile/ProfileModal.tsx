'use client';

import React, { useState } from 'react';
import { useAppStore, ALL_DEMO_USERS } from '@/store/appStore';
import { ROLE_LABELS } from '@/lib/constants';
import {
  X,
  Mail,
  Briefcase,
  Users,
  ShieldCheck,
  UserCheck,
  Calendar,
  LogOut,
  Award,
  CheckCircle,
  Clock,
  AlertCircle,
  Sparkles,
  KeyRound,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';

interface Props {
  onClose: () => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<Props> = ({ onClose, onLogout }) => {
  const { currentUser, workLogs, switchRole, selectSpecificMentor, changePassword } = useAppStore();

  // State สำหรับการเปลี่ยนรหัสผ่าน
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdFeedback, setPwdFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // คำนวณสถิติสำหรับผู้ใช้ปัจจุบัน (ไม่มีชั่วโมงรวมแล้ว ตามที่ผู้ใช้แจ้ง)
  const traineeLogs = workLogs.filter((l) => l.trainee_id === currentUser.id);
  const totalLogsCount = traineeLogs.length;
  const approvedLogsCount = traineeLogs.filter((l) => l.status === 'approved').length;
  const pendingLogsCount = traineeLogs.filter(
    (l) => l.status === 'pending_mentor' || l.status === 'pending_lead'
  ).length;
  const revisionLogsCount = traineeLogs.filter((l) => l.status === 'revision_required').length;

  // คำนวณสำหรับ Mentor / Lead
  const mentorPendingCount = workLogs.filter((l) => l.status === 'pending_mentor').length;
  const leadPendingCount = workLogs.filter((l) => l.status === 'pending_lead').length;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPwdFeedback(null);

    if (newPassword.length < 4) {
      setPwdFeedback({ success: false, message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdFeedback({ success: false, message: 'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน' });
      return;
    }

    const res = changePassword(currentUser.email, newPassword);
    setPwdFeedback(res);
    if (res.success) {
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordForm(false);
        setPwdFeedback(null);
      }, 2500);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'trainee':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: <Briefcase className="w-3.5 h-3.5 text-emerald-600" />,
        };
      case 'mentor':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          icon: <UserCheck className="w-3.5 h-3.5 text-blue-600" />,
        };
      case 'lead':
        return {
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          icon: <Users className="w-3.5 h-3.5 text-indigo-600" />,
        };
      case 'admin':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />,
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
          icon: <Briefcase className="w-3.5 h-3.5 text-slate-600" />,
        };
    }
  };

  const badgeInfo = getRoleBadge(currentUser.role);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Cover Banner */}
        <div className="relative h-28 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-4 flex items-start justify-between">
          <div className="flex items-center gap-1.5 text-white/90 text-xs font-semibold bg-black/20 backdrop-blur-md px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>โปรไฟล์ผู้ใช้งาน TrainTrack</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition focus:outline-none"
            title="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card Header with Avatar */}
        <div className="px-6 pb-4 pt-0 relative border-b border-slate-100">
          <div className="flex items-end justify-between -mt-12 mb-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-lg border-2 border-white overflow-hidden">
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-2xl shadow-inner">
                  {currentUser.full_name ? currentUser.full_name.charAt(0) : 'U'}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white">
                <CheckCircle className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${badgeInfo.bg}`}
              >
                {badgeInfo.icon}
                {ROLE_LABELS[currentUser.role]}
              </span>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-900 leading-tight">
              {currentUser.full_name}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {currentUser.position || 'ทีมพัฒนาซอฟต์แวร์และการเรียนรู้'}
            </p>
          </div>
        </div>

        {/* Content Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Contact & Organization Details */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              ข้อมูลทั่วไป
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2.5 text-slate-700">
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium">อีเมล</p>
                  <p className="font-semibold text-slate-800 truncate">{currentUser.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-700">
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                  <Users className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium">สังกัดทีม</p>
                  <p className="font-semibold text-slate-800 truncate">
                    {currentUser.team_id || 'Mobile Development Team'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-700">
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium">เข้าร่วมระบบ</p>
                  <p className="font-semibold text-slate-800">
                    {new Date(currentUser.created_at).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-700">
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium">สถานะสิทธิ์</p>
                  <p className="font-semibold text-emerald-700">เปิดใช้งาน (Active)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Statistics - (ไม่มีการแสดงชั่วโมงแล้ว) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              สรุปผลงานในระบบ
            </h3>

            {currentUser.role === 'trainee' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs text-center">
                  <p className="text-[11px] text-slate-500 font-medium">บันทึกทั้งหมด</p>
                  <p className="text-xl font-black text-slate-800 mt-0.5">{totalLogsCount}</p>
                  <span className="text-[10px] text-slate-400">รายการ</span>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl shadow-xs text-center">
                  <p className="text-[11px] text-emerald-800 font-medium flex items-center justify-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    อนุมัติแล้ว
                  </p>
                  <p className="text-xl font-black text-emerald-700 mt-0.5">{approvedLogsCount}</p>
                  <span className="text-[10px] text-emerald-600 font-semibold">สำเร็จ</span>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl shadow-xs text-center">
                  <p className="text-[11px] text-amber-800 font-medium flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600" />
                    รอตรวจ
                  </p>
                  <p className="text-xl font-black text-amber-700 mt-0.5">{pendingLogsCount}</p>
                  <span className="text-[10px] text-amber-600 font-semibold">รอผล</span>
                </div>

                <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-2xl shadow-xs text-center">
                  <p className="text-[11px] text-rose-800 font-medium flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    ต้องแก้ไข
                  </p>
                  <p className="text-xl font-black text-rose-700 mt-0.5">{revisionLogsCount}</p>
                  <span className="text-[10px] text-rose-600 font-semibold">ปรับปรุง</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-amber-900 font-semibold">
                      {currentUser.role === 'mentor' ? 'งานที่รอให้คุณตรวจ' : 'งานรออนุมัติขั้นสุดท้าย'}
                    </p>
                    <p className="text-2xl font-black text-amber-700 mt-0.5">
                      {currentUser.role === 'mentor' ? mentorPendingCount : leadPendingCount}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 font-bold">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-900 font-semibold">งานที่อนุมัติสำเร็จแล้ว</p>
                    <p className="text-2xl font-black text-emerald-700 mt-0.5">
                      {workLogs.filter((l) => l.status === 'approved').length}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ระบบเปลี่ยนรหัสผ่านสำหรับผู้ใช้ปัจจุบัน */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-slate-800">ความปลอดภัยของบัญชี</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(!showPasswordForm);
                  setPwdFeedback(null);
                }}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-white border border-slate-200 hover:border-emerald-300 px-3 py-1.5 rounded-xl transition shadow-xs"
              >
                {showPasswordForm ? 'ยกเลิก' : 'เปลี่ยนรหัสผ่าน'}
              </button>
            </div>

            {showPasswordForm && (
              <form onSubmit={handlePasswordSubmit} className="mt-3.5 pt-3.5 border-t border-slate-200/80 space-y-3">
                {pwdFeedback && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      pwdFeedback.success
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border border-rose-200 text-rose-700'
                    }`}
                  >
                    {pwdFeedback.success ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{pwdFeedback.message}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    รหัสผ่านใหม่
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="กำหนดรหัสผ่านใหม่อย่างน้อย 4 ตัวอักษร"
                      required
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    ยืนยันรหัสผ่านใหม่
                  </label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
                    required
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  บันทึกรหัสผ่านใหม่
                </button>
              </form>
            )}
          </div>

          {/* Quick Account Switcher (สำหรับทดสอบในระบบ) */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">สลับบัญชีใช้งานทันที:</span>
              <span className="text-[10px] text-slate-400">สำหรับทดสอบระบบ</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {ALL_DEMO_USERS.map((u) => {
                const isActive = u.id === currentUser.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      if (u.role === 'mentor') {
                        switchRole('mentor', u.id);
                        selectSpecificMentor(u.id);
                      } else {
                        switchRole(u.role);
                      }
                      onClose();
                    }}
                    className={`p-2 rounded-xl text-left border text-xs transition ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <p className="truncate font-bold text-[11px]">{u.full_name.split(' ')[0]}</p>
                    <p className={`text-[10px] truncate ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                      {ROLE_LABELS[u.role].split(' ')[0]}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>ออกจากระบบ</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition shadow-xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};

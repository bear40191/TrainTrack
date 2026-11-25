'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { TrainTrackLogo } from '@/components/common/TrainTrackLogo';
import {
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ArrowRight,
} from 'lucide-react';

/**
 * หน้าจอบังคับเปลี่ยนรหัสผ่านเมื่อเข้าสู่ระบบครั้งแรก
 * จะแสดงเมื่อบัญชีผู้ใช้มีสถานะ must_change_password = true
 */
export const ForceChangePasswordModal: React.FC = () => {
  const { currentUser, changePassword, logout } = useAppStore();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const hasMinLength = newPassword.length >= 8;
  const hasLetterAndDigit = /[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword);
  const isDifferentFromDefault = newPassword !== '123456';
  const isMatching = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isDifferentFromDefault) {
      setErrorMsg('กรุณาตั้งรหัสผ่านใหม่ที่ไม่ใช่รหัสผ่านเริ่มต้น (123456)');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    const result = changePassword(currentUser.email, newPassword);
    if (!result.success) {
      setErrorMsg(result.message);
      return;
    }
  };

  return (
    <div className="min-h-screen bg-[#EFEFEF] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
                <TrainTrackLogo className="w-6 h-6" />
              </div>
              <span className="font-bold text-lg tracking-tight">TrainTrack</span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              ออกจากระบบ
            </button>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-snug">
                ตั้งรหัสผ่านใหม่สำหรับการใช้งานครั้งแรก
              </h1>
              <p className="text-xs text-emerald-100/90 mt-1">
                สวัสดีคุณ <span className="font-semibold text-white">{currentUser.full_name}</span> เพื่อความปลอดภัย กรุณาเปลี่ยนรหัสผ่านเริ่มต้นก่อนเริ่มใช้งานระบบ
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              รหัสผ่านใหม่
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="อย่างน้อย 8 ตัวอักษร (ตัวอักษร + ตัวเลข)"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="แสดงหรือซ่อนรหัสผ่านใหม่"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ยืนยันรหัสผ่านใหม่อีกครั้ง
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="แสดงหรือซ่อนยืนยันรหัสผ่าน"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password Policy Checklist */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/70 space-y-1.5 text-xs">
            <div className={`flex items-center gap-2 ${hasMinLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
              <CheckCircle2 className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-600' : 'text-slate-300'}`} />
              ความยาวอย่างน้อย 8 ตัวอักษร
            </div>
            <div className={`flex items-center gap-2 ${hasLetterAndDigit ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
              <CheckCircle2 className={`w-3.5 h-3.5 ${hasLetterAndDigit ? 'text-emerald-600' : 'text-slate-300'}`} />
              มีทั้งตัวอักษรภาษาอังกฤษ (a-z / A-Z) และตัวเลข (0-9)
            </div>
            <div className={`flex items-center gap-2 ${isMatching ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
              <CheckCircle2 className={`w-3.5 h-3.5 ${isMatching ? 'text-emerald-600' : 'text-slate-300'}`} />
              รหัสผ่านทั้ง 2 ช่องตรงกัน
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            บันทึกรหัสผ่านใหม่และเข้าสู่ระบบ
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

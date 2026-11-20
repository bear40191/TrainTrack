'use client';

/**
 * หน้าเว็บสำหรับรีเซ็ตรหัสผ่าน (Reset Password Page)
 * ตาม Spec 2026-11-20:
 * - อ่านโทเค็นจาก URL แล้วลบออกจากแถบที่อยู่ (Address Bar) ทันที
 * - ตั้ง Referrer-Policy: no-referrer
 * - ตรวจสอบนโยบายรหัสผ่าน
 * - แสดงข้อผิดพลาดกลางหากลิงก์ไม่ถูกต้องหรือหมดอายุ พร้อมปุ่มขอลิงก์ใหม่
 */
import React, { useState, useEffect } from 'react';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

export default function ResetPasswordPage() {
  const [token, setToken] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isInvalidToken, setIsInvalidToken] = useState(false);

  useEffect(() => {
    // 1. กำหนด Referrer-Policy เป็น no-referrer ตาม Spec ข้อ 3
    const metaReferrer = document.createElement('meta');
    metaReferrer.name = 'referrer';
    metaReferrer.content = 'no-referrer';
    document.head.appendChild(metaReferrer);

    // 2. อ่านโทเค็นจาก Query string
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryToken = params.get('token');

      if (queryToken) {
        setToken(queryToken);
        // 3. ลบโทเค็นออกจากแถบที่อยู่ของเบราว์เซอร์ทันที เพื่อป้องกัน token รั่วไหล
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        // หากไม่มีโทเค็นใน URL เลย
        setIsInvalidToken(true);
        setErrorMsg('ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว');
      }
    }

    return () => {
      if (metaReferrer.parentNode) {
        metaReferrer.parentNode.removeChild(metaReferrer);
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!token) {
      setIsInvalidToken(true);
      setErrorMsg('ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร');
      return;
    }

    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setErrorMsg('รหัสผ่านต้องประกอบด้วยตัวอักษรและตัวเลขอย่างน้อยอย่างละ 1 ตัว');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // ถ้าโทเค็นหมดอายุหรือถูกใช้ไปแล้ว
        if (data.message && data.message.includes('ไม่ถูกต้องหรือหมดอายุ')) {
          setIsInvalidToken(true);
        }
        setErrorMsg(data.message || 'ไม่สามารถรีเซ็ตรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง');
        setIsLoading(false);
        return;
      }

      setSuccessMsg(data.message || 'ตั้งรหัสผ่านใหม่สำเร็จแล้ว');
      // ล้างค่าฟอร์ม
      setNewPassword('');
      setConfirmPassword('');
      setToken('');
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EFEFEF] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-300/60 border border-slate-200/80 p-6 sm:p-8 overflow-hidden transition-all">
        
        {/* Header Icon */}
        <div className="w-full flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#19705F] border border-emerald-200 flex items-center justify-center shadow-xs">
            <KeyRound className="w-8 h-8" />
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            ตั้งรหัสผ่านใหม่
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            กรุณากำหนดรหัสผ่านใหม่สำหรับเข้าสู่ระบบ TrainTrack
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span>{errorMsg}</span>
              {isInvalidToken && (
                <div className="mt-3">
                  <a
                    href="/forgot-password"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    ขอลิงก์รีเซ็ตรหัสผ่านใหม่
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMsg ? (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center space-y-4">
            <div className="w-12 h-12 bg-[#2BA185] text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-emerald-950">สำเร็จ!</h3>
              <p className="text-xs sm:text-sm text-emerald-800 mt-1">
                {successMsg}
              </p>
            </div>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-[#19705F] hover:bg-[#145C4E] text-white rounded-xl font-bold text-sm transition shadow-sm"
            >
              <span>กลับสู่หน้าเข้าสู่ระบบ</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        ) : !isInvalidToken ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="ตัวอักษรและตัวเลขอย่างน้อย 8 ตัว"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-[#EFEFEF] border border-slate-200 focus:border-[#2BA185] rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#6FD098] transition font-medium"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                ยืนยันรหัสผ่านใหม่
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-[#EFEFEF] border border-slate-200 focus:border-[#2BA185] rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#6FD098] transition font-medium"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Password Policy Checklist */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs text-slate-600">
              <p className="font-semibold text-slate-700 mb-1">ข้อกำหนดรหัสผ่าน:</p>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 8 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className={newPassword.length >= 8 ? 'text-emerald-700 font-medium' : ''}>ความยาวอย่างน้อย 8 ตัวอักษร</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${/[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className={/[a-zA-Z]/.test(newPassword) && /[0-9]/.test(newPassword) ? 'text-emerald-700 font-medium' : ''}>มีทั้งตัวอักษรภาษาอังกฤษและตัวเลข</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#19705F] hover:bg-[#145C4E] disabled:bg-slate-300 text-white rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังบันทึกรหัสผ่านใหม่...</span>
                </>
              ) : (
                <>
                  <span>ยืนยันการเปลี่ยนรหัสผ่าน</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : null}

        {/* Back to Login link */}
        <div className="text-center mt-6 pt-4 border-t border-slate-100">
          <a
            href="/"
            className="text-xs text-slate-500 hover:text-slate-800 font-bold transition inline-flex items-center gap-1"
          >
            ← กลับไปหน้าเข้าสู่ระบบ
          </a>
        </div>

      </div>
    </div>
  );
}

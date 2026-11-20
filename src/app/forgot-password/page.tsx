'use client';

/**
 * หน้าลืมรหัสผ่าน (Forgot Password Page)
 * สัมพันธ์กับระบบ Forgot Password API, Email Service และ Reset Password Flow ตาม Spec 2026-11-20
 */
import React, { useState } from 'react';
import {
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Send,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg('กรุณากรอกอีเมลบัญชีของคุณ');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json();

      if (!response.ok && response.status !== 200) {
        setErrorMsg(data.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง');
        setIsLoading(false);
        return;
      }

      // ตอบข้อความกลางตาม Spec: "ถ้าอีเมลนี้อยู่ในระบบ เราได้ส่งลิงก์ให้แล้ว"
      setSuccessMsg(data.message || 'ถ้าอีเมลนี้อยู่ในระบบ เราได้ส่งลิงก์ให้แล้ว');
    } catch {
      // ป้องกันการรั่วไหลของข้อมูลแม้อยู่ในกรณี error
      setSuccessMsg('ถ้าอีเมลนี้อยู่ในระบบ เราได้ส่งลิงก์ให้แล้ว');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EFEFEF] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-300/60 border border-slate-200/80 p-6 sm:p-8 overflow-hidden transition-all">
        
        {/* Brand Header Icon */}
        <div className="w-full flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#19705F] border border-emerald-200 flex items-center justify-center shadow-xs">
            <KeyRound className="w-8 h-8" />
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            ลืมรหัสผ่าน?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            ระบุอีเมลบัญชีของคุณเพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs sm:text-sm flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg ? (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3">
              <div className="flex items-center gap-2 font-black text-sm text-emerald-900">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                ระบบได้ส่งคำขอไปยังอีเมลของคุณเรียบร้อยแล้ว กรุณาเปิดกล่องจดหมายและคลิกปุ่ม <strong>&ldquo;ตั้งรหัสผ่านใหม่&rdquo;</strong> เพื่อกำหนดรหัสผ่านใหม่บนเบราว์เซอร์
              </p>
            </div>

            {/* Steps Info */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 text-xs text-slate-600">
              <p className="font-bold text-slate-800 mb-1">ขั้นตอนถัดไป:</p>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                <span>เปิดอีเมลที่ได้รับจากระบบ TrainTrack</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                <span>คลิกลิงก์ในอีเมล (ลิงก์มีอายุ 30 นาที และใช้ได้ครั้งเดียว)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                <span>ตั้งรหัสผ่านใหม่แล้วกลับมาเข้าสู่ระบบในแอปพลิเคชัน</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href="/"
                className="w-full py-3 bg-[#19705F] hover:bg-[#145C4E] text-white rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm text-center"
              >
                <span>กลับไปหน้าเข้าสู่ระบบ</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => {
                  setSuccessMsg(null);
                  setEmail('');
                }}
                className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-bold transition"
              >
                ส่งคำขออีกครั้งด้วยอีเมลอื่น
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                อีเมลบัญชีผู้ใช้
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="เช่น kittisak.trainee@traintrack.app"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-[#EFEFEF] border border-slate-200 focus:border-[#2BA185] rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#6FD098] transition font-medium"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-500 leading-relaxed">
              💡 เพื่อความปลอดภัย ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมลที่ผูกไว้กับบัญชีของคุณเท่านั้น
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-[#19705F] hover:bg-[#145C4E] disabled:bg-slate-300 text-white rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังส่งข้อมูล...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>ส่งลิงก์รีเซ็ตรหัสผ่าน</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Back to Login link */}
        <div className="text-center mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-4 text-xs font-bold text-slate-500">
          <a
            href="/"
            className="hover:text-slate-800 transition"
          >
            ← กลับไปหน้าเข้าสู่ระบบ
          </a>
        </div>

      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useAppStore, ALL_DEMO_USERS } from '@/store/appStore';
import { Profile } from '@/lib/types';
import { ROLE_LABELS } from '@/lib/constants';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  UserCheck,
  Users,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

export const LoginPage: React.FC<{ onLoginSuccess?: () => void }> = ({ onLoginSuccess }) => {
  const { login } = useAppStore();
  const [email, setEmail] = useState('kittisak.trainee@traintrack.app');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDemoUser, setSelectedDemoUser] = useState<Profile | null>(ALL_DEMO_USERS[0]);

  const handleSelectDemoUser = (user: Profile) => {
    setSelectedDemoUser(user);
    setEmail(user.email);
    setPassword('123456');
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('กรุณากรอกอีเมล');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const ok = login(email, password);
      setIsLoading(false);
      if (ok) {
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setErrorMsg('ไม่พบบัญชีนี้ในระบบ กรุณาเลือกบัญชีทดสอบด้านล่าง หรือใช้อีเมลที่มีในระบบ');
      }
    }, 350);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'trainee':
        return <Briefcase className="w-3.5 h-3.5 text-emerald-600" />;
      case 'mentor':
        return <UserCheck className="w-3.5 h-3.5 text-blue-600" />;
      case 'lead':
        return <Users className="w-3.5 h-3.5 text-indigo-600" />;
      case 'admin':
        return <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Briefcase className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/80 border border-slate-200/80 p-6 sm:p-8 overflow-hidden transition-all">
        
        {/* Vector Illustration matching user reference */}
        <div className="w-full flex items-center justify-center py-2 mb-2">
          <div className="relative w-64 h-44 sm:w-72 sm:h-48 flex items-center justify-center">
            <svg
              viewBox="0 0 320 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full drop-shadow-sm select-none"
            >
              {/* Background ambient bubble */}
              <circle cx="160" cy="100" r="85" fill="#f0fdf4" />
              
              {/* Floating Code Badges in Emerald / Tech style */}
              {/* Search Badge top-left */}
              <g transform="translate(68, 25)">
                <rect width="36" height="30" rx="8" fill="#FBBF24" />
                <circle cx="17" cy="14" r="5" stroke="#FFFFFF" strokeWidth="2.5" />
                <line x1="21" y1="18" x2="25" y2="22" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              </g>

              {/* Code < / > Badge top-right */}
              <g transform="translate(185, 20)">
                <rect width="52" height="32" rx="8" fill="#F87171" />
                <text x="14" y="22" fill="#FFFFFF" fontSize="16" fontWeight="bold" fontFamily="monospace">
                  &lt;/&gt;
                </text>
              </g>

              {/* { } Badge right */}
              <g transform="translate(235, 75)">
                <rect width="32" height="28" rx="8" fill="#818CF8" />
                <text x="10" y="20" fill="#FFFFFF" fontSize="15" fontWeight="bold" fontFamily="monospace">
                  {'{ }'}
                </text>
              </g>

              {/* Background Monitor / Window */}
              <rect x="95" y="45" width="80" height="55" rx="6" fill="#1E293B" />
              <rect x="100" y="52" width="70" height="42" rx="4" fill="#0F172A" />
              {/* Code lines in monitor */}
              <rect x="106" y="58" width="22" height="3" rx="1.5" fill="#34D399" />
              <rect x="132" y="58" width="16" height="3" rx="1.5" fill="#60A5FA" />
              <rect x="106" y="65" width="40" height="3" rx="1.5" fill="#94A3B8" />
              <rect x="112" y="72" width="30" height="3" rx="1.5" fill="#F472B6" />
              <rect x="112" y="79" width="45" height="3" rx="1.5" fill="#34D399" />
              <rect x="106" y="86" width="20" height="3" rx="1.5" fill="#60A5FA" />

              {/* Plant on right */}
              <g transform="translate(245, 120)">
                <path d="M5 25 C0 10, -5 0, -10 -10 C5 0, 15 10, 10 25 Z" fill="#059669" />
                <path d="M12 25 C15 12, 22 2, 30 -5 C22 8, 18 18, 14 25 Z" fill="#10B981" />
                <path d="M8 25 C10 15, 8 5, 5 -12 C12 -2, 16 12, 10 25 Z" fill="#34D399" />
                <rect x="2" y="25" width="18" height="15" rx="3" fill="#D97706" />
              </g>

              {/* Desk */}
              <rect x="55" y="140" width="210" height="6" rx="3" fill="#0F172A" />
              <rect x="75" y="146" width="6" height="30" rx="2" fill="#334155" />
              <rect x="238" y="146" width="6" height="30" rx="2" fill="#334155" />

              {/* Laptop on desk */}
              <path d="M115 140 L125 105 L165 105 L175 140 Z" fill="#CBD5E1" />
              <rect x="127" y="108" width="36" height="26" rx="2" fill="#1E293B" />
              <rect x="110" y="138" width="70" height="4" rx="2" fill="#94A3B8" />

              {/* Yellow Chair Back */}
              <rect x="215" y="105" width="8" height="42" rx="4" fill="#F59E0B" />
              <rect x="195" y="140" width="30" height="6" rx="3" fill="#F59E0B" />
              <rect x="207" y="146" width="5" height="25" rx="2" fill="#475569" />

              {/* Person Working */}
              {/* Head */}
              <circle cx="205" cy="88" r="14" fill="#FDBA74" />
              {/* Hair */}
              <path d="M193 84 C193 72, 216 72, 218 80 C210 82, 204 88, 193 84 Z" fill="#1E293B" />
              {/* Body / Orange Shirt */}
              <path d="M190 102 C190 102, 175 120, 168 130 L180 134 L192 118 L196 140 L218 140 L216 102 Z" fill="#F97316" />
              {/* Arm reaching for laptop */}
              <path d="M188 106 L158 126 L148 135 L158 137 L174 126 Z" fill="#FDBA74" />
              {/* Blue Pants */}
              <path d="M194 140 L188 175 L160 175 L175 140 Z" fill="#3B82F6" />
              <path d="M206 140 L208 175 L192 175 L196 140 Z" fill="#1D4ED8" />
              {/* Shoes */}
              <ellipse cx="166" cy="177" rx="12" ry="4" fill="#1E293B" />
              <ellipse cx="202" cy="177" rx="10" ry="4" fill="#1E293B" />
              
              {/* Bottom floor line */}
              <line x1="40" y1="180" x2="280" y2="180" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Title matching user reference "Me Call API - Login" -> "TrainTrack - เข้าสู่ระบบ" */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-xs shadow-sm">
              TT
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              TrainTrack <span className="text-slate-400 font-normal">-</span> Login
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            ระบบติดตาม & อนุมัติการฝึกงาน (Hybrid Application)
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-700 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Inputs matching the uploaded image */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                required
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-sm"
              />
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full pl-11 pr-11 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition shadow-sm"
              />
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Login Button in Theme Green (Emerald) */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Login</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Account Selector (เข้าสู่ระบบด่วนด้วย 1 คลิก) */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              บัญชีทดสอบด่วน (คลิกเพื่อเลือก)
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              6 บัญชีจำลอง
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
            {ALL_DEMO_USERS.map((user) => {
              const isSelected = selectedDemoUser?.email === user.email;
              return (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectDemoUser(user)}
                  className={`flex items-center gap-2 p-2 rounded-xl text-left border transition text-xs ${
                    isSelected
                      ? 'bg-emerald-50/90 border-emerald-500/80 text-emerald-950 font-semibold shadow-xs'
                      : 'bg-slate-50/80 border-slate-200 hover:bg-slate-100/80 text-slate-700'
                  }`}
                >
                  <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
                    {getRoleIcon(user.role)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold truncate leading-tight">
                      {user.full_name.split(' ')[0]}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate leading-tight">
                      {ROLE_LABELS[user.role].split(' ')[0]}
                    </p>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Attribution matching the user's reference footer */}
        <div className="mt-5 text-center">
          <p className="text-[11px] text-slate-400">
            TrainTrack Hybrid Internship Management Platform
          </p>
        </div>

      </div>
    </div>
  );
};

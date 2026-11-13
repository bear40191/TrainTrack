'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/store/appStore';
import { Profile } from '@/lib/types';
import {
  ShieldCheck,
  UserCheck,
  FileText,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  X,
  Download,
  Database,
  GraduationCap,
  Sparkles,
  ChevronDown,
  Check,
  AlertCircle,
  Users
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const {
    trainees,
    mentors,
    leads,
    workLogs,
    addTrainee,
    updateTrainee,
    removeTrainee,
    assignMentorToTrainee,
    addMentor,
    updateMentor,
    removeMentor,
    addLead,
    updateLead,
    removeLead,
  } = useAppStore();

  // Active Sub-Tab: 'trainees' | 'supervisors' | 'export'
  const [activeSubTab, setActiveSubTab] = useState<'trainees' | 'supervisors' | 'export'>('trainees');

  // Trainee Filter State
  const [searchTrainee, setSearchTrainee] = useState('');
  const [mentorFilter, setMentorFilter] = useState<string>('all');

  // Supervisor Filter State
  const [searchSupervisor, setSearchSupervisor] = useState('');

  // Trainee Modal State
  const [isTraineeModalOpen, setIsTraineeModalOpen] = useState(false);
  const [editingTrainee, setEditingTrainee] = useState<Profile | null>(null);
  const [traineeForm, setTraineeForm] = useState({
    full_name: '',
    email: '',
    position: '',
    mentor_id: '',
  });
  const [traineeError, setTraineeError] = useState<string | null>(null);

  // Mentor / Lead Modal State
  const [isSupervisorModalOpen, setIsSupervisorModalOpen] = useState(false);
  const [supervisorModalType, setSupervisorModalType] = useState<'mentor' | 'lead'>('mentor');
  const [editingSupervisor, setEditingSupervisor] = useState<Profile | null>(null);
  const [supervisorForm, setSupervisorForm] = useState({
    full_name: '',
    email: '',
    position: '',
  });
  const [supervisorError, setSupervisorError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deletingTarget, setDeletingTarget] = useState<{
    type: 'trainee' | 'mentor' | 'lead';
    profile: Profile;
  } | null>(null);

  // Success Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ================== TRAINEE HANDLERS ==================
  const handleOpenAddTrainee = () => {
    setEditingTrainee(null);
    setTraineeForm({
      full_name: '',
      email: '',
      position: 'Frontend Developer Intern',
      mentor_id: mentors[0]?.id || '',
    });
    setTraineeError(null);
    setIsTraineeModalOpen(true);
  };

  const handleOpenEditTrainee = (trainee: Profile) => {
    setEditingTrainee(trainee);
    setTraineeForm({
      full_name: trainee.full_name,
      email: trainee.email,
      position: trainee.position || 'นักศึกษาฝึกงาน (Intern)',
      mentor_id: trainee.mentor_id || '',
    });
    setTraineeError(null);
    setIsTraineeModalOpen(true);
  };

  const handleSubmitTrainee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!traineeForm.full_name.trim()) {
      setTraineeError('กรุณากรอกชื่อ-นามสกุลของนักศึกษา');
      return;
    }
    if (!traineeForm.email.trim() || !traineeForm.email.includes('@')) {
      setTraineeError('กรุณากรอกอีเมลที่ถูกต้อง');
      return;
    }

    if (editingTrainee) {
      updateTrainee(editingTrainee.id, {
        full_name: traineeForm.full_name.trim(),
        email: traineeForm.email.trim().toLowerCase(),
        position: traineeForm.position.trim(),
        mentor_id: traineeForm.mentor_id || null,
      });
      showToast(`อัปเดตข้อมูลของ ${traineeForm.full_name.trim()} เรียบร้อยแล้ว`);
      setIsTraineeModalOpen(false);
    } else {
      const res = addTrainee({
        full_name: traineeForm.full_name.trim(),
        email: traineeForm.email.trim().toLowerCase(),
        position: traineeForm.position.trim(),
        mentor_id: traineeForm.mentor_id || null,
      });
      if (!res.success) {
        setTraineeError(res.message);
        return;
      }
      showToast(res.message);
      setIsTraineeModalOpen(false);
    }
  };

  const handleQuickMentorChange = (traineeId: string, mentorId: string) => {
    const targetMentorId = mentorId === '' ? null : mentorId;
    assignMentorToTrainee(traineeId, targetMentorId);
    const mentorName = mentors.find((m) => m.id === targetMentorId)?.full_name?.split(' ')[0] || 'ยังไม่ระบุ';
    showToast(`มอบหมายพี่เลี้ยงเป็น: ${mentorName} เรียบร้อยแล้ว`);
  };

  // ================== SUPERVISOR (MENTOR & LEAD) HANDLERS ==================
  const handleOpenAddSupervisor = (type: 'mentor' | 'lead') => {
    setSupervisorModalType(type);
    setEditingSupervisor(null);
    setSupervisorForm({
      full_name: '',
      email: '',
      position: type === 'mentor' ? 'Senior Developer / Mentor' : 'Lead Engineer / Head of Mentors',
    });
    setSupervisorError(null);
    setIsSupervisorModalOpen(true);
  };

  const handleOpenEditSupervisor = (profile: Profile, type: 'mentor' | 'lead') => {
    setSupervisorModalType(type);
    setEditingSupervisor(profile);
    setSupervisorForm({
      full_name: profile.full_name,
      email: profile.email,
      position: profile.position || '',
    });
    setSupervisorError(null);
    setIsSupervisorModalOpen(true);
  };

  const handleSubmitSupervisor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supervisorForm.full_name.trim()) {
      setSupervisorError('กรุณากรอกชื่อ-นามสกุล');
      return;
    }
    if (!supervisorForm.email.trim() || !supervisorForm.email.includes('@')) {
      setSupervisorError('กรุณากรอกอีเมลที่ถูกต้อง');
      return;
    }

    if (supervisorModalType === 'mentor') {
      if (editingSupervisor) {
        updateMentor(editingSupervisor.id, {
          full_name: supervisorForm.full_name.trim(),
          email: supervisorForm.email.trim().toLowerCase(),
          position: supervisorForm.position.trim(),
        });
        showToast(`อัปเดตข้อมูลพี่เลี้ยง ${supervisorForm.full_name.trim()} เรียบร้อยแล้ว`);
        setIsSupervisorModalOpen(false);
      } else {
        const res = addMentor({
          full_name: supervisorForm.full_name.trim(),
          email: supervisorForm.email.trim().toLowerCase(),
          position: supervisorForm.position.trim(),
        });
        if (!res.success) {
          setSupervisorError(res.message);
          return;
        }
        showToast(res.message);
        setIsSupervisorModalOpen(false);
      }
    } else {
      if (editingSupervisor) {
        updateLead(editingSupervisor.id, {
          full_name: supervisorForm.full_name.trim(),
          email: supervisorForm.email.trim().toLowerCase(),
          position: supervisorForm.position.trim(),
        });
        showToast(`อัปเดตข้อมูลหัวหน้าพี่เลี้ยง ${supervisorForm.full_name.trim()} เรียบร้อยแล้ว`);
        setIsSupervisorModalOpen(false);
      } else {
        const res = addLead({
          full_name: supervisorForm.full_name.trim(),
          email: supervisorForm.email.trim().toLowerCase(),
          position: supervisorForm.position.trim(),
        });
        if (!res.success) {
          setSupervisorError(res.message);
          return;
        }
        showToast(res.message);
        setIsSupervisorModalOpen(false);
      }
    }
  };

  // ================== DELETE HANDLERS ==================
  const handleConfirmDelete = () => {
    if (!deletingTarget) return;

    if (deletingTarget.type === 'trainee') {
      removeTrainee(deletingTarget.profile.id);
      showToast(`ลบข้อมูลนักศึกษา ${deletingTarget.profile.full_name} เรียบร้อยแล้ว`);
    } else if (deletingTarget.type === 'mentor') {
      const res = removeMentor(deletingTarget.profile.id);
      if (!res.success) {
        alert(res.message);
        return;
      }
      showToast(res.message);
    } else if (deletingTarget.type === 'lead') {
      const res = removeLead(deletingTarget.profile.id);
      if (!res.success) {
        alert(res.message);
        return;
      }
      showToast(res.message);
    }
    setDeletingTarget(null);
  };

  // ================== FILTER LOGIC ==================
  const filteredTrainees = useMemo(() => {
    return trainees.filter((t) => {
      if (searchTrainee.trim()) {
        const q = searchTrainee.toLowerCase();
        const matchName = t.full_name.toLowerCase().includes(q);
        const matchEmail = t.email.toLowerCase().includes(q);
        const matchPos = t.position?.toLowerCase().includes(q) || false;
        if (!matchName && !matchEmail && !matchPos) return false;
      }
      if (mentorFilter !== 'all') {
        if (mentorFilter === 'unassigned') {
          if (t.mentor_id) return false;
        } else if (t.mentor_id !== mentorFilter) {
          return false;
        }
      }
      return true;
    });
  }, [trainees, searchTrainee, mentorFilter]);

  const filteredMentors = useMemo(() => {
    if (!searchSupervisor.trim()) return mentors;
    const q = searchSupervisor.toLowerCase();
    return mentors.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.position && m.position.toLowerCase().includes(q))
    );
  }, [mentors, searchSupervisor]);

  const filteredLeads = useMemo(() => {
    if (!searchSupervisor.trim()) return leads;
    const q = searchSupervisor.toLowerCase();
    return leads.filter(
      (l) =>
        l.full_name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.position && l.position.toLowerCase().includes(q))
    );
  }, [leads, searchSupervisor]);

  // Statistics
  const totalApproved = useMemo(() => workLogs.filter((l) => l.status === 'approved').length, [workLogs]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const csvContent = [
      ['ID', 'Date', 'Trainee', 'Mentor', 'Title', 'Hours', 'Status', 'Category'],
      ...workLogs.map((l) => [
        l.id,
        l.work_date,
        `"${l.trainee?.full_name || 'Trainee'}"`,
        `"${l.assigned_mentor?.full_name || 'Mentor'}"`,
        `"${l.title.replace(/"/g, '""')}"`,
        l.hours_spent,
        l.status,
        `"${l.category.replace(/"/g, '""')}"`,
      ]),
    ]
      .map((e) => e.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `traintrack_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว');
  };

  return (
    <div className="space-y-4 pb-24 font-sans">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#19705F] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-[#145C4E] animate-fade-in-up">
          <CheckCircle2 className="w-4 h-4 text-[#6FD098]" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* =========================================================================
          BANNER HEADER (แผงควบคุมผู้ดูแลระบบ)
          ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs relative overflow-hidden animate-fade-in-up [animation-delay:40ms]">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-[#6FD098]/15 via-[#2BA185]/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#19705F] to-[#2BA185] flex items-center justify-center text-white shadow-md shadow-[#19705F]/20 shrink-0">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  แผงควบคุมผู้ดูแลระบบ (Admin Console)
                </h2>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E2F4EB] text-[#19705F] border border-[#C2EAD6]">
                  <Sparkles className="w-2.5 h-2.5 text-[#2BA185]" />
                  System Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                จัดการรายชื่อนักศึกษา พี่เลี้ยง และหัวหน้าพี่เลี้ยง พร้อมระบบส่งออกข้อมูล
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            <button
              onClick={handleOpenAddTrainee}
              className="px-3.5 py-2 rounded-xl bg-[#EFEFEF] hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#19705F]" />
              <span>เพิ่มนักศึกษา</span>
            </button>
            <button
              onClick={() => handleOpenAddSupervisor('mentor')}
              className="px-3.5 py-2 rounded-xl bg-[#19705F] hover:bg-[#145C4E] text-white font-bold text-xs shadow-md shadow-[#19705F]/20 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มพี่เลี้ยงใหม่</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          STATISTICS CARDS (4 CARDS GRID)
          ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          onClick={() => setActiveSubTab('trainees')}
          className={`bg-white border rounded-2xl p-4 shadow-2xs hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${
            activeSubTab === 'trainees' ? 'border-[#19705F] ring-1 ring-[#19705F]' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500">นักศึกษาในระบบ</span>
            <div className="w-7 h-7 rounded-lg bg-[#E2F4EB] text-[#19705F] flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-[#2BA185]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{trainees.length}</span>
            <span className="text-[10px] font-semibold text-slate-400">คน</span>
          </div>
        </div>

        <div
          onClick={() => setActiveSubTab('supervisors')}
          className={`bg-white border rounded-2xl p-4 shadow-2xs hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer ${
            activeSubTab === 'supervisors' ? 'border-[#19705F] ring-1 ring-[#19705F]' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500">พี่เลี้ยงผู้ดูแล</span>
            <div className="w-7 h-7 rounded-lg bg-[#E2F4EB] text-[#19705F] flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-[#2BA185]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{mentors.length}</span>
            <span className="text-[10px] font-semibold text-slate-400">คน (หัวหน้า {leads.length})</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500">บันทึกงานรวม</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <FileText className="w-4 h-4 text-slate-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{workLogs.length}</span>
            <span className="text-[10px] font-semibold text-slate-400">รายการ</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-sm transition-all duration-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500">อนุมัติสำเร็จ</span>
            <div className="w-7 h-7 rounded-lg bg-[#E2F4EB] text-[#19705F] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-[#2BA185]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#19705F] tracking-tight">{totalApproved}</span>
            <span className="text-[10px] font-bold text-[#2BA185] bg-[#E2F4EB] px-1.5 py-0.2 rounded">ผ่านเกณฑ์</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SUB-TAB NAVIGATION BAR (สลับหมวดหมู่การจัดการ)
          ========================================================================= */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#EFEFEF] rounded-2xl border border-slate-200 w-fit">
        <button
          onClick={() => setActiveSubTab('trainees')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'trainees'
              ? 'bg-[#19705F] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>จัดการนักศึกษาฝึกงาน ({trainees.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('supervisors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'supervisors'
              ? 'bg-[#19705F] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>จัดการพี่เลี้ยงและหัวหน้า ({mentors.length + leads.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('export')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'export'
              ? 'bg-[#19705F] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>ส่งออกรายงาน CSV</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: จัดการนักศึกษาฝึกงาน (TRAINEES MANAGEMENT)
          ========================================================================= */}
      {activeSubTab === 'trainees' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4 animate-fade-in-up">
          {/* Header & Filter Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                  รายชื่อนักศึกษาและมอบหมายพี่เลี้ยง
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E2F4EB] text-[#19705F] border border-[#C2EAD6]">
                  แสดง {filteredTrainees.length} จาก {trainees.length} คน
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Admin สามารถเพิ่มนักศึกษาใหม่ และปรับเปลี่ยนพี่เลี้ยงผู้ดูแลได้ทันทีจากตารางด้านล่าง
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-48 sm:w-56">
                <input
                  type="text"
                  value={searchTrainee}
                  onChange={(e) => setSearchTrainee(e.target.value)}
                  placeholder="ค้นหาชื่อ, อีเมล, ตำแหน่ง..."
                  className="w-full pl-7 pr-6 py-1.5 bg-[#EFEFEF] border border-slate-200 hover:border-slate-300 focus:border-[#2BA185] rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#6FD098] transition"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                {searchTrainee && (
                  <button
                    onClick={() => setSearchTrainee('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="relative inline-flex items-center">
                <Filter className="w-3 h-3 text-slate-400 mr-1" />
                <select
                  value={mentorFilter}
                  onChange={(e) => setMentorFilter(e.target.value)}
                  className="appearance-none bg-[#EFEFEF] border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 py-1.5 pr-7 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">พี่เลี้ยงทุกคน</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name.split(' ')[0]} {m.full_name.split(' ')[1] || ''}
                    </option>
                  ))}
                  <option value="unassigned">ยังไม่ระบุพี่เลี้ยง</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
              </div>

              <button
                onClick={handleOpenAddTrainee}
                className="px-3 py-1.5 rounded-xl bg-[#19705F] hover:bg-[#145C4E] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มนักศึกษา</span>
              </button>
            </div>
          </div>

          {/* Trainees Table */}
          <div className="overflow-x-auto -mx-2 sm:mx-0">
            {filteredTrainees.length > 0 ? (
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold text-[11px]">
                    <th className="pb-2.5 px-3">นักศึกษา</th>
                    <th className="pb-2.5 px-3">อีเมล & ตำแหน่ง</th>
                    <th className="pb-2.5 px-3">พี่เลี้ยงผู้ดูแล (มอบหมายได้ทันที)</th>
                    <th className="pb-2.5 px-3 text-center">สถิติส่งงาน</th>
                    <th className="pb-2.5 px-3 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/90">
                  {filteredTrainees.map((trainee) => {
                    const studentLogs = workLogs.filter((l) => l.trainee_id === trainee.id);
                    const totalLogs = studentLogs.length;
                    const approvedLogs = studentLogs.filter((l) => l.status === 'approved').length;

                    return (
                      <tr key={trainee.id} className="hover:bg-[#EFEFEF]/60 transition-colors duration-150 group">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#19705F] to-[#2BA185] text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0 group-hover:scale-105 transition-transform duration-200">
                              {trainee.full_name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 group-hover:text-[#19705F] transition-colors text-xs truncate">
                                {trainee.full_name}
                              </p>
                              <span className="text-[10px] text-slate-400 font-medium">
                                ID: {trainee.id.replace('user-', '')}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <p className="font-semibold text-slate-700 text-xs">{trainee.position || 'นักศึกษาฝึกงาน (Intern)'}</p>
                          <p className="text-[11px] text-slate-400 truncate">{trainee.email}</p>
                        </td>

                        <td className="py-3 px-3">
                          <div className="relative inline-block w-full max-w-xs">
                            <select
                              value={trainee.mentor_id || ''}
                              onChange={(e) => handleQuickMentorChange(trainee.id, e.target.value)}
                              className={`w-full appearance-none rounded-xl px-3 py-1.5 pr-7 text-xs font-bold border transition cursor-pointer ${
                                trainee.mentor_id
                                  ? 'bg-[#E2F4EB]/70 border-[#C2EAD6] text-[#19705F] hover:bg-[#E2F4EB]'
                                  : 'bg-[#EFEFEF] border-slate-200 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              <option value="">-- ยังไม่มอบหมายพี่เลี้ยง --</option>
                              {mentors.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.full_name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#EFEFEF] text-slate-700 border border-slate-200">
                            <span className="text-[#19705F] font-black">{approvedLogs}</span>
                            <span className="text-slate-400">/</span>
                            <span>{totalLogs} งาน</span>
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditTrainee(trainee)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#19705F] hover:text-white text-slate-600 transition duration-150"
                              title="แก้ไขข้อมูล"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingTarget({ type: 'trainee', profile: trainee })}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-600 hover:text-white text-slate-600 transition duration-150"
                              title="ลบนักศึกษา"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-slate-400">
                <GraduationCap className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-700">ไม่พบข้อมูลนักศึกษาที่ตรงกับเงื่อนไข</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: จัดการพี่เลี้ยงและหัวหน้า (MENTORS & LEADS MANAGEMENT)
          ========================================================================= */}
      {activeSubTab === 'supervisors' && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Section: Mentors Management */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-[#E2F4EB] text-[#19705F] flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5 text-[#2BA185]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>รายชื่อพี่เลี้ยงประจำทีม (Mentors)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#E2F4EB] text-[#19705F] border border-[#C2EAD6]">
                      {mentors.length} คน
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    พี่เลี้ยงทำหน้าที่ตรวจรับงานเบื้องต้น ให้คำแนะนำ และส่งต่องานให้หัวหน้าอนุมัติ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative w-44 sm:w-52">
                  <input
                    type="text"
                    value={searchSupervisor}
                    onChange={(e) => setSearchSupervisor(e.target.value)}
                    placeholder="ค้นหาชื่อพี่เลี้ยง..."
                    className="w-full pl-7 pr-6 py-1.5 bg-[#EFEFEF] border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#2BA185] transition"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                </div>

                <button
                  onClick={() => handleOpenAddSupervisor('mentor')}
                  className="px-3.5 py-1.5 rounded-xl bg-[#19705F] hover:bg-[#145C4E] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>เพิ่มพี่เลี้ยงใหม่</span>
                </button>
              </div>
            </div>

            {/* Mentors Cards / Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredMentors.map((m) => {
                const assignedTrainees = trainees.filter((t) => t.mentor_id === m.id);
                return (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-[#EFEFEF]/50 hover:bg-[#EFEFEF] border border-slate-200/90 hover:border-[#2BA185]/60 hover:shadow-xs transition-all duration-200 group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#19705F] to-[#2BA185] text-white flex items-center justify-center font-extrabold text-sm shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                            {m.full_name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#19705F] transition-colors truncate">
                              {m.full_name}
                            </h4>
                            <p className="text-[11px] text-[#19705F] font-semibold truncate">
                              {m.position || 'Senior Developer'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenEditSupervisor(m, 'mentor')}
                            className="p-1.5 rounded-lg bg-white hover:bg-[#19705F] hover:text-white text-slate-500 border border-slate-200 transition"
                            title="แก้ไขข้อมูลพี่เลี้ยง"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDeletingTarget({ type: 'mentor', profile: m })}
                            className="p-1.5 rounded-lg bg-white hover:bg-rose-600 hover:text-white text-slate-500 border border-slate-200 transition"
                            title="ลบพี่เลี้ยง"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 truncate mb-3">{m.email}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">นักศึกษาในความดูแล:</span>
                      <span className="font-extrabold px-2 py-0.5 rounded-full bg-[#E2F4EB] text-[#19705F] border border-[#C2EAD6]">
                        {assignedTrainees.length} คน
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Leads Management */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>รายชื่อหัวหน้าพี่เลี้ยง (Leads / Approvers)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                      {leads.length} คน
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    หัวหน้าพี่เลี้ยงทำหน้าที่อนุมัติผลงานขั้นสุดท้ายและประเมินผลการฝึกงานโดยรวม
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleOpenAddSupervisor('lead')}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs self-start sm:self-center"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มหัวหน้าใหม่</span>
              </button>
            </div>

            {/* Leads Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-4 rounded-2xl bg-[#EFEFEF]/50 hover:bg-[#EFEFEF] border border-slate-200/90 hover:border-amber-400 hover:shadow-xs transition-all duration-200 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 text-white flex items-center justify-center font-extrabold text-sm shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                          {lead.full_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {lead.full_name}
                          </h4>
                          <p className="text-[11px] text-amber-700 font-semibold truncate">
                            {lead.position || 'Head of Mentors'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEditSupervisor(lead, 'lead')}
                          className="p-1.5 rounded-lg bg-white hover:bg-amber-600 hover:text-white text-slate-500 border border-slate-200 transition"
                          title="แก้ไขข้อมูลหัวหน้า"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setDeletingTarget({ type: 'lead', profile: lead })}
                          className="p-1.5 rounded-lg bg-white hover:bg-rose-600 hover:text-white text-slate-500 border border-slate-200 transition"
                          title="ลบหัวหน้า"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 truncate mb-3">{lead.email}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">สิทธิ์การอนุมัติ:</span>
                    <span className="font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                      Final Approval
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: ส่งออกรายงาน (EXPORT SECTION)
          ========================================================================= */}
      {activeSubTab === 'export' && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-2xs space-y-4 animate-fade-in-up">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#E2F4EB] text-[#19705F] flex items-center justify-center">
                <Database className="w-5 h-5 text-[#2BA185]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">ส่งออกรายงานบันทึกการฝึกงาน (Export Work Logs)</h3>
                <p className="text-xs text-slate-500">
                  ดาวน์โหลดข้อมูลบันทึกงานของนักศึกษาฝึกงานทั้งหมดในรูปแบบไฟล์ CSV เพื่อใช้สรุปผลหรือส่งอาจารย์ที่ปรึกษา
                </p>
              </div>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2.5 rounded-xl bg-[#19705F] hover:bg-[#145C4E] text-white text-xs font-bold flex items-center gap-2 shadow-2xs transition active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ดาวน์โหลด CSV ({workLogs.length} รายการ)</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-[#EFEFEF]/50 border border-slate-200 text-xs text-slate-600 space-y-2">
            <p className="font-bold text-slate-800">โครงสร้างไฟล์ CSV ประกอบด้วย:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-500 text-[11px]">
              <li>รหัสบันทึกงาน (WorkLog ID)</li>
              <li>วันที่ปฏิบัติงาน (Date)</li>
              <li>ชื่อนักศึกษาฝึกงาน (Trainee Name)</li>
              <li>ชื่อพี่เลี้ยงผู้รับผิดชอบ (Assigned Mentor)</li>
              <li>หัวข้อการทำงาน (Title)</li>
              <li>จำนวนชั่วโมง (Hours Spent)</li>
              <li>สถานะการตรวจงาน (Status)</li>
              <li>หมวดหมู่งาน (Category)</li>
            </ul>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: เพิ่ม / แก้ไขนักศึกษา (ADD/EDIT TRAINEE MODAL)
          ========================================================================= */}
      {isTraineeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-fade-in-scale">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E2F4EB] text-[#19705F] flex items-center justify-center font-bold">
                  {editingTrainee ? <Edit2 className="w-4 h-4 text-[#2BA185]" /> : <Plus className="w-4 h-4 text-[#2BA185]" />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingTrainee ? 'แก้ไขข้อมูลนักศึกษา' : 'เพิ่มนักศึกษาฝึกงานใหม่'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingTrainee ? 'แก้ไขชื่อ อีเมล หรือเปลี่ยนพี่เลี้ยงผู้ดูแล' : 'เพิ่มบัญชีนักศึกษาเข้าระบบและมอบหมายพี่เลี้ยง'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsTraineeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {traineeError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{traineeError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitTrainee} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={traineeForm.full_name}
                  onChange={(e) => setTraineeForm({ ...traineeForm, full_name: e.target.value })}
                  placeholder="เช่น อนันต์ รักเรียน (นักศึกษาฝึกงาน)"
                  className="w-full bg-[#EFEFEF] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#2BA185] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  อีเมล (ใช้เข้าสู่ระบบ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={traineeForm.email}
                  onChange={(e) => setTraineeForm({ ...traineeForm, email: e.target.value })}
                  placeholder="เช่น anan.trainee@traintrack.app"
                  className="w-full bg-[#EFEFEF] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#2BA185] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ตำแหน่ง / สายงานฝึกงาน
                </label>
                <input
                  type="text"
                  value={traineeForm.position}
                  onChange={(e) => setTraineeForm({ ...traineeForm, position: e.target.value })}
                  placeholder="เช่น Frontend Developer Intern, Backend, Mobile"
                  className="w-full bg-[#EFEFEF] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#2BA185] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  มอบหมายพี่เลี้ยงผู้ดูแล
                </label>
                <select
                  value={traineeForm.mentor_id}
                  onChange={(e) => setTraineeForm({ ...traineeForm, mentor_id: e.target.value })}
                  className="w-full bg-[#EFEFEF] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#2BA185] focus:bg-white transition cursor-pointer"
                >
                  <option value="">-- ยังไม่ระบุพี่เลี้ยง --</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.position || 'Mentor'})
                    </option>
                  ))}
                </select>
              </div>

              {!editingTrainee && (
                <div className="p-2.5 rounded-xl bg-[#E2F4EB]/60 border border-[#C2EAD6] text-[11px] text-[#19705F] font-medium">
                  * รหัสผ่านเริ่มต้นสำหรับเข้าสู่ระบบของนักศึกษาใหม่คือ: <strong>123456</strong>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTraineeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#19705F] hover:bg-[#145C4E] text-white text-xs font-bold shadow-md shadow-[#19705F]/20 transition flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{editingTrainee ? 'บันทึกการแก้ไข' : 'ยืนยันเพิ่มนักศึกษา'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: เพิ่ม / แก้ไขพี่เลี้ยง หรือ หัวหน้า (ADD/EDIT SUPERVISOR MODAL)
          ========================================================================= */}
      {isSupervisorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-fade-in-scale">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                    supervisorModalType === 'mentor' ? 'bg-[#E2F4EB] text-[#19705F]' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {supervisorModalType === 'mentor' ? <UserCheck className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingSupervisor
                      ? `แก้ไขข้อมูล${supervisorModalType === 'mentor' ? 'พี่เลี้ยง' : 'หัวหน้าพี่เลี้ยง'}`
                      : `เพิ่ม${supervisorModalType === 'mentor' ? 'พี่เลี้ยงใหม่' : 'หัวหน้าพี่เลี้ยงใหม่'}`}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {supervisorModalType === 'mentor'
                      ? 'พี่เลี้ยงจะมีสิทธิ์ตรวจและให้คำแนะนำบันทึกงานของนักศึกษา'
                      : 'หัวหน้าพี่เลี้ยงมีสิทธิ์อนุมัติขั้นสุดท้าย (Final Approval)'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsSupervisorModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {supervisorError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{supervisorError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitSupervisor} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อ-นามสกุล <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={supervisorForm.full_name}
                  onChange={(e) => setSupervisorForm({ ...supervisorForm, full_name: e.target.value })}
                  placeholder={
                    supervisorModalType === 'mentor'
                      ? 'เช่น พี่ประสิทธิ์ ใจดี (พี่เลี้ยง Mobile)'
                      : 'เช่น หัวหน้าสมศักดิ์ นำทีม (หัวหน้าพี่เลี้ยง)'
                  }
                  className="w-full bg-[#EFEFEF] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#2BA185] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  อีเมล (ใช้เข้าสู่ระบบ) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={supervisorForm.email}
                  onChange={(e) => setSupervisorForm({ ...supervisorForm, email: e.target.value })}
                  placeholder={
                    supervisorModalType === 'mentor'
                      ? 'เช่น prasit.mentor@traintrack.app'
                      : 'เช่น somsak.lead@traintrack.app'
                  }
                  className="w-full bg-[#EFEFEF] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#2BA185] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ตำแหน่ง / สายงานที่เชี่ยวชาญ
                </label>
                <input
                  type="text"
                  value={supervisorForm.position}
                  onChange={(e) => setSupervisorForm({ ...supervisorForm, position: e.target.value })}
                  placeholder={
                    supervisorModalType === 'mentor'
                      ? 'เช่น Senior Mobile Developer / UI Specialist'
                      : 'เช่น Head of Engineering / Mentor Lead'
                  }
                  className="w-full bg-[#EFEFEF] border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#2BA185] focus:bg-white transition"
                />
              </div>

              {!editingSupervisor && (
                <div className="p-2.5 rounded-xl bg-[#E2F4EB]/60 border border-[#C2EAD6] text-[11px] text-[#19705F] font-medium">
                  * รหัสผ่านเริ่มต้นสำหรับเข้าสู่ระบบคือ: <strong>123456</strong> (สามารถเปลี่ยนรหัสได้ภายหลัง)
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSupervisorModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 ${
                    supervisorModalType === 'mentor'
                      ? 'bg-[#19705F] hover:bg-[#145C4E] shadow-[#19705F]/20'
                      : 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{editingSupervisor ? 'บันทึกการแก้ไข' : `ยืนยันเพิ่ม${supervisorModalType === 'mentor' ? 'พี่เลี้ยง' : 'หัวหน้า'}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ยืนยันการลบ (CONFIRM DELETE DIALOG)
          ========================================================================= */}
      {deletingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center animate-fade-in-scale">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              ยืนยันการลบ{deletingTarget.type === 'trainee' ? 'นักศึกษา' : deletingTarget.type === 'mentor' ? 'พี่เลี้ยง' : 'หัวหน้า'}?
            </h3>
            <p className="text-xs text-slate-500 mb-2">
              คุณต้องการลบ <strong>{deletingTarget.profile.full_name}</strong> ออกจากระบบหรือไม่
            </p>
            {deletingTarget.type === 'mentor' && (
              <p className="text-[11px] text-amber-600 font-medium mb-4">
                * หากมีนักศึกษาที่เคยผูกกับพี่เลี้ยงท่านนี้ ระบบจะปรับสถานะนักศึกษาเป็น &quot;ยังไม่มอบหมายพี่เลี้ยง&quot; โดยอัตโนมัติ
              </p>
            )}
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setDeletingTarget(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition"
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

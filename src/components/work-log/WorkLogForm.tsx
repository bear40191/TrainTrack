'use client';

import React, { useState, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { Attachment } from '@/lib/types';
import { sanitizeText } from '@/lib/security';
import { uploadAttachmentToStorage } from '@/services/db';
import {
  Camera,
  Send,
  Save,
  AlertCircle,
  X,
  Plus,
  Trash2,
  UserCheck,
  Calendar,
  Image as ImageIcon
} from 'lucide-react';

interface Props {
  onSuccess: () => void;
}

// ฟังก์ชันแปลง YYYY-MM-DD เป็น วันที่/เดือน/ปี (DD/MM/YYYY)
const formatToDMY = (isoDate: string) => {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
  }
  return isoDate;
};

// ฟังก์ชันแปลง วันที่/เดือน/ปี (DD/MM/YYYY) กลับเป็น YYYY-MM-DD
const parseFromDMY = (dmyStr: string): string | null => {
  const parts = dmyStr.trim().split(/[/.-]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);

    // รองรับกรณีผู้ใช้กรอกเป็นปี พ.ศ. (เช่น 2569 -> 2026)
    if (year > 2400) {
      year -= 543;
    }

    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1990 && year <= 2100) {
      const dStr = day.toString().padStart(2, '0');
      const mStr = month.toString().padStart(2, '0');
      return `${year}-${mStr}-${dStr}`;
    }
  }
  return null;
};

export const WorkLogForm: React.FC<Props> = ({ onSuccess }) => {
  const { categories, mentors, addCategory, removeCategory, createWorkLog } = useAppStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateDisplay, setDateDisplay] = useState(() => formatToDMY(new Date().toISOString().split('T')[0]));
  const datePickerRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<string>(categories[0] || 'พัฒนาระบบ');
  const [assignedMentorId, setAssignedMentorId] = useState<string>(mentors[0]?.id || 'user-mentor-1');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Refs สำหรับ File Inputs (กล้องถ่ายรูป และ คลังรูปภาพในเครื่อง)
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // จัดการเมื่อเลือกไฟล์รูปภาพจากเครื่องหรือถ่ายรูปผ่านกล้อง
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - attachments.length;
    if (remainingSlots <= 0) {
      alert('แนบรูปได้สูงสุด 5 รูปแล้ว');
      e.target.value = '';
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      alert(`สามารถเพิ่มได้อีกเพียง ${remainingSlots} รูปเท่านั้น`);
    }

    filesToProcess.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        alert(`ไฟล์ "${file.name}" ไม่ใช่รูปภาพ`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          const newAttId = 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
          const newAtt: Attachment = {
            id: newAttId,
            work_log_id: '',
            file_name: file.name || `photo_${Date.now()}.jpg`,
            file_url: result,
            file_type: 'image',
            file_size: file.size,
            created_at: new Date().toISOString(),
          };
          setAttachments((prev) => (prev.length < 5 ? [...prev, newAtt] : prev));

          // อัปโหลดขึ้น Supabase Storage (ถ้าเชื่อมต่อได้ จะแทนที่ด้วย Public URL จาก Cloud)
          uploadAttachmentToStorage(file, file.name || `photo_${Date.now()}.jpg`).then((cloudUrl) => {
            if (cloudUrl) {
              setAttachments((prev) =>
                prev.map((a) => (a.id === newAttId ? { ...a, file_url: cloudUrl } : a))
              );
            }
          });
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // จัดการการเปลี่ยนวันที่จาก Date Picker
  const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setWorkDate(e.target.value);
      setDateDisplay(formatToDMY(e.target.value));
    }
  };

  // จัดการเมื่อผู้ใช้พิมพ์วันที่ในกล่องข้อความ
  const handleDateTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDateDisplay(val);
    const parsed = parseFromDMY(val);
    if (parsed) {
      setWorkDate(parsed);
    }
  };

  const handleDateBlur = () => {
    const parsed = parseFromDMY(dateDisplay);
    if (parsed) {
      setWorkDate(parsed);
      setDateDisplay(formatToDMY(parsed));
    } else {
      setDateDisplay(formatToDMY(workDate));
    }
  };

  // การจัดการหมวดหมู่ (เพิ่ม / ลบ)
  const [isManagingCategory, setIsManagingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddNewCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName.trim());
    setCategory(newCategoryName.trim());
    setNewCategoryName('');
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const handleSubmit = (isDraft: boolean) => {
    const cleanedTitle = sanitizeText(title, 200);
    const cleanedDescription = sanitizeText(description, 5000);

    if (!cleanedTitle) {
      setError('กรุณาระบุหัวข้องาน');
      return;
    }
    if (!cleanedDescription || cleanedDescription.length < 5) {
      setError('กรุณาระบุรายละเอียดงานอย่างน้อย 5 ตัวอักษร');
      return;
    }

    setError(null);

    createWorkLog({
      trainee_id: '',
      assigned_mentor_id: assignedMentorId,
      work_date: workDate,
      title: cleanedTitle,
      description: cleanedDescription,
      hours_spent: 0,
      category,
      status: isDraft ? 'draft' : 'pending_mentor',
      submitted_at: isDraft ? null : new Date().toISOString(),
      approved_at: null,
      attachments,
    });

    onSuccess();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-card pb-10">
      <div className="flex items-center justify-between pb-5 border-b border-slate-100 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500" />
            บันทึกการทำงานประจำวัน
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            ระบุรายละเอียดงาน เลือกพี่เลี้ยงผู้สั่งงานหรือผู้ตรวจ และส่งอนุมัติ
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* เลือกพี่เลี้ยงผู้สั่งงาน / ผู้ตรวจ (รองรับพี่เลี้ยงหลายคน) */}
        <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-4 sm:p-5">
          <label className="block text-sm font-bold text-emerald-900 mb-2 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            เลือกพี่เลี้ยงที่สั่งงาน / ผู้ตรวจงานชิ้นนี้
          </label>
          <select
            value={assignedMentorId}
            onChange={(e) => setAssignedMentorId(e.target.value)}
            className="w-full bg-white border border-emerald-300 rounded-xl px-4 py-3 text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          >
            {mentors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name} ({m.position || 'พี่เลี้ยง'})
              </option>
            ))}
          </select>
          <p className="text-xs text-emerald-700/80 mt-2 font-medium">
            * ระบบจะส่งงานชิ้นนี้ไปยังพี่เลี้ยงคนที่คุณเลือกเพื่อทำการตรวจสอบและยืนยัน
          </p>
        </div>

        {/* วันที่ปฏิบัติงาน (รูปแบบ วันที่/เดือน/ปี พร้อมระบบเลือกปฏิทิน และตัดจำนวนชั่วโมงออก) */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#19705F]" />
              <span>วันที่ปฏิบัติงาน</span>
            </span>
            <span className="text-xs text-slate-400 font-normal">
              รูปแบบ: วันที่/เดือน/ปี (DD/MM/YYYY)
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={dateDisplay}
              onChange={handleDateTextChange}
              onBlur={handleDateBlur}
              placeholder="วว/ดด/ปปปป (เช่น 12/11/2026)"
              className="w-full bg-[#EFEFEF] hover:bg-slate-100/80 border border-slate-200 hover:border-slate-300 rounded-xl pl-4 pr-12 py-3 text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#2BA185] focus:bg-white transition shadow-xs"
            />
            <button
              type="button"
              onClick={() => {
                try {
                  datePickerRef.current?.showPicker?.();
                } catch {
                  datePickerRef.current?.focus();
                }
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 text-slate-500 hover:text-[#19705F] hover:bg-slate-200/60 rounded-lg transition"
              title="เปิดปฏิทินเลือกวันที่"
            >
              <Calendar className="w-4 h-4 text-[#19705F]" />
            </button>
            {/* ซ่อน Native Date Input เพื่อรองรับการเปิดปฏิทินในทุกเบราว์เซอร์ */}
            <input
              ref={datePickerRef}
              type="date"
              value={workDate}
              onChange={handleDatePickerChange}
              className="sr-only absolute pointer-events-none opacity-0"
              tabIndex={-1}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            * แสดงและบันทึกในรูปแบบ วันที่/เดือน/ปี เช่น {dateDisplay || '12/11/2026'}
          </p>
        </div>

        {/* หมวดหมู่งาน + ปุ่มเพิ่ม/ลบหมวดหมู่ */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-slate-700">หมวดหมู่งาน</label>
            <button
              type="button"
              onClick={() => setIsManagingCategory(!isManagingCategory)}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
            >
              {isManagingCategory ? 'ปิดการจัดการ' : '+ จัดการ/เพิ่มหมวดหมู่'}
            </button>
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* แผงเพิ่ม / ลบ หมวดหมู่ที่ User กำหนดเอง */}
          {isManagingCategory && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
              <form onSubmit={handleAddNewCategory} className="flex gap-2">
                <input
                  type="text"
                  placeholder="พิมพ์ชื่อหมวดหมู่ใหม่ที่ต้องการ..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  เพิ่ม
                </button>
              </form>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {categories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-700 shadow-sm"
                  >
                    <span>{cat}</span>
                    {categories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCategory(cat)}
                        className="text-slate-400 hover:text-rose-600 transition"
                        title="ลบหมวดหมู่นี้"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* หัวข้องาน */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">หัวข้อการทำงาน</label>
          <input
            type="text"
            placeholder="เช่น พัฒนาระบบยืนยันตัวตน, ออกแบบ Wireframe หน้าหลัก"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
        </div>

        {/* รายละเอียด */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">รายละเอียดผลการปฏิบัติงาน</label>
          <textarea
            rows={5}
            placeholder="อธิบายสิ่งที่ทำ สิ่งที่ได้เรียนรู้ และปัญหาที่พบเจอหรือแนวทางแก้ไข..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition leading-relaxed"
          />
        </div>

        {/* แนบรูปภาพ / หลักฐาน */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                รูปภาพประกอบหรือหลักฐาน ({attachments.length}/5)
              </label>
              <p className="text-[11px] text-slate-400">
                ถ่ายภาพหน้างาน หรือเลือกรูปจากแกลเลอรีในเครื่อง (สูงสุด 5 รูป)
              </p>
            </div>
            
            {/* ปุ่มถ่ายรูป และ ปุ่มเลือกรูปจากเครื่อง */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={attachments.length >= 5}
                className="text-xs text-emerald-700 hover:text-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition shadow-2xs cursor-pointer"
                title="เปิดกล้องเพื่อถ่ายภาพทันที"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                <span>ถ่ายภาพ</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={attachments.length >= 5}
                className="text-xs text-slate-700 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 transition shadow-2xs cursor-pointer"
                title="เลือกไฟล์รูปภาพจากเครื่องหรือคลังภาพ"
              >
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>เลือกรูปจากเครื่อง</span>
              </button>
            </div>
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFilesSelected}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFilesSelected}
          />

          {attachments.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 shadow-sm transition hover:shadow-md"
                >
                  <img
                    src={att.file_url}
                    alt={att.file_name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                    <span className="text-[10px] text-white font-medium truncate max-w-[80%]">
                      {att.file_name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="absolute top-1.5 right-1.5 bg-slate-900/80 hover:bg-rose-600 text-white p-1.5 rounded-full transition shadow-sm cursor-pointer"
                    title="ลบรูปภาพนี้"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50/60">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-100">
                <Camera className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-600 font-semibold">
                ยังไม่มีรูปภาพประกอบ
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                คลิกปุ่ม &ldquo;ถ่ายภาพ&rdquo; หรือ &ldquo;เลือกรูปจากเครื่อง&rdquo; ด้านบนเพื่อแนบหลักฐาน
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold border border-slate-200 transition"
          >
            <Save className="w-4 h-4 text-slate-500" />
            บันทึกแบบร่าง
          </button>

          <button
            type="button"
            onClick={() => handleSubmit(false)}
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-600/20 transition active:scale-95"
          >
            <Send className="w-4 h-4" />
            ส่งให้พี่เลี้ยงตรวจ
          </button>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Attachment } from '@/lib/types';
import { Camera, Send, Save, AlertCircle, X, Plus, Trash2, UserCheck } from 'lucide-react';

interface Props {
  onSuccess: () => void;
}

export const WorkLogForm: React.FC<Props> = ({ onSuccess }) => {
  const { categories, mentors, addCategory, removeCategory, createWorkLog } = useAppStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [hoursSpent, setHoursSpent] = useState<number>(8);
  const [category, setCategory] = useState<string>(categories[0] || 'พัฒนาระบบ');
  const [assignedMentorId, setAssignedMentorId] = useState<string>(mentors[0]?.id || 'user-mentor-1');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  const handleAddSampleImage = () => {
    if (attachments.length >= 5) {
      alert('แนบรูปได้สูงสุด 5 รูป');
      return;
    }
    const sampleImages = [
      'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600',
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=600',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600'
    ];
    const picked = sampleImages[attachments.length % sampleImages.length];

    const newAtt: Attachment = {
      id: 'att-' + Date.now(),
      work_log_id: '',
      file_name: `evidence_${attachments.length + 1}.jpg`,
      file_url: picked,
      file_type: 'image',
      file_size: 1024 * 320,
      created_at: new Date().toISOString()
    };
    setAttachments([...attachments, newAtt]);
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  const handleSubmit = (isDraft: boolean) => {
    if (!title.trim()) {
      setError('กรุณาระบุหัวข้องาน');
      return;
    }
    if (!description.trim() || description.length < 5) {
      setError('กรุณาระบุรายละเอียดงานอย่างน้อย 5 ตัวอักษร');
      return;
    }

    setError(null);

    createWorkLog({
      trainee_id: '',
      assigned_mentor_id: assignedMentorId,
      work_date: workDate,
      title: title.trim(),
      description: description.trim(),
      hours_spent: Number(hoursSpent),
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

        {/* วันที่ & ชั่วโมง */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">วันที่ปฏิบัติงาน</label>
            <input
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">จำนวนชั่วโมง (ชม.)</label>
            <input
              type="number"
              min="1"
              max="24"
              step="0.5"
              value={hoursSpent}
              onChange={(e) => setHoursSpent(parseFloat(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>
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
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-slate-700">
              รูปภาพประกอบหรือหลักฐาน ({attachments.length}/5)
            </label>
            <button
              type="button"
              onClick={handleAddSampleImage}
              className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 transition"
            >
              <Camera className="w-4 h-4" />
              + เพิ่มรูปภาพ
            </button>
          </div>

          {attachments.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {attachments.map((att) => (
                <div key={att.id} className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 shadow-sm">
                  <img src={att.file_url} alt={att.file_name} className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="absolute top-1.5 right-1.5 bg-slate-900/70 hover:bg-rose-600 text-white p-1.5 rounded-full transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
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

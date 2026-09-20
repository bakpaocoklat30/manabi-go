
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookPlus, Plus, Loader2, Edit, Trash2, Layers, Video, FileText, CheckCircle2, AlertCircle, Calendar
} from 'lucide-react';

interface ModuleData {
  id: string;
  title: string;
  weekNumber: number;
  description: string;
  isGamified?: boolean;
  _count: {
    items: number;
    quizzes: number;
  };
}

interface KelasSchedule {
  id: string;
  name: string;
  publishAt: string | null;
  dueDate: string | null;
  isSelected: boolean;
}

export default function CourseBuilderPage() {
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formWeek, setFormWeek] = useState(1);
  const [formDesc, setFormDesc] = useState('');
  const [formIsGamified, setFormIsGamified] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Jadwal Modal States
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleModuleId, setScheduleModuleId] = useState('');
  const [scheduleModuleTitle, setScheduleModuleTitle] = useState('');
  const [classes, setClasses] = useState<KelasSchedule[]>([]);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [isScheduleSaving, setIsScheduleSaving] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch('/api/guru/modules');
      if (res.ok) {
        const data = await res.json();
        setModules(data.modules);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setIsEditing(false);
    setFormTitle('');
    setFormWeek(modules.length > 0 ? Math.max(...modules.map(m => m.weekNumber)) + 1 : 1);
    setFormDesc('');
    setFormIsGamified(true);
    setShowModal(true);
  };

  const openEdit = (m: ModuleData) => {
    setIsEditing(true);
    setEditId(m.id);
    setFormTitle(m.title);
    setFormWeek(m.weekNumber);
    setFormDesc(m.description);
    setShowModal(true);
  };

  const openSchedule = async (m: ModuleData) => {
    setScheduleModuleId(m.id);
    setScheduleModuleTitle(m.title);
    setShowScheduleModal(true);
    setIsScheduleLoading(true);
    try {
      const res = await fetch(`/api/guru/modules/${m.id}/schedule`);
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsScheduleLoading(false);
    }
  };

  const handleClassSelection = (index: number) => {
    const newClasses = [...classes];
    newClasses[index].isSelected = !newClasses[index].isSelected;
    setClasses(newClasses);
  };

  const handleDateChange = (index: number, dateString: string) => {
    const newClasses = [...classes];
    newClasses[index].publishAt = dateString ? new Date(dateString).toISOString() : null;
    setClasses(newClasses);
  };

  const handleDueDateChange = (index: number, dateString: string) => {
    const newClasses = [...classes];
    newClasses[index].dueDate = dateString ? new Date(dateString).toISOString() : null;
    setClasses(newClasses);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScheduleSaving(true);
    try {
      const selectedSchedules = classes.filter(c => c.isSelected).map(c => ({
        kelasId: c.id,
        publishAt: c.publishAt,
        dueDate: c.dueDate
      }));

      const res = await fetch(`/api/guru/modules/${scheduleModuleId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedules: selectedSchedules })
      });
      if (res.ok) {
        setNotification({ type: 'success', message: 'Jadwal berhasil disimpan.' });
        setShowScheduleModal(false);
      } else {
        throw new Error('Gagal menyimpan jadwal');
      }
    } catch (e: any) {
      setNotification({ type: 'error', message: e.message });
    } finally {
      setIsScheduleSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotification(null);
    try {
      const action = isEditing ? 'UPDATE' : 'CREATE';
      const body = { action, id: editId, title: formTitle, weekNumber: formWeek, description: formDesc, isGamified: formIsGamified };
      const res = await fetch('/api/guru/modules', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }
      setNotification({ type: 'success', message: `Modul berhasil ${isEditing ? 'diperbarui' : 'dibuat'}.` });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal menyimpan modul.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus modul ini beserta semua isinya?')) return;
    try {
      const res = await fetch('/api/guru/modules', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'DELETE', id })
      });
      if (res.ok) {
        setNotification({ type: 'success', message: 'Modul berhasil dihapus.' });
        loadData();
      }
    } catch (e) {
      setNotification({ type: 'error', message: 'Gagal menghapus modul.' });
    }
  };

  const toLocalISOString = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E8E2D2] p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <BookPlus className="w-5 h-5 text-blue-600" />
            Course Builder
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Susun dan kelola materi pembelajaran, video, dan tugas untuk siswa.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Modul Baru</span>
        </button>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs animate-in fade-in ${
            notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs text-stone-500">Memuat modul...</p>
        </div>
      ) : modules.length === 0 ? (
        <div className="bg-white border border-[#E8E2D2] rounded-2xl p-12 text-center shadow-sm">
          <Layers className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-stone-900 mb-1">Belum Ada Materi</h3>
          <p className="text-xs text-stone-500">Silakan buat modul baru untuk memulai.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modules.map(m => (
            <div key={m.id} className="bg-white border border-[#E8E2D2] rounded-2xl p-5 shadow-sm space-y-4 hover:border-blue-300 transition-colors group">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mb-1.5 inline-block">
                    Pekan {m.weekNumber}
                  </span>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-stone-900 line-clamp-1">{m.title}</h3>
                    {!m.isGamified && (
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded">EXP Mati</span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                    {m.description || 'Tidak ada deskripsi'}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(m)} className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(m.id)} className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              
              <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-stone-600">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    {m._count.items} Item
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-stone-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    {m._count.quizzes} Kuis
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openSchedule(m)} className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> Distribusi & Jadwal
                  </button>
                  <Link href={`/guru/builder/${m.id}`} className="text-[11px] font-bold text-white bg-stone-800 hover:bg-stone-700 px-3 py-1.5 rounded-lg transition shadow-sm inline-block">
                    Isi Konten
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Buat/Edit Modul */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E2D2] rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-stone-900 mb-4">{isEditing ? 'Edit Modul' : 'Buat Modul Baru'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Judul Bab / Modul</label>
                <input type="text" required value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Contoh: Pengenalan Katakana" className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E8E2D2] rounded-xl text-stone-900 text-xs focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Pertemuan Pekan Ke-</label>
                <input type="number" min="1" required value={formWeek} onChange={(e) => setFormWeek(Number(e.target.value))} className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E8E2D2] rounded-xl text-stone-900 text-xs focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex flex-col gap-1 p-3 bg-blue-50 border border-blue-100 rounded-xl mb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-blue-900">Fitur EXP / Gamifikasi</h4>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={formIsGamified}
                      onChange={(e) => setFormIsGamified(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-[9px] text-blue-700">Jika aktif, siswa mendapat poin berdasarkan lama membaca materi.</p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Deskripsi Singkat</label>
                <textarea rows={3} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E8E2D2] rounded-xl text-stone-900 text-xs focus:outline-none focus:border-blue-500" />
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t border-[#E8E2D2]">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold rounded-xl">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5">
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Modul</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Penjadwalan */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E2D2] rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" /> Distribusi & Jadwal
              </h3>
              <p className="text-xs text-stone-500 mt-1 font-medium">Pilih kelas yang berhak mengakses materi: <span className="text-stone-800 font-bold">{scheduleModuleTitle}</span></p>
            </div>

            {isScheduleLoading ? (
              <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
            ) : (
              <form onSubmit={handleSaveSchedule} className="space-y-4">
                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {classes.length === 0 ? (
                    <p className="text-xs text-stone-500 text-center py-4">Belum ada kelas yang terdaftar di sistem.</p>
                  ) : (
                    classes.map((cls, idx) => (
                      <div key={cls.id} className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center gap-3 transition-colors ${cls.isSelected ? 'border-blue-300 bg-blue-50/50' : 'border-[#E8E2D2] bg-white'}`}>
                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                          <input type="checkbox" checked={cls.isSelected} onChange={() => handleClassSelection(idx)} className="w-4 h-4 rounded border-stone-300 text-blue-600 focus:ring-blue-500" />
                          <span className="text-sm font-bold text-stone-800">{cls.name}</span>
                        </label>
                        {cls.isSelected && (
                                                    <div className="sm:w-56 flex flex-col gap-2">
                            <div>
                              <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-1 block">Waktu Mulai:</span>
                              <input 
                                type="datetime-local" 
                                value={toLocalISOString(cls.publishAt || '')}
                                onChange={(e) => handleDateChange(idx, e.target.value)}
                                className="w-full text-xs font-medium px-2 py-1.5 border border-[#E8E2D2] bg-white rounded-lg focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-1 block">Batas Pengumpulan (Deadline):</span>
                              <input 
                                type="datetime-local" 
                                value={toLocalISOString(cls.dueDate || '')}
                                onChange={(e) => handleDueDateChange(idx, e.target.value)}
                                className="w-full text-xs font-medium px-2 py-1.5 border border-[#E8E2D2] bg-white rounded-lg focus:outline-none focus:border-red-500"
                              />
                            </div>
                            <button 
                              type="button"
                              onClick={() => {
                                handleDateChange(idx, '');
                                // Auto set deadline 7 hari kemudian
                                const nextWeek = new Date();
                                nextWeek.setDate(nextWeek.getDate() + 7);
                                handleDueDateChange(idx, nextWeek.toISOString());
                              }}
                              className="w-full px-2 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-[10px] font-bold rounded-lg transition-colors border border-emerald-200 mt-1"
                            >
                              🚀 Langsung Rilis (+7 Hari Batas Waktu)
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-[#E8E2D2]">
                  <button type="button" onClick={() => setShowScheduleModal(false)} className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold rounded-xl">Batal</button>
                  <button type="submit" disabled={isScheduleSaving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md">
                    {isScheduleSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Simpan Jadwal Rilis</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

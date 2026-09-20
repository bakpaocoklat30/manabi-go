'use client';

import React, { useState, useEffect } from 'react';
import { FileCheck2, Loader2, CheckCircle2, AlertCircle, Search, Save } from 'lucide-react';

interface ClassData {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
  identifier: string;
  taughtClasses: ClassData[];
}

export default function LearningManagementPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/learning-management');
      const data = await res.json();
      if (res.ok) {
        setTeachers(data.teachers);
        setClasses(data.classes);
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

  const openAssignModal = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setSelectedClassIds(teacher.taughtClasses.map(c => c.id));
    setShowModal(true);
  };

  const handleToggleClass = (classId: string) => {
    setSelectedClassIds(prev => 
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;
    setIsSaving(true);
    setNotification(null);
    try {
      const res = await fetch('/api/admin/learning-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId: selectedTeacher.id, classIds: selectedClassIds })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setNotification({ type: 'success', message: 'Kelas berhasil di-assign ke guru.' });
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTeachers = teachers.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-amber-500" />
            Manajemen Pembelajaran
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Atur guru mata pelajaran dan tugaskan mereka ke lebih dari satu kelas.
          </p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari guru..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500"
          />
        </div>
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
        <div className="min-h-[40vh] flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTeachers.map(teacher => (
            <div key={teacher.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{teacher.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">NIP: {teacher.identifier}</p>
                </div>
                <button
                  onClick={() => openAssignModal(teacher)}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold transition"
                >
                  Assign Kelas
                </button>
              </div>
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Mengajar di Kelas:</p>
                <div className="flex flex-wrap gap-1.5">
                  {teacher.taughtClasses.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">Belum ada kelas</span>
                  ) : (
                    teacher.taughtClasses.map(c => (
                      <span key={c.id} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold border border-slate-200">
                        {c.name}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && selectedTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[85vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">Assign Kelas untuk Guru</h3>
            <p className="text-xs text-slate-500 mb-5">
              Pilih kelas mana saja yang diajar oleh <strong className="text-slate-800">{selectedTeacher.name}</strong>.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {classes.map(cls => (
                  <label key={cls.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    selectedClassIds.includes(cls.id) ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input 
                      type="checkbox"
                      checked={selectedClassIds.includes(cls.id)}
                      onChange={() => handleToggleClass(cls.id)}
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                    />
                    <span className={`text-sm font-bold ${selectedClassIds.includes(cls.id) ? 'text-amber-900' : 'text-slate-700'}`}>
                      {cls.name}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl">Batal</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5">
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Simpan Pengaturan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

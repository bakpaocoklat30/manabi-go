'use client';

import React, { useState, useEffect } from 'react';
import { 
  School, 
  Plus, 
  Users, 
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UserPlus
} from 'lucide-react';

interface TeacherData { id: string; name: string; identifier: string; }
interface ClassData {
  teachers: { id: string; name: string; }[];
  id: string;
  name: string;
  jurusan: string;
  driveFolderUrl: string | null;
  _count: {
    students: number;
  };
}

interface StudentData {
  id: string;
  name: string;
  identifier: string;
}

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<StudentData[]>([]);
          const [isLoading, setIsLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formJurusan, setFormJurusan] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch('/api/admin/classes');
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes);
        setUnassignedStudents(data.unassignedStudents);
        if (data.unassignedTeachers) {
                        if (data.unassignedTeachers.length > 0) {
                          }
        }
        if (data.unassignedStudents.length > 0) {
          setSelectedStudentId(data.unassignedStudents[0].id);
        }
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

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotification(null);

    try {
      const res = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE',
          name: formName,
          jurusan: formJurusan,
          
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setNotification({ type: 'success', message: 'Kelas berhasil dibuat!' });
      setShowCreateModal(false);
      setFormName('');
      setFormJurusan('');
            await loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal membuat kelas.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedStudentId) return;

    setIsAssigning(true);
    setNotification(null);

    try {
      const res = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ASSIGN_STUDENT',
          kelasId: selectedClassId,
          studentId: selectedStudentId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setNotification({ type: 'success', message: 'Siswa berhasil dimasukkan ke kelas!' });
      setShowAssignModal(false);
      await loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal memasukkan siswa.' });
    } finally {
      setIsAssigning(false);
    }
  };

  
  
  const handleDeleteClass = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kelas ini? Siswa di dalamnya akan kehilangan relasi kelas.')) return;
    
    try {
      const res = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE', kelasId: id }),
      });
      if (res.ok) {
        setNotification({ type: 'success', message: 'Kelas berhasil dihapus!' });
        loadData();
      }
    } catch (e: any) {
      setNotification({ type: 'error', message: e.message || 'Gagal menghapus kelas.' });
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <School className="w-5 h-5 text-amber-500" />
            Manajemen Kelas / Rombel
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola daftar kelas dan masukkan siswa ke dalam kelas yang sesuai.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kelas</span>
          </button>
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

      {/* Grid Kelas */}
      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-xs text-slate-500">Memuat data kelas...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <School className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900 mb-1">Belum ada kelas</h3>
          <p className="text-xs text-slate-500">Silakan tambah kelas baru untuk memulai.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(c => (
            <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                                    <h3 className="text-lg font-black text-slate-900">{c.name}</h3>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-1 inline-block">
                    {c.jurusan}
                  </span>
                  <div className="mt-2 text-[11px] font-medium text-slate-600">
                    <span className="text-slate-400">Guru Mapel: </span>
                    {c.teachers && c.teachers.length > 0 ? (
                      <span className="text-blue-600 font-bold truncate block">{c.teachers.map((t: any) => t.name).join(', ')}</span>
                    ) : (
                      <span className="text-amber-500 italic">Belum Diatur</span>
                    )}
                  </div>
                </div>
                <button onClick={() => handleDeleteClass(c.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition" aria-label="Hapus kelas">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
                            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                  <Users className="w-4 h-4 text-blue-500" />
                  {c._count.students} Siswa
                </div>
                <div className="flex items-center gap-1.5">
                  
                  <button
                    onClick={() => {
                      setSelectedClassId(c.id);
                      setShowAssignModal(true);
                    }}
                    className="text-[11px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg transition flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Siswa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah Kelas */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Tambah Kelas Baru</h3>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Nama Kelas</label>
                <input type="text" required placeholder="Contoh: XII TKR 1" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Jurusan</label>
                <select required value={formJurusan} onChange={(e) => setFormJurusan(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-amber-500">
                  <option value="" disabled>Pilih Jurusan...</option>
                  <option value="Desain Pemodelan dan Informasi Bangunan">Desain Pemodelan dan Informasi Bangunan</option>
                  <option value="Teknik Audio Video">Teknik Audio Video</option>
                  <option value="Teknik Instalasi Tenaga Listrik">Teknik Instalasi Tenaga Listrik</option>
                  <option value="Teknik Pemesinan">Teknik Pemesinan</option>
                  <option value="Teknik Pengelasan">Teknik Pengelasan</option>
                  <option value="Teknik Kendaraan Ringan">Teknik Kendaraan Ringan</option>
                  <option value="Teknik Alat Berat">Teknik Alat Berat</option>
                  <option value="Teknik Komputer dan Jaringan">Teknik Komputer dan Jaringan</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5">
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Simpan Kelas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Masukkan Siswa */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Masukkan Siswa ke Kelas</h3>
            {unassignedStudents.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl text-center">
                <p className="text-xs text-slate-500">Semua siswa sudah masuk ke kelas masing-masing. Tidak ada siswa yang belum punya kelas.</p>
                <button onClick={() => setShowAssignModal(false)} className="mt-4 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl">Tutup</button>
              </div>
            ) : (
              <form onSubmit={handleAssignStudent} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Pilih Siswa (Belum Ada Kelas)</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-amber-500"
                  >
                    {unassignedStudents.map(s => (
                      <option key={s.id} value={s.id}>{s.identifier} - {s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl">Batal</button>
                  <button type="submit" disabled={isAssigning} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5">
                    {isAssigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Tambahkan ke Kelas</span>
                  </button>
                </div>
              </form>
            )}
          </div></div>)}
      
    </div>
  );
}


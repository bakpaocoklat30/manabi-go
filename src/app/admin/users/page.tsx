'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, UserPlus, FileSpreadsheet, Download, Search, CheckCircle2, 
  AlertCircle, Loader2, Upload, Edit, Trash2, KeyRound, ChevronLeft, ChevronRight
} from 'lucide-react';

interface UserData {
  id: string;
  identifier: string;
  name: string;
  role: 'SUPER_ADMIN' | 'GURU' | 'SISWA';
  isActive: boolean;
  createdAt: string;
  kelas: { name: string } | null;
  kelasId?: string | null;
}

interface KelasData {
  id: string;
  name: string;
  jurusan: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [classes, setClasses] = useState<KelasData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'SISWA' | 'GURU' | 'SUPER_ADMIN'>('ALL');

  // Pagination
  const [perPage, setPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Form Registrasi Tunggal & Edit
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  const [formIdentifier, setFormIdentifier] = useState('');
  const [formName, setFormName] = useState('');
  const [formPassword, setFormPassword] = useState('adb12345');
  const [formRole, setFormRole] = useState<'SISWA' | 'GURU'>('SISWA');
  const [formKelasId, setFormKelasId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Reset Password
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetId, setResetId] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  
  // Form Bulk CSV
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setClasses(data.classes);
        if (data.classes.length > 0 && !formKelasId) {
          setFormKelasId(data.classes[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setFormIdentifier('');
    setFormName('');
    setFormPassword('adb12345');
    setFormRole('SISWA');
    setShowSingleModal(true);
  };

  const openEditModal = (u: UserData) => {
    setIsEditing(true);
    setEditId(u.id);
    setFormIdentifier(u.identifier);
    setFormName(u.name);
    setFormRole(u.role === 'SUPER_ADMIN' ? 'GURU' : u.role);
    setFormKelasId(u.kelasId || (classes.length > 0 ? classes[0].id : ''));
    setShowSingleModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotification(null);
    try {
      const action = isEditing ? 'UPDATE' : 'CREATE_SINGLE';
      const body: any = { action, name: formName, identifier: formIdentifier, kelasId: formRole === 'SISWA' ? formKelasId : null };
      if (!isEditing) {
        body.password = formPassword;
        body.role = formRole;
      } else {
        body.id = editId;
      }

      const res = await fetch('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setNotification({ type: 'success', message: isEditing ? 'Pengguna berhasil diperbarui!' : 'Akun berhasil ditambahkan!' });
      setShowSingleModal(false);
      await loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal menyimpan akun.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'DELETE', id }),
      });
      if (res.ok) {
        setNotification({ type: 'success', message: 'Pengguna berhasil dihapus!' });
        loadData();
      } else {
        const data = await res.json();
        throw new Error(data.message);
      }
    } catch (e: any) {
      setNotification({ type: 'error', message: e.message || 'Gagal menghapus pengguna.' });
    }
  };

  const openResetModal = (id: string) => {
    setResetId(id);
    setResetPassword('adb12345');
    setShowResetModal(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'RESET_PASSWORD', id: resetId, password: resetPassword }),
      });
      if (res.ok) {
        setNotification({ type: 'success', message: 'Password berhasil direset!' });
        setShowResetModal(false);
      } else {
        const data = await res.json();
        throw new Error(data.message);
      }
    } catch (e: any) {
      setNotification({ type: 'error', message: e.message || 'Gagal mereset password.' });
    }
  };

    const downloadTemplate = () => {
    const csvHeader = "identifier,name,kelasName,password\n";
    const csvExample = "212210003,Doni Pratama,XII TKR 1,rahasia123\n212210004,Siti Aminah,XII TKJ 2,rahasia123";
    const blob = new Blob([csvHeader + csvExample], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'template-import-siswa.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkCsv = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploadingCsv(true);
    setNotification(null);
    try {
      const lines = csvContent.trim().split('\n');
      const rows = lines.map((line) => {
        const [identifier, name, kelasName, password] = line.split(',').map((s) => s.trim());
        return { identifier, name, kelasName, password };
      }).filter((r) => r.identifier && r.name);

      if (rows.length === 0) throw new Error('Format CSV tidak terbaca atau kosong.');

      const res = await fetch('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'BULK_IMPORT_CSV', rows }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setNotification({ type: 'success', message: data.message });
      setShowCsvModal(false);
      setCsvContent('');
      await loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal memproses file CSV.' });
    } finally {
      setIsUploadingCsv(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.identifier.includes(searchTerm) ||
        (u.kelas?.name.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      if (roleFilter === 'ALL') return matchesSearch;
      return matchesSearch && u.role === roleFilter;
    });
  }, [users, searchTerm, roleFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / perPage);
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredUsers.slice(start, start + perPage);
  }, [filteredUsers, currentPage, perPage]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E8E2D2] p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#C62828]" />
            Manajemen Akun Pengguna & Impor CSV
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Kelola akun Guru (NIP), Siswa (NISN), dan input massal kelas STM ADB.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C62828] hover:bg-[#B71C1C] text-white text-xs font-bold rounded-xl shadow-md shadow-[#C62828]/20 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Akun</span>
          </button>
          <button
            onClick={() => setShowCsvModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Impor Massal (CSV)</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs animate-in fade-in ${
            notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Bar Filter & Pencarian */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Cari berdasarkan NISN/NIP/Nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E8E2D2] text-stone-900 placeholder-stone-400 text-xs focus:outline-none focus:border-[#C62828] transition"
            />
          </div>
          <div className="flex items-center gap-2">
            {(['ALL', 'SISWA', 'GURU', 'SUPER_ADMIN'] as const).map((role) => (
              <button
                key={role}
                onClick={() => { setRoleFilter(role); setCurrentPage(1); }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                  roleFilter === role ? 'bg-[#C62828] text-white' : 'bg-white border border-[#E8E2D2] text-stone-500 hover:text-stone-900'
                }`}
              >
                {role === 'ALL' ? 'Semua Role' : role}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-500">Tampilkan:</span>
          <select 
            value={perPage} 
            onChange={(e) => { setPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="px-2 py-1.5 rounded-lg bg-white border border-[#E8E2D2] text-xs font-bold text-stone-700 outline-none"
          >
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Tabel Pengguna */}
      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#C62828]" />
          <p className="text-xs text-stone-500 font-mono">Memuat daftar akun database...</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E8E2D2] rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FDFBF7] text-stone-500 uppercase tracking-wider border-b border-[#E8E2D2]">
                <tr>
                  <th className="px-6 py-4">Nama Lengkap</th>
                  <th className="px-6 py-4">NISN / NIP</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Kelas Rombel</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D2] text-stone-600">
                {paginatedUsers.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-stone-500">Data tidak ditemukan.</td></tr>
                ) : paginatedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-stone-50 transition group">
                    <td className="px-6 py-4 font-bold text-stone-900">{u.name}</td>
                    <td className="px-6 py-4 font-mono text-stone-600">{u.identifier}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                          u.role === 'SUPER_ADMIN' ? 'bg-red-50 text-red-600 border border-red-200' :
                          u.role === 'GURU' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                          'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.kelas ? <span className="font-semibold text-blue-600">{u.kelas.name}</span> : <span className="text-stone-400">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Aktif
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => openEditModal(u)} className="p-1.5 rounded-lg text-stone-400 hover:text-blue-600 hover:bg-blue-50 transition" title="Edit Profil">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => openResetModal(u.id)} className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition" title="Reset Password">
                        <KeyRound className="w-4 h-4" />
                      </button>
                      {u.role !== 'SUPER_ADMIN' && (
                        <button onClick={() => handleDeleteUser(u.id)} className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition" title="Hapus Akun">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-[#E8E2D2] flex items-center justify-between bg-[#FDFBF7]">
              <span className="text-xs text-stone-500 font-medium">
                Halaman {currentPage} dari {totalPages} ({filteredUsers.length} total baris)
              </span>
              <div className="flex gap-1">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 rounded-lg border border-[#E8E2D2] bg-white text-stone-600 hover:bg-stone-100 disabled:opacity-50 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-1.5 rounded-lg border border-[#E8E2D2] bg-white text-stone-600 hover:bg-stone-100 disabled:opacity-50 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal 1: Tambah / Edit Pengguna Tunggal */}
      {showSingleModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E2D2] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-stone-900">
              {isEditing ? 'Edit Profil Pengguna' : 'Tambah Pengguna Baru'}
            </h3>
            <form onSubmit={handleSaveUser} className="space-y-4">
              {!isEditing && (
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 uppercase mb-1">Role Akun</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E8E2D2] rounded-xl text-stone-900 text-xs focus:outline-none"
                  >
                    <option value="SISWA">Siswa (Learner)</option>
                    <option value="GURU">Guru (Sensei / Pengajar)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 uppercase mb-1">
                  {formRole === 'SISWA' ? 'NISN Siswa' : 'NIP / NUPTK Guru'}
                </label>
                <input
                  type="text" required
                  value={formIdentifier} onChange={(e) => setFormIdentifier(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E8E2D2] rounded-xl text-stone-900 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 uppercase mb-1">Nama Lengkap</label>
                <input
                  type="text" required
                  value={formName} onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E8E2D2] rounded-xl text-stone-900 text-xs focus:outline-none"
                />
              </div>

              {formRole === 'SISWA' && (
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 uppercase mb-1">Kelas Rombel</label>
                  <select
                    value={formKelasId} onChange={(e) => setFormKelasId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E8E2D2] rounded-xl text-stone-900 text-xs focus:outline-none"
                  >
                    <option value="">-- Tidak Ada Kelas --</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name} - {c.jurusan}</option>)}
                  </select>
                </div>
              )}

              {!isEditing && (
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 uppercase mb-1">Kata Sandi Awal</label>
                  <input
                    type="text" required
                    value={formPassword} onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E8E2D2] rounded-xl text-stone-900 text-xs font-mono focus:outline-none"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowSingleModal(false)} className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold rounded-xl">Batal</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[#C62828] hover:bg-[#B71C1C] text-white text-xs font-bold rounded-xl flex items-center gap-1.5">
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E2D2] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-stone-900">Reset Password</h3>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 uppercase mb-1">Password Baru</label>
                <input
                  type="text" required
                  value={resetPassword} onChange={(e) => setResetPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E8E2D2] rounded-xl text-stone-900 text-xs font-mono focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowResetModal(false)} className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold rounded-xl">Batal</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5">
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Bulk Import Siswa CSV */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E2D2] rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-500" />
                Impor Massal Siswa
              </h3>
              <button 
                type="button" 
                onClick={downloadTemplate}
                className="text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
              >
                <Download className="w-3 h-3" /> Unduh Template CSV
              </button>
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              Format baris: <code className="text-[#C62828] font-mono">NISN,Nama Siswa,Nama Kelas,Password</code>.<br />
              <code className="text-stone-600 font-mono block bg-[#FDFBF7] p-2 rounded-lg mt-1">212210003,Doni Pratama,XII TKR 1,adb12345</code>
            </p>
            <form onSubmit={handleBulkCsv} className="space-y-4">
              <textarea rows={6} required value={csvContent} onChange={(e) => setCsvContent(e.target.value)} placeholder="..." className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E8E2D2] rounded-xl text-stone-900 text-xs font-mono focus:outline-none focus:border-blue-500" />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCsvModal(false)} className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold rounded-xl">Batal</button>
                <button type="submit" disabled={isUploadingCsv} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5">
                  {isUploadingCsv ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>Proses Impor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

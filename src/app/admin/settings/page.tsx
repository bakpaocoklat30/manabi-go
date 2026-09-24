'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Loader2, CheckCircle2, AlertCircle, Cloud, Database, ExternalLink, FileArchive, Download, Bot, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    gdrive_client_id: '',
    gdrive_client_secret: '',
    gdrive_refresh_token: '',
    gdrive_root_folder_id: '',
    auto_backup_schedule: 'manual',
    api_sudarmono: '',
    ai_grading_prompt: '',
    gemini_api_key: '',
    gemini_model_name: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [driveStatus, setDriveStatus] = useState<{ status: 'LOADING' | 'NOT_CONFIGURED' | 'CONNECTED' | 'ERROR', message?: string, quota?: any }>({ status: 'LOADING' });
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  
  const checkDriveStatus = async () => {
    setDriveStatus({ status: 'LOADING' });
    try {
      const res = await fetch('/api/admin/settings/drive-status');
      const data = await res.json();
      if (res.ok) {
        setDriveStatus({ status: data.status, message: data.message, quota: data.storageQuota });
      const listRes = await fetch('/api/admin/settings/backup/list');
      if (listRes.ok) {
        const listData = await listRes.json();
        setBackups(listData.data || []);
      }
      } else {
        setDriveStatus({ status: 'ERROR', message: 'Gagal mengecek status' });
      }
    } catch (e) {
      setDriveStatus({ status: 'ERROR', message: 'Koneksi terputus' });
    }
  };

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const { settings } = await res.json();
        setFormData({
          gdrive_client_id: settings.gdrive_client_id || '',
          gdrive_client_secret: settings.gdrive_client_secret || '',
          gdrive_refresh_token: settings.gdrive_refresh_token || '',
          gdrive_root_folder_id: settings.gdrive_root_folder_id || '',
          auto_backup_schedule: settings.auto_backup_schedule || 'manual',
          api_sudarmono: settings.api_sudarmono || '',
          ai_grading_prompt: settings.ai_grading_prompt || '',
          gemini_api_key: settings.gemini_api_key || '',
          gemini_model_name: settings.gemini_model_name || '',
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  
  useEffect(() => {
    loadSettings();
    checkDriveStatus();
  }, []);

  
  const handleRestore = async (fileId: string) => {
    if (!confirm('PERINGATAN KRITIKAL! Seluruh data (Nilai, Kuis, Siswa) akan dihapus dan diganti dengan isi backup ini.\n\nApakah Anda yakin ingin memulihkan database?')) return;
    
    setRestoringId(fileId);
    try {
      const res = await fetch('/api/admin/settings/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId })
      });
      const json = await res.json();
      
      if (res.ok) {
        alert('✅ ' + json.message + ' Halaman akan dimuat ulang.');
        window.location.reload();
      } else {
        alert('❌ Gagal: ' + json.message);
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setRestoringId(null);
    }
  };

  const handleBackupNow = async () => {
    setIsBackingUp(true);
    setNotification(null);
    try {
      const res = await fetch('/api/admin/settings/backup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setNotification({ type: 'success', message: 'Backup berhasil diunggah ke Google Drive!' });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal melakukan backup.' });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setNotification(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: formData })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setNotification({ type: 'success', message: data.message });
      checkDriveStatus(); // Re-check status after saving

    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-500" />
            Pengaturan Sistem & API
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi kredensial pihak ketiga (Google Drive Backup, Google Gemini AI) dan integrasi layanan lainnya.
          </p>
        </div>
      </div>

      {/* Pintasan Cepat Google APIs & Cloud Console */}
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/70 to-purple-50/80 border border-blue-200/70 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2.5 mb-3.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Pintasan Cepat Google API & Console
            </h3>
            <p className="text-[11px] text-slate-500">
              Akses langsung ke portal resmi Google untuk membuat project, mengaktifkan API, dan mengambil kunci akses.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 p-3 bg-white/90 hover:bg-white border border-indigo-200/80 hover:border-indigo-400 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-700 shadow-2xs hover:shadow-xs transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
              <Bot className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block truncate font-bold text-slate-800 group-hover:text-indigo-600">Google AI Studio</span>
              <span className="block text-[10px] text-slate-400 truncate">Dapatkan Gemini API Key</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 flex-shrink-0" />
          </a>

          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 p-3 bg-white/90 hover:bg-white border border-blue-200/80 hover:border-blue-400 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-700 shadow-2xs hover:shadow-xs transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
              <Cloud className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block truncate font-bold text-slate-800 group-hover:text-blue-600">Cloud Credentials</span>
              <span className="block text-[10px] text-slate-400 truncate">OAuth Client ID & Secret</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 flex-shrink-0" />
          </a>

          <a
            href="https://console.cloud.google.com/apis/library/drive.googleapis.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 p-3 bg-white/90 hover:bg-white border border-emerald-200/80 hover:border-emerald-400 rounded-xl text-xs font-semibold text-slate-700 hover:text-emerald-700 shadow-2xs hover:shadow-xs transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
              <Database className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block truncate font-bold text-slate-800 group-hover:text-emerald-600">Google Drive API</span>
              <span className="block text-[10px] text-slate-400 truncate">Aktifkan API di Console</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 flex-shrink-0" />
          </a>

          <a
            href="https://developers.google.com/oauthplayground"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 p-3 bg-white/90 hover:bg-white border border-amber-200/80 hover:border-amber-400 rounded-xl text-xs font-semibold text-slate-700 hover:text-amber-700 shadow-2xs hover:shadow-xs transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 transition-colors">
              <Settings className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block truncate font-bold text-slate-800 group-hover:text-amber-600">OAuth Playground</span>
              <span className="block text-[10px] text-slate-400 truncate">Ambil Refresh Token</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 flex-shrink-0" />
          </a>
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
          <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Card: Google Drive */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Cloud className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Backup Google Drive</h3>
                  <p className="text-[10px] text-slate-500">Kredensial OAuth 2.0 untuk sinkronisasi tugas siswa.</p>
                </div>
              </div>
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 min-w-[200px]">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Status Koneksi API</p>
                {driveStatus.status === 'LOADING' && <div className="flex items-center gap-1.5 text-xs text-slate-600"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sedang memeriksa...</div>}
                {driveStatus.status === 'NOT_CONFIGURED' && <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400"><AlertCircle className="w-3.5 h-3.5" /> Belum Dikonfigurasi</div>}
                {driveStatus.status === 'ERROR' && <div className="flex items-center gap-1.5 text-xs font-bold text-red-600"><AlertCircle className="w-3.5 h-3.5" /> Error: {driveStatus.message}</div>}
                {driveStatus.status === 'CONNECTED' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Terhubung Aktif
                    </div>
                    {driveStatus.quota && (
                      <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full" 
                          style={{ width: `${Math.min(100, (Number(driveStatus.quota.usage) / Number(driveStatus.quota.limit)) * 100)}%` }}
                        ></div>
                      </div>
                    )}
                    {driveStatus.quota && (
                      <p className="text-[9px] text-slate-500 mt-1">
                        Terpakai: {(Number(driveStatus.quota.usage) / (1024 ** 3)).toFixed(2)} GB / {(Number(driveStatus.quota.limit) / (1024 ** 3)).toFixed(2)} GB
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">Google Client ID</label>
                  <a 
                    href="https://console.cloud.google.com/apis/credentials" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-700 hover:underline font-medium"
                  >
                    <span>Buka Cloud Credentials</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input type="text" name="gdrive_client_id" value={formData.gdrive_client_id} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-500" placeholder="1234567890-xxx.apps.googleusercontent.com" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Google Client Secret</label>
                <input type="password" name="gdrive_client_secret" value={formData.gdrive_client_secret} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-500" placeholder="GOCSPX-xxx" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase">Refresh Token (Offline Access)</label>
                  <a 
                    href="https://developers.google.com/oauthplayground" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-700 hover:underline font-medium"
                    title="Gunakan scope https://www.googleapis.com/auth/drive"
                  >
                    <span>Buka OAuth 2.0 Playground</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input type="password" name="gdrive_refresh_token" value={formData.gdrive_refresh_token} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-500" placeholder="1//0eX..." />
              </div>
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">ID Folder Induk / Drive Bersama</label>
                <p className="text-[9px] text-slate-500 mb-2 leading-relaxed">Semua file dan folder kelas otomatis akan diletakkan di dalam folder/Drive Bersama ini. Anda bisa mendapatkan ID-nya dari link URL (contoh: drive.google.com/drive/folders/<b>1A2b3C4d...</b>)</p>
                <div className="flex gap-2">
                  <input type="text" name="gdrive_root_folder_id" value={formData.gdrive_root_folder_id} onChange={handleChange} className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-500" placeholder="Contoh: 1vXgKj-Hk..." />
                  {formData.gdrive_root_folder_id && (
                    <a 
                      href={`https://drive.google.com/drive/folders/${formData.gdrive_root_folder_id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Lihat Folder
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          
          {/* Card: Auto Backup */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Database className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Database & Auto-Backup</h3>
                  <p className="text-[10px] text-slate-500">Mencadangkan seluruh data sistem (Akun, Kelas, Tugas, dll).</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/api/admin/settings/backup"
                  className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-2xs"
                  title="Unduh seluruh data database dan berkas unggahan langsung ke laptop/komputer Anda (Format ZIP)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh ZIP Langsung</span>
                </a>
                <button 
                  type="button"
                  onClick={handleBackupNow}
                  disabled={isBackingUp || driveStatus.status !== 'CONNECTED'}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                  title="Cadangkan seluruh data dan kirim ke Google Drive"
                >
                  {isBackingUp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                  <span>Backup ke Drive</span>
                </button>
              </div>
            </div>
            
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Jadwal Auto-Backup</label>
              <select 
                name="auto_backup_schedule" 
                value={formData.auto_backup_schedule} 
                onChange={handleChange} 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
              >
                <option value="manual">Manual (Hanya lewat tombol)</option>
                <option value="hourly">Setiap Jam (Hourly)</option>
                <option value="daily">Setiap Hari (Daily - Midnight)</option>
                <option value="weekly">Setiap Minggu (Weekly - Sunday)</option>
              </select>
              <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                Mencakup 100% data: <strong>14 Tabel Database</strong> (Akun Guru/Siswa/Admin, Kelas, Modul, Item Modul, Kuis, Soal, Opsi Jawaban, Nilai & Percobaan Kuis, Tugas Siswa, Absensi, Log Akses, Hubungan Guru-Kelas, Pengaturan) + <strong>Seluruh Berkas Unggahan</strong> (Foto tugas siswa & lembar coretan guru).
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 mt-6">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-3">Daftar Backup Tersedia di Drive</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {backups.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl">Belum ada file backup.</div>
                ) : (
                  backups.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <FileArchive className="w-5 h-5 text-emerald-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate max-w-xs">{b.name}</p>
                          <p className="text-[10px] text-slate-500">{new Date(b.createdAt).toLocaleString('id-ID')} • {(Number(b.sizeBytes) / (1024*1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`/api/admin/settings/backup/download?fileId=${b.id}`}
                          download
                          className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-blue-600 text-[10px] font-bold rounded-lg flex items-center gap-1 transition-colors"
                          title="Unduh file ZIP ini dari Google Drive ke komputer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Unduh</span>
                        </a>
                        <button 
                          type="button"
                          onClick={() => handleRestore(b.id)}
                          disabled={restoringId === b.id}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          {restoringId === b.id ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> Memproses...</>
                          ) : (
                            <><RefreshCw className="w-3 h-3 text-amber-600" /> Restore</>
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          {/* Card: AI Grading Agent */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <Bot className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-bold text-slate-800">Agent AI Korektor Kuis Isian</h3>
                  {formData.gemini_api_key && formData.gemini_api_key.trim().length > 0 ? (
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold rounded-full flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Status: Aktif Berjalan
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold rounded-full flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                      Status: Tidak Aktif
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Sistem prompt (instruksi) yang digunakan Gemini untuk menilai jawaban essay/isian singkat siswa.</p>
              </div>
            </div>
            
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-2">Sistem Prompt Utama</label>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Gemini API Key</label>
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Dapatkan Key di Google AI Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input 
                  type="password"
                  name="gemini_api_key"
                  value={formData.gemini_api_key || ''}
                  onChange={handleChange}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-500 mt-1.5">Kunci rahasia dari Google AI Studio untuk mengaktifkan fitur koreksi otomatis.</p>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gemini Model Name (Opsional)</label>
                <input 
                  type="text"
                  list="gemini-models"
                  name="gemini_model_name"
                  value={formData.gemini_model_name || ''}
                  onChange={handleChange}
                  placeholder="Contoh: gemini-3.6-flash (Kosongkan untuk auto-detect)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
                />
                <datalist id="gemini-models">
                  <option value="gemini-3.6-flash">gemini-3.6-flash (Rekomendasi Google)</option>
                  <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro (Akurasi Tinggi)</option>
                  <option value="gemini-pro">gemini-pro (Universal)</option>
                </datalist>
                <p className="text-[10px] text-slate-500 mt-1.5">Pilih dari daftar atau ketik manual model terbaru dari Google jika opsi di atas sudah usang.</p>
              </div>

              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4">Sistem Prompt (Koreksi Otomatis AI)</label>
              <textarea 
                rows={4}
                name="ai_grading_prompt" 
                value={formData.ai_grading_prompt} 
                onChange={handleChange} 
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-indigo-500" 
                placeholder="Anda adalah guru bahasa Jepang. Tugas Anda adalah mengoreksi..." 
              />
              <p className="text-[9px] text-slate-400 mt-2">
                <strong>Catatan:</strong> Gunakan variabel <code>{"{{reference}}"}</code> untuk Kunci Jawaban Referensi dan <code>{"{{studentText}}"}</code> untuk Jawaban Siswa. AI HANYA boleh menjawab <code>TRUE</code> atau <code>FALSE</code>.
              </p>
            </div>
          </div>

          {/* Card: Sudarmono API */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Database className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">API Sudarmono</h3>
                <p className="text-[10px] text-slate-500">Integrasi ke sistem internal atau key khusus.</p>
              </div>
            </div>
            
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Sudarmono API Key</label>
              <input type="password" name="api_sudarmono" value={formData.api_sudarmono} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-amber-500" placeholder="sk-sudarmono-..." />
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={isSaving} className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

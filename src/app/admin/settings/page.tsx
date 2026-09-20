'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Loader2, CheckCircle2, AlertCircle, Cloud, Database, ExternalLink, FileArchive, Download } from 'lucide-react';

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    gdrive_client_id: '',
    gdrive_client_secret: '',
    gdrive_refresh_token: '',
    gdrive_root_folder_id: '',
    auto_backup_schedule: 'manual',
    api_sudarmono: ''
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [driveStatus, setDriveStatus] = useState<{ status: 'LOADING' | 'NOT_CONFIGURED' | 'CONNECTED' | 'ERROR', message?: string, quota?: any }>({ status: 'LOADING' });
  const [isBackingUp, setIsBackingUp] = useState(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
            Konfigurasi kredensial pihak ketiga (Google Drive Backup) dan integrasi layanan lainnya.
          </p>
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
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Google Client ID</label>
                <input type="text" name="gdrive_client_id" value={formData.gdrive_client_id} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-500" placeholder="1234567890-xxx.apps.googleusercontent.com" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Google Client Secret</label>
                <input type="password" name="gdrive_client_secret" value={formData.gdrive_client_secret} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none focus:border-blue-500" placeholder="GOCSPX-xxx" />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase mb-1">Refresh Token (Offline Access)</label>
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
              <button 
                type="button"
                onClick={handleBackupNow}
                disabled={isBackingUp || driveStatus.status !== 'CONNECTED'}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
              >
                {isBackingUp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                <span>Backup Sekarang</span>
              </button>
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
              <p className="text-[9px] text-slate-400 mt-1.5">File backup akan disimpan dalam format ZIP (berisi Data JSON + Folder Uploads Siswa) ke dalam folder "Backup" di Drive Bersama Anda.</p>
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
                        <FileArchive className="w-5 h-5 text-emerald-500" />
                        <div>
                          <p className="text-xs font-bold text-slate-700">{b.name}</p>
                          <p className="text-[10px] text-slate-500">{new Date(b.createdAt).toLocaleString('id-ID')} • {(Number(b.sizeBytes) / (1024*1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleRestore(b.id)}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Restore
                      </button>
                    </div>
                  ))
                )}
              </div>
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

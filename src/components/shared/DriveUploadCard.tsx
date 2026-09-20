'use client';

import React, { useState, useRef } from 'react';
import { 
  FolderGit2, 
  UploadCloud, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileCheck,
  MessageSquare,
  FileImage,
  Clock
} from 'lucide-react';

interface LocalUploadCardProps {
  moduleItemId: string;
  folderUrl: string; // We still receive this for legacy or informational, but we won't strictly rely on it.
  instruction: string;
  dueDate?: Date | null;
  existingSubmission?: {
    driveFileUrl: string;
    notes?: string | null;
    grade?: number | null;
    feedback?: string | null;
    submittedAt: Date;
  } | null;
}

export default function DriveUploadCard({
  dueDate,
  moduleItemId,
  instruction,
  existingSubmission,
}: LocalUploadCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState(existingSubmission?.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isGraded = existingSubmission?.grade !== null && existingSubmission?.grade !== undefined;
  const isPastDeadline = dueDate ? new Date() > new Date(dueDate) : false;
  const isLocked = isGraded || isPastDeadline;

  const getDeadlineText = () => {
    if (!dueDate) return null;
    const now = new Date();
    const deadline = new Date(dueDate);
    const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 0) {
      return `Ditutup pada ${deadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} ${deadline.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    if (diffHours < 24) {
      return `Sisa waktu: ${Math.floor(diffHours)} jam ${Math.floor((diffHours % 1) * 60)} menit lagi`;
    }
    
    return `Tenggat: ${deadline.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} ${deadline.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    if (!file && !existingSubmission) {
      setStatusMessage({
        type: 'error',
        text: 'Harap pilih foto atau berkas yang akan diunggah.',
      });
      setIsLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('moduleItemId', moduleItemId);
      if (notes) formData.append('notes', notes);
      if (file) formData.append('file', file);

      // If we don't have a new file but we have an existing submission, and we just want to update notes, we could handle it.
      // But for simplicity, we require a file if they want to submit. Or they can re-upload.

      const res = await fetch('/api/assignments/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal menyimpan tugas.');
      }

      setStatusMessage({
        type: 'success',
        text: 'Berkas tugas berhasil diunggah ke server lokal!',
      });
      // Optionally reset file input
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Terjadi kesalahan sistem saat mengirim data.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getFileNameFromUrl = (url: string) => {
    try {
      const parts = url.split('/');
      return parts[parts.length - 1];
    } catch {
      return 'File Tersimpan';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h4 className="text-base font-bold text-white flex items-center gap-2">
          <FolderGit2 className="w-5 h-5 text-blue-500" />
          Penyerahan Tugas Praktik
        </h4>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          {instruction}
        </p>
      </div>

      {/* Feedback & Nilai dari Guru Jika Sudah Dinilai */}
      {existingSubmission?.grade !== null && existingSubmission?.grade !== undefined && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4" />
              Tugas Telah Dinilai oleh Sensei
            </span>
            <span className="text-sm font-extrabold text-emerald-300 font-mono px-2.5 py-0.5 rounded-lg bg-emerald-900/60 border border-emerald-700">
              Nilai: {existingSubmission.grade} / 100
            </span>
          </div>
          {existingSubmission.feedback && (
            <div className="text-xs text-slate-300 pt-1 flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <p className="italic">"{existingSubmission.feedback}"</p>
            </div>
          )}
        </div>
      )}

      {existingSubmission && !file && (
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileImage className="w-6 h-6 text-emerald-500" />
            <div>
              <p className="text-xs font-bold text-emerald-400">Berkas Sudah Terkirim</p>
              <a href={existingSubmission.driveFileUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-400 hover:underline">
                Lihat File ({getFileNameFromUrl(existingSubmission.driveFileUrl)})
              </a>
            </div>
          </div>
        </div>
      )}

      
      {/* Deadline Notice */}
      {dueDate && !isGraded && (
        <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${isPastDeadline ? 'bg-red-950/40 border-red-800/60 text-red-400' : 'bg-amber-950/40 border-amber-800/60 text-amber-400'}`}>
          <Clock className="w-4 h-4" />
          <span>{getDeadlineText()}</span>
        </div>
      )}

      {/* Jika terkunci, hilangkan form upload sepenuhnya */}
      {isLocked ? (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 text-center space-y-2">
          <div className="mx-auto w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-slate-500" />
          </div>
          <p className="text-sm font-bold text-slate-300">Penyerahan Dikunci</p>
          <p className="text-xs text-slate-500">
            {isGraded ? 'Tugas ini sudah dinilai dan tidak dapat diubah lagi.' : 'Batas waktu pengumpulan telah berakhir.'}
          </p>
        </div>
      ) : (
      <>
      {/* Form Upload Lokal */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            {existingSubmission ? 'Timpa / Unggah Ulang Berkas Baru' : 'Unggah Foto Tugas (Lokal)'}
          </label>
          <div 
            className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 rounded-xl bg-slate-950 hover:border-blue-500/50 hover:bg-slate-900/50 transition cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="w-8 h-8 text-slate-500 mb-2" />
            <p className="text-xs text-slate-300 font-semibold text-center mb-1">
              {file ? file.name : 'Klik untuk memilih berkas gambar (JPG/PNG)'}
            </p>
            <p className="text-[10px] text-slate-500">Maks. 5MB, file tersimpan langsung di server lokal.</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              required={!existingSubmission}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            Catatan Tambahan untuk Sensei (Opsional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Sensei, saya lampirkan foto tugas tulisan tangan..."
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition"
          />
        </div>

        {statusMessage && (
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200'
                : 'bg-red-950/60 border-red-800 text-red-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Mengunggah Berkas...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>{existingSubmission ? 'Kirim Ulang Berkas' : 'Kirim Berkas Tugas'}</span>
            </>
          )}
        </button>
      </form>
      </>
      )}
    </div>
  );
}

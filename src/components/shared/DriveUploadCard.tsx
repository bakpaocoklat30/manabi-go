
'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, FileImage, FolderGit2, FileCheck, MessageSquare, Clock, Send, Camera, X, Sparkles, ExternalLink } from 'lucide-react';

interface DriveUploadCardProps {
  moduleItemId: string;
  folderUrl: string;
  instruction: string;
  existingSubmission: any;
  dueDate?: string;
  maxFiles?: number;
  studentName?: string;
}

export default function DriveUploadCard({
  moduleItemId,
  folderUrl,
  instruction,
  existingSubmission,
  dueDate,
  maxFiles = 1,
  studentName = 'Siswa'
}: DriveUploadCardProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState(existingSubmission?.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isGraded = existingSubmission?.grade !== null && existingSubmission?.grade !== undefined;
  const isPastDeadline = dueDate ? new Date() > new Date(dueDate) : false;
  const isLocked = isGraded || (isPastDeadline && !existingSubmission);

  const getDeadlineText = () => {
    if (!dueDate) return '';
    const d = new Date(dueDate);
    return `Batas Pengumpulan: ${d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`;
  };

  const processWatermark = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Calculate watermark size relative to image dimensions
        const fontSize = Math.max(20, Math.floor(img.width * 0.03));
        const padding = fontSize;
        
        const dateStr = new Date().toLocaleString('id-ID');
        const line1 = 'MANABI GO - OTENTIKASI TUGAS';
        const line2 = `Oleh: ${studentName}`;
        const line3 = `Waktu: ${dateStr}`;

        ctx.font = `bold ${fontSize}px monospace`;
        
        // Measure text for background box
        const m1 = ctx.measureText(line1).width;
        const m2 = ctx.measureText(line2).width;
        const m3 = ctx.measureText(line3).width;
        const maxWidth = Math.max(m1, m2, m3);
        const boxWidth = maxWidth + (padding * 2);
        const boxHeight = (fontSize * 3) + (padding * 2.5);

        const startX = img.width - boxWidth - padding;
        const startY = img.height - boxHeight - padding;

        // Draw semi-transparent dark background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(startX, startY, boxWidth, boxHeight);

        // Draw text
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(line1, startX + padding, startY + padding);
        
        ctx.fillStyle = '#10B981'; // Emerald 500
        ctx.fillText(line2, startX + padding, startY + padding + fontSize * 1.2);
        
        ctx.fillStyle = '#60A5FA'; // Blue 400
        ctx.fillText(line3, startX + padding, startY + padding + fontSize * 2.4);

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(objectUrl);
          if (blob) {
            // Convert blob back to file
            const newFile = new File([blob], `watermarked_${file.name}`, { type: file.type });
            resolve(newFile);
          } else {
            resolve(file); // fallback
          }
        }, file.type, 0.9);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file); // fallback if it's not an image (e.g. PDF)
      };

      img.src = objectUrl;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setStatusMessage(null);
    
    setIsLoading(true);
    try {
      const newFiles = Array.from(e.target.files);
      const watermarkedFiles = await Promise.all(newFiles.map(f => processWatermark(f)));
      
      setFiles(prev => {
        const combined = [...prev, ...watermarkedFiles];
        return combined.slice(0, maxFiles); // Enforce max limit
      });
    } catch (err) {
      console.error(err);
      setStatusMessage({ type: 'error', text: 'Gagal memproses gambar kamera.' });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingSubmission && files.length === 0) {
      setStatusMessage({ type: 'error', text: 'Silakan ambil foto minimal 1 file terlebih dahulu.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const formData = new FormData();
      formData.append('moduleItemId', moduleItemId);
      if (notes) formData.append('notes', notes);
      
      files.forEach(f => {
        formData.append('files', f);
      });

      const res = await fetch('/api/assignments/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menyimpan tugas.');

      setStatusMessage({ type: 'success', text: 'Berkas tugas berhasil diunggah dengan otentikasi!' });
      setFiles([]);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Terjadi kesalahan sistem saat mengirim data.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Get array of existing URLs
  let existingUrls: string[] = [];
  if (existingSubmission) {
    if (existingSubmission.fileUrls) {
      existingUrls = typeof existingSubmission.fileUrls === 'string' ? JSON.parse(existingSubmission.fileUrls) : existingSubmission.fileUrls;
    } else if (existingSubmission.driveFileUrl) {
      existingUrls = [existingSubmission.driveFileUrl];
    }
  }

  // Extract all annotated images from feedback if present
  const getAnnotatedUrls = (feedback: string | null | undefined): string[] => {
    if (!feedback || typeof feedback !== 'string') return [];
    const regex = /\/uploads\/annotated\/[^\s\)\"\']+/g;
    const matches = feedback.match(regex);
    if (!matches) return [];
    return Array.from(new Set(matches));
  };

  const getCleanFeedback = (feedback: string | null | undefined): string => {
    if (!feedback || typeof feedback !== 'string') return '';
    return feedback
      .replace(/!?\[.*?\]\(\/uploads\/annotated\/[^\)]+\)/g, '')
      .replace(/\/uploads\/annotated\/[^\s\)\"\']+/g, '')
      .trim();
  };

  const annotatedUrls = getAnnotatedUrls(existingSubmission?.feedback);
  const cleanFeedback = getCleanFeedback(existingSubmission?.feedback);
  const isEvaluated = (existingSubmission?.grade !== null && existingSubmission?.grade !== undefined) || annotatedUrls.length > 0 || cleanFeedback.length > 0;

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

      {isEvaluated && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4" />
              {existingSubmission?.grade !== null && existingSubmission?.grade !== undefined
                ? 'Tugas Telah Dinilai oleh Sensei'
                : 'Koreksi & Evaluasi dari Sensei'}
            </span>
            {existingSubmission?.grade !== null && existingSubmission?.grade !== undefined && (
              <span className="text-sm font-extrabold text-emerald-300 font-mono px-2.5 py-0.5 rounded-lg bg-emerald-900/60 border border-emerald-700">
                Nilai: {existingSubmission.grade} / 100
              </span>
            )}
          </div>
          <div className="space-y-3 pt-1">
            {cleanFeedback && (
              <div className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/60 p-3 rounded-xl border border-emerald-900/40">
                <MessageSquare className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="italic">"{cleanFeedback}"</p>
              </div>
            )}
            {annotatedUrls.length > 0 && (
              <div className="p-3.5 bg-slate-950/90 border border-emerald-700/50 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                    Lembar Koreksi dari Sensei ({annotatedUrls.length} file coretan):
                  </span>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    Klik foto untuk memperbesar di tab baru
                  </span>
                </div>
                <div className={`grid gap-3 ${annotatedUrls.length === 1 ? 'grid-cols-1 max-w-md' : 'grid-cols-1 sm:grid-cols-2'}`}>
                  {annotatedUrls.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative block rounded-xl overflow-hidden border border-slate-700 hover:border-emerald-500 bg-slate-900 transition-all shadow-md hover:shadow-emerald-950/50"
                      title={`Buka Lembar Koreksi #${idx + 1}`}
                    >
                      <div className="px-3 py-1.5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Koreksi #{idx + 1}
                        </span>
                        <span className="text-[10px] text-slate-400 group-hover:text-emerald-300 flex items-center gap-0.5 transition">
                          Perbesar <ExternalLink className="w-3 h-3" />
                        </span>
                      </div>
                      <div className="relative aspect-[4/3] flex items-center justify-center bg-slate-950 p-1.5">
                        <img 
                          src={url} 
                          alt={`Hasil Koreksi Sensei #${idx + 1}`} 
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition backdrop-blur-[1px]">
                          Klik untuk Memperbesar #{idx + 1}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {existingUrls.length > 0 && files.length === 0 && (
        <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
          <p className="text-xs font-bold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Berkas Sudah Terkirim ({existingUrls.length} file)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {existingUrls.map((url, idx) => (
              <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="relative group block rounded-lg overflow-hidden border border-slate-700 bg-slate-800 aspect-square">
                <img src={url} alt={`File ${idx+1}`} className="w-full h-full object-cover group-hover:opacity-75 transition" />
              </a>
            ))}
          </div>
        </div>
      )}

      {dueDate && !isGraded && (
        <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold ${isPastDeadline ? 'bg-red-950/40 border-red-800/60 text-red-400' : 'bg-amber-950/40 border-amber-800/60 text-amber-400'}`}>
          <Clock className="w-4 h-4" />
          <span>{getDeadlineText()}</span>
        </div>
      )}

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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
            <span>Ambil Foto Tugas ({files.length} / {maxFiles})</span>
          </label>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            {files.map((f, idx) => (
              <div key={idx} className="relative rounded-lg overflow-hidden border border-emerald-500/50 aspect-square bg-slate-800">
                <img src={URL.createObjectURL(f)} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeFile(idx)} className="absolute top-1 right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition">
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            ))}
            
            {files.length < maxFiles && (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative rounded-lg overflow-hidden border-2 border-dashed border-slate-700 hover:border-blue-500 hover:bg-slate-800/50 transition cursor-pointer aspect-square flex flex-col items-center justify-center text-slate-500 hover:text-blue-400"
              >
                <Camera className="w-8 h-8 mb-2" />
                <span className="text-[10px] font-bold text-center px-2">Buka Kamera</span>
              </div>
            )}
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            capture="environment"
            multiple={false}
            onChange={handleFileChange}
          />
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Sistem akan secara otomatis menyisipkan watermark (Nama, Tanggal, Jam) pada setiap foto untuk menjaga otentikasi. Dilarang mengunggah file dari galeri.</p>
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
          <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${statusMessage.type === 'success' ? 'bg-emerald-950/60 border-emerald-800 text-emerald-200' : 'bg-red-950/60 border-red-800 text-red-200'}`}>
            {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || (files.length === 0 && !existingSubmission)}
          className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-60"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /><span>Memproses Berkas...</span></>
          ) : (
            <><Send className="w-4 h-4" /><span>{existingSubmission ? (files.length > 0 ? 'Timpa dengan File Baru' : 'Perbarui Catatan') : 'Kirim Foto Otentik'}</span></>
          )}
        </button>
      </form>
      )}
    </div>
  );
}

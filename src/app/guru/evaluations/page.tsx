'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, 
  ExternalLink, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2, 
  Send, 
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface SubmissionItem {
  id: string;
  driveFileUrl: string;
  notes: string | null;
  grade: number | null;
  feedback: string | null;
  submittedAt: string;
  student: {
    name: string;
    identifier: string;
    kelas: {
      name: string;
    } | null;
  };
  moduleItem: {
    title: string;
    module: {
      title: string;
    };
  };
}

export default function GuruEvaluationsPage() {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'GRADED'>('ALL');
  const [filterKelas, setFilterKelas] = useState('ALL');
  const [filterTugas, setFilterTugas] = useState('ALL');

  // State untuk form modal/inline grading
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [inputGrade, setInputGrade] = useState<string>('');
  const [inputFeedback, setInputFeedback] = useState<string>('');
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    try {
      const res = await fetch('/api/evaluations/list');
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (e) {
      console.error('Gagal mengambil daftar tugas:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  
  const handleSyncDrive = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/guru/drive-sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert(data.message);
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Gagal sinkronisasi');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveGrade = async (submissionId: string) => {
    if (!inputGrade) return;
    setIsSubmittingGrade(true);
    try {
      const res = await fetch('/api/evaluations/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          grade: inputGrade,
          feedback: inputFeedback,
        }),
      });

      if (res.ok) {
        setToastMessage('Penilaian berhasil disimpan!');
        setGradingId(null);
        setInputGrade('');
        setInputFeedback('');
        await fetchSubmissions();
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (e) {
      console.error('Gagal menyimpan nilai:', e);
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  const uniqueKelas = Array.from(new Set(submissions.map(s => s.student.kelas?.name).filter(Boolean))).sort();
  const uniqueTugas = Array.from(new Set(submissions.map(s => s.moduleItem.title))).sort();


  const getPreviewUrl = (url: string) => {
    if (!url) return '';
    return url.replace('/view', '/preview').replace('?usp=drivesdk', '');
  };

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.student.identifier.includes(searchTerm) ||
      sub.moduleItem.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesKelas = filterKelas === 'ALL' || sub.student.kelas?.name === filterKelas;
    const matchesTugas = filterTugas === 'ALL' || sub.moduleItem.title === filterTugas;
    const matchesStatus = filterStatus === 'ALL' 
      ? true 
      : filterStatus === 'PENDING' 
        ? sub.grade === null 
        : sub.grade !== null;

    return matchesSearch && matchesKelas && matchesTugas && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-blue-500" />
            Evaluasi Tulisan Tangan (Kakikata / Kaitou)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Periksa hasil foto tulisan siswa di Google Drive dan berikan penilaian langsung.
          </p>
        </div>

        {/* Toast Notifikasi */}
        {toastMessage && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Filter & Pencarian */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">Semua Kelas</option>
            {uniqueKelas.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <select
            value={filterTugas}
            onChange={(e) => setFilterTugas(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-blue-500 truncate"
          >
            <option value="ALL">Semua Tugas</option>
            {uniqueTugas.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Cari nama siswa, NISN, atau judul tugas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
              filterStatus === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterStatus('PENDING')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
              filterStatus === 'PENDING'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Belum Dinilai
          </button>
          <button
            onClick={() => setFilterStatus('GRADED')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
              filterStatus === 'GRADED'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Sudah Dinilai
          </button>
        </div>
      </div>
      </div>

      {isLoading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs text-slate-400 font-mono">Mengambil data penyerahan tugas...</p>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
          <p className="text-xs text-slate-400">Tidak ada data tugas yang sesuai dengan pencarian.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((sub) => {
            const isEditingThis = gradingId === sub.id;

            return (
              <div
                key={sub.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">{sub.student.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        NISN: {sub.student.identifier}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs">
                      <span className="text-blue-400 font-semibold">{sub.moduleItem.module.title}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400">{sub.moduleItem.title}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(sub.submittedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {sub.grade !== null ? (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Nilai: {sub.grade}
                      </div>
                    ) : (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Menunggu Penilaian
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const isPreviewing = previewId === sub.id;
                        setPreviewId(isPreviewing ? null : sub.id);
                        if (!isPreviewing) {
                          setGradingId(sub.id);
                          setInputGrade(sub.grade !== null ? String(sub.grade) : '');
                          setInputFeedback(sub.feedback || '');
                        } else {
                          setGradingId(null);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-md shadow-blue-600/20"
                    >
                      <span>{previewId === sub.id ? 'Tutup Preview' : 'Buka Preview & Nilai'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                    
                    <a
                      href={sub.driveFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                      title="Buka di tab baru (Google Drive)"
                    >
                      <span>Tab Baru</span>
                    </a>
                  </div>
                </div>

                {/* Catatan Siswa jika ada */}
                {sub.notes && (
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300">
                    <span className="text-slate-500 block font-semibold mb-0.5">Catatan Siswa:</span>
                    {sub.notes}
                  </div>
                )}

                {previewId === sub.id && (
                  <div className="pt-4 border-t border-slate-800 space-y-4 bg-slate-950/50 -mx-5 -mb-5 p-5 rounded-b-2xl">
                    <div className="flex flex-col lg:flex-row gap-4">
                      
                      {/* Left: iframe preview */}
                      <div className="flex-1 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 h-[60vh] min-h-[400px]">
                        <iframe 
                          src={getPreviewUrl(sub.driveFileUrl)} 
                          className="w-full h-full"
                          allow="autoplay"
                        />
                      </div>

                      {/* Right: Grading Form */}
                      <div className="lg:w-80 space-y-4 flex flex-col bg-slate-900 p-4 rounded-xl border border-slate-800">
                        <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Penilaian</h4>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Nilai (0-100)</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={inputGrade}
                            onChange={(e) => setInputGrade(e.target.value)}
                            className="w-full px-3 py-2.5 text-xl font-bold bg-slate-950 border border-slate-700 rounded-lg text-emerald-400 focus:outline-none focus:border-blue-500 text-center"
                            placeholder="0-100"
                          />
                        </div>
                        <div className="flex-1 flex flex-col">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Komentar / Feedback</label>
                          <textarea
                            value={inputFeedback}
                            onChange={(e) => setInputFeedback(e.target.value)}
                            className="flex-1 w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-300 text-sm focus:outline-none focus:border-blue-500 resize-none min-h-[120px]"
                            placeholder="Tulis catatan evaluasi untuk siswa di sini..."
                          />
                        </div>
                        <button
                          onClick={() => handleSaveGrade(sub.id)}
                          disabled={isSubmittingGrade}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-md transition mt-auto"
                        >
                          {isSubmittingGrade ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Kirim Nilai
                        </button>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Loader2, 
  CheckCircle2, 
  Bot, 
  Save, 
  AlertCircle, 
  RefreshCw, 
  CheckSquare, 
  Square, 
  Sparkles, 
  Calculator, 
  ArrowRight,
  BookOpen,
  Award,
  Search,
  Users,
  GraduationCap,
  Filter,
  Check,
  CheckCheck
} from 'lucide-react';

interface EvaluationItem {
  questionId: string;
  questionText: string;
  studentText: string;
  reference: string;
  aiFeedback: string;
  suggestedScore?: number | null;
}

export default function KoreksiKuisPage() {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAttempt, setActiveAttempt] = useState<any | null>(null);
  
  // Filter & Search Antrean Siswa
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'GRADED'>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');

  // Checklist nomor soal yang dipilih untuk dibantu AI
  const [selectedQuestions, setSelectedQuestions] = useState<Record<string, boolean>>({});
  
  // Poin/skor tiap butir soal (0 - 100)
  const [questionScores, setQuestionScores] = useState<Record<string, number>>({});
  
  // Evaluasi dari AI (dipetakan per questionId)
  const [evaluations, setEvaluations] = useState<Record<string, EvaluationItem>>({});
  
  // Loading states
  const [isAskingBatchAI, setIsAskingBatchAI] = useState(false);
  const [singleAiLoadingId, setSingleAiLoadingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  
  // Nilai akhir (bisa otomatis atau di-override guru)
  const [manualFinalScore, setManualFinalScore] = useState<number | null>(null);

  const fetchAttempts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/guru/koreksi-kuis');
      const data = await res.json();
      if (res.ok) {
        setAttempts(data.attempts || []);
      }
    } catch (e) {
      console.error('Gagal mengambil daftar kuis siswa:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, []);

  // Saat guru memilih attempt siswa dari antrean
  const handleSelectAttempt = (att: any) => {
    setActiveAttempt(att);
    setEvaluations({});
    setManualFinalScore(null);
    setSingleAiLoadingId(null);
    setIsAskingBatchAI(false);
    setAiSuccessMessage(null);

    const questions = att.quiz?.questions || [];
    const isQuizEssay = att.quiz?.quizType === 'ESSAY';
    const essayQs = questions.filter((q: any) => q.type === 'ESSAY' || isQuizEssay);
    
    // Default: Semua soal esai dicentang aktif untuk dibantu AI
    const initSelected: Record<string, boolean> = {};
    const initScores: Record<string, number> = {};

    essayQs.forEach((q: any) => {
      initSelected[q.id] = true;
      initScores[q.id] = 0;
    });

    // Jika attempt sudah memiliki riwayat skor sebelumnya di answers
    if (att.answers && Array.isArray(att.answers)) {
      att.answers.forEach((ans: any) => {
        if (typeof ans.score === 'number') {
          initScores[ans.questionId] = ans.score;
        }
        if (ans.aiFeedback) {
          evaluations[ans.questionId] = {
            questionId: ans.questionId,
            questionText: '',
            studentText: ans.answerText || '',
            reference: '',
            aiFeedback: ans.aiFeedback,
            suggestedScore: ans.score
          };
        }
      });
    }

    setSelectedQuestions(initSelected);
    setQuestionScores(initScores);

    // Jika attempt sudah pernah dinilai (GRADED), pasang nilai finalnya
    if (att.status === 'GRADED' && typeof att.score === 'number') {
      setManualFinalScore(att.score);
    }
  };

  // Daftar pertanyaan esai pada attempt yang sedang aktif
  const essayQuestions = useMemo(() => {
    if (!activeAttempt?.quiz?.questions) return [];
    const isQuizEssay = activeAttempt.quiz.quizType === 'ESSAY';
    return activeAttempt.quiz.questions.filter((q: any) => q.type === 'ESSAY' || isQuizEssay);
  }, [activeAttempt]);

  // Daftar kelas unik dari seluruh attempt siswa untuk dropdown filter
  const uniqueClasses = useMemo(() => {
    const set = new Set<string>();
    attempts.forEach(att => {
      const cls = att.student?.kelas?.name;
      if (cls) set.add(cls);
    });
    return Array.from(set).sort();
  }, [attempts]);

  // Filter antrean siswa berdasarkan pencarian, status, dan kelas
  const filteredAttempts = useMemo(() => {
    return attempts.filter(att => {
      const studentName = att.student?.name?.toLowerCase() || '';
      const identifier = att.student?.identifier?.toLowerCase() || '';
      const quizTitle = att.quiz?.title?.toLowerCase() || '';
      const className = att.student?.kelas?.name?.toLowerCase() || '';
      const q = searchQuery.toLowerCase().trim();

      const matchSearch = !q || studentName.includes(q) || identifier.includes(q) || quizTitle.includes(q) || className.includes(q);
      const matchStatus = statusFilter === 'ALL' || (statusFilter === 'PENDING' && att.status === 'PENDING_GRADING') || (statusFilter === 'GRADED' && att.status === 'GRADED');
      const matchClass = selectedClass === 'ALL' || att.student?.kelas?.name === selectedClass;

      return matchSearch && matchStatus && matchClass;
    });
  }, [attempts, searchQuery, statusFilter, selectedClass]);

  // Hitungan jumlah pending & graded untuk badge filter
  const pendingCount = useMemo(() => attempts.filter(a => a.status === 'PENDING_GRADING').length, [attempts]);
  const gradedCount = useMemo(() => attempts.filter(a => a.status === 'GRADED').length, [attempts]);

  // Hitungan Poin Otomatis
  const { totalPoints, maxTotalPoints, autoAverageScore } = useMemo(() => {
    const totalQ = essayQuestions.length || 1;
    let sum = 0;
    essayQuestions.forEach((q: any) => {
      sum += Number(questionScores[q.id]) || 0;
    });
    const avg = Math.round(sum / totalQ);
    return {
      totalPoints: sum,
      maxTotalPoints: totalQ * 100,
      autoAverageScore: avg,
    };
  }, [essayQuestions, questionScores]);

  // Nilai akhir yang dipakai (manual jika guru sengaja mengubahnya, atau otomatis dari rata-rata poin)
  const effectiveFinalScore = manualFinalScore !== null ? manualFinalScore : autoAverageScore;

  // Toggle checklist nomor soal tertentu
  const handleToggleQuestionSelect = (qId: string) => {
    setSelectedQuestions(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  // Pilih Semua / Batalkan Semua Nomor Soal
  const handleSelectAllQuestions = (selectAll: boolean) => {
    const updated: Record<string, boolean> = {};
    essayQuestions.forEach((q: any) => {
      updated[q.id] = selectAll;
    });
    setSelectedQuestions(updated);
  };

  // Hitung berapa nomor soal yang sedang dicentang untuk AI
  const selectedCount = essayQuestions.filter((q: any) => selectedQuestions[q.id]).length;

  // Handler ubah poin butir soal manual
  const handleSetQuestionScore = (qId: string, score: number) => {
    const clamped = Math.max(0, Math.min(100, score));
    setQuestionScores(prev => ({
      ...prev,
      [qId]: clamped
    }));
  };

  // Scroll ke kartu soal tertentu
  const scrollToQuestion = (qId: string) => {
    const el = document.getElementById(`question-card-${qId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Handler minta bantuan AI (Bisa per-nomor soal atau batch nomor soal yang dipilih)
  const handleAskAI = async (specificQuestionId?: string) => {
    if (!activeAttempt) return;
    setAiSuccessMessage(null);

    let targetIds: string[] = [];
    if (specificQuestionId) {
      targetIds = [specificQuestionId];
      setSingleAiLoadingId(specificQuestionId);
    } else {
      targetIds = essayQuestions.filter((q: any) => selectedQuestions[q.id]).map((q: any) => q.id);
      if (targetIds.length === 0) {
        alert('Silakan pilih minimal 1 nomor soal yang ingin dianalisis oleh AI.');
        return;
      }
      setIsAskingBatchAI(true);
    }

    try {
      const res = await fetch(`/api/guru/koreksi-kuis/${activeAttempt.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'ASK_AI',
          questionIds: targetIds
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal memproses evaluasi AI.');
      }

      if (Array.isArray(data.evaluations) && data.evaluations.length > 0) {
        // 1. Simpan ulasan evaluasi dari AI
        setEvaluations(prev => {
          const next = { ...prev };
          data.evaluations.forEach((item: EvaluationItem) => {
            next[item.questionId] = item;
          });
          return next;
        });

        // 2. PASTI LANGSUNG ISI SKOR PER-SOAL SECARA OTOMATIS!
        setQuestionScores(prev => {
          const nextScores = { ...prev };
          data.evaluations.forEach((item: EvaluationItem) => {
            if (typeof item.suggestedScore === 'number' && !isNaN(item.suggestedScore)) {
              nextScores[item.questionId] = item.suggestedScore;
            }
          });
          return nextScores;
        });

        // 3. Reset override nilai manual agar nilai akhir langsung menghitung rata-rata skor AI
        setManualFinalScore(null);

        const countUpdated = data.evaluations.length;
        setAiSuccessMessage(`✨ Berhasil! Analisis AI selesai dan skor ${countUpdated} soal telah terisi otomatis.`);
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi gangguan saat memanggil layanan Google Gemini AI.');
    } finally {
      setIsAskingBatchAI(false);
      setSingleAiLoadingId(null);
    }
  };

  // Simpan nilai final
  const handleSaveGrade = async () => {
    if (!activeAttempt) return;
    setIsSaving(true);

    try {
      const existingAnswers: any[] = activeAttempt.answers || [];
      const updatedAnswers = existingAnswers.map((ans: any) => ({
        ...ans,
        score: questionScores[ans.questionId] ?? 0,
        aiFeedback: evaluations[ans.questionId]?.aiFeedback || null,
      }));

      // Tambahkan jawaban untuk soal esai yang mungkin belum ada di answers
      essayQuestions.forEach((q: any) => {
        const found = updatedAnswers.find((a: any) => a.questionId === q.id);
        if (!found) {
          updatedAnswers.push({
            questionId: q.id,
            score: questionScores[q.id] ?? 0,
            aiFeedback: evaluations[q.id]?.aiFeedback || null,
          });
        }
      });

      const totalCorrect = essayQuestions.filter((q: any) => (questionScores[q.id] || 0) >= 70).length;

      const res = await fetch(`/api/guru/koreksi-kuis/${activeAttempt.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'SAVE_GRADE', 
          score: effectiveFinalScore, 
          totalCorrect,
          answers: updatedAnswers
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal menyimpan penilaian.');
      }

      alert('✅ Nilai kuis berhasil disimpan dan status siswa telah diperbarui menjadi GRADED!');
      setActiveAttempt(null);
      setEvaluations({});
      fetchAttempts();
    } catch (e: any) {
      alert(e.message || 'Gagal menyimpan nilai.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center gap-1">
              <Bot className="w-3.5 h-3.5" />
              Asisten Guru Koreksi Kuis
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              Semua Siswa Terbuka
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Koreksi Kuis Esai</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pilih nomor soal yang ingin dianalisis oleh AI. Skor akan langsung otomatis terisi ke lembar penilaian siswa.
          </p>
        </div>
        <button 
          onClick={fetchAttempts} 
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          title="Segarkan data seluruh siswa"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Antrean Seluruh Siswa (4 kolom) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama siswa, NISN, atau kuis..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white text-slate-800"
              />
            </div>

            {/* Filter Tabs: Semua, Perlu Koreksi, Sudah Dinilai */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`flex-1 py-1 px-2 rounded-lg font-bold text-center transition ${
                  statusFilter === 'ALL' 
                    ? 'bg-white text-slate-800 shadow-2xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semua ({attempts.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                className={`flex-1 py-1 px-2 rounded-lg font-bold text-center transition ${
                  statusFilter === 'PENDING' 
                    ? 'bg-amber-500 text-white shadow-2xs' 
                    : 'text-amber-600 hover:text-amber-700'
                }`}
              >
                Perlu ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('GRADED')}
                className={`flex-1 py-1 px-2 rounded-lg font-bold text-center transition ${
                  statusFilter === 'GRADED' 
                    ? 'bg-emerald-600 text-white shadow-2xs' 
                    : 'text-emerald-600 hover:text-emerald-700'
                }`}
              >
                Dinilai ({gradedCount})
              </button>
            </div>

            {/* Dropdown Filter Kelas jika ada */}
            {uniqueClasses.length > 0 && (
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">Kelas:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="flex-1 py-1 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none"
                >
                  <option value="ALL">Semua Kelas ({attempts.length} Siswa)</option>
                  {uniqueClasses.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
              <p className="text-xs text-slate-400">Memuat daftar siswa...</p>
            </div>
          ) : filteredAttempts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800">Tidak Ada Siswa Ditemukan</h4>
              <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau filter status Anda.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
              {filteredAttempts.map(att => {
                const isSelected = activeAttempt?.id === att.id;
                const isPending = att.status === 'PENDING_GRADING';
                return (
                  <div 
                    key={att.id} 
                    onClick={() => handleSelectAttempt(att)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-blue-50/90 border-blue-500 shadow-sm ring-2 ring-blue-500/20' 
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 truncate">
                          {att.student?.name || 'Siswa'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-1.5">
                          {att.student?.kelas?.name && (
                            <span className="font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded text-[10px]">
                              {att.student.kelas.name}
                            </span>
                          )}
                          <span className="font-mono text-slate-400">@{att.student?.identifier || '-'}</span>
                        </div>
                        <div className="text-xs text-slate-700 font-medium truncate mt-1">
                          {att.quiz?.title || 'Kuis Evaluasi'}
                        </div>
                      </div>
                      
                      {isPending ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                          Perlu Koreksi
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap font-mono">
                          Nilai: {att.score ?? 0}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-[10px] text-slate-400 mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2">
                      <span>{new Date(att.completedAt || att.startedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      <span className="font-semibold text-blue-600 flex items-center gap-0.5">
                        Koreksi Sekarang <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Lembar Penilaian & Evaluasi AI (8 kolom) */}
        <div className="lg:col-span-8">
          {activeAttempt ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Header Editor Attempt Siswa */}
              <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                      Lembar Koreksi Siswa
                    </span>
                    {activeAttempt.student?.kelas?.name && (
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-md">
                        {activeAttempt.student.kelas.name}
                      </span>
                    )}
                  </div>
                  <h2 className="font-black text-xl text-slate-900 mt-1">{activeAttempt.student?.name}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kuis: <strong className="text-slate-700">{activeAttempt.quiz?.title}</strong> • KKM: <span className="font-mono font-bold text-slate-700">{activeAttempt.quiz?.passingScore || 75}</span> Poin
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                    activeAttempt.status === 'PENDING_GRADING'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {activeAttempt.status === 'PENDING_GRADING' ? 'Status: Menunggu Koreksi' : `Status: Selesai (${activeAttempt.score} Poin)`}
                  </span>
                </div>
              </div>

              {/* Toast Notifikasi Berhasil AI */}
              {aiSuccessMessage && (
                <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-between shadow-2xs">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {aiSuccessMessage}
                  </span>
                  <button 
                    onClick={() => setAiSuccessMessage(null)}
                    className="text-emerald-600 hover:text-emerald-900 text-xs px-2 py-0.5 rounded"
                  >
                    Tutup
                  </button>
                </div>
              )}

              {/* PANEL PILIHAN NOMOR SOAL UNTUK AI (REQUIREMENT UTAMA) */}
              <div className="p-5 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border-b border-indigo-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                      Pilih Nomor Soal yang Mau Dikoreksi oleh AI:
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {selectedCount} dari {essayQuestions.length} Soal Terpilih
                    </span>
                  </div>

                  {/* Tombol Pilih Semua / Batalkan */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => handleSelectAllQuestions(true)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-700 font-bold hover:bg-indigo-50 transition text-[11px] flex items-center gap-1 shadow-2xs"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Pilih Semua Nomor
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectAllQuestions(false)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 font-medium hover:bg-slate-100 transition text-[11px]"
                    >
                      Batalkan Pilihan
                    </button>
                  </div>
                </div>

                {/* Bilah Pilihan Nomor Soal Interaktif */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {essayQuestions.map((q: any, idx: number) => {
                    const isSelected = Boolean(selectedQuestions[q.id]);
                    const currentScore = questionScores[q.id];
                    const hasScore = typeof currentScore === 'number' && currentScore > 0;

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => handleToggleQuestionSelect(q.id)}
                        className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-500/25 ring-2 ring-indigo-500/20'
                            : 'bg-white border-slate-300 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/40'
                        }`}
                        title={`Klik untuk memilih atau membatalkan Soal #${idx + 1}`}
                      >
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                          isSelected 
                            ? 'bg-white text-indigo-600' 
                            : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700'
                        }`}>
                          {idx + 1}
                        </span>
                        <span>Nomor {idx + 1}</span>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        ) : (
                          <span className="w-3 h-3 rounded-full border border-slate-300 inline-block" />
                        )}

                        {hasScore && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ml-0.5 ${
                            isSelected 
                              ? 'bg-indigo-800 text-indigo-100' 
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {currentScore}p
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* Tombol Eksekusi Batch AI */}
                  <button
                    type="button"
                    onClick={() => handleAskAI()}
                    disabled={isAskingBatchAI || selectedCount === 0}
                    className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    {isAskingBatchAI ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menganalisis & Mengisi Skor {selectedCount} Soal...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Koreksi {selectedCount} Soal Terpilih dengan AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Daftar Butir Soal Esai */}
              <div className="p-6 space-y-6">
                {essayQuestions.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    Tidak ada butir pertanyaan bertipe esai pada kuis ini.
                  </div>
                ) : (
                  essayQuestions.map((q: any, idx: number) => {
                    const ans = (activeAttempt.answers || []).find((a: any) => a.questionId === q.id);
                    const evalData = evaluations[q.id];
                    const isSelectedForAi = Boolean(selectedQuestions[q.id]);
                    const currentScore = questionScores[q.id] ?? 0;
                    const isSingleLoading = singleAiLoadingId === q.id;

                    return (
                      <div 
                        id={`question-card-${q.id}`}
                        key={q.id} 
                        className={`rounded-2xl border transition-all ${
                          isSelectedForAi 
                            ? 'bg-white border-indigo-200 shadow-sm' 
                            : 'bg-slate-50/60 border-slate-200'
                        }`}
                      >
                        {/* Header Kartu Pertanyaan */}
                        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/80 rounded-t-2xl">
                          <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                              <input 
                                type="checkbox"
                                checked={isSelectedForAi}
                                onChange={() => handleToggleQuestionSelect(q.id)}
                                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                              />
                              <span className="text-xs font-black text-slate-800">
                                Soal #{idx + 1}
                              </span>
                            </label>
                            {isSelectedForAi && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                                <Sparkles className="w-3 h-3" />
                                Terpilih untuk AI
                              </span>
                            )}
                          </div>

                          {/* Tombol Minta Bantuan AI Khusus Soal Ini */}
                          <button
                            type="button"
                            onClick={() => handleAskAI(q.id)}
                            disabled={isSingleLoading || isAskingBatchAI}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-lg text-[11px] font-bold transition shadow-2xs"
                          >
                            {isSingleLoading ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Menganalisis & Mengisi Skor...</span>
                              </>
                            ) : (
                              <>
                                <Bot className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Tanya AI Khusus Soal #{idx + 1}</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Isi Pertanyaan & Jawaban Siswa */}
                        <div className="p-5 space-y-4">
                          {/* Pertanyaan */}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                              Pertanyaan #{idx + 1}:
                            </span>
                            {q.imageUrl && (
                              <img src={q.imageUrl} alt="soal" className="max-h-48 rounded-lg border border-slate-200 mb-2" />
                            )}
                            <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                              {q.questionText}
                            </p>
                          </div>

                          {/* Kunci Jawaban Referensi Guru */}
                          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950">
                            <span className="font-black text-emerald-800 block text-[10px] uppercase tracking-wider mb-0.5">
                              Kunci Jawaban Referensi Guru:
                            </span>
                            <span className="font-medium">{q.referenceAnswer || '(Belum disetel di kuis builder)'}</span>
                          </div>

                          {/* Jawaban Siswa */}
                          <div className="p-3 bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-900">
                            <span className="font-black text-slate-500 block text-[10px] uppercase tracking-wider mb-1">
                              Jawaban Siswa:
                            </span>
                            <p className="text-sm font-mono whitespace-pre-wrap bg-white p-3 rounded-lg border border-slate-200 text-slate-800 leading-relaxed">
                              {ans?.answerText?.trim() ? ans.answerText : <em className="text-slate-400 font-sans">Tidak dijawab oleh siswa</em>}
                            </p>
                          </div>

                          {/* Hasil Analisis AI & Skor Otomatis */}
                          {evalData && (
                            <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                                  <Bot className="w-4 h-4 text-indigo-600" /> Hasil Analisis Gemini AI
                                </span>
                                {typeof evalData.suggestedScore === 'number' && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                                    <Sparkles className="w-3 h-3 text-emerald-600" />
                                    Skor Terisi Otomatis: {evalData.suggestedScore} Poin
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-white/70 p-2.5 rounded-lg border border-indigo-100">
                                {evalData.aiFeedback}
                              </p>
                            </div>
                          )}

                          {/* Input Nilai/Poin per Pertanyaan */}
                          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-700">Poin Soal #{idx + 1}:</span>
                              <div className="flex items-center gap-1">
                                <input 
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={currentScore}
                                  onChange={(e) => handleSetQuestionScore(q.id, Number(e.target.value))}
                                  className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-black text-center text-indigo-900 focus:outline-none focus:border-indigo-500 focus:bg-white"
                                />
                                <span className="text-xs text-slate-400 font-medium">/ 100</span>
                              </div>
                              {evalData && (
                                <span className="text-[11px] text-emerald-600 font-semibold hidden sm:inline">
                                  ✓ Terisi otomatis dari AI
                                </span>
                              )}
                            </div>

                            {/* Preset Tombol Cepat Poin */}
                            <div className="flex items-center gap-1 text-[10px] font-bold">
                              <span className="text-slate-400 mr-1 hidden sm:inline">Preset:</span>
                              <button 
                                type="button" 
                                onClick={() => handleSetQuestionScore(q.id, 0)} 
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 transition"
                              >
                                0
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleSetQuestionScore(q.id, 50)} 
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-600 border border-slate-200 transition"
                              >
                                50
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleSetQuestionScore(q.id, 75)} 
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 transition"
                              >
                                75
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleSetQuestionScore(q.id, 100)} 
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 border border-slate-200 transition"
                              >
                                100
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Baris Total & Penghitungan Otomatis di Bawah */}
              <div className="p-6 bg-slate-900 text-white rounded-b-2xl border-t border-slate-800 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Kalkulasi Otomatis */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Total Poin & Rata-rata Nilai Akhir Siswa
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                      <div>
                        Total Poin Soal: <strong className="text-white font-mono">{totalPoints}</strong> / {maxTotalPoints}
                      </div>
                      <div>•</div>
                      <div>
                        Rata-rata: <strong className="text-indigo-400 font-mono text-base">{autoAverageScore}</strong> / 100
                      </div>
                      <div>•</div>
                      <div>
                        {effectiveFinalScore >= (activeAttempt.quiz?.passingScore || 75) ? (
                          <span className="text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded text-[10px]">
                            LULUS KKM (≥ {activeAttempt.quiz?.passingScore || 75})
                          </span>
                        ) : (
                          <span className="text-amber-400 font-bold bg-amber-950/80 border border-amber-800 px-2.5 py-0.5 rounded text-[10px]">
                            BELUM MEMENUHI KKM (&lt; {activeAttempt.quiz?.passingScore || 75})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Input Nilai Akhir & Tombol Simpan */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
                      <span className="text-xs font-bold text-slate-300 pl-1">Nilai Akhir:</span>
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        value={effectiveFinalScore}
                        onChange={(e) => setManualFinalScore(Number(e.target.value))}
                        className="w-20 px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-lg font-black font-mono text-center text-white focus:outline-none focus:border-indigo-500"
                      />
                      {manualFinalScore !== null && (
                        <button
                          type="button"
                          onClick={() => setManualFinalScore(null)}
                          className="px-2 py-1 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 underline"
                          title="Kembalikan ke rata-rata otomatis poin soal"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    <button 
                      onClick={handleSaveGrade}
                      disabled={isSaving}
                      className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all whitespace-nowrap cursor-pointer"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Simpan & Selesai</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[420px] shadow-sm">
              <AlertCircle className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-bold text-base text-slate-800">Pilih Siswa dari Antrean</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Silakan pilih salah satu siswa di sebelah kiri untuk melihat jawaban esai dan melakukan koreksi dengan bantuan AI.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

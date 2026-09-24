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
  Search, 
  Users, 
  Filter, 
  Check, 
  CheckCheck, 
  History, 
  Clock, 
  X,
  Play
} from 'lucide-react';

interface EvaluationItem {
  questionId: string;
  questionText: string;
  studentText: string;
  reference: string;
  aiFeedback: string;
  suggestedScore?: number | null;
}

interface StudentSubmissionGroup {
  key: string;
  studentId: string;
  quizId: string;
  student: any;
  quiz: any;
  latestAttempt: any;
  allAttempts: any[];
}

interface BatchProgressItem {
  key: string;
  attemptId: string;
  studentName: string;
  quizTitle: string;
  status: 'WAITING' | 'ANALYZING' | 'SAVING' | 'DONE' | 'ERROR';
  score?: number;
  errorMsg?: string;
}

export default function KoreksiKuisPage() {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Attempt aktif yang sedang dinilai di lembar sebelah kanan
  const [activeAttempt, setActiveAttempt] = useState<any | null>(null);
  const [activeGroup, setActiveGroup] = useState<StudentSubmissionGroup | null>(null);
  
  // Filter & Search Antrean Siswa
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'GRADED'>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');

  // Multi-select Siswa untuk Koreksi AI Sekaligus
  const [selectedGroupKeys, setSelectedGroupKeys] = useState<Record<string, boolean>>({});

  // Checklist nomor soal yang dipilih untuk dibantu AI (pada siswa yang aktif)
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

  // Modal Status Koreksi Massal
  const [batchProgress, setBatchProgress] = useState<BatchProgressItem[] | null>(null);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  
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

  // KELOMPOKKAN ATTEMPTS: 1 Rekaman per Siswa per Kuis (Mengambil yang paling akhir/terbaru)
  const groupedSubmissions = useMemo(() => {
    const map = new Map<string, StudentSubmissionGroup>();

    // Urutkan seluruh attempt dari yang terbaru ke terlama
    const sorted = [...attempts].sort((a, b) => {
      const dateA = new Date(a.completedAt || a.startedAt).getTime();
      const dateB = new Date(b.completedAt || b.startedAt).getTime();
      return dateB - dateA;
    });

    sorted.forEach((att) => {
      const sId = att.student?.id || att.studentId;
      const qId = att.quiz?.id || att.quizId;
      const key = `${sId}_${qId}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          studentId: sId,
          quizId: qId,
          student: att.student,
          quiz: att.quiz,
          latestAttempt: att,
          allAttempts: [att],
        });
      } else {
        map.get(key)!.allAttempts.push(att);
      }
    });

    return Array.from(map.values());
  }, [attempts]);

  // Filter kelompok siswa berdasarkan pencarian, status kuis terbaru, dan kelas
  const filteredGroups = useMemo(() => {
    return groupedSubmissions.filter((group) => {
      const studentName = group.student?.name?.toLowerCase() || '';
      const identifier = group.student?.identifier?.toLowerCase() || '';
      const quizTitle = group.quiz?.title?.toLowerCase() || '';
      const className = group.student?.kelas?.name?.toLowerCase() || '';
      const q = searchQuery.toLowerCase().trim();

      const matchSearch = !q || studentName.includes(q) || identifier.includes(q) || quizTitle.includes(q) || className.includes(q);
      const isPending = group.latestAttempt.status === 'PENDING_GRADING';
      const matchStatus = statusFilter === 'ALL' || (statusFilter === 'PENDING' && isPending) || (statusFilter === 'GRADED' && !isPending);
      const matchClass = selectedClass === 'ALL' || group.student?.kelas?.name === selectedClass;

      return matchSearch && matchStatus && matchClass;
    });
  }, [groupedSubmissions, searchQuery, statusFilter, selectedClass]);

  // Hitungan jumlah unik pending & graded
  const pendingCount = useMemo(() => groupedSubmissions.filter(g => g.latestAttempt.status === 'PENDING_GRADING').length, [groupedSubmissions]);
  const gradedCount = useMemo(() => groupedSubmissions.filter(g => g.latestAttempt.status === 'GRADED').length, [groupedSubmissions]);

  // Daftar kelas unik dari seluruh attempt siswa untuk dropdown filter
  const uniqueClasses = useMemo(() => {
    const set = new Set<string>();
    groupedSubmissions.forEach(g => {
      const cls = g.student?.kelas?.name;
      if (cls) set.add(cls);
    });
    return Array.from(set).sort();
  }, [groupedSubmissions]);

  // Saat guru memilih siswa dari antrean, inisialisasi lembar kerja
  const handleSelectAttempt = (att: any, group?: StudentSubmissionGroup) => {
    setActiveAttempt(att);
    if (group) {
      setActiveGroup(group);
    } else {
      const found = groupedSubmissions.find(g => g.allAttempts.some(a => a.id === att.id));
      if (found) setActiveGroup(found);
    }

    setEvaluations({});
    setManualFinalScore(null);
    setSingleAiLoadingId(null);
    setIsAskingBatchAI(false);
    setAiSuccessMessage(null);

    const questions = att.quiz?.questions || [];
    const isQuizEssay = att.quiz?.quizType === 'ESSAY';
    const essayQs = questions.filter((q: any) => q.type === 'ESSAY' || isQuizEssay);
    
    // Default: Semua soal esai dicentang aktif untuk AI
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

  // Toggle checklist nomor soal tertentu untuk AI (di lembar aktif)
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

  const selectedCount = essayQuestions.filter((q: any) => selectedQuestions[q.id]).length;

  const handleSetQuestionScore = (qId: string, score: number) => {
    const clamped = Math.max(0, Math.min(100, score));
    setQuestionScores(prev => ({
      ...prev,
      [qId]: clamped
    }));
  };

  // ---------------------------------------------------------------------------
  // MULTI-SELECT SISWA & KOREKSI SEKALIGUS (BATCH AI)
  // ---------------------------------------------------------------------------
  const handleToggleSelectStudent = (key: string) => {
    setSelectedGroupKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const selectedStudentCount = Object.values(selectedGroupKeys).filter(Boolean).length;
  const isAllStudentsSelected = filteredGroups.length > 0 && filteredGroups.every(g => selectedGroupKeys[g.key]);

  const handleToggleSelectAllStudents = () => {
    const nextState = !isAllStudentsSelected;
    const nextKeys: Record<string, boolean> = {};
    if (nextState) {
      filteredGroups.forEach(g => {
        nextKeys[g.key] = true;
      });
    }
    setSelectedGroupKeys(nextKeys);
  };

  // Eksekusi Koreksi Massal dengan AI
  const handleStartBatchGrading = async () => {
    const targetGroups = filteredGroups.filter(g => selectedGroupKeys[g.key]);
    if (targetGroups.length === 0) {
      alert('Silakan centang minimal 1 siswa untuk dikoreksi sekaligus.');
      return;
    }

    const initialProgress: BatchProgressItem[] = targetGroups.map(g => ({
      key: g.key,
      attemptId: g.latestAttempt.id,
      studentName: g.student?.name || 'Siswa',
      quizTitle: g.quiz?.title || 'Kuis',
      status: 'WAITING',
    }));

    setBatchProgress(initialProgress);
    setIsBatchRunning(true);

    // Proses siswa satu per satu secara berurutan
    for (let i = 0; i < targetGroups.length; i++) {
      const g = targetGroups[i];
      const attempt = g.latestAttempt;

      // Update status item ke ANALYZING
      setBatchProgress(prev => prev ? prev.map(p => p.key === g.key ? { ...p, status: 'ANALYZING' } : p) : null);

      try {
        // 1. Minta evaluasi AI untuk seluruh soal esai pada attempt ini
        const resAi = await fetch(`/api/guru/koreksi-kuis/${attempt.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ASK_AI' })
        });
        const dataAi = await resAi.json();

        if (!resAi.ok) {
          throw new Error(dataAi.message || 'Gagal memproses AI.');
        }

        const evals: EvaluationItem[] = dataAi.evaluations || [];
        const questions = attempt.quiz?.questions || [];
        const isQuizEssay = attempt.quiz?.quizType === 'ESSAY';
        const essayQs = questions.filter((q: any) => q.type === 'ESSAY' || isQuizEssay);
        const totalQ = essayQs.length || 1;

        let totalScoreSum = 0;
        const answersPayload: any[] = [];

        essayQs.forEach((q: any) => {
          const evalItem = evals.find(e => e.questionId === q.id);
          const qScore = evalItem && typeof evalItem.suggestedScore === 'number' ? evalItem.suggestedScore : 75;
          totalScoreSum += qScore;
          answersPayload.push({
            questionId: q.id,
            score: qScore,
            aiFeedback: evalItem?.aiFeedback || null,
          });
        });

        const calculatedFinalScore = Math.round(totalScoreSum / totalQ);
        const totalCorrect = answersPayload.filter(a => a.score >= 70).length;

        // 2. Simpan nilai ke database (SAVE_GRADE)
        setBatchProgress(prev => prev ? prev.map(p => p.key === g.key ? { ...p, status: 'SAVING' } : p) : null);

        const resSave = await fetch(`/api/guru/koreksi-kuis/${attempt.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SAVE_GRADE',
            score: calculatedFinalScore,
            totalCorrect,
            answers: answersPayload
          })
        });

        if (!resSave.ok) {
          const saveErr = await resSave.json();
          throw new Error(saveErr.message || 'Gagal menyimpan nilai.');
        }

        // Tandai sukses
        setBatchProgress(prev => prev ? prev.map(p => p.key === g.key ? { ...p, status: 'DONE', score: calculatedFinalScore } : p) : null);

      } catch (err: any) {
        setBatchProgress(prev => prev ? prev.map(p => p.key === g.key ? { ...p, status: 'ERROR', errorMsg: err.message || 'Terjadi kesalahan' } : p) : null);
      }
    }

    setIsBatchRunning(false);
    setSelectedGroupKeys({});
    fetchAttempts();
  };

  // Minta Bantuan AI untuk Siswa yang Sedang Dibuka
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

        // 2. PASTI LANGSUNG ISI SKOR PER-SOAL SECARA OTOMATIS
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
        setAiSuccessMessage(`✨ Berhasil! Analisis AI selesai dan skor ${countUpdated} butir soal telah terisi otomatis.`);
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi gangguan saat memanggil layanan Google Gemini AI.');
    } finally {
      setIsAskingBatchAI(false);
      setSingleAiLoadingId(null);
    }
  };

  // Simpan nilai final (Attempt yang sedang aktif)
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
      setActiveGroup(null);
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
              1 Baris per Siswa (Terkini)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Koreksi Kuis Esai</h1>
          <p className="text-xs text-slate-500 mt-1">
            Centang siswa di sebelah kiri untuk mengoreksi beberapa siswa sekaligus dengan AI, atau klik nama siswa untuk melihat seluruh riwayat jawabannya.
          </p>
        </div>
        <button 
          onClick={fetchAttempts} 
          disabled={loading || isBatchRunning}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          title="Segarkan data seluruh siswa"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Antrean Siswa (1 Baris per Siswa) (4 kolom) */}
        <div className="lg:col-span-4 space-y-3">
          {/* Banner Aksi Batch jika ada siswa yang dicentang */}
          {selectedStudentCount > 0 && (
            <div className="p-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-600/25 flex items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                  {selectedStudentCount}
                </span>
                <div>
                  <div className="text-xs font-black leading-none">Siswa Dipilih</div>
                  <div className="text-[10px] text-indigo-100 mt-0.5">Siap dikoreksi dengan AI</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleStartBatchGrading}
                disabled={isBatchRunning}
                className="px-3 py-2 bg-white text-indigo-700 hover:bg-indigo-50 active:scale-95 rounded-xl text-xs font-black shadow-sm transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600" />
                <span>Koreksi Sekaligus ({selectedStudentCount})</span>
              </button>
            </div>
          )}

          {/* Filter Bar & Checkbox Select All */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs space-y-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama siswa, NISN, atau kuis..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white text-slate-800"
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
                Semua ({groupedSubmissions.length})
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

            {/* Sub-bar: Pilih Semua & Filter Kelas */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isAllStudentsSelected}
                  onChange={handleToggleSelectAllStudents}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-[11px] font-bold text-slate-700">
                  {isAllStudentsSelected ? 'Batalkan Semua' : 'Pilih Semua Siswa'}
                </span>
              </label>

              {uniqueClasses.length > 0 && (
                <div className="flex items-center gap-1 text-xs">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="py-1 px-2 text-[11px] bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-semibold focus:outline-none"
                  >
                    <option value="ALL">Semua Kelas</option>
                    {uniqueClasses.map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
          
          {/* Daftar Kelompok Siswa */}
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
              <p className="text-xs text-slate-400">Memuat daftar siswa...</p>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800">Tidak Ada Siswa</h4>
              <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau filter status.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
              {filteredGroups.map(group => {
                const isGroupActive = activeGroup?.key === group.key;
                const latest = group.latestAttempt;
                const isPending = latest.status === 'PENDING_GRADING';
                const hasMultiple = group.allAttempts.length > 1;
                const isChecked = Boolean(selectedGroupKeys[group.key]);

                return (
                  <div 
                    key={group.key} 
                    onClick={() => handleSelectAttempt(latest, group)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isGroupActive 
                        ? 'bg-blue-50/90 border-blue-500 shadow-sm ring-2 ring-blue-500/20' 
                        : isChecked
                          ? 'bg-indigo-50/40 border-indigo-300'
                          : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Checkbox di samping nama siswa untuk koreksi massal */}
                      <div 
                        className="pt-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectStudent(group.key)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                          title="Centang untuk koreksi AI sekaligus"
                        />
                      </div>

                      {/* Info Siswa & Status */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="font-black text-sm text-slate-900 truncate">
                            {group.student?.name || 'Siswa'}
                          </div>

                          {isPending ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                              Perlu Koreksi
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap font-mono">
                              Nilai: {latest.score ?? 0}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 truncate mt-0.5 flex items-center gap-1.5">
                          {group.student?.kelas?.name && (
                            <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded text-[10px]">
                              {group.student.kelas.name}
                            </span>
                          )}
                          <span className="font-mono text-slate-400">@{group.student?.identifier || '-'}</span>
                        </div>

                        <div className="text-xs text-slate-700 font-medium truncate mt-1">
                          {group.quiz?.title || 'Kuis Evaluasi'}
                        </div>

                        {/* Indikator Riwayat Jika Siswa Mengirim Lebih dari 1 Kali */}
                        {hasMultiple && (
                          <div className="mt-1.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                              <History className="w-3 h-3" />
                              {group.allAttempts.length}x Pengiriman (Klik untuk riwayat)
                            </span>
                          </div>
                        )}

                        <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-100 pt-1.5">
                          <span>Terakhir: {new Date(latest.completedAt || latest.startedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          <span className="font-bold text-blue-600 flex items-center gap-0.5">
                            Buka <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Kolom Kanan: Lembar Penilaian & Riwayat Pengiriman (8 kolom) */}
        <div className="lg:col-span-8">
          {activeAttempt && activeGroup ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Header Editor Attempt Siswa */}
              <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                      Lembar Koreksi Siswa
                    </span>
                    {activeGroup.student?.kelas?.name && (
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-md">
                        {activeGroup.student.kelas.name}
                      </span>
                    )}
                  </div>
                  <h2 className="font-black text-xl text-slate-900 mt-1">{activeGroup.student?.name}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kuis: <strong className="text-slate-700">{activeGroup.quiz?.title}</strong> • KKM: <span className="font-mono font-bold text-slate-700">{activeGroup.quiz?.passingScore || 75}</span> Poin
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                    activeAttempt.status === 'PENDING_GRADING'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {activeAttempt.status === 'PENDING_GRADING' ? 'Status: Perlu Koreksi' : `Status: Dinilai (${activeAttempt.score} Poin)`}
                  </span>
                </div>
              </div>

              {/* BILAH RIWAYAT PENGIRIMAN SISWA (JIKA LEBIH DARI 1x PENGIRIMAN) */}
              {activeGroup.allAttempts.length > 1 && (
                <div className="flex flex-wrap items-center gap-2 px-6 py-3 bg-indigo-50/70 border-b border-indigo-100 text-xs">
                  <span className="font-black text-slate-700 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-indigo-600" />
                    Riwayat Pengiriman ({activeGroup.allAttempts.length} Percobaan):
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                    {activeGroup.allAttempts.map((att, idx) => {
                      const attemptNum = activeGroup.allAttempts.length - idx;
                      const isLatest = idx === 0;
                      const isCurrentActive = activeAttempt.id === att.id;

                      return (
                        <button
                          key={att.id}
                          type="button"
                          onClick={() => handleSelectAttempt(att, activeGroup)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            isCurrentActive
                              ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20'
                              : 'bg-white text-slate-700 hover:bg-indigo-50/60 border border-slate-300'
                          }`}
                        >
                          <span>Percobaan #{attemptNum}</span>
                          {isLatest && (
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                              isCurrentActive ? 'bg-indigo-900 text-indigo-100' : 'bg-emerald-500 text-white'
                            }`}>
                              Terbaru
                            </span>
                          )}
                          <span className="font-mono text-[10px] opacity-80">
                            ({att.status === 'PENDING_GRADING' ? 'Belum Dinilai' : `${att.score ?? 0}p`})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Toast Notifikasi Berhasil AI */}
              {aiSuccessMessage && (
                <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center justify-between shadow-2xs">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {aiSuccessMessage}
                  </span>
                  <button 
                    onClick={() => setAiSuccessMessage(null)}
                    className="text-emerald-600 hover:text-emerald-900 text-xs px-2 py-0.5 rounded cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              )}

              {/* PANEL PILIHAN NOMOR SOAL UNTUK AI */}
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
                      className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-700 font-bold hover:bg-indigo-50 transition text-[11px] flex items-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Pilih Semua Nomor
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectAllQuestions(false)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 font-medium hover:bg-slate-100 transition text-[11px] cursor-pointer"
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

                  {/* Tombol Eksekusi Batch AI untuk Siswa Ini */}
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
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-lg text-[11px] font-bold transition shadow-2xs cursor-pointer"
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
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 transition cursor-pointer"
                              >
                                0
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleSetQuestionScore(q.id, 50)} 
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-600 border border-slate-200 transition cursor-pointer"
                              >
                                50
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleSetQuestionScore(q.id, 75)} 
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 transition cursor-pointer"
                              >
                                75
                              </button>
                              <button 
                                type="button" 
                                onClick={() => handleSetQuestionScore(q.id, 100)} 
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 border border-slate-200 transition cursor-pointer"
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
                          className="px-2 py-1 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
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
                Silakan pilih salah satu siswa di sebelah kiri untuk melihat jawaban esai dan riwayat pengirimannya, atau centang beberapa siswa untuk mengoreksi secara massal.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PROGRESS KOREKSI MASSAL AI */}
      {batchProgress && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Koreksi AI Massal Berjalan</h3>
                  <p className="text-[11px] text-slate-500">
                    {isBatchRunning ? 'Sedang mengevaluasi jawaban siswa...' : 'Semua siswa selesai dievaluasi!'}
                  </p>
                </div>
              </div>

              {!isBatchRunning && (
                <button
                  type="button"
                  onClick={() => setBatchProgress(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* List Progress Siswa */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {batchProgress.map((item, idx) => (
                <div 
                  key={item.key} 
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                    item.status === 'DONE' 
                      ? 'bg-emerald-50/70 border-emerald-200' 
                      : item.status === 'ERROR'
                        ? 'bg-red-50/70 border-red-200'
                        : item.status === 'ANALYZING' || item.status === 'SAVING'
                          ? 'bg-indigo-50 border-indigo-300'
                          : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 truncate">
                      {idx + 1}. {item.studentName}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {item.quizTitle}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {item.status === 'WAITING' && (
                      <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Antrean
                      </span>
                    )}
                    {item.status === 'ANALYZING' && (
                      <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Menganalisis...
                      </span>
                    )}
                    {item.status === 'SAVING' && (
                      <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Menyimpan...
                      </span>
                    )}
                    {item.status === 'DONE' && (
                      <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Nilai: {item.score}
                      </span>
                    )}
                    {item.status === 'ERROR' && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-lg flex items-center gap-1" title={item.errorMsg}>
                        <AlertCircle className="w-3.5 h-3.5 text-red-500" /> Gagal
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Tombol Tutup / Selesai */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                {batchProgress.filter(p => p.status === 'DONE').length} dari {batchProgress.length} siswa selesai
              </span>

              <button
                type="button"
                disabled={isBatchRunning}
                onClick={() => setBatchProgress(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {isBatchRunning ? 'Sedang Memproses...' : 'Tutup & Terapkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

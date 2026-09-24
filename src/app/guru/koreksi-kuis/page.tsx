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
  Award
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
  
  // Checklist soal yang dipilih untuk dibantu AI
  const [selectedQuestions, setSelectedQuestions] = useState<Record<string, boolean>>({});
  
  // Poin/skor tiap butir soal (0 - 100)
  const [questionScores, setQuestionScores] = useState<Record<string, number>>({});
  
  // Evaluasi dari AI (dipetakan per questionId)
  const [evaluations, setEvaluations] = useState<Record<string, EvaluationItem>>({});
  
  // Loading states
  const [isAskingBatchAI, setIsAskingBatchAI] = useState(false);
  const [singleAiLoadingId, setSingleAiLoadingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Nilai akhir (bisa otomatis atau di-override guru)
  const [manualFinalScore, setManualFinalScore] = useState<number | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/guru/koreksi-kuis');
      const data = await res.json();
      if (res.ok) {
        setAttempts(data.attempts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // Saat guru memilih attempt siswa, inisialisasi state per-soal
  const handleSelectAttempt = (att: any) => {
    setActiveAttempt(att);
    setEvaluations({});
    setManualFinalScore(null);
    setSingleAiLoadingId(null);
    setIsAskingBatchAI(false);

    const questions = att.quiz?.questions || [];
    const essayQuestions = questions.filter((q: any) => q.type === 'ESSAY');
    
    // Default: Semua soal esai dicentang untuk dibantu AI
    const initSelected: Record<string, boolean> = {};
    const initScores: Record<string, number> = {};

    essayQuestions.forEach((q: any) => {
      initSelected[q.id] = true;
      initScores[q.id] = 0;
    });

    // Jika attempt sudah memiliki riwayat skor sebelumnya di answers
    if (att.answers && Array.isArray(att.answers)) {
      att.answers.forEach((ans: any) => {
        if (typeof ans.score === 'number') {
          initScores[ans.questionId] = ans.score;
        }
      });
    }

    setSelectedQuestions(initSelected);
    setQuestionScores(initScores);
  };

  // Daftar pertanyaan esai pada attempt yang sedang aktif
  const essayQuestions = useMemo(() => {
    if (!activeAttempt?.quiz?.questions) return [];
    return activeAttempt.quiz.questions.filter((q: any) => q.type === 'ESSAY');
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

  // Nilai akhir yang dipakai (manual jika guru sengaja mengubahnya, atau otomatis dari rata-rata)
  const effectiveFinalScore = manualFinalScore !== null ? manualFinalScore : autoAverageScore;

  // Toggle checklist soal tertentu
  const handleToggleQuestionSelect = (qId: string) => {
    setSelectedQuestions(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  // Toggle Pilih Semua / Batal Semua
  const allSelected = essayQuestions.length > 0 && essayQuestions.every((q: any) => selectedQuestions[q.id]);
  const handleToggleAllSelect = () => {
    const nextState = !allSelected;
    const updated: Record<string, boolean> = {};
    essayQuestions.forEach((q: any) => {
      updated[q.id] = nextState;
    });
    setSelectedQuestions(updated);
  };

  // Hitung berapa soal yang sedang dicentang
  const selectedCount = essayQuestions.filter((q: any) => selectedQuestions[q.id]).length;

  // Handler ubah poin butir soal
  const handleSetQuestionScore = (qId: string, score: number) => {
    const clamped = Math.max(0, Math.min(100, score));
    setQuestionScores(prev => ({
      ...prev,
      [qId]: clamped
    }));
  };

  // Handler minta bantuan AI (bisa batch untuk yang dicentang, atau single untuk satu soal)
  const handleAskAI = async (specificQuestionId?: string) => {
    if (!activeAttempt) return;

    let targetIds: string[] = [];
    if (specificQuestionId) {
      targetIds = [specificQuestionId];
      setSingleAiLoadingId(specificQuestionId);
    } else {
      targetIds = essayQuestions.filter((q: any) => selectedQuestions[q.id]).map((q: any) => q.id);
      if (targetIds.length === 0) {
        alert('Silakan centang minimal 1 soal yang ingin dievaluasi dengan AI.');
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

      if (Array.isArray(data.evaluations)) {
        setEvaluations(prev => {
          const next = { ...prev };
          data.evaluations.forEach((item: EvaluationItem) => {
            next[item.questionId] = item;
          });
          return next;
        });

        // Terapkan skor rekomendasi AI ke kolom poin butir soal jika terdeteksi
        setQuestionScores(prev => {
          const nextScores = { ...prev };
          data.evaluations.forEach((item: EvaluationItem) => {
            if (typeof item.suggestedScore === 'number' && !isNaN(item.suggestedScore)) {
              nextScores[item.questionId] = item.suggestedScore;
            }
          });
          return nextScores;
        });
      }
    } catch (err: any) {
      alert(err.message || 'Terjadi gangguan saat memanggil layanan AI.');
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
      // Siapkan riwayat answers yang diperbarui dengan skor per-soal
      const existingAnswers: any[] = activeAttempt.answers || [];
      const updatedAnswers = existingAnswers.map((ans: any) => ({
        ...ans,
        score: questionScores[ans.questionId] ?? 0,
        aiFeedback: evaluations[ans.questionId]?.aiFeedback || null,
      }));

      const isPassed = effectiveFinalScore >= (activeAttempt.quiz?.passingScore || 75);
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
      fetchPending();
    } catch (e: any) {
      alert(e.message || 'Gagal menyimpan nilai.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center gap-1">
              <Bot className="w-3.5 h-3.5" />
              Asisten Guru AI
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Koreksi Kuis Esai</h1>
          <p className="text-xs text-slate-500 mt-1">
            Verifikasi jawaban esai siswa dengan bantuan analisis Gemini AI atau koreksi manual per-butir soal.
          </p>
        </div>
        <button 
          onClick={fetchPending} 
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          title="Segarkan antrean"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Antrean</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Antrean Koreksi Siswa (4 kolom) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-bold text-slate-700 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <span>Antrean Siswa</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                {attempts.length}
              </span>
            </h3>
          </div>
          
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
              <p className="text-xs text-slate-400">Memuat antrean...</p>
            </div>
          ) : attempts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800">Semua Kuis Terkoreksi</h4>
              <p className="text-xs text-slate-500 mt-1">Tidak ada kuis siswa yang menunggu pemeriksaan saat ini.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[75vh] overflow-y-auto pr-1">
              {attempts.map(att => {
                const isSelected = activeAttempt?.id === att.id;
                return (
                  <div 
                    key={att.id} 
                    onClick={() => handleSelectAttempt(att)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-blue-50/80 border-blue-400 shadow-sm ring-2 ring-blue-500/20' 
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-slate-900 truncate">
                          {att.student?.name || 'Siswa'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {att.quiz?.title || 'Kuis Evaluasi'}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                        Menunggu
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                      <span>{new Date(att.startedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</span>
                      <span className="font-semibold text-blue-600 flex items-center gap-0.5">
                        Koreksi <ArrowRight className="w-3 h-3" />
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
              {/* Header Editor Attempt */}
              <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                    Lembar Koreksi
                  </span>
                  <h2 className="font-black text-lg text-slate-900 mt-1">{activeAttempt.student?.name}</h2>
                  <p className="text-xs text-slate-500">
                    Kuis: <strong className="text-slate-700">{activeAttempt.quiz?.title}</strong> • KKM: <span className="font-mono font-bold text-slate-700">{activeAttempt.quiz?.passingScore || 75}</span> Poin
                  </p>
                </div>

                {/* Tombol Batch AI */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button 
                    onClick={() => handleAskAI()}
                    disabled={isAskingBatchAI || selectedCount === 0}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    {isAskingBatchAI ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menganalisis {selectedCount} Soal...</span>
                      </>
                    ) : (
                      <>
                        <Bot className="w-4 h-4" />
                        <span>Bantu Koreksi ({selectedCount} Soal)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Sub-toolbar: Checklist & Helper */}
              <div className="px-6 py-3 bg-slate-100/60 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                <button
                  type="button"
                  onClick={handleToggleAllSelect}
                  className="inline-flex items-center gap-1.5 font-bold text-slate-700 hover:text-blue-600 transition"
                >
                  {allSelected ? (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  <span>{allSelected ? 'Batalkan Semua Pilihan' : 'Pilih Semua Soal untuk AI'}</span>
                </button>

                <div className="text-[11px] text-slate-500 font-medium">
                  Centang soal yang ingin dianalisis otomatis oleh Gemini AI.
                </div>
              </div>

              {/* Daftar Butir Soal Esai */}
              <div className="p-6 space-y-6">
                {essayQuestions.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
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
                        key={q.id} 
                        className={`rounded-2xl border transition-all ${
                          isSelectedForAi 
                            ? 'bg-white border-slate-300 shadow-xs' 
                            : 'bg-slate-50/50 border-slate-200 opacity-90'
                        }`}
                      >
                        {/* Header Kartu Pertanyaan */}
                        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70 rounded-t-2xl">
                          <div className="flex items-center gap-3">
                            {/* Checkbox AI */}
                            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                              <input 
                                type="checkbox"
                                checked={isSelectedForAi}
                                onChange={() => handleToggleQuestionSelect(q.id)}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                              />
                              <span className="text-xs font-bold text-slate-700">
                                Soal #{idx + 1}
                              </span>
                            </label>
                            {isSelectedForAi && (
                              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                                <Sparkles className="w-3 h-3" />
                                Terpilih untuk AI
                              </span>
                            )}
                          </div>

                          {/* Tombol Tanya AI Soal Ini */}
                          <button
                            type="button"
                            onClick={() => handleAskAI(q.id)}
                            disabled={isSingleLoading || isAskingBatchAI}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-lg text-[11px] font-bold transition shadow-2xs"
                          >
                            {isSingleLoading ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Menganalisis...</span>
                              </>
                            ) : (
                              <>
                                <Bot className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Tanya AI Soal Ini</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Isi Pertanyaan & Jawaban */}
                        <div className="p-5 space-y-4">
                          {/* Pertanyaan */}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                              Pertanyaan:
                            </span>
                            {q.imageUrl && (
                              <img src={q.imageUrl} alt="soal" className="max-h-40 rounded-lg border border-slate-200 mb-2" />
                            )}
                            <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                              {q.questionText}
                            </p>
                          </div>

                          {/* Kunci Jawaban Referensi Guru */}
                          <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs text-emerald-900">
                            <span className="font-bold text-emerald-800 block text-[10px] uppercase mb-0.5">
                              Kunci Jawaban Referensi Anda:
                            </span>
                            <span className="font-medium">{q.referenceAnswer || '(Belum disetel di kuis builder)'}</span>
                          </div>

                          {/* Jawaban Siswa */}
                          <div className="p-3 bg-slate-100/70 border border-slate-200 rounded-xl text-xs text-slate-900">
                            <span className="font-bold text-slate-500 block text-[10px] uppercase mb-1">
                              Jawaban Siswa:
                            </span>
                            <p className="text-sm font-mono whitespace-pre-wrap bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800">
                              {ans?.answerText?.trim() ? ans.answerText : <em className="text-slate-400 font-sans">Tidak dijawab oleh siswa</em>}
                            </p>
                          </div>

                          {/* Hasil Analisis AI */}
                          {evalData && (
                            <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-200 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-indigo-800 font-bold text-xs uppercase tracking-wider">
                                  <Bot className="w-4 h-4 text-indigo-600" /> Hasil Analisis Gemini AI
                                </span>
                                {typeof evalData.suggestedScore === 'number' && (
                                  <button
                                    type="button"
                                    onClick={() => handleSetQuestionScore(q.id, evalData.suggestedScore!)}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-white hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-300 shadow-2xs transition"
                                    title="Terapkan saran nilai ini ke kolom poin"
                                  >
                                    <span>Saran AI: <strong>{evalData.suggestedScore} Poin</strong></span>
                                    <span className="text-[10px] text-indigo-500 underline ml-1">Terapkan</span>
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
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
                                  className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-center text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                                />
                                <span className="text-xs text-slate-400 font-medium">/ 100</span>
                              </div>
                            </div>

                            {/* Preset Tombol Cepat */}
                            <div className="flex items-center gap-1 text-[10px] font-bold">
                              <span className="text-slate-400 mr-1 hidden sm:inline">Cepat:</span>
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
                      <Calculator className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Penjumlahan & Rata-rata Poin Otomatis
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                      <div>
                        Total Poin Soal: <strong className="text-white font-mono">{totalPoints}</strong> / {maxTotalPoints}
                      </div>
                      <div>•</div>
                      <div>
                        Rata-rata: <strong className="text-blue-400 font-mono text-sm">{autoAverageScore}</strong> / 100
                      </div>
                      <div>•</div>
                      <div>
                        {effectiveFinalScore >= (activeAttempt.quiz?.passingScore || 75) ? (
                          <span className="text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded text-[10px]">
                            LULUS KKM (≥ {activeAttempt.quiz?.passingScore || 75})
                          </span>
                        ) : (
                          <span className="text-amber-400 font-bold bg-amber-950/80 border border-amber-800 px-2 py-0.5 rounded text-[10px]">
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
                        className="w-20 px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-lg font-black font-mono text-center text-white focus:outline-none focus:border-blue-500"
                      />
                      {manualFinalScore !== null && (
                        <button
                          type="button"
                          onClick={() => setManualFinalScore(null)}
                          className="px-2 py-1 text-[10px] font-semibold text-blue-400 hover:text-blue-300 underline"
                          title="Kembalikan ke rata-rata otomatis poin soal"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    <button 
                      onClick={handleSaveGrade}
                      disabled={isSaving}
                      className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all whitespace-nowrap"
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
              <h3 className="font-bold text-base text-slate-800">Pilih Jawaban Siswa</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Silakan pilih salah satu siswa dari daftar antrean di sebelah kiri untuk memeriksa jawaban kuis mereka.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

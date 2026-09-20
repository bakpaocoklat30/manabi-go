'use client';

import React, { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Sparkles, 
  RotateCcw, 
  Loader2, 
  BookOpen,
  Award,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import QuizTimer from '@/components/shared/QuizTimer';

interface Option {
  id: string;
  optionText: string;
}

interface Question {
  id: string;
  questionText: string;
  imageUrl?: string;
  orderIndex: number;
  options: Option[];
}

interface QuizData {
  id: string;
  title: string;
  timeLimitMinutes: number;
  passingScore: number;
  moduleId: string;
  randomizeOptions?: boolean;
  randomizeQuestions?: boolean;
  antiCheatMode?: string;
  questions: Question[];
}

interface ReviewDetail {
  questionId: string;
  questionText: string;
  imageUrl?: string;
  explanation: string | null;
  selectedOptionId: string | null;
  correctOptionId: string | null;
  isCorrect: boolean;
}

interface SubmissionResult {
  score: number;
  totalCorrect: number;
  totalQuestions: number;
  isPassed: boolean;
  passingScore: number;
  review: ReviewDetail[];
}

export default function SiswaQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const quizId = resolvedParams.id;
  const router = useRouter();

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [cheatWarnings, setCheatWarnings] = useState(0);
  const selectedAnswersRef = useRef(selectedAnswers);

  useEffect(() => {
    selectedAnswersRef.current = selectedAnswers;
  }, [selectedAnswers]);
  const [showCheatAlert, setShowCheatAlert] = useState(false);

  // Ambil data struktur kuis
  useEffect(() => {
    async function fetchQuiz() {
      try {
        const res = await fetch(`/api/quizzes/${quizId}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Gagal memuat kuis atau sesi telah berakhir.');
        }
        const data = await res.json();
        setQuizData(data);
      } catch (err: any) {
        setErrorMessage(err.message || 'Terjadi gangguan saat mengambil modul kuis.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuiz();
  }, [quizId]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (result || isSubmitting) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };


  useEffect(() => {
    if (!quizData || quizData.antiCheatMode === 'OFF' || result !== null) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setCheatWarnings(prev => {
          const newCount = prev + 1;
          if (quizData.antiCheatMode === 'AUTO_SUBMIT' && newCount >= 3) {
            alert('ANDA TERDETEKSI MENCONTEK (PINDAH TAB) LEBIH DARI 3 KALI. KUIS DIKUMPULKAN OTOMATIS!');
            handleSubmitQuiz(newCount);
          } else {
            setShowCheatAlert(true);
            setTimeout(() => setShowCheatAlert(false), 5000);
          }
          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [quizData, result]);

  const handleSubmitQuiz = async (overrideCheatCount?: number) => {
    if (isSubmitting || result || !quizData) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const currentAnswers = selectedAnswersRef.current;
    const formattedAnswers = quizData.questions.map((q) => ({
      questionId: q.id,
      selectedOptionId: currentAnswers[q.id] || '',
    }));

    try {
      const res = await fetch('/api/quizzes/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: quizData.id,
          answers: formattedAnswers,
          cheatCount: typeof overrideCheatCount === 'number' ? overrideCheatCount : cheatWarnings,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengirim evaluasi kuis.');
      }

      localStorage.removeItem(`quiz_timer_${quizData.id}`);
      setResult(data);

      // Trigger Confetti jika siswa berhasil melampaui KKM
      if (data.isPassed) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#DC2626', '#2563EB', '#F59E0B', '#10B981'],
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem saat mengirim jawaban.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        <p className="text-xs text-slate-400 font-mono">Memuat Lembar Evaluasi Kuis...</p>
      </div>
    );
  }

  if (errorMessage || !quizData) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-slate-900 border border-red-900/60 p-6 rounded-2xl text-center space-y-4">
        <XCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h3 className="text-base font-bold text-white">Tidak Dapat Mengakses Kuis</h3>
        <p className="text-xs text-slate-400">{errorMessage || 'Kuis tidak ditemukan.'}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
        >
          Kembali ke Modul
        </button>
      </div>
    );
  }

  const currentQuestion = quizData.questions[currentQuestionIndex];
  const totalQuestions = quizData.questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header Bar: Status Navigasi & Timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl">
        <div>
          <Link
            href={`/siswa/modules/${quizData.moduleId}`}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Modul</span>
          </Link>
          <h2 className="text-base font-bold text-white leading-snug">{quizData.title}</h2>
        </div>

        {!result && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Terjawab: {answeredCount}/{totalQuestions}
            </span>
            <QuizTimer
              quizId={quizData.id}
              initialMinutes={quizData.timeLimitMinutes}
              onTimeUp={handleSubmitQuiz}
              isSubmitting={isSubmitting}
            />
          </div>
        )}
      </div>

      {/* Tampilan Hasil / Pembahasan Kuis */}
      {result ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Card Rekap Skor */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 mx-auto shadow-inner">
              {result.isPassed ? (
                <Award className="w-8 h-8 text-emerald-400" />
              ) : (
                <RotateCcw className="w-8 h-8 text-amber-400" />
              )}
            </div>

            <div>
              <span
                className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                  result.isPassed
                    ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                    : 'bg-amber-950/60 border-amber-800 text-amber-300'
                }`}
              >
                {result.isPassed ? 'Lulus KKM STM ADB' : 'Belum Memenuhi KKM'}
              </span>
              <h3 className="text-4xl font-black text-white font-mono mt-3">
                {result.score} <span className="text-base font-normal text-slate-500">/ 100</span>
              </h3>
              <p className="text-xs text-slate-400 mt-2">
                Menjawab benar <strong className="text-white">{result.totalCorrect}</strong> dari{' '}
                <strong className="text-white">{result.totalQuestions}</strong> butir soal (Batas KKM: {result.passingScore}).
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/siswa/modules/${quizData.moduleId}`}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
              >
                Kembali ke Materi
              </Link>
              <button
                onClick={() => {
                  setResult(null);
                  setSelectedAnswers({});
                  setCurrentQuestionIndex(0);
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-lg shadow-red-600/30 flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Ulangi Pengerjaan</span>
              </button>
            </div>
          </div>

          {/* Ulasan & Pembahasan Tiap Butir Soal */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-red-500" />
              Pembahasan & Kunci Jawaban
            </h4>

            {result.review.map((item, idx) => (
              <div
                key={item.questionId}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      {item.imageUrl && <img src={item.imageUrl} alt="soal" className="mb-3 max-h-40 rounded-lg border border-slate-700" />}
                      <p className="text-sm font-semibold text-white leading-relaxed">
                        {item.questionText}
                      </p>
                    </div>
                  </div>
                  {item.isCorrect ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Benar
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-950/60 border border-red-800 px-2.5 py-1 rounded-lg">
                      <XCircle className="w-3.5 h-3.5" />
                      Salah
                    </span>
                  )}
                </div>

                {item.explanation && (
                  <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                    <span className="font-bold text-red-400 block mb-1">Penjelasan Sensei:</span>
                    {item.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Lembar Pengerjaan Kuis */
        <div className="space-y-6">
          {/* Palet Nomor Soal */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              Navigasi Butir Pertanyaan
            </p>
            <div className="flex flex-wrap gap-2">
              {quizData.questions.map((q, idx) => {
                const isAnswered = Boolean(selectedAnswers[q.id]);
                const isCurrent = idx === currentQuestionIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition duration-150 ${
                      isCurrent
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : isAnswered
                        ? 'bg-blue-600/30 border border-blue-600 text-blue-300'
                        : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Kartu Pertanyaan Aktif */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                Pertanyaan {currentQuestionIndex + 1} dari {totalQuestions}
              </span>
              <span className="text-xs text-slate-500 font-medium">Pilihan Ganda</span>
            </div>

            {currentQuestion.imageUrl && (
              <img src={currentQuestion.imageUrl} alt="Ilustrasi soal" className="max-w-full h-auto max-h-64 rounded-xl border border-slate-700 shadow-sm" />
            )}
            <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
              {currentQuestion.questionText}
            </p>

            {/* Opsi Jawaban */}
            <div className="space-y-3">
              {currentQuestion.options.map((opt) => {
                const isSelected = selectedAnswers[currentQuestion.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                    className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-red-950/40 border-red-600 text-white ring-2 ring-red-600/30'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <span>{opt.optionText}</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'border-red-500 bg-red-600'
                          : 'border-slate-600'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Tombol Navigasi Bawah */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>

              {currentQuestionIndex < totalQuestions - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    if (window.confirm('Apakah Anda yakin ingin mengumpulkan kuis ini? Jawaban yang sudah dikumpulkan tidak dapat diubah kembali.')) {
                      handleSubmitQuiz();
                    }
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-lg shadow-red-600/30 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menilai...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Selesai & Kumpulkan</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
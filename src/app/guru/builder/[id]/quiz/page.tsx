'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Plus, Trash2, Loader2, Save, X, Headphones, CheckCircle2, AlertCircle, HelpCircle
} from 'lucide-react';

interface Option {
  optionText: string;
  isCorrect: boolean;
  imageUrl?: string;
}

interface Question {
  type?: string;
  referenceAnswer?: string | null;
  questionText: string;
  imageUrl?: string;
  audioUrl?: string;
  explanation: string;
  options: Option[];
}

export default function QuizBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizType = searchParams.get('type') || 'MULTIPLE_CHOICE';
  const moduleId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [title, setTitle] = useState("Kuis Evaluasi");
  const [quizAudioUrl, setQuizAudioUrl] = useState("");
  const [timeLimit, setTimeLimit] = useState(15);
  const [passingScore, setPassingScore] = useState(75);
  const [randomizeOptions, setRandomizeOptions] = useState(true);
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [antiCheatMode, setAntiCheatMode] = useState('WARNING');
  const [allowRetake, setAllowRetake] = useState(true);
  const [maxRetakes, setMaxRetakes] = useState(3);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const res = await fetch(`/api/guru/modules/${moduleId}/quiz?type=${quizType}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.quiz) {
            setTitle(data.quiz.title);
            setTimeLimit(data.quiz.timeLimitMinutes);
            setPassingScore(data.quiz.passingScore);
            setQuizAudioUrl(data.quiz.audioUrl || "");
          setRandomizeOptions(data.quiz.randomizeOptions !== false);
          setRandomizeQuestions(data.quiz.randomizeQuestions !== false);
          setAntiCheatMode(data.quiz.antiCheatMode || 'WARNING');
          if (data.quiz.allowRetake !== undefined) setAllowRetake(data.quiz.allowRetake);
          if (data.quiz.maxRetakes !== undefined) setMaxRetakes(data.quiz.maxRetakes);
            setQuestions(data.quiz.questions);
          } else {
            // Default 1 soal kosong jika belum ada
            setQuestions([{
              type: quizType,
              questionText: '',
              imageUrl: '',
              explanation: '',
              options: [
                { optionText: '', isCorrect: true },
                { optionText: '', isCorrect: false },
                { optionText: '', isCorrect: false },
                { optionText: '', isCorrect: false },
              ]
            }]);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadQuiz();
  }, [moduleId]);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        type: quizType,
        questionText: '',
        imageUrl: '',
        explanation: '',
        options: [
          { optionText: '', isCorrect: true },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
          { optionText: '', isCorrect: false },
        ]
      }
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    const newQ = [...questions];
    newQ.splice(index, 1);
    setQuestions(newQ);
  };

  const updateQuestionText = (index: number, text: string) => {
    const newQ = [...questions];
    newQ[index].questionText = text;
    setQuestions(newQ);
  };

  const updateQuestionExplanation = (index: number, text: string) => {
    const newQ = [...questions];
    newQ[index].explanation = text;
    setQuestions(newQ);
  };

  
  const handleOptionPaste = (qIndex: number, optIndex: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64String = event.target?.result as string;
            const newQ = [...questions];
            newQ[qIndex].options[optIndex].imageUrl = base64String;
            setQuestions(newQ);
          };
          reader.readAsDataURL(blob);
          e.preventDefault();
        }
      }
    }
  };
  
  const removeOptionImage = (qIndex: number, optIndex: number) => {
    const newQ = [...questions];
    newQ[qIndex].options[optIndex].imageUrl = undefined;
    setQuestions(newQ);
  };

  const updateOptionText = (qIndex: number, optIndex: number, text: string) => {
    const newQ = [...questions];
    newQ[qIndex].options[optIndex].optionText = text;
    setQuestions(newQ);
  };

  const setCorrectOption = (qIndex: number, optIndex: number) => {
    const newQ = [...questions];
    newQ[qIndex].options.forEach((opt, idx) => {
      opt.isCorrect = (idx === optIndex);
    });
    setQuestions(newQ);
  };

  
  const handleAudioUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload/audio', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Gagal mengunggah audio');
    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async () => {
    // Validasi dasar
    if (questions.length === 0) {
      setNotification({ type: 'error', message: 'Minimal harus ada 1 soal!' });
      return;
    }
    
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].questionText.trim()) {
        setNotification({ type: 'error', message: `Soal no ${i+1} tidak boleh kosong.` });
        return;
      }
      const hasCorrect = questions[i].options.some(o => o.isCorrect);
      if (!hasCorrect) {
        setNotification({ type: 'error', message: `Soal no ${i+1} harus memiliki 1 jawaban benar.` });
        return;
      }
    }

    setIsSubmitting(true);
    setNotification(null);
    try {
      const res = await fetch(`/api/guru/modules/${moduleId}/quiz?type=${quizType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          timeLimitMinutes: timeLimit,
          passingScore,
          randomizeOptions,
          randomizeQuestions,
          antiCheatMode,
          allowRetake,
          maxRetakes,
          audioUrl: quizAudioUrl,
          questions
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setNotification({ type: 'success', message: 'Kuis berhasil disimpan!' });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Gagal menyimpan kuis.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>;
  }

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#E8E2D2] p-6 rounded-2xl shadow-sm sticky top-4 z-10">
        <div className="flex items-center gap-4">
          <Link href={`/guru/builder/${moduleId}`} className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              {quizType === 'ESSAY' ? 'Kuis Isian Singkat (AI)' : 'Kuis Pilihan Ganda'}
            </h2>
            <p className="text-xs text-stone-500 mt-1">Buat soal evaluasi untuk mengukur pemahaman siswa.</p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Simpan Kuis</span>
        </button>
      </div>

      {notification && (
        <div className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs animate-in fade-in ${
            notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Pengaturan Kuis */}
      <div className="bg-white border border-[#E8E2D2] rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-stone-900 border-b border-[#E8E2D2] pb-2">Pengaturan Umum Kuis</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Judul Kuis</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E8E2D2] rounded-xl text-stone-900 text-xs font-bold focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Durasi (Menit)</label>
            <input type="number" min="1" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E8E2D2] rounded-xl text-stone-900 text-xs font-bold focus:outline-none focus:border-purple-500" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Passing Grade (KKM)</label>
            <input type="number" min="0" max="100" value={passingScore} onChange={e => setPassingScore(Number(e.target.value))} className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E8E2D2] rounded-xl text-stone-900 text-xs font-bold focus:outline-none focus:border-purple-500" />
          </div>
          <div className="md:col-span-3 flex gap-6">
            <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
              <input type="checkbox" checked={randomizeOptions} onChange={e => setRandomizeOptions(e.target.checked)} className="w-4 h-4 text-purple-600 rounded" />
              Acak Urutan Opsi
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-stone-700 cursor-pointer">
              <input type="checkbox" checked={randomizeQuestions} onChange={e => setRandomizeQuestions(e.target.checked)} className="w-4 h-4 text-purple-600 rounded" />
              Acak Urutan Soal
            </label>

            <div className="flex flex-col">
              <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Anti-Cheat (Deteksi Tab)</label>
              <select value={antiCheatMode} onChange={e => setAntiCheatMode(e.target.value)} className="w-full px-3 py-2 bg-[#FDFBF7] border border-[#E8E2D2] rounded-xl text-stone-900 text-xs font-bold focus:outline-none focus:border-purple-500">
                <option value="OFF">Mati (Bebas Pindah Tab)</option>
                <option value="WARNING">Peringatan & Dicatat</option>
                <option value="AUTO_SUBMIT">Kumpul Otomatis (3x Pindah)</option>
              </select>
            </div>
            
            <div className="flex flex-col">
              <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Ujian Ulang (Retake)</label>
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input type="checkbox" checked={allowRetake} onChange={(e) => setAllowRetake(e.target.checked)} className="rounded border-stone-300 text-purple-600 focus:ring-purple-600" />
                <span className="text-xs font-bold text-stone-700">Izinkan Siswa Mengulang Kuis</span>
              </label>
              {allowRetake && (
                <div className="pl-6">
                  <label className="block text-[10px] font-bold text-stone-500 mb-1">Maksimal Pengulangan (termasuk percobaan pertama)</label>
                  <input 
                    type="number" min="1" max="10" 
                    value={maxRetakes} 
                    onChange={(e) => setMaxRetakes(Number(e.target.value))} 
                    className="w-full text-xs p-2 border border-[#E8E2D2] bg-[#FDFBF7] rounded-xl font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Daftar Soal */}
      <div className="space-y-6">
        {questions.map((q, qIndex) => (
          <div key={qIndex} className="bg-white border border-[#E8E2D2] rounded-2xl p-6 shadow-sm relative group">
            <div className="absolute -left-3 -top-3 w-8 h-8 bg-purple-600 text-white rounded-xl flex items-center justify-center font-black shadow-sm">
              {qIndex + 1}
            </div>
            <button 
              onClick={() => handleRemoveQuestion(qIndex)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
              title="Hapus Soal"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="space-y-4">

              
              <div className="mb-2">
                <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Gambar (Opsional)</label>
                <div 
                  className="w-full border-2 border-dashed border-stone-300 rounded-xl p-4 text-center cursor-pointer hover:border-purple-500 transition relative bg-[#FDFBF7]"
                  onPaste={(e) => {
                    const items = e.clipboardData?.items;
                    if (!items) return;
                    for (let i = 0; i < items.length; i++) {
                      if (items[i].type.indexOf('image') !== -1) {
                        const file = items[i].getAsFile();
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            const newQ = [...questions];
                            newQ[qIndex].imageUrl = e.target?.result as string;
                            setQuestions(newQ);
                          };
                          reader.readAsDataURL(file);
                        }
                      }
                    }
                  }}
                >
                  <input 
                    type="file" 
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          const newQ = [...questions];
                          newQ[qIndex].imageUrl = e.target?.result as string;
                          setQuestions(newQ);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {!q.imageUrl ? (
                    <div className="flex flex-col items-center gap-1 opacity-50 pointer-events-none">
                      <span className="text-xl">📸</span>
                      <p className="text-[10px] font-bold text-stone-600">Klik / Paste (Ctrl+V) / Drag gambar ke sini</p>
                    </div>
                  ) : (
                    <div className="relative inline-block pointer-events-none">
                      <img src={q.imageUrl} alt="preview" className="h-32 object-contain rounded-lg border border-stone-200" />
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          const newQ = [...questions];
                          newQ[qIndex].imageUrl = '';
                          setQuestions(newQ);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center pointer-events-auto"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-1">Pertanyaan</label>


                <textarea 
                  rows={2} 
                  value={q.questionText} 
                  onChange={e => updateQuestionText(qIndex, e.target.value)}
                  placeholder="Ketik pertanyaan di sini..."
                  className="w-full px-4 py-3 bg-[#FDFBF7] border border-[#E8E2D2] rounded-xl text-stone-900 text-sm focus:outline-none focus:border-purple-500 font-medium" 
                />
              </div>

              

              {(!q.type || q.type === 'MULTIPLE_CHOICE') && (
                <div>
                  <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-2">Pilihan Ganda (Tandai yang Benar)</label>
                  <div className="space-y-2">
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className={`flex items-center gap-3 p-2 rounded-xl border ${opt.isCorrect ? 'border-emerald-400 bg-emerald-50' : 'border-[#E8E2D2] bg-white'}`}>
                        <input 
                          type="radio" 
                          name={`correct-${qIndex}`}
                          checked={opt.isCorrect}
                          onChange={() => setCorrectOption(qIndex, optIndex)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        
                          <input 
                            type="text" 
                            value={opt.optionText || ''}
                            onChange={e => updateOptionText(qIndex, optIndex, e.target.value)}
                            onPaste={(e) => handleOptionPaste(qIndex, optIndex, e)}
                            placeholder={`Pilihan ${String.fromCharCode(65 + optIndex)} (Tekan Ctrl+V untuk Paste Gambar)`}
                            className="flex-1 bg-transparent border-none text-xs focus:ring-0 text-stone-900 outline-none"
                          />
                        </div>
                        {opt.imageUrl && (
                          <div className="mt-2 ml-7 relative inline-block">
                            <img src={opt.imageUrl} alt="Option Image" className="h-16 object-contain border rounded shadow-sm" />
                            <button onClick={() => removeOptionImage(qIndex, optIndex)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                    ))}
                  </div>
                </div>
              )}

              {q.type === 'ESSAY' && (
                <div>
                  <label className="block text-[11px] font-semibold text-stone-500 uppercase mb-2">Kunci Jawaban Referensi (Untuk Dikoreksi AI)</label>
                  <textarea 
                    rows={3}
                    value={q.referenceAnswer || ''}
                    onChange={(e) => { const n = [...questions]; n[qIndex].referenceAnswer = e.target.value; setQuestions(n); }}
                    placeholder="Contoh: Watashi wa ringo o tabemasu. (AI akan mencocokkan jawaban siswa dengan makna kalimat ini)"
                    className="w-full px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-sm focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              )}

              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-500 uppercase mb-1">
                  <HelpCircle className="w-3.5 h-3.5" /> Pembahasan (Opsional)
                </label>
                <input 
                  type="text" 
                  value={q.explanation || ''} 
                  onChange={e => updateQuestionExplanation(qIndex, e.target.value)}
                  placeholder="Penjelasan jawaban jika siswa salah (opsional)"
                  className="w-full px-3 py-2 bg-stone-50 border border-[#E8E2D2] rounded-xl text-stone-600 text-xs focus:outline-none focus:border-purple-500" 
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleAddQuestion}
        className="w-full py-4 border-2 border-dashed border-[#E8E2D2] hover:border-purple-400 rounded-2xl flex flex-col items-center justify-center gap-2 text-stone-500 hover:text-purple-600 hover:bg-purple-50 transition"
      >
        <Plus className="w-6 h-6" />
        <span className="text-sm font-bold">Tambah Soal Baru</span>
      </button>

    </div>
  );
}

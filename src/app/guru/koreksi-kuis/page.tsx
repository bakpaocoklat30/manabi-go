"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Bot, Save, AlertCircle, RefreshCw } from 'lucide-react';

export default function KoreksiKuisPage() {
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAttempt, setActiveAttempt] = useState<any | null>(null);
  
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [manualScore, setManualScore] = useState<number>(0);

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

  const handleAskAI = async () => {
    if (!activeAttempt) return;
    setIsAskingAI(true);
    try {
      const res = await fetch(`/api/guru/koreksi-kuis/${activeAttempt.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ASK_AI' })
      });
      const data = await res.json();
      if (res.ok) {
        setEvaluations(data.evaluations || []);
        
        // Coba parsing skor otomatis dari respon AI jika memungkinkan
        let totalAiScore = 0;
        let count = 0;
        data.evaluations.forEach((ev: any) => {
          const match = ev.aiFeedback.match(/SKOR:\s*(\d+)/i);
          if (match && match[1]) {
             totalAiScore += parseInt(match[1]);
          }
          count++;
        });
        if (count > 0) {
           setManualScore(Math.round(totalAiScore / count));
        }
      } else {
        alert(data.message || 'Gagal menghubungi AI');
      }
    } catch (e) {
      alert('Error saat minta bantuan AI');
    } finally {
      setIsAskingAI(false);
    }
  };

  const handleSave = async () => {
    if (!activeAttempt) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/guru/koreksi-kuis/${activeAttempt.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SAVE_GRADE', score: manualScore, totalCorrect: manualScore > 50 ? activeAttempt.totalQuestions : 0 })
      });
      if (res.ok) {
        alert('Nilai berhasil disimpan!');
        setActiveAttempt(null);
        setEvaluations([]);
        fetchPending();
      } else {
        const data = await res.json();
        alert(data.message || 'Gagal menyimpan');
      }
    } catch (e) {
      alert('Error saving');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Koreksi Kuis (Essay AI)</h1>
          <p className="text-sm text-slate-500 mt-1">Daftar jawaban siswa yang membutuhkan verifikasi Anda.</p>
        </div>
        <button onClick={fetchPending} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Kolom Daftar Antrean */}
        <div className="md:col-span-1 space-y-3">
          <h3 className="font-bold text-slate-700 uppercase tracking-wider text-xs mb-4">Antrean Koreksi ({attempts.length})</h3>
          
          {loading ? (
            <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" /></div>
          ) : attempts.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">Semua kuis sudah dikoreksi!</p>
            </div>
          ) : (
            attempts.map(att => (
              <div 
                key={att.id} 
                onClick={() => { setActiveAttempt(att); setEvaluations([]); setManualScore(0); }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${activeAttempt?.id === att.id ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-slate-200 hover:border-blue-300'}`}
              >
                <div className="font-bold text-sm text-slate-900">{att.student?.name}</div>
                <div className="text-[10px] text-slate-500 mt-1">Kuis: {att.quiz?.title}</div>
                <div className="text-[10px] text-slate-400 mt-1">{new Date(att.startedAt).toLocaleString('id-ID')}</div>
              </div>
            ))
          )}
        </div>

        {/* Kolom Editor & AI */}
        <div className="md:col-span-2">
          {activeAttempt ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="font-black text-lg text-slate-900">{activeAttempt.student?.name}</h2>
                  <p className="text-xs text-slate-500">Mengerjakan: {activeAttempt.quiz?.title}</p>
                </div>
                <button 
                  onClick={handleAskAI}
                  disabled={isAskingAI}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl flex items-center gap-2 transition"
                >
                  {isAskingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                  Bantu Saya Koreksi dengan AI
                </button>
              </div>

              {/* Daftar Jawaban */}
              <div className="space-y-6 mb-8">
                {activeAttempt.answers && Array.isArray(activeAttempt.answers) ? activeAttempt.answers.map((ans: any, idx: number) => {
                  const evalData = evaluations.find(e => e.questionId === ans.questionId);
                  
                  return (
                    <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <div className="text-xs font-bold text-slate-500 mb-2">Jawaban Siswa:</div>
                      <div className="text-sm font-medium text-slate-900 mb-4 bg-white p-3 border border-slate-200 rounded-lg">
                        {ans.answerText || '(Kosong)'}
                      </div>
                      
                      {evalData && (
                        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                          <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-[10px] uppercase mb-2">
                            <Bot className="w-3.5 h-3.5" /> Analisis AI:
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{evalData.aiFeedback}</p>
                          <div className="mt-3 pt-3 border-t border-indigo-100 text-[10px] text-slate-500">
                            <strong>Kunci Referensi Anda:</strong> {evalData.reference}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }) : (
                  <p className="text-sm text-slate-500">Tidak ada data jawaban tersimpan.</p>
                )}
              </div>

              {/* Form Input Nilai Final */}
              <div className="bg-slate-900 rounded-2xl p-6 text-white flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">Nilai Akhir (0-100)</h3>
                  <p className="text-xs text-slate-400 mt-1">Anda bebas menyetujui atau mengubah saran nilai AI.</p>
                </div>
                <div className="flex items-center gap-4">
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    value={manualScore}
                    onChange={(e) => setManualScore(Number(e.target.value))}
                    className="w-24 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xl font-bold text-center focus:outline-none focus:border-blue-500"
                  />
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 font-bold text-xs rounded-xl flex items-center gap-2 transition"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Simpan Nilai
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="font-bold text-slate-700">Pilih Jawaban Siswa</h3>
              <p className="text-xs text-slate-500 mt-2">Pilih salah satu siswa dari antrean di sebelah kiri untuk mulai mengoreksi kuis mereka.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CheckCircle2, Clock, FileCheck, XCircle } from 'lucide-react';

export default async function ProgressPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const submissions = await prisma.taskSubmission.findMany({
    where: { studentId: userId },
    include: { moduleItem: { include: { module: true } } },
    orderBy: { submittedAt: 'desc' },
  });

  const quizAttempts = await prisma.quizAttempt.findMany({
    where: { studentId: userId },
    include: { quiz: { include: { module: true } } },
    orderBy: { startedAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-[#E8E2D2]">
        <h2 className="text-xl font-bold text-stone-800 mb-2">Riwayat & Evaluasi</h2>
        <p className="text-xs text-stone-500">Pantau semua nilai kuis dan tugas yang sudah kamu kerjakan di sini.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kuis */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D2] space-y-4">
          <h3 className="font-bold text-stone-800 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" /> Riwayat Kuis
          </h3>
          {quizAttempts.length === 0 ? (
            <p className="text-xs text-stone-500 italic">Belum ada kuis yang dikerjakan.</p>
          ) : (
            <div className="space-y-3">
              {quizAttempts.map((attempt) => (
                <div key={attempt.id} className="p-3 border rounded-xl border-[#E8E2D2] flex justify-between items-center bg-stone-50/50">
                  <div>
                    <p className="text-sm font-bold text-stone-800">{attempt.quiz.title}</p>
                    <p className="text-xs text-stone-500">{attempt.quiz.module.title}</p>
                    <p className="text-[10px] text-stone-400 mt-1">{attempt.startedAt.toLocaleDateString('id-ID')} {attempt.startedAt.toLocaleTimeString('id-ID')}</p>
                  </div>
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-bold \${attempt.score >= 75 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    Skor: {attempt.score}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tugas */}
        <div className="bg-white p-6 rounded-2xl border border-[#E8E2D2] space-y-4">
          <h3 className="font-bold text-stone-800 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-amber-600" /> Penilaian Tugas
          </h3>
          {submissions.length === 0 ? (
            <p className="text-xs text-stone-500 italic">Belum ada tugas yang dikumpulkan.</p>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <div key={sub.id} className="p-3 border rounded-xl border-[#E8E2D2] bg-stone-50/50 flex flex-col gap-2">
                  <div className="flex justify-between items-center w-full">
                  <div>
                    <p className="text-sm font-bold text-stone-800">{sub.moduleItem.title}</p>
                    <p className="text-xs text-stone-500">{sub.moduleItem.module.title}</p>
                    <p className="text-[10px] text-stone-400 mt-1">{sub.submittedAt.toLocaleDateString('id-ID')} {sub.submittedAt.toLocaleTimeString('id-ID')}</p>
                  </div>
                  <div className="text-right">
                    {sub.grade !== null ? (
                      <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 inline-block">
                        Nilai: {sub.grade}
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-stone-100 text-stone-600 inline-block">
                        Menunggu Penilaian
                      </span>
                    )}
                  </div>
                  </div>
                  {sub.feedback && (() => {
                    const annotatedUrls = Array.from(new Set(sub.feedback.match(/\/uploads\/annotated\/[^\s\)\"\']+/g) || []));
                    const cleanFeedback = sub.feedback
                      .replace(/!?\[.*?\]\(\/uploads\/annotated\/[^\)]+\)/g, '')
                      .replace(/\/uploads\/annotated\/[^\s\)\"\']+/g, '')
                      .trim();

                    return (
                      <div className="mt-1 p-2.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 w-full space-y-1.5">
                        <strong className="block mb-0.5 text-blue-900">Catatan Guru:</strong>
                        {cleanFeedback && <p>{cleanFeedback}</p>}
                        {annotatedUrls.length > 0 && (
                          <div className="pt-1 flex flex-wrap gap-2">
                            {annotatedUrls.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-100 hover:bg-blue-200 text-xs text-blue-800 font-bold transition"
                              >
                                <span>🖼️ Lembar Koreksi #{idx + 1}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

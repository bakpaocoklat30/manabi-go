import React from 'react';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  BookOpen, 
  HelpCircle, 
  FileText, 
  ExternalLink, 
  ArrowRight, 
  Award, 
  CheckCircle2, 
  Clock, 
  FolderGit2
} from 'lucide-react';

export default async function SiswaDashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  // 1. Ambil data modul yang dibuka untuk kelas siswa ini
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      kelas: {
        include: {
          modules: {
            orderBy: { publishAt: 'asc' },
            include: {
              module: {
                include: {
                  items: true,
                  quizzes: {
                    include: {
                      attempts: {
                        where: { studentId: userId },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      quizAttempts: true,
      submissions: true,
    },
  });

  const assignedModules = user?.kelas?.modules.map((m) => m.module) || [];
  const totalSubmissions = user?.submissions.length || 0;
  const totalQuizzesPassed = user?.quizAttempts.filter((q) => q.score >= 75).length || 0;

  return (
    <div className="space-y-8">
      {/* Banner Sambutan Siswa */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-50 via-white to-blue-50 border border-[#E8E2D2] p-6 sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 mb-3">
            🎌 こんにちは (Konnichiwa)
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Selamat Datang, {user?.name}!
          </h1>
          <p className="text-sm text-stone-600 mt-2 leading-relaxed">
            Lanjutkan progres pembelajaran Bahasa Jepang kejuruanmu secara mandiri. Tonton video tutorial, pelajari etos kerja industri, dan selesaikan tugas harian.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {user?.kelas?.driveFolderUrl && (
              <a
                href={user.kelas.driveFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-md shadow-blue-600/20"
              >
                <FolderGit2 className="w-4 h-4" />
                <span>Buka Google Drive Kelas</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Ringkasan Metrik Siswa */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E8E2D2] rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-600/15 border border-red-500/20 flex items-center justify-center text-red-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-medium">Modul Tersedia</p>
            <h3 className="text-xl font-bold text-stone-800">{assignedModules.length} Modul</h3>
          </div>
        </div>

        <div className="bg-white border border-[#E8E2D2] rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-600/15 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-medium">Kuis Lulus (KKM 75)</p>
            <h3 className="text-xl font-bold text-stone-800">{totalQuizzesPassed} Evaluasi</h3>
          </div>
        </div>

        <div className="bg-white border border-[#E8E2D2] rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-medium">Tugas Terunggah</p>
            <h3 className="text-xl font-bold text-stone-800">{totalSubmissions} Berkas</h3>
          </div>
        </div>
      </div>

      {/* Daftar Modul Pembelajaran */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-stone-800">Daftar Modul Pembelajaran</h2>
            <p className="text-xs text-stone-500">
              Pilih bab pembelajaran aktif sesuai jadwal mata pelajaran STM ADB
            </p>
          </div>
        </div>

        {assignedModules.length === 0 ? (
          <div className="text-center py-12 bg-white/50 rounded-2xl border border-[#E8E2D2]">
            <p className="text-sm text-stone-500">Belum ada modul yang ditugaskan untuk kelas kamu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {user?.kelas?.modules.map((mk) => {
              const module = mk.module;
              const quiz = module.quizzes[0];
              const latestAttempt = quiz?.attempts?.[0];
              // Jika publishAt null, artinya langsung rilis (tidak terkunci)
              const isLocked = mk.publishAt ? new Date(mk.publishAt) > new Date() : false;

              return (
                <div
                  key={module.id}
                  className="bg-white border border-[#E8E2D2] hover:border-stone-300 rounded-2xl p-6 transition-all duration-200"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-600 border border-red-200">
                          Pekan {module.weekNumber}
                        </span>
                        <span className="text-xs text-stone-500 flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-stone-400" />
                          {module.items.length} Bagian Konten
                        </span>
                        {mk.dueDate && (
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${new Date() > new Date(mk.dueDate) ? 'bg-red-50 text-red-600 border-red-200 font-bold' : 'bg-amber-50 text-amber-700 border-amber-200 font-bold'}`}>
                            <Clock className="w-3 h-3" />
                            {new Date() > new Date(mk.dueDate) ? 'Ditutup: ' : 'Batas: '} 
                            {new Date(mk.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} {new Date(mk.dueDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-stone-800">
                        {module.title}
                      </h3>
                      <p className="text-xs text-stone-500 line-clamp-2 max-w-3xl">
                        {module.description}
                      </p>
                    </div>

                    {/* Status Kuis & Action Link */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#E8E2D2]">
                      {quiz && (
                        <div className="text-right">
                          {latestAttempt ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Skor: {latestAttempt.score}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
                              <Clock className="w-3.5 h-3.5" />
                              Kuis Belum Dikerjakan
                            </span>
                          )}
                        </div>
                      )}

                      
                      {isLocked ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-500 text-xs font-bold">
                          <span className="text-lg">🔒</span>
                          <span>Terkunci (Jadwal: {mk.publishAt ? new Date(mk.publishAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : 'Draft'})</span>
                        </div>
                      ) : (
                        <Link
                          href={`/siswa/modules/${module.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C62828] hover:bg-[#B71C1C] text-white text-xs font-bold transition shadow-md shadow-red-600/20"
                        >
                          <span>Mulai Belajar</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
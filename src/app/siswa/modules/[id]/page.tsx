import React from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import YoutubeEmbed from '@/components/shared/YoutubeEmbed';
import DriveUploadCard from '@/components/shared/DriveUploadCard';
import ClientAccessTracker from '@/components/shared/ClientAccessTracker';
import { 
  ArrowLeft, 
  HelpCircle, 
  PlayCircle, 
  BookOpen, 
  Briefcase, 
  Sparkles, 
  Clock, 
  FileEdit,
  CheckCircle2
} from 'lucide-react';

interface ModulePageProps {
  params: Promise<{ id: string }>;
}

export default async function SiswaModuleDetailPage({ params }: ModulePageProps) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect('/login');
  }

  const { id } = await params;

  // Query Modul beserta Item Konten dan Status Submission Siswa
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { kelas: true } });
  const userKelasIds = user?.kelas?.id ? [user.kelas.id] : [];

  const learningModule = await prisma.learningModule.findUnique({
    where: { id },
    include: {
      items: {
        orderBy: { orderIndex: 'asc' },
        include: {
          submissions: {
            where: { studentId: userId },
          },
        },
      },
      quizzes: {
        include: {
          attempts: {
            where: { studentId: userId },
            orderBy: { score: 'desc' },
          },
        },
      },
      assignedTo: {
        include: {
          kelas: true,
        },
      },
    },
  });

  // Cek ketersediaan jadwal
  // Cek apakah ada jadwal untuk kelas siswa ini, dan jika publishAt null = langsung rilis
  const isAccessible = learningModule?.assignedTo.some(a => !a.publishAt || new Date(a.publishAt) <= new Date());
  const myAssignment = learningModule?.assignedTo.find(a => userKelasIds.includes(a.kelasId));
  const dueDate = myAssignment?.dueDate ? new Date(myAssignment.dueDate) : null;
  if (!learningModule || !isAccessible) {
    notFound();
  }

  const defaultFolderUrl =
    learningModule.assignedTo[0]?.kelas.driveFolderUrl || 'https://drive.google.com';

  const quiz = learningModule.quizzes[0];
  const bestAttempt = quiz?.attempts[0];
  const attemptsCount = quiz?.attempts?.length || 0;
  const isRetakeBlocked = attemptsCount > 0 && (quiz?.allowRetake === false || attemptsCount >= (quiz?.maxRetakes || 3));

  return (
    <div className="space-y-8 pb-12">
      <ClientAccessTracker moduleId={learningModule.id} />
      {/* Tombol Kembali & Header Modul */}
      <div>
        <Link
          href="/siswa"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard</span>
        </Link>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600/20 text-red-400 border border-red-700/40">
              Pekan {learningModule.weekNumber}
            </span>
            {dueDate && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${new Date() > new Date(dueDate) ? 'bg-red-500/20 text-red-400 border-red-700/40' : 'bg-amber-500/20 text-amber-400 border-amber-700/40'}`}>
                <Clock className="w-3.5 h-3.5" />
                {new Date() > new Date(dueDate) ? 'Tenggat Terlewat: ' : 'Tenggat Waktu: '}
                {new Date(dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} {new Date(dueDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <span className="text-xs text-slate-400">
              SMKN 1 Adiwerna (STM ADB)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {learningModule.title}
          </h1>
          {learningModule.description && (
            <p className="text-sm text-slate-300 mt-2 max-w-4xl leading-relaxed">
              {learningModule.description}
            </p>
          )}
        </div>
      </div>

      {/* Konten Materi Berurutan */}
      <div className="space-y-6">
        {learningModule.items.map((item, index) => {
          return (
            <section
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4"
            >
              {/* Badge & Judul Item */}
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <span className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs">
                  {index + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    {item.type === 'BUDAYA_KERJA' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800 text-amber-400">
                        Budaya Kerja Industri (5S)
                      </span>
                    )}
                    {item.type === 'KOTOBA_TEKNIS' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800 text-blue-400">
                        Kosakata Bengkel / Otomotif
                      </span>
                    )}
                    {item.type === 'YOUTUBE_TUTORIAL' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-950/60 border border-red-800 text-red-400">
                        Video Panduan Guratan
                      </span>
                    )}
                    {item.type === 'TUGAS_MENULIS' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400">
                        Praktik Tulisan Tangan
                      </span>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                    {item.title}
                  </h3>
                </div>
              </div>

              {/* Teks Materi Pembelajaran */}
              {item.bodyText && (
                <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed whitespace-pre-line bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
                  {item.bodyText}
                </div>
              )}

              {/* Render Video YouTube jika ada */}
              {item.youtubeUrl && (
                <div className="pt-2">
                  <YoutubeEmbed url={item.youtubeUrl} title={item.title} />
                </div>
              )}

              {/* Render Modul Upload Google Drive untuk Tugas Menulis */}
              {item.type === 'TUGAS_MENULIS' && (
                <div className="pt-2">
                  <DriveUploadCard
                    moduleItemId={item.id}
                    folderUrl={defaultFolderUrl}
                    instruction={
                      item.gdrivePrompt ||
                      'Tuliskan materi di atas pada kertas kotak, lalu upload foto hasil tugas kamu ke folder Shared Google Drive berikut.'
                    }
                    existingSubmission={item.submissions[0] || null}
                  />
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Bagian Evaluasi Kuis Berbatas Waktu */}
      {quiz && (
        <div className="bg-gradient-to-r from-red-950/50 via-slate-900 to-slate-900 border border-red-800/40 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-600 text-white">
                Evaluasi Mandiri
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Batas Waktu: {quiz.timeLimitMinutes} Menit
              </span>
            </div>
            <h3 className="text-xl font-bold text-white">{quiz.title}</h3>
            <p className="text-xs text-slate-300">
              Passing Grade (KKM): {quiz.passingScore} Poin. Kerjakan dengan teliti untuk menguji penguasaan materi pekan ini.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
            {bestAttempt ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Skor Terbaik: {bestAttempt.score} / 100</span>
              </div>
            ) : null}

            {isRetakeBlocked ? (
              <div className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold cursor-not-allowed w-full sm:w-auto border border-slate-700" title="Batas maksimal pengulangan telah habis">
                <FileEdit className="w-4 h-4 opacity-50" />
                <span>Pengulangan Ditutup</span>
              </div>
            ) : (
              <Link
                href={`/siswa/quiz/${quiz.id}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-lg shadow-red-600/30 w-full sm:w-auto"
              >
                <FileEdit className="w-4 h-4" />
                <span>{bestAttempt ? 'Kerjakan Ulang Kuis' : 'Mulai Uji Pemahaman'}</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
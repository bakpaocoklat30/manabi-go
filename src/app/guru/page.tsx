import React from 'react';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  Users, 
  BookOpen, 
  FileCheck2, 
  Award, 
  FolderGit2, 
  ExternalLink, 
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';

export default async function GuruDashboardPage() {
  const session = await auth();
  const teacherId = session?.user?.id;

  // Query agregasi data riil dari PostgreSQL
  const [totalStudents, totalModules, pendingTasks, classes] = await Promise.all([
    prisma.user.count({ where: { role: 'SISWA' } }),
    prisma.learningModule.count(),
    prisma.taskSubmission.count({ where: { grade: null } }),
    prisma.kelas.findMany({
      include: {
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  // Ambil 5 submission tugas menulis terbaru
  const recentSubmissions = await prisma.taskSubmission.findMany({
    take: 5,
    orderBy: { submittedAt: 'desc' },
    include: {
      student: { include: { kelas: true } },
      moduleItem: { include: { module: true } },
    },
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Banner Selamat Datang Sensei */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-50 via-white to-red-50 border border-[#E8E2D2] p-6 sm:p-8">
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 mb-3">
            🎌 先生ダッシュボード (Sensei Dashboard)
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Pantau Progres Siswa STM ADB Secara Mandiri
          </h1>
          <p className="text-sm text-stone-600 mt-2 leading-relaxed">
            Meskipun Anda sedang bertugas atau menempuh studi di Jepang, materi kejuruan otomotif, 
            tata bahasa, dan etos kerja industri tetap tersampaikan secara terstruktur dan terukur.
          </p>
        </div>
      </div>

      {/* KPI Cards Ringkasan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E8E2D2] rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-medium">Total Siswa Aktif</p>
            <h3 className="text-2xl font-bold text-stone-800">{totalStudents} Siswa</h3>
          </div>
        </div>

        <div className="bg-white border border-[#E8E2D2] rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-600/15 border border-red-500/20 flex items-center justify-center text-red-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-medium">Modul Pembelajaran</p>
            <h3 className="text-2xl font-bold text-stone-800">{totalModules} Bab</h3>
          </div>
        </div>

        <div className="bg-white border border-[#E8E2D2] rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-600/15 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-medium">Tugas Menunggu Nilai</p>
            <h3 className="text-2xl font-bold text-amber-400">{pendingTasks} Berkas</h3>
          </div>
        </div>
      </div>

      {/* Folder Google Drive Per Kelas */}
      <div className="bg-white border border-[#E8E2D2] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8E2D2] pb-4">
          <div>
            <h3 className="text-base font-bold text-stone-800 flex items-center gap-2">
              <FolderGit2 className="w-5 h-5 text-blue-500" />
              Shared Folder Google Drive Kelas
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Tautan cepat menuju repositori foto tugas tulisan tangan yang diunggah siswa per kelas
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((c) => (
            <div
              key={c.id}
              className="bg-stone-50 border border-[#E8E2D2] hover:border-stone-300 p-4 rounded-xl flex items-center justify-between transition"
            >
              <div>
                <h4 className="text-sm font-bold text-stone-800">{c.name}</h4>
                <p className="text-[11px] text-stone-500">{c.jurusan}</p>
                <span className="text-[10px] text-blue-400 font-mono mt-1 block">
                  {c._count.students} Siswa Terdaftar
                </span>
              </div>
              {c.driveFolderUrl ? (
                <a
                  href={c.driveFolderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition"
                  title="Buka Folder Google Drive"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <span className="text-[10px] text-stone-500 italic">Belum Ada Link</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Antrean Pengumpulan Tugas Menulis Terbaru */}
      <div className="bg-white border border-[#E8E2D2] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8E2D2] pb-4">
          <div>
            <h3 className="text-base font-bold text-stone-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Antrean Pengumpulan Tugas Tulisan Tangan Terbaru
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Siswa yang baru saja mengirimkan tautan foto tulisan ke Google Drive
            </p>
          </div>
          <Link
            href="/guru/evaluations"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 transition"
          >
            <span>Buka Semua Antrean</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentSubmissions.length === 0 ? (
          <div className="text-center py-8 text-stone-400 text-xs">
            Belum ada tugas tulisan yang diserahkan oleh siswa.
          </div>
        ) : (
          <div className="divide-y divide-[#E8E2D2]">
            {recentSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-stone-800">{sub.student.name}</span>
                    <span className="text-[11px] font-mono text-stone-500">({sub.student.identifier})</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 border border-blue-200 text-blue-700">
                      {sub.student.kelas?.name}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Modul: {sub.moduleItem.module.title} — {sub.moduleItem.title}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {sub.grade !== null ? (
                    <span className="px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-bold">
                      Nilai: {sub.grade}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold">
                      Belum Dinilai
                    </span>
                  )}
                  <Link
                    href="/guru/evaluations"
                    className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition"
                  >
                    Koreksi
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
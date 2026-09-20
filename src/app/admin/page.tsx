import React from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { 
  Server, 
  Users, 
  GraduationCap, 
  School, 
  BookOpen, 
  CheckCircle2, 
  Database,
  Cpu
} from 'lucide-react';

export default async function AdminDashboardPage() {
  const [
    totalStudents,
    totalTeachers,
    totalClasses,
    totalModules,
    totalSubmissions,
    totalQuizAttempts,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'SISWA' } }),
    prisma.user.count({ where: { role: 'GURU' } }),
    prisma.kelas.count(),
    prisma.learningModule.count(),
    prisma.taskSubmission.count(),
    prisma.quizAttempt.count(),
  ]);

  return (
    <div className="space-y-8 pb-12">
      {/* Banner System Status */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-50 via-white to-white border border-slate-200 p-6 sm:p-8">
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Sistem Berjalan Normal • Docker Environment
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Status Infrastruktur Manabi Go
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Semua kontainer web service dan PostgreSQL database berjalan sinkron. Server siap melayani sesi asinkron siswa SMKN 1 Adiwerna secara simultan.
          </p>
        </div>
      </div>

      {/* Grid Metrik Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Siswa Terdaftar</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">{totalStudents}</h3>
          <p className="text-[11px] text-slate-400">Akun siswa aktif dengan NISN</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Guru / Pengajar</span>
            <GraduationCap className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">{totalTeachers}</h3>
          <p className="text-[11px] text-slate-400">Akun pengajar dengan NIP</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Kelas / Rombel</span>
            <School className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">{totalClasses}</h3>
          <p className="text-[11px] text-slate-400">Jurusan STM ADB aktif</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Modul Pembelajaran</span>
            <BookOpen className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">{totalModules}</h3>
          <p className="text-[11px] text-slate-400">Bab materi tersusun</p>
        </div>
      </div>

      {/* Info Database & Container Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Metrik PostgreSQL Database
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500">Total Pengumpulan Tugas Google Drive</span>
              <span className="font-mono font-bold text-slate-900">{totalSubmissions} Berkas</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500">Total Percobaan Kuis Evaluasi</span>
              <span className="font-mono font-bold text-slate-900">{totalQuizAttempts} Sesi</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500">Database Driver & ORM</span>
              <span className="font-mono font-bold text-emerald-600">Prisma Client 5.22</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-red-600" />
            Konfigurasi Runtime Server
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500">Arsitektur Host Target</span>
              <span className="font-mono font-bold text-slate-900">Apple Silicon / ARM64 & Linux AMD64</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500">Framework Application</span>
              <span className="font-mono font-bold text-slate-900">Next.js 15 App Router</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500">Containerization</span>
              <span className="font-mono font-bold text-emerald-600">Docker Compose Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
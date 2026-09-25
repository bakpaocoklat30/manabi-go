'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardList, 
  Search, 
  Loader2, 
  Download,
  AlertCircle,
  Filter,
  Layers,
  Award,
  CheckCircle2,
  Clock,
  XCircle,
  User,
  BookOpen,
  TrendingUp,
  Eye,
  X,
  FileText,
  HelpCircle,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  ImageIcon,
  ExternalLink,
  PenTool,
  Check,
  Headphones
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Helper mengekstrak seluruh URL lampiran tugas siswa (baik single driveFileUrl maupun multi fileUrls)
function getSubmissionUrls(sub: any): string[] {
  if (!sub) return [];
  if (sub.fileUrls) {
    if (Array.isArray(sub.fileUrls)) {
      const arr = sub.fileUrls.filter(Boolean);
      if (arr.length > 0) return arr;
    }
    if (typeof sub.fileUrls === 'string') {
      try {
        const parsed = JSON.parse(sub.fileUrls);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter(Boolean);
        }
      } catch {
        if (sub.fileUrls.trim().length > 0) {
          return [sub.fileUrls];
        }
      }
    }
  }
  return sub.driveFileUrl ? [sub.driveFileUrl] : [];
}

// Helper mengekstrak seluruh URL gambar hasil koreksi guru (anotasi) dari field feedback
function getAnnotatedUrls(feedback: string | null | undefined): string[] {
  if (!feedback) return [];
  const regex = /\/uploads\/annotated\/[^\s\)\"\']+/g;
  const matches = feedback.match(regex);
  if (!matches) return [];
  return Array.from(new Set(matches));
}

// Helper membersihkan teks feedback dari format markdown gambar koreksi
function getCleanFeedback(feedback: string | null | undefined): string {
  if (!feedback) return '';
  return feedback
    .replace(/!?\[.*?\]\(\/uploads\/annotated\/[^\)]+\)/g, '')
    .replace(/\/uploads\/annotated\/[^\s\)\"\']+/g, '')
    .trim();
}

function getPreviewUrl(url: string) {
  if (!url) return '';
  return url.replace('/view', '/preview').replace('?usp=drivesdk', '');
}

export default function GuruRekapPage() {
  const [data, setData] = useState<{ modules: any[], students: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKelas, setFilterKelas] = useState('ALL');
  const [filterModuleId, setFilterModuleId] = useState('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'TUGAS' | 'KUIS' | 'KUIS_PILGAN' | 'KUIS_LISTENING' | 'KUIS_ESSAY'>('ALL');
  
  // Student Detail Modal
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);

  // Modal Preview Gambar Tugas Siswa & Lembar Koreksi Guru
  const [selectedSubmissionPreview, setSelectedSubmissionPreview] = useState<{
    studentName: string;
    taskTitle: string;
    moduleTitle: string;
    grade?: number | null;
    notes?: string | null;
    feedback?: string | null;
    annotatedUrls: string[]; // Hasil coretan koreksi guru
    originalUrls: string[];  // Berkas asli kiriman siswa
    submissionId?: string;
  } | null>(null);

  const [previewMode, setPreviewMode] = useState<'CORRECTION' | 'ORIGINAL'>('CORRECTION');
  const [previewCorrectionIndex, setPreviewCorrectionIndex] = useState(0);
  const [previewOriginalIndex, setPreviewOriginalIndex] = useState(0);

  // Saat membuka pratinjau: jika ada koreksi guru, utamakan HASIL KOREKSI TERAKHIR!
  useEffect(() => {
    if (!selectedSubmissionPreview) return;

    if (selectedSubmissionPreview.annotatedUrls.length > 0) {
      setPreviewMode('CORRECTION');
      // Otomatis arahkan ke hasil koreksi TERAKHIR jika guru mengoreksi 2 kali atau lebih!
      setPreviewCorrectionIndex(selectedSubmissionPreview.annotatedUrls.length - 1);
      setPreviewOriginalIndex(0);
    } else {
      setPreviewMode('ORIGINAL');
      setPreviewCorrectionIndex(0);
      setPreviewOriginalIndex(0);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedSubmissionPreview(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSubmissionPreview]);

  // URL gambar/berkas yang sedang aktif ditampilkan pada modal
  const currentActiveUrl = useMemo(() => {
    if (!selectedSubmissionPreview) return '';
    if (previewMode === 'CORRECTION') {
      const ann = selectedSubmissionPreview.annotatedUrls;
      if (ann.length > 0) {
        const safeIdx = Math.max(0, Math.min(previewCorrectionIndex, ann.length - 1));
        return ann[safeIdx];
      }
    }
    const orig = selectedSubmissionPreview.originalUrls;
    const safeIdx = Math.max(0, Math.min(previewOriginalIndex, orig.length - 1));
    return orig[safeIdx] || '';
  }, [selectedSubmissionPreview, previewMode, previewCorrectionIndex, previewOriginalIndex]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/guru/rekap', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // List unique classes
  const uniqueKelas = useMemo(() => {
    if (!data?.students) return [];
    return Array.from(new Set(data.students.map(s => s.kelas?.name).filter(Boolean))).sort() as string[];
  }, [data]);

  // Filtered Modules according to module filter
  const visibleModules = useMemo(() => {
    if (!data?.modules) return [];
    if (filterModuleId === 'ALL') return data.modules;
    return data.modules.filter(m => m.id === filterModuleId);
  }, [data, filterModuleId]);

  // Compute all visible items (columns) based on filters
  const visibleColumns = useMemo(() => {
    const cols: {
      type: 'TUGAS' | 'KUIS';
      quizType?: string; // 'MULTIPLE_CHOICE' | 'LISTENING' | 'ESSAY'
      id: string;
      title: string;
      moduleTitle: string;
      moduleId: string;
      passingScore?: number;
    }[] = [];

    visibleModules.forEach(mod => {
      if (filterType === 'ALL' || filterType === 'TUGAS') {
        (mod.items || []).forEach((item: any) => {
          cols.push({
            type: 'TUGAS',
            id: item.id,
            title: item.title,
            moduleTitle: mod.title,
            moduleId: mod.id,
          });
        });
      }
      if (filterType === 'ALL' || filterType === 'KUIS' || filterType.startsWith('KUIS_')) {
        (mod.quizzes || []).forEach((quiz: any) => {
          const qType = quiz.quizType || 'MULTIPLE_CHOICE';
          if (filterType === 'KUIS_PILGAN' && qType !== 'MULTIPLE_CHOICE') return;
          if (filterType === 'KUIS_LISTENING' && qType !== 'LISTENING') return;
          if (filterType === 'KUIS_ESSAY' && qType !== 'ESSAY') return;

          cols.push({
            type: 'KUIS',
            quizType: qType,
            id: quiz.id,
            title: quiz.title,
            moduleTitle: mod.title,
            moduleId: mod.id,
            passingScore: quiz.passingScore || 75,
          });
        });
      }
    });

    return cols;
  }, [visibleModules, filterType]);

  // Filtered Students list based on search and class filter
  const filteredStudents = useMemo(() => {
    if (!data?.students) return [];
    return data.students.filter(student => {
      const matchSearch = 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (student.identifier && student.identifier.includes(searchTerm));
      const matchKelas = filterKelas === 'ALL' || student.kelas?.name === filterKelas;
      return matchSearch && matchKelas;
    });
  }, [data, searchTerm, filterKelas]);

  // Compute Summary Statistics per Student
  const studentMetrics = useMemo(() => {
    if (!data) return new Map();

    const map = new Map<string, {
      totalAssigned: number;
      totalSubmitted: number;
      totalGraded: number;
      avgGrade: number;
      isPassed: boolean;
      pendingGradesCount: number;
    }>();

    const allModules = data.modules || [];
    let totalAssignmentsCount = 0;
    allModules.forEach(m => {
      totalAssignmentsCount += (m.items?.length || 0) + (m.quizzes?.length || 0);
    });

    data.students.forEach(student => {
      let sumScores = 0;
      let gradedCount = 0;
      let submittedCount = 0;
      let pendingGrades = 0;

      allModules.forEach(mod => {
        // Check tasks
        (mod.items || []).forEach((item: any) => {
          const sub = (student.submissions || []).find((s: any) => s.moduleItemId === item.id);
          if (sub) {
            submittedCount++;
            if (typeof sub.grade === 'number') {
              sumScores += sub.grade;
              gradedCount++;
            } else {
              pendingGrades++;
            }
          }
        });

        // Check quizzes
        (mod.quizzes || []).forEach((quiz: any) => {
          const attempts = (student.quizAttempts || []).filter((a: any) => a.quizId === quiz.id);
          if (attempts.length > 0) {
            submittedCount++;
            // Ambil skor tertinggi
            const bestScore = Math.max(...attempts.map((a: any) => a.score ?? 0));
            sumScores += bestScore;
            gradedCount++;
          }
        });
      });

      const avg = gradedCount > 0 ? Math.round(sumScores / gradedCount) : 0;
      const isPassed = avg >= 75 && gradedCount >= Math.ceil(totalAssignmentsCount * 0.7);

      map.set(student.id, {
        totalAssigned: totalAssignmentsCount,
        totalSubmitted: submittedCount,
        totalGraded: gradedCount,
        avgGrade: avg,
        isPassed,
        pendingGradesCount: pendingGrades
      });
    });

    return map;
  }, [data]);

  // Overall Classroom KPIs
  const classroomKPIs = useMemo(() => {
    if (!filteredStudents.length) {
      return { totalStudents: 0, classAverage: 0, passRate: 0, pendingTasks: 0 };
    }

    let totalScoreSum = 0;
    let studentsWithScores = 0;
    let passedCount = 0;
    let totalPending = 0;

    filteredStudents.forEach(s => {
      const metric = studentMetrics.get(s.id);
      if (metric) {
        if (metric.totalGraded > 0) {
          totalScoreSum += metric.avgGrade;
          studentsWithScores++;
        }
        if (metric.isPassed) {
          passedCount++;
        }
        totalPending += metric.pendingGradesCount;
      }
    });

    return {
      totalStudents: filteredStudents.length,
      classAverage: studentsWithScores > 0 ? Math.round(totalScoreSum / studentsWithScores) : 0,
      passRate: filteredStudents.length > 0 ? Math.round((passedCount / filteredStudents.length) * 100) : 0,
      pendingTasks: totalPending
    };
  }, [filteredStudents, studentMetrics]);

  // Export to Excel with proper formatting
  const handleExportExcel = () => {
    if (!data) return;

    // Header row
    const headers = ['NISN', 'Nama Siswa', 'Kelas', 'Rata-rata Nilai', 'Status Tuntas'];
    const columnsToExport = visibleColumns;

    columnsToExport.forEach(col => {
      let typeLabel = '[TUGAS]';
      if (col.type === 'KUIS') {
        if (col.quizType === 'LISTENING') typeLabel = '[KUIS LISTENING]';
        else if (col.quizType === 'ESSAY') typeLabel = '[KUIS ESAI]';
        else typeLabel = '[KUIS PILGAN]';
      }
      headers.push(`${typeLabel} ${col.moduleTitle} - ${col.title}`);
    });

    // Rows
    const rows = filteredStudents.map(student => {
      const metric = studentMetrics.get(student.id);
      const rowData: any = {
        'NISN': student.identifier,
        'Nama Siswa': student.name,
        'Kelas': student.kelas?.name || '-',
        'Rata-rata Nilai': metric?.avgGrade || 0,
        'Status Tuntas': metric?.isPassed ? 'TUNTAS' : 'REMEDIAL'
      };

      columnsToExport.forEach((col, i) => {
        const headerKey = headers[5 + i];
        if (col.type === 'TUGAS') {
          const submission = student.submissions.find((s: any) => s.moduleItemId === col.id);
          rowData[headerKey] = typeof submission?.grade === 'number' ? submission.grade : (submission ? 'Menunggu Nilai' : '-');
        } else {
          const attempts = student.quizAttempts.filter((a: any) => a.quizId === col.id);
          if (attempts.length > 0) {
            const best = Math.max(...attempts.map((a: any) => a.score ?? 0));
            const maxCheat = Math.max(...attempts.map((a: any) => a.cheatCount || 0));
            rowData[headerKey] = maxCheat > 0 ? `${best} (${maxCheat}x Curang)` : best;
          } else {
            rowData[headerKey] = '-';
          }
        }
      });

      return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Nilai Siswa");
    
    const classNameSuffix = filterKelas === 'ALL' ? 'Semua_Kelas' : filterKelas.replace(/\s+/g, '_');
    XLSX.writeFile(workbook, `Rekap_Nilai_ManabiGo_${classNameSuffix}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-xs text-slate-400 font-mono">Mengambil data rekap nilai & portofolio siswa...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-slate-400">Gagal memuat data rekapitulasi nilai.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-[100vw] overflow-x-hidden">
      {/* Header Utama */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
              <ClipboardList className="w-3.5 h-3.5" />
              Buku Nilai & Portofolio Guru
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">Rekapitulasi Nilai Siswa</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Tinjau seluruh perolehan nilai tugas praktik menulis dan kuis evaluasi. Gunakan filter modul untuk membaca tugas secara spesifik tanpa perlu scroll horizontal berlebihan.
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          <span>Export Excel (.xlsx)</span>
        </button>
      </div>

      {/* Ringkasan Statistik Cepat (KPI Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Siswa</span>
            <div className="text-xl font-black text-white font-mono">{classroomKPIs.totalStudents} <span className="text-xs font-normal text-slate-500">anak</span></div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Rata-rata Kelas</span>
            <div className="text-xl font-black text-emerald-400 font-mono">{classroomKPIs.classAverage} <span className="text-xs font-normal text-slate-500">/ 100</span></div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Tuntas KKM</span>
            <div className="text-xl font-black text-purple-300 font-mono">{classroomKPIs.passRate}% <span className="text-xs font-normal text-slate-500">lulus</span></div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Perlu Koreksi</span>
            <div className="text-xl font-black text-amber-400 font-mono">{classroomKPIs.pendingTasks} <span className="text-xs font-normal text-slate-500">tugas</span></div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar Interaktif */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            Filter & Tata Letak Kolom
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Menampilkan: <strong className="text-slate-300">{visibleColumns.length}</strong> kolom evaluasi
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Pencarian Siswa */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari nama atau NISN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* 2. Filter Kelas */}
          <div>
            <select
              value={filterKelas}
              onChange={(e) => setFilterKelas(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Semua Kelas ({data.students.length} Siswa)</option>
              {uniqueKelas.map(k => (
                <option key={k} value={k}>Kelas: {k}</option>
              ))}
            </select>
          </div>

          {/* 3. Filter Modul (Solusi utama jika tugas sangat banyak) */}
          <div>
            <select
              value={filterModuleId}
              onChange={(e) => setFilterModuleId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-blue-400 text-xs font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Semua Modul Pembelajaran ({data.modules.length} Modul)</option>
              {data.modules.map((m, idx) => (
                <option key={m.id} value={m.id}>
                  Modul #{idx + 1}: {m.title}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Filter Tipe Evaluasi */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">Semua Evaluasi (Tugas & Seluruh Kuis)</option>
              <option value="TUGAS">📝 Hanya Tugas Praktik Menulis</option>
              <option value="KUIS">🎯 Semua Kuis Evaluasi</option>
              <option value="KUIS_PILGAN">🔘 Hanya Kuis Pilihan Ganda</option>
              <option value="KUIS_LISTENING">🎧 Hanya Kuis Listening (Choukai)</option>
              <option value="KUIS_ESSAY">✍️ Hanya Kuis Isian / Esai</option>
            </select>
          </div>
        </div>

        {/* Info Aktif Filter */}
        {filterModuleId !== 'ALL' && (
          <div className="flex items-center justify-between text-[11px] bg-blue-950/40 border border-blue-900/60 px-3 py-1.5 rounded-lg text-blue-300">
            <span>
              Sedang difokuskan pada: <strong>{data.modules.find(m => m.id === filterModuleId)?.title}</strong>
            </span>
            <button 
              onClick={() => setFilterModuleId('ALL')}
              className="text-xs font-bold underline hover:text-white"
            >
              Tampilkan Semua Modul Kembali
            </button>
          </div>
        )}
      </div>

      {/* Tabel Matrix Nilai Berjenjang */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              {/* Header Tingkat 1: Kelompok Modul & Identitas */}
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px]">
                <th className="px-3 py-3 font-bold text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-950 border-r border-slate-800 z-20 w-10 text-center">
                  No
                </th>
                <th className="px-4 py-3 font-bold text-slate-400 uppercase tracking-wider sticky left-10 bg-slate-950 border-r border-slate-800 z-20 min-w-[200px]">
                  Informasi Siswa
                </th>
                <th className="px-3 py-3 font-bold text-slate-300 uppercase tracking-wider sticky left-[240px] bg-slate-950 border-r-2 border-slate-700 z-20 text-center min-w-[90px] shadow-sm">
                  Rata-rata
                </th>

                {/* Kolom Modul Groups */}
                {visibleModules.map((mod, modIdx) => {
                  const itemsCount = (filterType === 'ALL' || filterType === 'TUGAS') ? (mod.items?.length || 0) : 0;
                  const quizzesCount = (filterType === 'ALL' || filterType === 'KUIS' || filterType.startsWith('KUIS_'))
                    ? (mod.quizzes || []).filter((q: any) => {
                        const qt = q.quizType || 'MULTIPLE_CHOICE';
                        if (filterType === 'KUIS_PILGAN') return qt === 'MULTIPLE_CHOICE';
                        if (filterType === 'KUIS_LISTENING') return qt === 'LISTENING';
                        if (filterType === 'KUIS_ESSAY') return qt === 'ESSAY';
                        return true;
                      }).length
                    : 0;
                  const totalColspan = itemsCount + quizzesCount;

                  if (totalColspan === 0) return null;

                  return (
                    <th 
                      key={mod.id} 
                      colSpan={totalColspan} 
                      className={`px-3 py-2 text-center border-r-2 border-slate-700 font-bold ${
                        modIdx % 2 === 0 ? 'bg-slate-900/90 text-blue-300' : 'bg-slate-950 text-indigo-300'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[280px]" title={mod.title}>
                          {mod.title}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>

              {/* Header Tingkat 2: Sub-Kolom Tiap Tugas & Kuis */}
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[10px]">
                <th className="sticky left-0 bg-slate-950 border-r border-slate-800 z-20"></th>
                <th className="sticky left-10 bg-slate-950 border-r border-slate-800 z-20"></th>
                <th className="sticky left-[240px] bg-slate-950 border-r-2 border-slate-700 z-20 text-center py-2 text-slate-500 font-semibold">
                  Skala 100
                </th>

                {visibleColumns.map((col) => {
                  const isListening = col.type === 'KUIS' && col.quizType === 'LISTENING';
                  const isEssay = col.type === 'KUIS' && col.quizType === 'ESSAY';

                  return (
                    <th 
                      key={col.id} 
                      className={`px-3 py-2.5 text-center border-r border-slate-800 min-w-[115px] max-w-[140px] font-bold ${
                        col.type === 'TUGAS' 
                          ? 'bg-amber-500/5 text-amber-400' 
                          : isListening
                          ? 'bg-cyan-500/10 text-cyan-300'
                          : isEssay
                          ? 'bg-purple-500/10 text-purple-300'
                          : 'bg-blue-500/5 text-blue-400'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                          col.type === 'TUGAS' 
                            ? 'bg-amber-950 text-amber-300 border border-amber-800' 
                            : isListening
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 shadow-xs'
                            : isEssay
                            ? 'bg-purple-950 text-purple-300 border border-purple-700'
                            : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}>
                          {col.type === 'TUGAS' ? (
                            'Tugas Menulis'
                          ) : isListening ? (
                            <>
                              <Headphones className="w-2.5 h-2.5 text-cyan-400" />
                              <span>Listening</span>
                            </>
                          ) : isEssay ? (
                            <>
                              <PenTool className="w-2.5 h-2.5 text-purple-400" />
                              <span>Esai</span>
                            </>
                          ) : (
                            '🔘 Pilgan'
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          KKM {col.passingScore}
                        </span>
                        <span className="truncate w-full text-white text-[11px] font-medium" title={col.title}>
                          {col.title}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/80 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + 3} className="px-6 py-12 text-center text-xs text-slate-500">
                    <User className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
                    Tidak ada siswa yang sesuai dengan filter atau kata kunci pencarian.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const metric = studentMetrics.get(student.id);
                  const avg = metric?.avgGrade || 0;

                  return (
                    <tr key={student.id} className="hover:bg-slate-800/40 transition group">
                      {/* 1. Kolom No */}
                      <td className="px-3 py-3 text-center text-slate-500 sticky left-0 bg-slate-900 border-r border-slate-800 z-10 group-hover:bg-slate-800/90 font-mono text-[11px]">
                        {idx + 1}
                      </td>

                      {/* 2. Informasi Siswa */}
                      <td className="px-4 py-3 sticky left-10 bg-slate-900 border-r border-slate-800 z-10 group-hover:bg-slate-800/90">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <button
                              onClick={() => setSelectedStudentDetail(student)}
                              className="font-bold text-white text-xs hover:text-blue-400 text-left transition truncate block"
                              title="Klik untuk melihat detail rapor siswa"
                            >
                              {student.name}
                            </button>
                            <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5 font-mono">
                              <span className="text-slate-300 font-semibold">{student.kelas?.name || '-'}</span>
                              <span>•</span>
                              <span>{student.identifier}</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => setSelectedStudentDetail(student)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-blue-400 transition"
                            title="Buka Lembar Rapor Lengkap"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* 3. Kolom Rata-rata Siswa */}
                      <td className="px-3 py-3 sticky left-[240px] bg-slate-900 border-r-2 border-slate-700 z-10 text-center group-hover:bg-slate-800/90 shadow-xs">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-black font-mono ${
                          avg >= 75 
                            ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300' 
                            : avg > 0 
                            ? 'bg-amber-950/80 border border-amber-800 text-amber-300'
                            : 'bg-slate-800 text-slate-500'
                        }`}>
                          {avg > 0 ? avg : '-'}
                        </span>
                      </td>

                      {/* 4. Nilai Tiap Kolom Evaluasi */}
                      {visibleColumns.map((col) => {
                        if (col.type === 'TUGAS') {
                          const submission = (student.submissions || []).find((s: any) => s.moduleItemId === col.id);
                          const grade = submission?.grade;
                          const taskUrls = getSubmissionUrls(submission);
                          const annotatedUrls = getAnnotatedUrls(submission?.feedback);
                          const hasCorrection = annotatedUrls.length > 0;

                          return (
                            <td key={col.id} className="px-3 py-3 text-center border-r border-slate-800 bg-amber-500/[0.02]">
                              {submission ? (
                                <div className="inline-flex flex-col items-center">
                                  {typeof grade === 'number' ? (
                                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold font-mono ${
                                      grade >= 75 
                                        ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/60' 
                                        : 'text-amber-400 bg-amber-950/40 border border-amber-900/60'
                                    }`}>
                                      {grade}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-400 bg-blue-950/60 border border-blue-900/60 px-1.5 py-0.5 rounded" title="Sudah dikumpulkan, menunggu nilai guru">
                                      <Clock className="w-2.5 h-2.5" />
                                      <span>Menunggu</span>
                                    </span>
                                  )}

                                  {/* Tombol Pratinjau: Menampilkan Foto Hasil Koreksi Terakhir */}
                                  {(hasCorrection || taskUrls.length > 0) && (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedSubmissionPreview({
                                        studentName: student.name,
                                        taskTitle: col.title,
                                        moduleTitle: col.moduleTitle,
                                        grade,
                                        notes: submission.notes,
                                        feedback: submission.feedback,
                                        annotatedUrls,
                                        originalUrls: taskUrls,
                                        submissionId: submission.id
                                      })}
                                      className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition shadow-xs ${
                                        hasCorrection
                                          ? 'bg-rose-950/90 hover:bg-rose-900 border border-rose-700/80 text-rose-200 shadow-rose-950/40'
                                          : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300'
                                      }`}
                                      title={
                                        hasCorrection
                                          ? (annotatedUrls.length > 1
                                              ? `Guru telah mengoreksi ${annotatedUrls.length}x. Klik untuk melihat hasil koreksi terakhir.`
                                              : 'Klik untuk melihat foto hasil koreksi guru.')
                                          : 'Belum ada foto koreksi coretan. Klik untuk melihat berkas asli yang diunggah siswa.'
                                      }
                                    >
                                      {hasCorrection ? (
                                        <>
                                          <PenTool className="w-2.5 h-2.5 text-rose-400" />
                                          <span>{annotatedUrls.length > 1 ? 'Koreksi Terakhir' : 'Hasil Koreksi'}</span>
                                          {annotatedUrls.length > 1 && (
                                            <span className="px-1 rounded text-[8px] bg-rose-900 border border-rose-600 text-white font-mono">
                                              #{annotatedUrls.length}
                                            </span>
                                          )}
                                        </>
                                      ) : (
                                        <>
                                          <ImageIcon className="w-2.5 h-2.5 text-slate-400" />
                                          <span>Foto Asli</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-700 font-mono">-</span>
                              )}
                            </td>
                          );
                        } else {
                          // Kuis
                          const isListening = col.quizType === 'LISTENING';
                          const isEssay = col.quizType === 'ESSAY';
                          const cellBg = isListening ? 'bg-cyan-500/[0.04]' : isEssay ? 'bg-purple-500/[0.03]' : 'bg-blue-500/[0.02]';

                          const attempts = (student.quizAttempts || []).filter((a: any) => a.quizId === col.id);
                          
                          if (attempts.length === 0) {
                            return (
                              <td key={col.id} className={`px-3 py-3 text-center border-r border-slate-800 ${cellBg}`}>
                                <span className="text-[11px] text-slate-700 font-mono">-</span>
                              </td>
                            );
                          }

                          // Ambil skor terbaik & attempt terbaru
                          const bestScore = Math.max(...attempts.map((a: any) => a.score ?? 0));
                          const maxCheatCount = Math.max(...attempts.map((a: any) => a.cheatCount || 0));
                          const isPassed = bestScore >= (col.passingScore || 75);

                          return (
                            <td key={col.id} className={`px-3 py-3 text-center border-r border-slate-800 ${cellBg}`}>
                              <div className="inline-flex flex-col items-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold font-mono ${
                                  isPassed 
                                    ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/60' 
                                    : 'text-amber-400 bg-amber-950/40 border border-amber-900/60'
                                }`}>
                                  {bestScore}
                                </span>

                                {/* Indikator Tambahan: Retake & Jumlah Kecurangan */}
                                <div className="flex flex-col items-center gap-0.5 mt-1">
                                  {maxCheatCount > 0 && (
                                    <span 
                                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold text-red-400 bg-red-950/90 border border-red-800 whitespace-nowrap shadow-2xs" 
                                      title={`Terdeteksi berpindah tab kuis sebanyak ${maxCheatCount} kali`}
                                    >
                                      <ShieldAlert className="w-2.5 h-2.5 text-red-400 flex-shrink-0" />
                                      <span>{maxCheatCount}x Curang</span>
                                    </span>
                                  )}
                                  {attempts.length > 1 && (
                                    <span className="text-[8px] text-slate-500 font-mono" title={`Total ${attempts.length} kali pengerjaan`}>
                                      {attempts.length}x tes
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                          );
                        }
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Rapor Siswa Lengkap */}
      {selectedStudentDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950 border border-blue-900 px-2 py-0.5 rounded">
                  Rapor Evaluasi Individu
                </span>
                <h3 className="text-lg font-black text-white mt-1">{selectedStudentDetail.name}</h3>
                <p className="text-xs text-slate-400">
                  Kelas: <strong className="text-slate-300">{selectedStudentDetail.kelas?.name || '-'}</strong> • NISN: <span className="font-mono text-slate-300">{selectedStudentDetail.identifier}</span>
                </p>
              </div>
              <button 
                onClick={() => setSelectedStudentDetail(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Rincian per Modul */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {data.modules.map((mod, modIdx) => {
                const modItems = mod.items || [];
                const modQuizzes = mod.quizzes || [];

                return (
                  <div key={mod.id} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                      <span className="font-bold text-xs text-white flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                        Modul #{modIdx + 1}: {mod.title}
                      </span>
                    </div>

                    {/* Tugas Menulis */}
                    {modItems.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                          Tugas Praktik Menulis:
                        </span>
                        {modItems.map((item: any) => {
                          const sub = (selectedStudentDetail.submissions || []).find((s: any) => s.moduleItemId === item.id);
                          const grade = sub?.grade;
                          const taskUrls = getSubmissionUrls(sub);
                          const annotatedUrls = getAnnotatedUrls(sub?.feedback);
                          const hasCorrection = annotatedUrls.length > 0;

                          return (
                            <div key={item.id} className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                              <span className="text-slate-300 font-medium truncate max-w-[260px]" title={item.title}>
                                {item.title}
                              </span>
                              {sub ? (
                                <div className="flex items-center gap-2">
                                  {typeof grade === 'number' ? (
                                    <span className={`font-bold font-mono px-2 py-0.5 rounded text-xs ${
                                      grade >= 75 ? 'text-emerald-400 bg-emerald-950 border border-emerald-800' : 'text-amber-400 bg-amber-950 border border-amber-800'
                                    }`}>
                                      {grade} Poin
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-blue-400 font-semibold bg-blue-950 px-2 py-0.5 rounded">
                                      Menunggu Nilai
                                    </span>
                                  )}
                                  {(hasCorrection || taskUrls.length > 0) && (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedSubmissionPreview({
                                        studentName: selectedStudentDetail.name,
                                        taskTitle: item.title,
                                        moduleTitle: mod.title,
                                        grade,
                                        notes: sub.notes,
                                        feedback: sub.feedback,
                                        annotatedUrls,
                                        originalUrls: taskUrls,
                                        submissionId: sub.id
                                      })}
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition shadow-xs ${
                                        hasCorrection
                                          ? 'bg-rose-950/90 hover:bg-rose-900 border border-rose-700/80 text-rose-200'
                                          : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300'
                                      }`}
                                      title={hasCorrection ? (annotatedUrls.length > 1 ? `Guru mengoreksi ${annotatedUrls.length}x. Klik untuk melihat hasil koreksi terakhir.` : 'Lihat hasil koreksi guru') : 'Lihat berkas asli siswa'}
                                    >
                                      {hasCorrection ? (
                                        <>
                                          <PenTool className="w-3.5 h-3.5 text-rose-400" />
                                          <span>{annotatedUrls.length > 1 ? 'Hasil Koreksi Terakhir' : 'Lihat Hasil Koreksi'}</span>
                                        </>
                                      ) : (
                                        <>
                                          <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                                          <span>Lihat Berkas Asli</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-600 text-[11px]">Belum Mengumpulkan</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Kuis Evaluasi */}
                    {modQuizzes.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                          Kuis & Evaluasi Pemahaman:
                        </span>
                        {modQuizzes.map((quiz: any) => {
                          const attempts = (selectedStudentDetail.quizAttempts || []).filter((a: any) => a.quizId === quiz.id);
                          const bestScore = attempts.length > 0 ? Math.max(...attempts.map((a: any) => a.score ?? 0)) : null;
                          const maxCheat = attempts.length > 0 ? Math.max(...attempts.map((a: any) => a.cheatCount || 0)) : 0;
                          const isListening = quiz.quizType === 'LISTENING';
                          const isEssay = quiz.quizType === 'ESSAY';

                          return (
                            <div key={quiz.id} className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                                    isListening
                                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                                      : isEssay
                                      ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                      : 'bg-blue-950 text-blue-300 border border-blue-800'
                                  }`}>
                                    {isListening ? (
                                      <>
                                        <Headphones className="w-2.5 h-2.5 text-cyan-400" />
                                        Listening
                                      </>
                                    ) : isEssay ? (
                                      <>
                                        <PenTool className="w-2.5 h-2.5 text-purple-400" />
                                        Esai
                                      </>
                                    ) : (
                                      '🔘 Pilgan'
                                    )}
                                  </span>
                                  <span className="text-slate-300 font-medium truncate block max-w-[240px]" title={quiz.title}>
                                    {quiz.title}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 flex flex-wrap items-center gap-1.5 mt-1 font-mono">
                                  <span>KKM: {quiz.passingScore || 75} Poin</span>
                                  <span>•</span>
                                  <span>Percobaan: {attempts.length}x</span>
                                  {maxCheat > 0 && (
                                    <>
                                      <span>•</span>
                                      <span className="text-red-400 font-bold bg-red-950/90 border border-red-800 px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                                        <ShieldAlert className="w-3 h-3 text-red-400" />
                                        <span>{maxCheat}x Curang (Pindah Tab)</span>
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {bestScore !== null ? (
                                <span className={`font-bold font-mono px-2 py-0.5 rounded text-xs ${
                                  bestScore >= (quiz.passingScore || 75) 
                                    ? 'text-emerald-400 bg-emerald-950 border border-emerald-800' 
                                    : 'text-amber-400 bg-amber-950 border border-amber-800'
                                }`}>
                                  Skor: {bestScore}
                                </span>
                              ) : (
                                <span className="text-slate-600 text-[11px]">Belum Dikerjakan</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedStudentDetail(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview Gambar & Berkas Tugas Siswa (Prioritaskan Hasil Koreksi Terakhir) */}
      {selectedSubmissionPreview && (
        <div 
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedSubmissionPreview(null);
          }}
        >
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[96vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950 border border-blue-900 px-2 py-0.5 rounded">
                    {selectedSubmissionPreview.moduleTitle}
                  </span>
                  <span className="text-xs font-semibold text-slate-300 truncate">
                    {selectedSubmissionPreview.taskTitle}
                  </span>
                </div>
                <h3 className="text-base font-black text-white mt-0.5 truncate flex items-center gap-2">
                  <span>Tugas: {selectedSubmissionPreview.studentName}</span>
                  {selectedSubmissionPreview.annotatedUrls.length > 0 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                      {selectedSubmissionPreview.annotatedUrls.length > 1 ? 'Sudah Dikoreksi (Terbaru)' : 'Sudah Dikoreksi'}
                    </span>
                  )}
                </h3>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {currentActiveUrl && (
                  <a
                    href={currentActiveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
                    title="Buka file yang sedang aktif di tab baru"
                  >
                    <span>Buka File Asli</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => setSelectedSubmissionPreview(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Tutup Preview (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-Header: Switcher Hasil Koreksi vs Berkas Asli */}
            <div className="px-5 py-2.5 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedSubmissionPreview.annotatedUrls.length > 0 ? (
                  <>
                    {/* Jika guru mengoreksi 2x atau lebih, tampilkan tombol tiap versi koreksi dengan penanda TERAKHIR */}
                    {selectedSubmissionPreview.annotatedUrls.map((_, idx) => {
                      const isLatest = idx === selectedSubmissionPreview.annotatedUrls.length - 1;
                      const isSelected = previewMode === 'CORRECTION' && previewCorrectionIndex === idx;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setPreviewMode('CORRECTION');
                            setPreviewCorrectionIndex(idx);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition ${
                            isSelected
                              ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                              : 'bg-slate-800/80 text-rose-300 hover:bg-slate-800 border border-rose-900/60'
                          }`}
                        >
                          <PenTool className="w-3 h-3" />
                          <span>
                            {isLatest 
                              ? (selectedSubmissionPreview.annotatedUrls.length > 1 ? `Koreksi Terakhir (ke-${idx + 1})` : 'Hasil Koreksi Guru') 
                              : `Koreksi ke-${idx + 1}`}
                          </span>
                          {isLatest && selectedSubmissionPreview.annotatedUrls.length > 1 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          )}
                        </button>
                      );
                    })}

                    {/* Tombol Tab untuk melihat Berkas Asli Siswa jika diperlukan */}
                    {selectedSubmissionPreview.originalUrls.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewMode('ORIGINAL');
                          setPreviewOriginalIndex(0);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition ${
                          previewMode === 'ORIGINAL'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/60'
                        }`}
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>Lihat Berkas Asli Siswa ({selectedSubmissionPreview.originalUrls.length})</span>
                      </button>
                    )}
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-800 text-amber-300 text-xs font-semibold">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Belum ada coretan hasil koreksi guru. Menampilkan foto asli kiriman siswa.</span>
                  </span>
                )}
              </div>

              {/* Status info label */}
              <div className="text-[11px] text-slate-400">
                {previewMode === 'CORRECTION' ? (
                  <span className="text-rose-400 font-semibold flex items-center gap-1">
                    <PenTool className="w-3 h-3" />
                    Lembar Koreksi Guru ({previewCorrectionIndex + 1}/{selectedSubmissionPreview.annotatedUrls.length})
                  </span>
                ) : (
                  <span className="text-slate-300">
                    Berkas Asli Siswa ({previewOriginalIndex + 1}/{selectedSubmissionPreview.originalUrls.length})
                  </span>
                )}
              </div>
            </div>

            {/* Sub-Header jika Mode Berkas Asli & Siswa upload > 1 gambar */}
            {previewMode === 'ORIGINAL' && selectedSubmissionPreview.originalUrls.length > 1 && (
              <div className="px-5 py-2 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Foto {previewOriginalIndex + 1} dari {selectedSubmissionPreview.originalUrls.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPreviewOriginalIndex(prev => (prev > 0 ? prev - 1 : selectedSubmissionPreview.originalUrls.length - 1))}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-0.5"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Sebelumnya</span>
                  </button>
                  <button
                    onClick={() => setPreviewOriginalIndex(prev => (prev < selectedSubmissionPreview.originalUrls.length - 1 ? prev + 1 : 0))}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-0.5"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Image Viewer Container */}
            <div className="flex-1 bg-slate-950/90 relative min-h-[380px] max-h-[60vh] overflow-auto flex items-center justify-center p-4">
              {(() => {
                if (!currentActiveUrl) {
                  return (
                    <div className="text-center py-12 text-slate-500">
                      <AlertCircle className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                      <p>URL lampiran tidak valid atau berkas belum diunggah.</p>
                    </div>
                  );
                }

                const isImage = currentActiveUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) || currentActiveUrl.startsWith('/uploads/');
                const isPdf = currentActiveUrl.match(/\.pdf($|\?)/i);

                if (isImage) {
                  return (
                    <div className="relative group max-w-full max-h-full flex items-center justify-center">
                      <img
                        src={currentActiveUrl}
                        alt="Pratinjau Tugas"
                        className="max-w-full max-h-[56vh] object-contain rounded-xl shadow-2xl border border-slate-800"
                      />
                      {/* Badge overlay on top of image */}
                      <div className="absolute top-3 left-3 pointer-events-none">
                        {previewMode === 'CORRECTION' ? (
                          <span className="px-2.5 py-1 rounded-md bg-rose-950/90 border border-rose-700 text-rose-200 font-bold text-[10px] shadow-lg flex items-center gap-1 backdrop-blur-xs">
                            <PenTool className="w-3 h-3 text-rose-400" />
                            <span>
                              Hasil Koreksi Guru {selectedSubmissionPreview.annotatedUrls.length > 1 ? `(#${previewCorrectionIndex + 1})` : ''}
                            </span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md bg-slate-900/90 border border-slate-700 text-slate-300 font-medium text-[10px] shadow-lg flex items-center gap-1 backdrop-blur-xs">
                            <ImageIcon className="w-3 h-3 text-slate-400" />
                            <span>Berkas Asli Kiriman Siswa</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }

                if (isPdf) {
                  return (
                    <object data={currentActiveUrl} type="application/pdf" className="w-full h-[56vh] rounded-xl border border-slate-800">
                      <div className="text-center p-6 text-slate-400">
                        Browser tidak mendukung tampilan PDF langsung. Silakan{' '}
                        <a href={currentActiveUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                          klik di sini untuk membuka PDF
                        </a>.
                      </div>
                    </object>
                  );
                }

                return (
                  <iframe
                    src={getPreviewUrl(currentActiveUrl)}
                    className="w-full h-[56vh] bg-white rounded-xl border border-slate-800"
                    allow="autoplay"
                    title="Pratinjau Berkas"
                  />
                );
              })()}
            </div>

            {/* Modal Footer with Notes, Feedback, & Grade Info */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold block text-[10px]">NILAI TUGAS</span>
                  {typeof selectedSubmissionPreview.grade === 'number' ? (
                    <span className="font-bold font-mono text-emerald-400 text-sm">
                      {selectedSubmissionPreview.grade} / 100 Poin
                    </span>
                  ) : (
                    <span className="font-semibold text-amber-400 text-xs">
                      Menunggu Penilaian Guru
                    </span>
                  )}
                </div>

                {getCleanFeedback(selectedSubmissionPreview.feedback) && (
                  <div className="border-l border-slate-800 pl-3 max-w-xs">
                    <span className="text-slate-500 font-semibold block text-[10px]">CATATAN GURU (FEEDBACK)</span>
                    <p className="text-rose-300 text-xs italic truncate" title={getCleanFeedback(selectedSubmissionPreview.feedback)}>
                      "{getCleanFeedback(selectedSubmissionPreview.feedback)}"
                    </p>
                  </div>
                )}

                {selectedSubmissionPreview.notes && (
                  <div className="border-l border-slate-800 pl-3 max-w-xs">
                    <span className="text-slate-500 font-semibold block text-[10px]">CATATAN SISWA</span>
                    <p className="text-slate-300 text-xs italic truncate" title={selectedSubmissionPreview.notes}>
                      "{selectedSubmissionPreview.notes}"
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/guru/evaluations"
                  className="px-4 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 font-bold text-xs transition inline-flex items-center gap-1.5 shadow-sm"
                  title="Buka halaman penilaian untuk membuat/memperbarui coretan koreksi atau memberi nilai"
                >
                  <PenTool className="w-3.5 h-3.5 text-rose-400" />
                  <span>Koreksi di Evaluasi</span>
                </a>
                <button
                  onClick={() => setSelectedSubmissionPreview(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

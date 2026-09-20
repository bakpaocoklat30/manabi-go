'use client';

import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Search, 
  Loader2, 
  Download,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function GuruRekapPage() {
  const [data, setData] = useState<{ modules: any[], students: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKelas, setFilterKelas] = useState('ALL');

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

  const handleExportExcel = () => {
    if (!data) return;

    // Persiapkan headers
    const headers = ['NISN', 'Nama Siswa', 'Kelas'];
    const columns: any[] = [];
    
    data.modules.forEach((mod: any) => {
      mod.items.forEach((item: any) => {
        const colName = `[Tugas] ${mod.title} - ${item.title}`;
        headers.push(colName);
        columns.push({ type: 'TUGAS', id: item.id });
      });
      mod.quizzes.forEach((quiz: any) => {
        const colName = `[Kuis] ${mod.title} - ${quiz.title}`;
        headers.push(colName);
        columns.push({ type: 'KUIS', id: quiz.id });
      });
    });

    // Persiapkan baris data
    const rows = filteredStudents.map(student => {
      const rowData: any = {
        'NISN': student.identifier,
        'Nama Siswa': student.name,
        'Kelas': student.kelas?.name || '-'
      };

      columns.forEach((col, i) => {
        if (col.type === 'TUGAS') {
          const submission = student.submissions.find((s: any) => s.moduleItemId === col.id);
          rowData[headers[3 + i]] = submission?.grade !== null && submission?.grade !== undefined ? submission.grade : '-';
        } else {
          const attempt = student.quizAttempts.find((a: any) => a.quizId === col.id);
          rowData[headers[3 + i]] = attempt?.score !== null && attempt?.score !== undefined ? attempt.score : '-';
        }
      });

      return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Nilai");
    XLSX.writeFile(workbook, "Rekap_Nilai_Siswa_Manabi_Go.xlsx");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-xs text-slate-400 font-mono">Mengambil data rekap nilai...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-slate-400">Gagal memuat data.</p>
      </div>
    );
  }

  const uniqueKelas = Array.from(new Set(data.students.map(s => s.kelas?.name).filter(Boolean))).sort() as string[];

  const filteredStudents = data.students.filter(student => {
    const matchSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || student.identifier.includes(searchTerm);
    const matchKelas = filterKelas === 'ALL' || student.kelas?.name === filterKelas;
    return matchSearch && matchKelas;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-500" />
            Rekap Nilai Siswa
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Lihat dan unduh rekapitulasi nilai tugas praktik dan kuis (pilihan ganda) seluruh siswa.
          </p>
        </div>
        <button
          onClick={handleExportExcel}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition shadow-md shadow-emerald-600/20"
        >
          <Download className="w-4 h-4" />
          Download Excel
        </button>
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Cari nama atau NISN siswa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 transition"
          />
        </div>
        <select
          value={filterKelas}
          onChange={(e) => setFilterKelas(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-blue-500 min-w-[200px]"
        >
          <option value="ALL">Semua Kelas</option>
          {uniqueKelas.map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
      </div>

      {/* Tabel Matrix Nilai */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800">
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-950 border-r border-slate-800 z-10 w-10">No</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky left-10 bg-slate-950 border-r border-slate-800 z-10">Siswa</th>
                
                {data.modules.map(mod => (
                  <React.Fragment key={mod.id}>
                    {mod.items.map((item: any) => (
                      <th key={item.id} className="px-4 py-3 text-[10px] font-bold text-amber-500 uppercase tracking-wider border-r border-slate-800 text-center bg-amber-500/5">
                        <div className="truncate max-w-[120px]" title={`[TUGAS] ${mod.title} - ${item.title}`}>
                          TGS: {item.title}
                        </div>
                      </th>
                    ))}
                    {mod.quizzes.map((quiz: any) => (
                      <th key={quiz.id} className="px-4 py-3 text-[10px] font-bold text-blue-500 uppercase tracking-wider border-r border-slate-800 text-center bg-blue-500/5">
                        <div className="truncate max-w-[120px]" title={`[KUIS] ${mod.title} - ${quiz.title}`}>
                          KUIS: {quiz.title}
                        </div>
                      </th>
                    ))}
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={100} className="px-4 py-8 text-center text-xs text-slate-500">
                    Tidak ada data siswa ditemukan.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-800/50 transition">
                    <td className="px-4 py-3 text-xs text-slate-500 sticky left-0 bg-slate-900 border-r border-slate-800 z-10 group-hover:bg-slate-800/90">{idx + 1}</td>
                    <td className="px-4 py-3 sticky left-10 bg-slate-900 border-r border-slate-800 z-10 group-hover:bg-slate-800/90">
                      <div className="font-bold text-white text-xs">{student.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{student.kelas?.name || '-'} • NISN: {student.identifier}</div>
                    </td>

                    {data.modules.map(mod => (
                      <React.Fragment key={mod.id}>
                        {mod.items.map((item: any) => {
                          const submission = student.submissions.find((s: any) => s.moduleItemId === item.id);
                          const grade = submission?.grade;
                          return (
                            <td key={item.id} className="px-4 py-3 text-center border-r border-slate-800 bg-amber-500/5">
                              {grade !== null && grade !== undefined ? (
                                <span className={`text-xs font-bold ${grade >= 75 ? 'text-emerald-400' : 'text-amber-500'}`}>
                                  {grade}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-600">-</span>
                              )}
                            </td>
                          );
                        })}
                        {mod.quizzes.map((quiz: any) => {
                          const attempts = student.quizAttempts.filter((a: any) => a.quizId === quiz.id);
                          return (
                            <td key={quiz.id} className="px-4 py-3 text-center border-r border-slate-800 bg-blue-500/5 align-top">
                              {attempts.length > 0 ? (
                                <div className="flex flex-col items-center gap-2">
                                  {attempts.map((attempt: any, index: number) => {
                                    const score = attempt.score;
                                    return (
                                      <div key={attempt.id} className="flex flex-col items-center border border-slate-700/50 bg-slate-900/50 rounded-lg p-1.5 w-full min-w-[70px]">
                                        <span className="text-[8px] text-slate-500 mb-0.5">Tes {attempts.length - index}</span>
                                        <span className={`text-xs font-bold ${score >= (quiz.passingScore || 75) ? 'text-emerald-400' : 'text-amber-500'}`}>
                                          {score}
                                        </span>
                                        {attempt.cheatCount > 0 && (
                                          <span className="text-[9px] mt-1 font-bold text-red-500 bg-red-500/10 px-1 rounded w-full text-center" title="Pindah Tab Kuis">
                                            {attempt.cheatCount}x Curang
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-600 block mt-3">-</span>
                              )}
                            </td>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Loader2, RefreshCw, Trophy, Clock, Users, CheckCircle2 } from 'lucide-react';

export default function MonitoringPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [monitoringData, setMonitoringData] = useState<any[] | null>(null);
  
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData('all');
  }, []);

  const fetchData = async (cId: string) => {
    setIsLoading(true);
    try {
      const url = new URL('/api/guru/monitoring', window.location.origin);
      url.searchParams.append('kelasId', cId);

      const res = await fetch(url.toString(), { cache: 'no-store' });
      const json = await res.json();
      
      if (res.ok) {
        setClasses(json.data.classes);
        setModules(json.data.modules);
        setMonitoringData(json.data.monitoringData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  
  const getPoints = (durationSeconds: number) => {
    if (durationSeconds >= 300) return 100;
    if (durationSeconds >= 240) return 75;
    if (durationSeconds >= 180) return 50;
    if (durationSeconds >= 120) return 20;
    if (durationSeconds >= 60) return 10;
    return 0;
  };

  const handleClassSelect = (cId: string) => {
    setSelectedClassId(cId);
    fetchData(cId);
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Eye className="w-5 h-5 text-blue-600" />
            Pantau Aktivitas Siswa
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Lihat siapa saja siswa yang sudah membuka atau membaca materi Anda.
          </p>
        </div>
      </div>

      {/* Filter Kelas Berupa Tombol (Pills) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <label className="block text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-1">
          <Users className="w-3.5 h-3.5" /> Pilih Kelas
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleClassSelect('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              selectedClassId === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-600 ring-offset-2'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Kelas
          </button>
          {classes.map(c => (
            <button
              key={c.id}
              onClick={() => handleClassSelect(c.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                selectedClassId === c.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-600 ring-offset-2'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : monitoringData ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-700">Daftar Kehadiran Membaca Seluruh Materi</span>
            <button onClick={() => fetchData(selectedClassId)} className="text-xs font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition shadow-sm">
              <RefreshCw className="w-3 h-3" /> Refresh Data
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 font-semibold whitespace-nowrap sticky left-0 bg-white shadow-[1px_0_0_0_#f1f5f9] z-10">Nama Siswa</th>
                  <th className="px-4 py-3 font-semibold whitespace-nowrap">Kelas</th>
                  {modules.map(m => (
                    <th key={m.id} className="px-4 py-3 font-semibold text-center min-w-[120px]">
                      Pekan {m.weekNumber}<br />
                      <span className="text-[9px] truncate max-w-[100px] block mx-auto text-slate-300 normal-case">{m.title}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-50">
                {monitoringData.length === 0 && (
                  <tr>
                    <td colSpan={modules.length + 2} className="px-6 py-8 text-center text-slate-400 text-xs">Belum ada siswa di kelas ini.</td>
                  </tr>
                )}
                {monitoringData.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap sticky left-0 bg-white shadow-[1px_0_0_0_#f1f5f9] group-hover:bg-slate-50 z-10">
                      {s.name}
                      <div className="text-[10px] text-slate-400 font-normal">{s.nis}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs font-medium whitespace-nowrap">{s.kelasName}</td>
                    {modules.map(m => {
                      const acc = s.accesses[m.id];
                      return (
                        <td key={m.id} className="px-4 py-3 text-center">
                          {acc?.hasOpened ? (() => {
                              if (!m.isGamified) {
                                return (
                                  <div className="flex flex-col items-center justify-center gap-1">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                      <CheckCircle2 className="w-3 h-3" /> Selesai
                                    </span>
                                  </div>
                                );
                              }
                              const pts = getPoints(acc.durationSeconds || 0);
                              const mins = Math.floor((acc.durationSeconds || 0) / 60);
                              return (
                                <div className="flex flex-col items-center justify-center gap-1">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${pts > 0 ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                    <Trophy className="w-3 h-3" /> {pts} pts
                                  </span>
                                  <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                                    <Clock className="w-3 h-3" /> {mins}m {(acc.durationSeconds || 0) % 60}s
                                  </span>
                                </div>
                              );
                            })() : (
                              <div className="flex flex-col items-center justify-center opacity-40">
                                {m.isGamified ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-400 border border-slate-200">
                                    <Trophy className="w-3 h-3" /> 0 pts
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-400 border border-slate-200">
                                    -
                                  </span>
                                )}
                                <span className="text-[9px] text-slate-400 mt-1">Belum buka</span>
                              </div>
                            )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

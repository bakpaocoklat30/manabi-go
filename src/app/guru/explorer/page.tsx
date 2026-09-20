'use client';

import React, { useState, useEffect } from 'react';
import { FolderOpen, Folder, FileText, ChevronRight, Download, Loader2, HardDrive, FileImage, FileCode, FileArchive, Search } from 'lucide-react';
import Link from 'next/link';

interface ExplorerFile {
  id: string;
  studentName: string;
  identifier: string;
  fileUrl: string;
  createdAt: string;
}

interface ExplorerModule {
  id: string;
  title: string;
  files: ExplorerFile[];
}

interface ExplorerClass {
  id: string;
  name: string;
  modules: ExplorerModule[];
}

export default function FileExplorerPage() {
  const [classes, setClasses] = useState<ExplorerClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Breadcrumbs state
  const [selectedClass, setSelectedClass] = useState<ExplorerClass | null>(null);
  const [selectedModule, setSelectedModule] = useState<ExplorerModule | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/guru/explorer');
        const json = await res.json();
        if (res.ok) setClasses(json.data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const getFileIcon = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return <FileImage className="w-10 h-10 text-blue-500" />;
    if (['zip', 'rar', '7z', 'tar'].includes(ext || '')) return <FileArchive className="w-10 h-10 text-amber-500" />;
    if (['js', 'ts', 'html', 'css', 'json'].includes(ext || '')) return <FileCode className="w-10 h-10 text-slate-700" />;
    return <FileText className="w-10 h-10 text-rose-500" />;
  };

  const getFileName = (url: string) => {
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-blue-600" />
            File Explorer Siswa
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Jelajahi dan unduh lampiran tugas yang dikumpulkan siswa berdasarkan kelas.
          </p>
        </div>
        {!selectedClass && (
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kelas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
            />
          </div>
        )}
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 px-2 text-sm font-semibold text-slate-600 overflow-x-auto whitespace-nowrap">
        <button 
          onClick={() => { setSelectedClass(null); setSelectedModule(null); }}
          className="hover:text-blue-600 hover:underline flex items-center gap-1.5"
        >
          <HardDrive className="w-4 h-4" /> Root
        </button>
        
        {selectedClass && (
          <>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <button 
              onClick={() => setSelectedModule(null)}
              className="hover:text-blue-600 hover:underline flex items-center gap-1.5"
            >
              <FolderOpen className="w-4 h-4 text-amber-500" /> {selectedClass.name}
            </button>
          </>
        )}

        {selectedModule && (
          <>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="text-slate-800 flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-blue-500" /> {selectedModule.title}
            </span>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="min-h-[40vh] flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[50vh]">
          
          {/* Level 0: Root (Classes) */}
          {!selectedClass && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {classes.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map(cls => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls)}
                  className="group p-4 flex flex-col items-center gap-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-center"
                >
                  <Folder className="w-16 h-16 text-amber-400 group-hover:text-amber-500 group-hover:scale-105 transition-transform drop-shadow-sm" fill="currentColor" />
                  <div>
                    <span className="block text-sm font-bold text-slate-700 group-hover:text-blue-600 line-clamp-2">{cls.name}</span>
                    <span className="text-[10px] text-slate-400">{cls.modules.length} Folder Materi</span>
                  </div>
                </button>
              ))}
              {classes.length === 0 && (
                <div className="col-span-full text-center py-10 text-slate-400 text-sm">
                  Belum ada file tugas yang masuk dari siswa.
                </div>
              )}
            </div>
          )}

          {/* Level 1: Modules in Class */}
          {selectedClass && !selectedModule && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {selectedClass.modules.map(mod => (
                <button
                  key={mod.id}
                  onClick={() => setSelectedModule(mod)}
                  className="group p-4 flex flex-col items-center gap-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-center"
                >
                  <Folder className="w-16 h-16 text-blue-400 group-hover:text-blue-500 group-hover:scale-105 transition-transform drop-shadow-sm" fill="currentColor" />
                  <div>
                    <span className="block text-sm font-bold text-slate-700 group-hover:text-blue-600 line-clamp-2">{mod.title}</span>
                    <span className="text-[10px] text-slate-400">{mod.files.length} File Tugas</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Level 2: Files in Module */}
          {selectedClass && selectedModule && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {selectedModule.files.map(file => (
                <a
                  key={file.id}
                  href={file.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-4 flex flex-col items-center gap-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-center relative"
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                      <Download className="w-3 h-3" />
                    </div>
                  </div>
                  {getFileIcon(file.fileUrl)}
                  <div className="w-full">
                    <span className="block text-xs font-bold text-slate-700 truncate px-1" title={getFileName(file.fileUrl)}>
                      {getFileName(file.fileUrl)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block truncate">
                      {file.studentName}
                    </span>
                  </div>
                </a>
              ))}
              {selectedModule.files.length === 0 && (
                <div className="col-span-full text-center py-10 text-slate-400 text-sm">
                  Tidak ada file di dalam folder ini.
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}

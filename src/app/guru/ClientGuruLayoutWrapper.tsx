'use client';

import React, { useState } from 'react';
import GuruSidebar from '@/components/layout/GuruSidebar';
import { Menu, Calendar, Sparkles } from 'lucide-react';

interface ClientGuruLayoutWrapperProps {
  children: React.ReactNode;
  teacherName: string;
  nip: string;
  pendingCount: number;
}

export default function ClientGuruLayoutWrapper({
  children,
  teacherName,
  nip,
  pendingCount,
}: ClientGuruLayoutWrapperProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const todayDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 flex flex-col lg:pl-72 font-sans">
      <GuruSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        teacherName={teacherName}
        nip={nip}
        pendingCount={pendingCount}
      />

      {/* Header Guru */}
      <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-[#E8E2D2] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-stone-100 text-stone-600 hover:text-stone-800 transition"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-bold text-stone-800 leading-snug">
              Portal Guru & Pengajar Asinkron
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>{todayDate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 border border-blue-200 text-blue-700">
            <Sparkles className="w-3 h-3 text-blue-600" /> Penugasan Studi Jepang
          </span>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
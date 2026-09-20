'use client';

import React from 'react';
import { Menu, ExternalLink, Calendar, CheckCircle } from 'lucide-react';

interface HeaderProps {
  onOpenSidebar: () => void;
  title?: string;
  driveFolderUrl?: string | null;
}

export default function Header({
  onOpenSidebar,
  title = 'Media Belajar Mandiri',
  driveFolderUrl = 'https://drive.google.com',
}: HeaderProps) {
  const todayDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-md border-b border-[#E8E2D2] px-4 sm:px-8 py-3.5 flex items-center justify-between">
      {/* Kiri: Toggle Hamburger & Judul */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 rounded-xl bg-stone-100 text-stone-600 hover:text-stone-800 transition"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base font-bold text-stone-800 leading-snug">{title}</h2>
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <Calendar className="w-3.5 h-3.5 text-stone-400" />
            <span>{todayDate}</span>
          </div>
        </div>
      </div>

      {/* Kanan: Link Google Drive Kelas & Status Absensi */}
      <div className="flex items-center gap-3">
        {driveFolderUrl && (
          <a
            href={driveFolderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-950/60 border border-blue-800/80 text-blue-300 hover:text-stone-800 hover:bg-blue-900/80 text-xs font-semibold transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Folder GDrive Kelas</span>
          </a>
        )}

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-emerald-400 text-xs font-semibold">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Presensi: Hadir</span>
        </div>
      </div>
    </header>
  );
}
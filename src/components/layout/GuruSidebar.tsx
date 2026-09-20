'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BookPlus, 
  FileCheck2, Eye, HardDrive, ClipboardList,
  GraduationCap, 
  LogOut, 
  Sparkles, 
  X,
  ExternalLink
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface GuruSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  teacherName?: string;
  nip?: string;
  pendingCount?: number;
}

export default function GuruSidebar({
  isOpen,
  onClose,
  teacherName = 'Sensei STM ADB',
  nip = '198501012010012001',
  pendingCount = 0,
}: GuruSidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      label: 'Beranda Pengajar',
      href: '/guru',
      icon: LayoutDashboard,
    },
    {
      label: 'Course Builder (Materi)',
      href: '/guru/builder',
      icon: BookPlus,
    },
    {
      label: 'Pantau Aktivitas Siswa',
      href: '/guru/monitoring',
      icon: Eye,
    },
    {
      label: 'Koreksi Tulisan Siswa',
      href: '/guru/evaluations',
      icon: FileCheck2,
      badge: pendingCount > 0 ? pendingCount : null,
    },
    {
      label: 'Rekap Nilai Siswa',
      href: '/guru/rekap',
      icon: ClipboardList,
    },
    {
      label: 'File Explorer Siswa',
      href: '/guru/explorer',
      icon: HardDrive,
    },
  ];

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#FDFBF7] border-r border-[#E8E2D2] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div>
          {/* Header Brand Guru */}
          <div className="flex items-center justify-between p-6 border-b border-[#E8E2D2]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-stone-800 font-black shadow-lg shadow-blue-600/30">
                <span className="text-base tracking-widest">先生</span>
              </div>
              <div>
                <h1 className="text-base font-extrabold text-stone-800 flex items-center gap-1.5 leading-none">
                  MANABI GO
                </h1>
                <span className="text-[10px] text-[#C62828] font-semibold uppercase tracking-wider">
                  Panel Guru Bahasa Jepang
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profil Sensei */}
          <div className="p-4 mx-4 my-4 rounded-xl bg-white border border-[#E8E2D2]/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#C62828]/10 text-[#C62828] flex items-center justify-center font-bold text-sm">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-stone-800 truncate">{teacherName}</p>
                <p className="text-[11px] font-mono text-stone-500 truncate">NIP: {nip}</p>
              </div>
            </div>
          </div>

          {/* Navigasi Panel Guru */}
          <div className="px-4 space-y-1.5">
            <p className="px-3 text-[10px] font-semibold tracking-wider text-stone-400 uppercase mb-2">
              Menu Pengajaran
            </p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onClose()}
                  className={cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group',
                    isActive
                      ? 'bg-blue-600 text-stone-800 shadow-md shadow-blue-600/25'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100/60'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-transform duration-200 group-hover:scale-110',
                        isActive ? 'text-stone-800' : 'text-stone-500 group-hover:text-stone-800'
                      )}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-[#E8E2D2]">
          <button
            onClick={async () => {
              await signOut({ redirect: false });
              window.location.href = '/login';
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-500 hover:text-[#C62828] hover:bg-[#C62828]/10 border border-transparent hover:border-[#C62828]/20 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun Sensei</span>
          </button>
          <div className="mt-3 text-center">
            <span className="text-[10px] text-slate-600 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-[#C62828]" /> SMKN 1 Adiwerna • Asinkron Jepang
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BookOpen, 
  CheckCircle2, 
  GraduationCap, 
  LogOut, 
  Home, 
  Sparkles,
  X 
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  nisn?: string;
  kelasName?: string;
}

export default function Sidebar({
  isOpen,
  onClose,
  userName = 'Siswa STM ADB',
  nisn = '212210001',
  kelasName = 'XII TKR 1',
}: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      label: 'Dashboard Belajar',
      href: '/siswa',
      icon: Home,
    },
    {
      label: 'Modul & Materi',
      href: '/siswa/modules',
      icon: BookOpen,
    },
    {
      label: 'Riwayat & Evaluasi',
      href: '/siswa/progress',
      icon: CheckCircle2,
    },
  ];

  return (
    <>
      {/* Backdrop Mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#FDFBF7] border-r border-[#E8E2D2] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Bagian Atas: Brand & Identitas */}
        <div>
          <div className="flex items-center justify-between p-6 border-b border-[#E8E2D2]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-stone-800 font-black shadow-lg shadow-[#C62828]/20">
                <span className="text-base tracking-widest">学び</span>
              </div>
              <div>
                <h1 className="text-base font-extrabold text-stone-800 flex items-center gap-1.5 leading-none">
                  MANABI GO
                </h1>
                <span className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">
                  SMKN 1 Adiwerna
                </span>
              </div>
            </div>
            {/* Tombol Tutup Mobile */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profil Singkat Siswa */}
          <div className="p-4 mx-4 my-4 rounded-xl bg-white border border-[#E8E2D2]/80">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600/20 text-blue-600 flex items-center justify-center font-bold text-sm">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-stone-800 truncate">{userName}</p>
                <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                  <span className="font-mono text-stone-600">{nisn}</span>
                  <span>•</span>
                  <span className="text-blue-600 font-medium">{kelasName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigasi Utama */}
          <div className="px-4 space-y-1.5">
            <p className="px-3 text-[10px] font-semibold tracking-wider text-stone-400 uppercase mb-2">
              Menu Utama
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
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group',
                    isActive
                      ? 'bg-red-600 text-stone-800 shadow-md shadow-[#C62828]/20'
                      : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100/60'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-transform duration-200 group-hover:scale-110',
                      isActive ? 'text-stone-800' : 'text-stone-500 group-hover:text-stone-800'
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bagian Bawah: Tombol Logout */}
        <div className="p-4 border-t border-[#E8E2D2]">
          <button
            onClick={async () => {
              await signOut({ redirect: false });
              window.location.href = '/login';
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-500 hover:text-[#C62828] hover:bg-[#C62828]/10 border border-transparent hover:border-[#C62828]/20 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
          <div className="mt-3 text-center">
            <span className="text-[10px] text-slate-600 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> STM ADB Adiwerna • 2026
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
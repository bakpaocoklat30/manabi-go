'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShieldCheck, 
  Users, 
  Server, 
  LogOut, 
  Sparkles, 
  X,
  School,
  FileCheck2,
  Settings
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  adminName?: string;
  identifier?: string;
}

export default function AdminSidebar({
  isOpen,
  onClose,
  adminName = 'Super Admin IT',
  identifier = 'admin_it',
}: AdminSidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      label: 'Monitoring Sistem',
      href: '/admin',
      icon: Server,
    },
    {
      label: 'Manajemen Akun & CSV',
      href: '/admin/users',
      icon: Users,
    },
    {
      label: 'Manajemen Kelas',
      href: '/admin/classes',
      icon: School,
    },
    {
      label: 'Manj. Pembelajaran',
      href: '/admin/learning-management',
      icon: FileCheck2,
    },
    {
      label: 'Pengaturan Backup & API',
      href: '/admin/settings',
      icon: Settings,
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

      {/* Sidebar Desktop & Drawer Mobile */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#FDFBF7] border-r border-[#E8E2D2] flex flex-col justify-between transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div>
          {/* Header Brand Admin */}
          <div className="flex items-center justify-between p-6 border-b border-[#E8E2D2]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C62828] flex items-center justify-center text-white font-black shadow-lg shadow-[#C62828]/20">
                <span className="text-base tracking-widest">管理</span>
              </div>
              <div>
                <h1 className="text-base font-extrabold text-stone-800 flex items-center gap-1.5 leading-none">
                  MANABI GO
                </h1>
                <span className="text-[10px] text-[#C62828] font-bold uppercase tracking-wider block mt-1">
                  Super Admin IT • ADB
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-200/50 transition"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Profil Admin */}
          <div className="p-4 mx-4 my-4 rounded-xl bg-white border border-[#E8E2D2] shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#C62828]/10 text-[#C62828] flex items-center justify-center font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-stone-800 truncate">{adminName}</p>
                <p className="text-[11px] font-mono text-stone-500 truncate">@{identifier}</p>
              </div>
            </div>
          </div>

          {/* Navigasi Panel Admin */}
          <div className="px-4 space-y-1.5">
            <p className="px-3 text-[10px] font-semibold tracking-wider text-stone-400 uppercase mb-2">
              Menu Pengaturan IT
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
                      ? 'bg-[#C62828] text-white shadow-md shadow-[#C62828]/20'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-transform duration-200 group-hover:scale-110',
                      isActive ? 'text-white' : 'text-stone-400 group-hover:text-stone-700'
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-[#E8E2D2]">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-stone-500 hover:text-[#C62828] hover:bg-[#C62828]/10 border border-transparent hover:border-[#C62828]/20 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sesi Admin</span>
          </button>
          <div className="mt-3 text-center">
            <span className="text-[10px] text-stone-400 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-[#C62828]" /> Infrastruktur IT SMKN 1 Adiwerna
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
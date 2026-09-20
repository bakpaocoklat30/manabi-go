'use client';

import React from 'react';
import Link from 'next/link';
import { HelpCircle, ArrowLeft, GraduationCap } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-screen w-full bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-2xl relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-blue-950/80 border border-blue-800 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
          <HelpCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-4xl font-black text-white font-mono block">
            404
          </span>
          <h1 className="text-lg font-bold text-white">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Halaman atau modul yang Anda tuju tidak tersedia atau tautan telah dipindahkan.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Halaman Awal</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
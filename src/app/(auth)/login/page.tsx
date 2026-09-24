'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import SakuraBackground from '@/components/shared/SakuraBackground';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, User, AlertCircle, Loader2, Sparkles, GraduationCap, RefreshCw } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Deteksi jika pengguna diarahkan kembali dengan parameter error
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      if (errorParam === 'CredentialsSignin') {
        setErrorMessage('NISN/NIP atau Kata sandi tidak cocok.');
      } else if (errorParam !== 'SessionRequired') {
        setErrorMessage('Sesi akun Anda telah diperbarui setelah update. Silakan masukkan kata sandi kembali.');
      }
    }
  }, [searchParams]);

  // Tombol penyelamat otomatis: bersihkan cookie & local storage jika ada cache lama yang nyangkut
  const handleResetSession = () => {
    try {
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.href = '/login';
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const res = await signIn('credentials', {
        identifier: identifier.trim(),
        password,
        redirect: false,
      });

      if (res?.error) {
        if (res.error === 'CredentialsSignin') {
          setErrorMessage('NISN/NIP atau Kata sandi yang Anda masukkan salah.');
        } else {
          setErrorMessage(res.error);
        }
        setIsLoading(false);
      } else {
        // PENTING: Gunakan window.location.href (hard redirect), bukan router.push()!
        // Hard redirect memastikan browser memuat halaman dengan session cookie baru
        // dan mengabaikan client-router cache lama di Next.js App Router.
        window.location.href = callbackUrl || '/';
      }
    } catch (error) {
      setErrorMessage('Terjadi kendala jaringan saat menghubungi server.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#FDFBF7] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      <SakuraBackground />
      {/* Background Decorative Rings */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#C62828]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#C62828] text-white shadow-lg shadow-[#C62828]/20 mb-4 transform hover:scale-105 transition-transform duration-300">
            <span className="text-2xl font-black tracking-widest">学び</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-800 flex items-center justify-center gap-2">
            MANABI GO
            <span className="text-xs bg-blue-600 text-blue-100 font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
              STM ADB
            </span>
          </h1>
          <p className="text-sm text-stone-500 mt-2">
            Portal Pembelajaran Bahasa & Budaya Industri Jepang
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-[#E8E2D2] shadow-2xl rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
          <div className="mb-6 border-b border-[#E8E2D2] pb-4">
            <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#C62828]" />
              Masuk ke Akun
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Gunakan NISN (Siswa) atau NIP (Guru) yang telah didaftarkan.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 font-medium">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Input Identifier */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider">
                NISN / NIP / Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Contoh: 212210001 atau 1985..."
                  className="w-full pl-10 pr-4 py-3 bg-[#FDFBF7] border border-[#E8E2D2] rounded-xl text-stone-900 placeholder-slate-500 text-sm focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-[#FDFBF7] border border-[#E8E2D2] rounded-xl text-stone-900 placeholder-slate-500 text-sm focus:outline-none focus:border-[#C62828] focus:ring-2 focus:ring-[#C62828]/20 transition-all duration-200"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 bg-[#C62828] hover:bg-[#B71C1C] text-white font-bold rounded-xl shadow-lg shadow-[#C62828]/20 flex items-center justify-center gap-2 transition-all duration-200 transform active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk Sekarang</span>
                  <Sparkles className="w-4 h-4 text-red-200" />
                </>
              )}
            </button>
          </form>

          {/* Tombol Self-Healing: Bersihkan Cache & Sesi Otomatis */}
          <div className="mt-4 pt-3 border-t border-stone-100 text-center">
            <button
              type="button"
              onClick={handleResetSession}
              className="text-[11px] text-stone-400 hover:text-stone-700 transition inline-flex items-center gap-1 cursor-pointer"
              title="Klik jika mengalami kendala setelah pembaruan aplikasi"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Kendala Masuk? Segarkan Sesi & Bersihkan Cache</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-stone-400 mt-6">
          © 2026 SMK Negeri 1 Adiwerna (STM ADB). All rights reserved.
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full bg-[#FDFBF7] flex flex-col justify-center items-center"><p>Memuat halaman login...</p></div>}>
      <LoginForm />
    </Suspense>
  );
}

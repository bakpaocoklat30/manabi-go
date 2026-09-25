'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  className?: string;
  autoPlay?: boolean;
}

export default function AudioPlayer({
  src,
  className = 'w-full h-10 outline-none',
  autoPlay = false
}: AudioPlayerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!src) {
      setBlobUrl(null);
      setIsLoading(false);
      return;
    }

    // Jika sudah berupa data URI atau blob URI, gunakan langsung
    if (src.startsWith('data:') || src.startsWith('blob:')) {
      setBlobUrl(src);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    let createdUrl: string | null = null;

    const loadAudioBlob = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Ambil file audio via AJAX dengan header X-Requested-With
        // Header ini memberi sinyal ke IDM agar TIDAK mencegat request download
        const res = await fetch(src, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          }
        });

        if (!res.ok) {
          throw new Error(`Gagal memuat file audio (${res.status})`);
        }

        const blob = await res.blob();
        if (isMounted) {
          // Buat URL memori internal browser (blob:http://...)
          // Ekstensi IDM tidak akan mengunduh URL bertipe blob:
          createdUrl = URL.createObjectURL(blob);
          setBlobUrl(createdUrl);
        }
      } catch (err: any) {
        console.warn('Gagal memuat blob audio, fallback ke src langsung:', err);
        if (isMounted) {
          // Fallback jika terjadi kegagalan jaringan
          setBlobUrl(src);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAudioBlob();

    return () => {
      isMounted = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [src]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400 w-full animate-pulse">
        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
        <span className="font-mono text-[11px]">Memuat streaming audio...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-2 bg-red-950/40 rounded-xl border border-red-900/50 text-xs text-red-400">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (!blobUrl) return null;

  return (
    <audio
      ref={audioRef}
      controls
      src={blobUrl}
      autoPlay={autoPlay}
      className={className}
      controlsList="nodownload"
    />
  );
}

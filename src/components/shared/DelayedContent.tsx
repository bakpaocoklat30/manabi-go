'use client';

import React, { useState, useEffect } from 'react';
import { Lock, Clock } from 'lucide-react';

interface Props {
  delayMinutes: number;
  accessStartTime: number;
  children: React.ReactNode;
}

export default function DelayedContent({ delayMinutes, accessStartTime, children }: Props) {
  const [remainingSecs, setRemainingSecs] = useState(() => {
    if (delayMinutes <= 0) return 0;
    const unlockTime = accessStartTime + delayMinutes * 60 * 1000;
    const diff = Math.ceil((unlockTime - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  });

  useEffect(() => {
    if (remainingSecs <= 0) return;
    const timer = setInterval(() => {
      const unlockTime = accessStartTime + delayMinutes * 60 * 1000;
      const diff = Math.ceil((unlockTime - Date.now()) / 1000);
      setRemainingSecs(diff > 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [accessStartTime, delayMinutes, remainingSecs]);

  if (remainingSecs > 0) {
    const mins = Math.floor(remainingSecs / 60);
    const secs = remainingSecs % 60;
    return (
      <div className="bg-[#1C1A17]/80 backdrop-blur-md border border-[#2D2A26] rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-3 shadow-xl">
        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-2">
          <Lock className="w-8 h-8 text-blue-400" />
        </div>
        <h4 className="text-white font-bold text-lg">Materi Terkunci Sementara</h4>
        <p className="text-stone-400 text-sm max-w-sm">
          Fokus pada materi sebelumnya dulu. Konten ini akan terbuka otomatis dalam:
        </p>
        <div className="flex items-center gap-2 mt-4 bg-[#2D2A26] px-5 py-2.5 rounded-xl text-emerald-400 font-mono font-bold text-lg shadow-inner">
          <Clock className="w-5 h-5" />
          {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

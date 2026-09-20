'use client';

import React from 'react';

interface YouTubeEmbedProps {
  url: string;
  title?: string;
}

export default function YouTubeEmbed({
  url,
  title = 'Video Tutorial Menulis Huruf Jepang',
}: YouTubeEmbedProps) {
  // Fungsi ekstraksi YouTube Video ID secara aman
  const getYouTubeId = (inputUrl: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = inputUrl.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = getYouTubeId(url);

  if (!videoId) {
    return (
      <div className="w-full p-6 rounded-2xl bg-slate-900 border border-red-800/40 text-center">
        <p className="text-xs text-red-400 font-medium">
          Format tautan video YouTube tidak valid atau tidak didukung.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
      <div className="relative w-full pb-[56.25%] h-0">
        <iframe
          className="absolute top-0 left-0 w-full h-full rounded-2xl"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}
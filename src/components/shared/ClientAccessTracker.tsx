'use client';

import { useEffect, useRef } from 'react';

export default function ClientAccessTracker({ moduleId }: { moduleId: string }) {
  const isFirstMount = useRef(true);

  useEffect(() => {
    // Initial record when opening the page
    const sendPing = (isInitial = false) => {
      fetch(`/api/siswa/modules/${moduleId}/access`, { 
        method: 'POST', 
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isInitial })
      }).catch(e => console.error('Tracker Error:', e));
    };

    if (isFirstMount.current) {
      sendPing(true);
      isFirstMount.current = false;
    }

    // Ping every 30 seconds to increment duration by 30
    const interval = setInterval(() => {
      sendPing(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [moduleId]);

  return null;
}

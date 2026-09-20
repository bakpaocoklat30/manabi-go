'use client';

import React, { useEffect, useState } from 'react';

export default function SakuraBackground() {
  const [petals, setPetals] = useState<Array<{ id: number; left: string; animationDuration: string; delay: string; opacity: number }>>([]);

  useEffect(() => {
    // Generate petals only on client to avoid hydration mismatch
    const generatedPetals = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 8 + 6}s`,
      delay: `${Math.random() * 10}s`,
      opacity: Math.random() * 0.5 + 0.3
    }));
    setPetals(generatedPetals);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fall {
          0% {
            opacity: 0;
            top: -10%;
            transform: translateX(0) rotate(0deg);
          }
          10% { opacity: var(--tw-opacity, 1); }
          90% { opacity: var(--tw-opacity, 1); }
          100% {
            top: 110%;
            transform: translateX(20px) rotate(360deg);
            opacity: 0;
          }
        }
        .sakura-petal {
          position: absolute;
          background-color: #ffb7c5;
          border-radius: 15px 0 15px 0;
          width: 12px;
          height: 12px;
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}} />
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="sakura-petal shadow-sm"
          style={{
            left: petal.left,
            animationDuration: petal.animationDuration,
            animationDelay: petal.delay,
            '--tw-opacity': petal.opacity,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

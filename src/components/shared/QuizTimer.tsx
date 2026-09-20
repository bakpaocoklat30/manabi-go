'use client';

import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface QuizTimerProps {
  quizId: string;
  initialMinutes: number;
  onTimeUp: () => void;
  isSubmitting?: boolean;
}

export default function QuizTimer({
  quizId,
  initialMinutes,
  onTimeUp,
  isSubmitting = false,
}: QuizTimerProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(initialMinutes * 60);

  // Initialize from localStorage
  useEffect(() => {
    const storageKey = `quiz_timer_${quizId}`;
    const storedEndTime = localStorage.getItem(storageKey);
    const now = Date.now();
    
    if (storedEndTime) {
      const remaining = Math.floor((parseInt(storedEndTime, 10) - now) / 1000);
      if (remaining > 0) {
        setSecondsRemaining(remaining);
      } else {
        setSecondsRemaining(0);
      }
    } else {
      // First time, set end time
      const endTime = now + initialMinutes * 60 * 1000;
      localStorage.setItem(storageKey, endTime.toString());
      setSecondsRemaining(initialMinutes * 60);
    }
  }, [quizId, initialMinutes]);

  useEffect(() => {
    if (isSubmitting) return;

    if (secondsRemaining <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining, isSubmitting, onTimeUp]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isUrgent = secondsRemaining <= 120; // Sisa <= 2 menit

  return (
    <div
      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-colors duration-300 ${
        isUrgent
          ? 'bg-red-950/80 border-red-700 text-red-300 animate-pulse'
          : 'bg-slate-900 border-slate-700 text-slate-200'
      }`}
    >
      {isUrgent ? (
        <AlertTriangle className="w-4 h-4 text-red-400" />
      ) : (
        <Clock className="w-4 h-4 text-slate-400" />
      )}
      <span>{formattedTime}</span>
    </div>
  );
}
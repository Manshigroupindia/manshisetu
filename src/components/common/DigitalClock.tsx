import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

export const DigitalClock: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const isPM = hours >= 12;
  const displayHours = hours % 12 || 12;

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-navy-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-navy-700">
        <Clock className="w-3.5 h-3.5 text-brand-600" />
        <span>
          {pad(displayHours)}:{pad(minutes)}:{pad(seconds)} {isPM ? 'PM' : 'AM'}
        </span>
      </div>
    );
  }

  const formattedDate = time.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 p-3.5 rounded-xl shadow-xs">
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 rounded-lg">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
            Live Office Time
          </div>
          <div className="flex items-baseline gap-1 font-mono font-bold text-slate-900 dark:text-white text-lg">
            <span>{pad(displayHours)}</span>
            <span className="text-brand-600 animate-pulse">:</span>
            <span>{pad(minutes)}</span>
            <span className="text-brand-600 animate-pulse">:</span>
            <span>{pad(seconds)}</span>
            <span className="text-xs ml-1 text-slate-500 font-sans font-semibold">
              {isPM ? 'PM' : 'AM'}
            </span>
          </div>
        </div>
      </div>

      <div className="hidden sm:block h-8 w-px bg-slate-200 dark:bg-navy-800" />

      <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
        <Calendar className="w-4 h-4 text-slate-400" />
        <span>{formattedDate}</span>
      </div>
    </div>
  );
};

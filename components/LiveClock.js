'use client';

import { useEffect, useState } from 'react';
import { formatClock } from '../lib/format.js';

export default function LiveClock({ className = '' }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer;
    const schedule = () => {
      const msToMinute = 60_000 - (Date.now() % 60_000);
      timer = setTimeout(() => {
        setNow(new Date());
        schedule();
      }, msToMinute + 250);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  return (
    <span className={`text-xs font-medium uppercase tracking-[0.18em] text-soft/90 ${className}`}>
      {formatClock(now)}
    </span>
  );
}

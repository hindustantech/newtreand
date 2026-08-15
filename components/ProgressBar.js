'use client';

import { useRef, useState } from 'react';
import { formatTime } from '../lib/format.js';

export default function ProgressBar({ currentTime, duration, onSeek, className = '' }) {
  const barRef = useRef(null);
  const [dragTime, setDragTime] = useState(null);
  const dragging = dragTime !== null;

  const shown = dragging ? dragTime : currentTime;
  const percent = duration > 0 ? Math.min(100, Math.max(0, (shown / duration) * 100)) : 0;

  const positionFromEvent = (event) => {
    const rect = barRef.current.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    return Math.min(1, Math.max(0, ratio));
  };

  const handlePointerDown = (event) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragTime(positionFromEvent(event) * duration);
  };

  const handlePointerMove = (event) => {
    if (!dragging) return;
    setDragTime(positionFromEvent(event) * duration);
  };

  const handlePointerUp = (event) => {
    if (dragging && onSeek) onSeek(dragTime);
    setDragTime(null);
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="w-10 text-right text-[11px] tabular-nums text-muted">{formatTime(shown)}</span>
      <div
        ref={barRef}
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(shown)}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setDragTime(null)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') onSeek?.(shown + 5);
          if (event.key === 'ArrowLeft') onSeek?.(shown - 5);
        }}
        className="group relative h-4 flex-1 cursor-pointer touch-none select-none"
      >
        <div className="absolute top-1/2 h-[5px] w-full -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-white/80 transition-[width] duration-150"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div
          className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_1px_8px_rgba(0,0,0,0.6)] opacity-0 transition-opacity group-hover:opacity-100"
          style={{ left: `${percent}%` }}
        />
      </div>
      <span className="w-10 text-[11px] tabular-nums text-muted">{formatTime(duration)}</span>
    </div>
  );
}

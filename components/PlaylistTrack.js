'use client';

import { Play } from 'lucide-react';
import Equalizer from './Equalizer.js';
import { formatTime } from '../lib/format.js';

export default function PlaylistTrack({ track, index, currentTrack, isPlaying, onPlay }) {
  const active = currentTrack?.id === track.id;

  return (
    <button
      type="button"
      onClick={onPlay}
      className={`group flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left transition-colors ${
        active ? 'bg-accent-soft' : 'hover:bg-white/5'
      }`}
    >
      <span className="flex w-6 shrink-0 items-center justify-center">
        {active ? (
          <Equalizer playing={isPlaying} />
        ) : (
          <>
            <span className="text-xs tabular-nums text-muted group-hover:hidden">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="hidden text-soft group-hover:block">
              <Play size={14} fill="currentColor" />
            </span>
          </>
        )}
      </span>

      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10">
        {track.thumbnail ? (
          <img src={track.thumbnail} alt="" draggable={false} className="h-full w-full object-cover" />
        ) : (
          <span className="block h-full w-full bg-white/5" />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className={`block truncate text-sm ${active ? 'font-semibold text-accent' : 'text-soft'}`}>
          {track.title}
        </span>
        <span className="block truncate text-xs text-muted">{track.artist}</span>
      </span>

      <span className="shrink-0 text-xs tabular-nums text-muted">{formatTime(track.duration)}</span>
    </button>
  );
}
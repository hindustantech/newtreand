'use client';

import { ChevronUp } from 'lucide-react';
import PlayerArtwork from './PlayerArtwork.js';
import PlayerControls from './PlayerControls.js';
import ProgressBar from './ProgressBar.js';

export default function MusicPlayer({ player }) {
  const { currentTrack, artwork, seek, currentTime, duration, setExpanded } = player;

  if (!currentTrack) return null;

  const displayTitle = currentTrack.title ? currentTrack.title.slice(0, 10).split('').join(' ') : '';

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center pb-4 md:pb-8"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
    >
      <div className="glass pointer-events-auto w-[min(520px,calc(100vw-24px))] rounded-[32px] px-8 pb-3.5 pt-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] md:rounded-[40px] md:px-7 md:pt-5">
        <div className="flex min-w-0 items-center gap-3 md:gap-6">
          <PlayerArtwork
            track={currentTrack}
            artwork={artwork}
            isPlaying={player.isPlaying}
            className="h-10 w-10 -mt-10 md:h-[80px] md:w-[80px] md:-mt-14"
          />

          <div className="min-w-0 flex-1">
            <div className=" text-sm font-semibold md:text-base">{displayTitle}</div>
            <div className="truncate text-xs text-muted md:text-sm">{currentTrack.artist}</div>
          </div>

          <div className="flex shrink-0 items-center gap-1 md:gap-2">
            <button
              type="button"
              aria-label="Expand player"
              onClick={() => setExpanded(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-soft transition hover:bg-white/10 md:hidden"
            >
              <ChevronUp size={18} />
            </button>
            <PlayerControls player={player} variant="compact" />
          </div>
        </div>

        <ProgressBar
          currentTime={currentTime}
          duration={duration}
          onSeek={seek}
          className="mt-2 md:mt-3"
        />
      </div>
    </div>
  );
}

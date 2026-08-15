'use client';

import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  ListMusic,
  Loader2,
  CirclePlay,
} from 'lucide-react';

const iconButton =
  'flex h-9 w-9 items-center justify-center rounded-full text-soft transition-all hover:bg-white/10 active:scale-90';

export default function PlayerControls({ player, variant = 'full', className = '' }) {
  const {
    isPlaying,
    buffering,
    shuffle,
    repeat,
    muted,
    volume,
    setVolume,
    toggleMute,
    togglePlay,
    next,
    previous,
    toggleShuffle,
    toggleRepeat,
    openQueue,
    openPlaylist,
    autoplay,
    toggleAutoplay,
  } = player;

  const compact = variant === 'compact' || variant === 'mobile';

  return (
    <div className={`flex items-center ${className}`}>
      {!compact && (
        <button
          type="button"
          aria-label="Shuffle"
          onClick={toggleShuffle}
          className={`${iconButton} ${shuffle ? '!text-accent' : ''}`}
        >
          <Shuffle size={14} />
        </button>
      )}

      <button type="button" aria-label="Previous" onClick={previous} className={iconButton}>
        <SkipBack size={18} fill="currentColor" />
      </button>

      <button
        type="button"
        aria-label={isPlaying ? 'Pause' : 'Play'}
        onClick={togglePlay}
        className="mx-1 flex h-12 w-12 items-center justify-center rounded-full bg-white text-base shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-all hover:scale-105 active:scale-95"
      >
        {buffering ? (
          <Loader2 size={20} className="animate-spin text-base" />
        ) : isPlaying ? (
          <Pause size={20} fill="currentColor" className="text-base" />
        ) : (
          <Play size={20} fill="currentColor" className="ml-0.5 text-base" />
        )}
      </button>

      <button type="button" aria-label="Next" onClick={next} className={iconButton}>
        <SkipForward size={18} fill="currentColor" />
      </button>

      {!compact && (
        <button
          type="button"
          aria-label="Repeat"
          onClick={toggleRepeat}
          className={`${iconButton} ${repeat !== 'off' ? '!text-accent' : ''}`}
        >
          {repeat === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
        </button>
      )}

      {variant === 'full' && (
        <>
          <div className="mx-3 hidden h-6 w-px bg-white/10 lg:block" />

          <div className="hidden items-center gap-2 lg:flex">
            <button
              type="button"
              aria-label={muted ? 'Unmute' : 'Mute'}
              onClick={toggleMute}
              className={iconButton}
            >
              {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round((muted ? 0 : volume) * 100)}
              onChange={(event) => setVolume(Number(event.target.value) / 100)}
              className="volume-slider w-10"
              aria-label="Volume"
            />
          </div>

          <button type="button" aria-label="Queue" onClick={openQueue} className={`${iconButton} hidden md:flex`}>
            <ListMusic size={16} />
          </button>
          <button
            type="button"
            aria-label={autoplay ? 'Turn autoplay off' : 'Turn autoplay on'}
            title={autoplay ? 'Autoplay on' : 'Autoplay off'}
            onClick={toggleAutoplay}
            className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition sm:flex ${autoplay ? 'bg-accent text-base' : 'bg-white/10 text-soft hover:bg-white/15'}`}
          >
            <CirclePlay size={14} />
            Auto
          </button>
          <button
            type="button"
            aria-label="Playlist"
            onClick={openPlaylist}
            className="ml-1 hidden items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-soft transition hover:bg-white/15 sm:flex"
          >
            <ListMusic size={14} />
            Playlist
          </button>
        </>
      )}
    </div>
  );
}

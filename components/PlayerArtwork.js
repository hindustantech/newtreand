'use client';

export default function PlayerArtwork({ track, artwork, isPlaying, className = '' }) {
  const url = artwork || track?.thumbnail;
  return (
    <div className={`relative shrink-0 ${className}`}>
      <div
        className={`h-full w-full overflow-hidden rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.55)] ring-1 ring-white/20 ${
          isPlaying ? 'animate-spin-slow' : 'spin-paused'
        }`}
      >
        {url ? (
          <img
            src={url}
            alt={track?.title}
            draggable={false}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-white/5" />
        )}
      </div>
      <div className="pointer-events-none absolute inset-[30%] rounded-full bg-base/70 ring-1 ring-white/25" />
    </div>
  );
}

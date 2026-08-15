'use client';

export default function Equalizer({ playing = true, className = '' }) {
  return (
    <div className={`flex h-4 items-end gap-[3px] ${playing ? '' : 'eq-paused'} ${className}`} aria-hidden>
      <span className="eq-bar h-full w-[3px] rounded-full bg-accent" />
      <span className="eq-bar h-full w-[3px] rounded-full bg-accent" />
      <span className="eq-bar h-full w-[3px] rounded-full bg-accent" />
    </div>
  );
}

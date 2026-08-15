'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Loader2, Music2, Play, X } from 'lucide-react';

export default function Collections({ open, onClose }) {
  const [playlists, setPlaylists] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;

    fetch('/api/playlists/public')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load collections');
        return data.playlists;
      })
      .then((items) => {
        if (!cancelled) {
          setPlaylists(items);
          setError(null);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.message);
          setPlaylists([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close collections"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 cursor-default bg-base/65 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="glass-strong fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col border-y-0 border-r-0 md:rounded-l-[32px]"
            aria-label="Public playlist collections"
          >
            <div className="border-b border-white/10 px-5 pb-5 pt-6 md:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Public library</p>
                  <h2 className="mt-1 font-display text-2xl font-bold">Collections</h2>
                  <p className="mt-1 text-sm text-muted">Choose a playlist and start listening.</p>
                </div>
                <button type="button" onClick={onClose} aria-label="Close collections" className="flex h-10 w-10 items-center justify-center rounded-full text-soft transition hover:bg-white/10 hover:text-white">
                  <X size={19} />
                </button>
              </div>
            </div>

            <div className="nice-scroll flex-1 overflow-y-auto px-4 py-4 md:px-5">
              {playlists === null && <p className="flex items-center justify-center gap-2 py-12 text-sm text-muted"><Loader2 size={16} className="animate-spin" /> Loading collections…</p>}
              {error && <p className="rounded-2xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
              {playlists?.length === 0 && !error && <p className="py-12 text-center text-sm text-muted">No public playlists yet.</p>}
              <div className="space-y-2.5">
                {playlists?.map((playlist) => (
                  <Link key={playlist.slug} href={`/${playlist.slug}`} onClick={onClose} className="group flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-2.5 transition hover:border-white/20 hover:bg-white/[0.08]">
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-accent/35 via-white/10 to-base">
                      {playlist.artwork ? <img src={playlist.artwork} alt={`${playlist.name} artwork`} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : <Music2 size={23} className="text-accent" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">{playlist.name}</span>
                      <span className="mt-1 block truncate text-xs text-muted">{playlist.creatorName ? `By ${playlist.creatorName} · ` : ''}{playlist.trackCount || 'YouTube'} {playlist.trackCount === 1 ? 'song' : 'songs'}</span>
                    </span>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-base shadow-lg transition group-hover:scale-105"><Play size={14} fill="currentColor" /></span>
                    <ArrowUpRight size={15} className="-ml-1 shrink-0 text-soft opacity-0 transition group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

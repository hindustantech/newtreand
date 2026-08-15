'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X, Play, Shuffle } from 'lucide-react';
import PlaylistTrack from './PlaylistTrack.js';
import { useMediaQuery } from '../hooks/use-media-query.js';

export default function PlaylistDrawer({ player, playlist, loading }) {
  const { playlistOpen, closePlaylist, playTrack, toggleShuffle, currentTrack, isPlaying } = player;
  const isMobile = useMediaQuery('(max-width: 767px)');

  const sheet = isMobile
    ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }
    : { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } };

  return (
    <AnimatePresence>
      {playlistOpen && (
        <>
          <motion.div
            key="pl-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePlaylist}
            className="absolute inset-0 z-40 bg-base/60"
          />
          <motion.div
            key="pl-sheet"
            initial={sheet.initial}
            animate={sheet.animate}
            exit={sheet.exit}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
            drag={isMobile ? 'y' : false}
            dragConstraints={isMobile ? { top: 0, bottom: 0 } : undefined}
            dragElastic={isMobile ? { top: 0, bottom: 0.55 } : undefined}
            onDragEnd={
              isMobile
                ? (_, info) => {
                    if (info.offset.y > 120) closePlaylist();
                  }
                : undefined
            }
            className="glass-strong fixed inset-x-0 bottom-0 z-[60] flex flex-col rounded-t-[36px] md:inset-y-0 md:right-0 md:left-auto md:w-[400px] md:rounded-none md:rounded-l-[32px] md:border-y-0 md:border-r-0"
          >
            <div className="flex items-center gap-3 px-6 pt-4 md:pt-6">
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-display text-lg font-bold">
                  {playlist?.name || 'Playlist'}
                </h2>
                <p className="text-xs text-muted">
                  {loading ? 'Loading…' : `${playlist?.tracks?.length ?? 0} songs`}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close playlist"
                onClick={closePlaylist}
                className="flex h-9 w-9 items-center justify-center rounded-full text-soft transition hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {playlist && playlist.tracks.length > 0 && (
              <div className="flex gap-2 px-6 pt-4">
                <button
                  type="button"
                  onClick={() => playTrack(playlist.tracks[0], { queue: playlist.tracks })}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white py-2.5 text-sm font-semibold text-base transition hover:scale-[1.02] active:scale-95"
                >
                  <Play size={15} fill="currentColor" />
                  Play All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toggleShuffle();
                    if (playlist.tracks.length > 0) {
                      const randomTrack =
                        playlist.tracks[Math.floor(Math.random() * playlist.tracks.length)];
                      playTrack(randomTrack, { queue: playlist.tracks });
                    }
                  }}
                  className="flex items-center justify-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-soft transition hover:bg-white/15 active:scale-95"
                >
                  <Shuffle size={15} />
                  Shuffle
                </button>
              </div>
            )}

            <div className="nice-scroll mt-4 flex-1 overflow-y-auto px-3 pb-8 md:pb-6">
              {loading ? (
                <div className="space-y-2 px-3 pt-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded-2xl bg-white/5" />
                  ))}
                </div>
              ) : (
                playlist?.tracks.map((track, i) => (
                  <PlaylistTrack
                    key={track.id}
                    track={track}
                    index={i}
                    currentTrack={currentTrack}
                    isPlaying={isPlaying}
                    onPlay={() => playTrack(track, { queue: playlist.tracks })}
                  />
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

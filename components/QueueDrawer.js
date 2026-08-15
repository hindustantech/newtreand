'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Trash2, X } from 'lucide-react';
import Equalizer from './Equalizer.js';
import { useMediaQuery } from '../hooks/use-media-query.js';

const spring = { type: 'spring', damping: 28, stiffness: 320 };

function QueueItem({ track, index, isCurrent, player }) {
  const { order, index: currentIndex, playTrack, removeFromQueue, moveQueueItem } = player;
  const isFirst = index === 0;
  const isLast = index === order.length - 1;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
        isCurrent ? 'bg-white/10' : 'hover:bg-white/5'
      }`}
    >
      <button
        type="button"
        onClick={() => playTrack(track)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        {track.thumbnail ? (
          <img
            src={track.thumbnail}
            alt=""
            loading="lazy"
            className="h-10 w-10 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
            draggable={false}
          />
        ) : (
          <span className="h-10 w-10 shrink-0 rounded-lg bg-white/10" />
        )}
        <span className="min-w-0 flex-1">
          <span className={`block truncate text-sm font-medium ${isCurrent ? 'text-accent' : ''}`}>
            {track.title}
          </span>
          <span className="block truncate text-xs text-muted">{track.artist}</span>
        </span>
        {isCurrent && <Equalizer className="shrink-0 text-accent" />}
      </button>

      {!isCurrent && (
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => moveQueueItem(index, index - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors enabled:hover:bg-white/10 enabled:hover:text-white disabled:opacity-30"
            aria-label="Move up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={() => moveQueueItem(index, index + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors enabled:hover:bg-white/10 enabled:hover:text-white disabled:opacity-30"
            aria-label="Move down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => removeFromQueue(track.id)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors enabled:hover:bg-red-400/20 enabled:hover:text-red-300"
            aria-label="Remove from queue"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function QueueDrawer({ player }) {
  const { queueOpen, closeQueue, clearQueue, currentTrack, nextUp, order, index: currentIndex } =
    player;
  const isMobile = useMediaQuery('(max-width: 767px)');

  const content = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-5 pb-3 pt-4 md:px-6 md:pt-5">
        <h2 className="font-display text-lg font-bold">Queue</h2>
        <div className="flex items-center gap-2">
          {nextUp.length > 0 && (
            <button
              type="button"
              onClick={clearQueue}
              className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold text-soft transition-colors hover:bg-white/10"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={closeQueue}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-soft transition-colors hover:bg-white/20"
            aria-label="Close queue"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="nice-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-6 md:px-3">
        <p className="px-3 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-widest text-muted">
          Now Playing
        </p>
        {currentTrack ? (
          <QueueItem track={currentTrack} index={currentIndex} isCurrent player={player} />
        ) : (
          <p className="px-3 py-2 text-sm text-muted">Nothing playing yet.</p>
        )}

        <p className="px-3 pb-1.5 pt-4 text-[11px] font-bold uppercase tracking-widest text-muted">
          Next Up
        </p>
        {nextUp.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted">End of queue — nothing left.</p>
        ) : (
          nextUp.map((track, i) => (
            <QueueItem
              key={track.id}
              track={track}
              index={currentIndex + 1 + i}
              isCurrent={false}
              player={player}
            />
          ))
        )}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {queueOpen &&
        (isMobile ? (
          <motion.div
            key="queue-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={spring}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.55 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) closeQueue();
            }}
            className="glass-strong fixed inset-x-0 bottom-0 z-[60] flex max-h-[78vh] flex-col rounded-t-[28px]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="mx-auto mt-2.5 h-1.5 w-12 shrink-0 rounded-full bg-white/20" />
            {content}
          </motion.div>
        ) : (
          <motion.div
            key="queue-panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={spring}
            className="glass-strong fixed bottom-0 left-0 top-0 z-[60] flex w-[400px] max-w-[92vw] flex-col rounded-r-[32px]"
          >
            {content}
          </motion.div>
        ))}
    </AnimatePresence>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { APP_TITLE, APP_SUBTITLE } from '../lib/config.js';
import { ytEmbed } from '../lib/yt-embed.js';

const VOLUME_KEY = 'satrang.volume';
const MUTED_KEY = 'satrang.muted';
const AUTOPLAY_KEY = 'satrang.autoplay';

const YT_STATE = { ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 };

function shuffleIndices(length, exclude) {
  const indices = [];
  for (let i = 0; i < length; i += 1) {
    if (i !== exclude) indices.push(i);
  }
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

export function useAudioPlayer() {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [baseQueue, setBaseQueue] = useState([]);
  const [order, setOrder] = useState([]);
  const [index, setIndex] = useState(-1);
  const [artwork, setArtwork] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    if (typeof window === 'undefined') return 0.9;
    const stored = Number(localStorage.getItem(VOLUME_KEY));
    const hasStoredVolume = Number.isFinite(stored) && stored >= 0 && stored <= 1;
    const isMuted = localStorage.getItem(MUTED_KEY) === '1';
    if (!hasStoredVolume) return 0.9;
    if (stored === 0 && !isMuted) {
      localStorage.setItem(VOLUME_KEY, '0.9');
      return 0.9;
    }
    return stored;
  });
  const [muted, setMuted] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isMuted = localStorage.getItem(MUTED_KEY) === '1';
    const stored = Number(localStorage.getItem(VOLUME_KEY));
    return isMuted || (Number.isFinite(stored) && stored === 0);
  });
  const [autoplay, setAutoplay] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(AUTOPLAY_KEY) === '1';
  });
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState('off');
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [playlistLoading, setPlaylistLoading] = useState(true);
  const [playlistError, setPlaylistError] = useState(null);

  const stateRef = useRef({
    order,
    index,
    baseQueue,
    currentTrack,
    shuffle,
    repeat,
  });

  useEffect(() => {
    stateRef.current = {
      order,
      index,
      baseQueue,
      currentTrack,
      shuffle,
      repeat,
    };
  });

  const lastCommit = useRef(0);
  const loadedTrackId = useRef(null);
  const loadedAt = useRef(0);
  const currentTimeRef = useRef(0);

  const loadAndPlay = useCallback((track) => {
    if (!track) return;
    loadedTrackId.current = track.id;
    loadedAt.current = Date.now();
    setBuffering(true);
    if (track.duration) setDuration(track.duration);
    ytEmbed
      .ensurePlayer()
      .then(() => ytEmbed.loadTrack(track.id, true))
      .catch(() => {
        setBuffering(false);
        setIsPlaying(false);
      });
  }, []);

  const syncFromVideo = useCallback(() => {
    ytEmbed
      .getVideoData()
      .then((data) => {
        if (!data?.video_id) return;
        const meta = {
          title: data.title || 'Unknown',
          artist: data.author || 'YouTube',
        };
        setBaseQueue((q) =>
          q.map((t) => (t.id === data.video_id ? { ...t, ...meta } : t)),
        );
        setOrder((o) =>
          o.map((t) => (t.id === data.video_id ? { ...t, ...meta } : t)),
        );
        setCurrentTrack((prev) => {
          if (prev?.id === data.video_id) return prev ? { ...prev, ...meta } : prev;
          return {
            id: data.video_id,
            title: meta.title,
            artist: meta.artist,
            thumbnail: `https://i.ytimg.com/vi/${data.video_id}/mqdefault.jpg`,
            duration: null,
          };
        });
        setDuration(0);
        currentTimeRef.current = 0;
      })
      .catch(() => {});
  }, []);

  const goTo = useCallback(
    (nextIndex) => {
      const { order: o } = stateRef.current;
      if (!o[nextIndex]) return;
      setIndex(nextIndex);
      setCurrentTrack(o[nextIndex]);
      setCurrentTime(0);
      currentTimeRef.current = 0;
      loadAndPlay(o[nextIndex]);
    },
    [loadAndPlay],
  );

  const playTrack = useCallback(
    (track, { queue: newQueue, autoplay = true } = {}) => {
      if (!track) return;
      const { shuffle: isShuffled, baseQueue: currentBase } = stateRef.current;
      const queue = newQueue ?? currentBase;
      setBaseQueue(queue);

      let nextOrder = queue;
      let nextIndex = queue.findIndex((t) => t.id === track.id);
      if (isShuffled) {
        const indices = shuffleIndices(queue.length, nextIndex);
        nextOrder = [queue[nextIndex], ...indices.map((i) => queue[i])];
        nextIndex = 0;
      }

      setOrder(nextOrder);
      setIndex(nextIndex);
      setCurrentTrack(track);
      setCurrentTime(0);
      currentTimeRef.current = 0;
      if (autoplay) loadAndPlay(track);
    },
    [loadAndPlay],
  );

  const play = useCallback(() => {
    const track = stateRef.current.currentTrack;
    if (!track) return;
    const playerReady = ytEmbed.isPlayerReady();
    const shouldReload = loadedTrackId.current !== track.id || !playerReady;
    if (shouldReload) {
      ytEmbed
        .ensurePlayer()
        .then(() => ytEmbed.loadTrack(track.id, true))
        .catch(() => {
          setBuffering(false);
          setIsPlaying(false);
        });
      return;
    }
    ytEmbed.playVideo().catch(() => {});
  }, []);

  const pause = useCallback(() => {
    ytEmbed.pauseVideo().catch(() => {});
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (stateRef.current.currentTrack) {
      if (isPlaying) pause();
      else play();
    }
  }, [play, pause, isPlaying]);

  const next = useCallback(() => {
    const { order: o, index: i, repeat: r } = stateRef.current;
    if (i < o.length - 1) {
      goTo(i + 1);
    } else if (r === 'all') {
      goTo(0);
    } else {
      pause();
      setCurrentTime(0);
      currentTimeRef.current = 0;
    }
  }, [goTo, pause]);

  const nextRef = useRef(next);
  useEffect(() => {
    nextRef.current = next;
  });

  const seekTo = useCallback((seconds) => {
    const clamped = Math.max(0, Math.min(seconds, duration || seconds));
    currentTimeRef.current = clamped;
    setCurrentTime(clamped);
    ytEmbed.seekTo(clamped).catch(() => {});
  }, [duration]);

  const previous = useCallback(() => {
    const { order: o, index: i, repeat: r } = stateRef.current;
    if (currentTimeRef.current > 5) {
      seekTo(0);
      return;
    }
    if (i > 0) {
      goTo(i - 1);
    } else if (r === 'all') {
      goTo(o.length - 1);
    } else {
      seekTo(0);
    }
  }, [goTo, seekTo]);

  const seek = seekTo;

  const setVolumeLevel = useCallback((value) => {
    const clamped = Math.max(0, Math.min(1, value));
    setVolume(clamped);
    const nextMuted = clamped === 0;
    setMuted(nextMuted);
    localStorage.setItem(VOLUME_KEY, String(clamped));
    localStorage.setItem(MUTED_KEY, nextMuted ? '1' : '0');
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const nextMuted = !m;
      localStorage.setItem(MUTED_KEY, nextMuted ? '1' : '0');
      if (!nextMuted && volume === 0) {
        const restoredVolume = 0.9;
        setVolume(restoredVolume);
        localStorage.setItem(VOLUME_KEY, String(restoredVolume));
      }
      return nextMuted;
    });
  }, [volume]);

  const toggleAutoplay = useCallback(() => {
    setAutoplay((enabled) => {
      const nextEnabled = !enabled;
      localStorage.setItem(AUTOPLAY_KEY, nextEnabled ? '1' : '0');
      return nextEnabled;
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    const { shuffle: wasShuffled, baseQueue: q, currentTrack: track } = stateRef.current;
    if (wasShuffled) {
      setShuffle(false);
      setOrder(q);
      setIndex(q.findIndex((t) => t.id === track?.id));
    } else {
      const currentIdx = q.findIndex((t) => t.id === track?.id);
      const indices = shuffleIndices(q.length, currentIdx);
      const nextOrder =
        currentIdx >= 0 ? [q[currentIdx], ...indices.map((i) => q[i])] : indices.map((i) => q[i]);
      setShuffle(true);
      setOrder(nextOrder);
      setIndex(0);
    }
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeat((r) => (r === 'off' ? 'all' : r === 'all' ? 'one' : 'off'));
  }, []);

  const addToQueue = useCallback((track) => {
    if (!track) return;
    setBaseQueue((q) => {
      if (q.some((t) => t.id === track.id)) return q;
      const next = [...q, track];
      setOrder((o) => (stateRef.current.shuffle ? [...o, track] : next));
      return next;
    });
  }, []);

  const removeFromQueue = useCallback((trackId) => {
    if (trackId === stateRef.current.currentTrack?.id) return;
    setBaseQueue((q) => q.filter((t) => t.id !== trackId));
    setOrder((o) => {
      const next = o.filter((t) => t.id !== trackId);
      const { index: i } = stateRef.current;
      const removedBefore = o.findIndex((t) => t.id === trackId) < i;
      if (removedBefore) setIndex(Math.max(0, i - 1));
      return next;
    });
  }, []);

  const moveQueueItem = useCallback((from, to) => {
    setOrder((o) => {
      const next = [...o];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      const { index: i } = stateRef.current;
      if (i === from) setIndex(to);
      else if (from < i && to >= i) setIndex(i - 1);
      else if (from > i && to <= i) setIndex(i + 1);
      return next;
    });
  }, []);

  const clearQueue = useCallback(() => {
    const { currentTrack: track } = stateRef.current;
    setBaseQueue(track ? [track] : []);
    setOrder(track ? [track] : []);
    setIndex(0);
  }, []);

  const openPlaylist = useCallback(() => {
    setQueueOpen(false);
    setPlaylistOpen(true);
  }, []);

  const loadPlaylist = useCallback((playlist) => {
    if (!playlist?.tracks?.length) return;
    setArtwork(playlist.artwork || null);
    setBaseQueue(playlist.tracks);
    setOrder(playlist.tracks);
    setIndex(0);
    setCurrentTrack(playlist.tracks[0]);
    setCurrentTime(0);
    currentTimeRef.current = 0;
  }, []);

  const closePlaylist = useCallback(() => setPlaylistOpen(false), []);
  const openQueue = useCallback(() => {
    setPlaylistOpen(false);
    setQueueOpen(true);
  }, []);
  const closeQueue = useCallback(() => setQueueOpen(false), []);

  const handleEnded = useCallback(() => {
    const { repeat: r } = stateRef.current;
    if (r === 'one') {
      currentTimeRef.current = 0;
      setCurrentTime(0);
      ytEmbed.seekTo(0).then(() => ytEmbed.playVideo()).catch(() => {});
    } else {
      nextRef.current();
    }
  }, []);

  const handleEmbedState = useCallback(
    ({ type, data, code }) => {
      if (type === 'state') {
        if (data === YT_STATE.PLAYING) {
          setBuffering(false);
          setIsPlaying(true);
          syncFromVideo();
        } else if (data === YT_STATE.PAUSED) {
          setBuffering(false);
          setIsPlaying(false);
          syncFromVideo();
        } else if (data === YT_STATE.BUFFERING) {
          setBuffering(true);
        } else if (data === YT_STATE.ENDED) {
          handleEnded();
        }
        return;
      }
      if (type === 'error') {
        const track = stateRef.current.currentTrack;
        if (!track || loadedTrackId.current !== track.id) return;
        setBuffering(false);
        setIsPlaying(false);
        if (code === 101 || code === 150 || (loadedAt.current && Date.now() - loadedAt.current > 3000)) {
          nextRef.current();
        }
      }
    },
    [handleEnded, syncFromVideo],
  );

  useEffect(() => {
    const unsubscribe = ytEmbed.onStateChange(handleEmbedState);
    return unsubscribe;
  }, [handleEmbedState]);

  useEffect(() => {
    ytEmbed.ensurePlayer().catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!ytEmbed.isPlayerReady()) return;
      Promise.all([ytEmbed.getCurrentTime(), ytEmbed.getDuration()]).then(([time, total]) => {
        if (total > 0) setDuration(total);
        if (time !== 0) {
          const now = performance.now();
          if (now - lastCommit.current > 200) {
            lastCommit.current = now;
            currentTimeRef.current = time;
            setCurrentTime(time);
          }
        }
      }).catch(() => {});
    }, 250);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    ytEmbed.setVolume(volume).catch(() => {});
    localStorage.setItem(VOLUME_KEY, String(volume));
  }, [volume]);

  useEffect(() => {
    ytEmbed.setMuted(muted).catch(() => {});
  }, [muted]);

  useEffect(() => {
    if (!currentTrack) {
      document.title = `${APP_TITLE} — ${APP_SUBTITLE}`;
      return;
    }
    document.title = `${currentTrack.title} — ${currentTrack.artist}`;
  }, [currentTrack]);

  useEffect(() => {
    if (!currentTrack || !('mediaSession' in navigator)) return;
    const artworkUrl = artwork || currentTrack.thumbnail;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      album: APP_TITLE,
      artwork: artworkUrl
        ? [
            { src: artworkUrl, sizes: '512x512', type: 'image/jpeg' },
            { src: artworkUrl, sizes: '256x256', type: 'image/jpeg' },
          ]
        : [],
    });
    navigator.mediaSession.setActionHandler('play', () => play());
    navigator.mediaSession.setActionHandler('pause', () => pause());
    navigator.mediaSession.setActionHandler('nexttrack', () => next());
    navigator.mediaSession.setActionHandler('previoustrack', () => previous());
    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
    };
  }, [currentTrack, artwork, play, pause, next, previous]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.target instanceof HTMLInputElement) return;
      if (event.code === 'Space') {
        event.preventDefault();
        togglePlay();
      } else if (event.code === 'ArrowRight') {
        seek(currentTimeRef.current + 5);
      } else if (event.code === 'ArrowLeft') {
        seek(currentTimeRef.current - 5);
      } else if (event.code === 'ArrowUp') {
        setVolumeLevel(volume + 0.1);
      } else if (event.code === 'ArrowDown') {
        setVolumeLevel(volume - 0.1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, seek, setVolumeLevel, volume]);

  return {
    currentTrack,
    artwork,
    baseQueue,
    order,
    index,
    nextUp: order.slice(index + 1),
    isPlaying,
    buffering,
    currentTime,
    duration,
    volume,
    muted,
    autoplay,
    shuffle,
    repeat,
    playlistOpen,
    queueOpen,
    expanded,
    setExpanded,
    playlistLoading,
    setPlaylistLoading,
    playlistError,
    setPlaylistError,
    loadPlaylist,
    playTrack,
    play,
    pause,
    togglePlay,
    next,
    previous,
    seek,
    setVolume: setVolumeLevel,
    toggleMute,
    toggleAutoplay,
    toggleShuffle,
    toggleRepeat,
    addToQueue,
    removeFromQueue,
    moveQueueItem,
    clearQueue,
    openPlaylist,
    closePlaylist,
    openQueue,
    closeQueue,
  };
}

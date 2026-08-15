'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, ListMusic, Music2, Plus } from 'lucide-react';
import Background from './Background.js';
import Header from './Header.js';
import MusicPlayer from './MusicPlayer.js';
import PlaylistDrawer from './PlaylistDrawer.js';
import QueueDrawer from './QueueDrawer.js';
import CreatorLinks from './CreatorLinks.js';
import { useAudioPlayer } from '../hooks/use-audio-player.js';
import { fetchPlaylistTracks } from '../lib/youtube.js';
import { DEFAULT_ARTWORK, PLAYLIST_ID } from '../lib/config.js';
import { apiFetch } from '../lib/client-fetch.js';

function toPlayerPlaylist(initial) {
  return {
    id: initial.slug,
    name: initial.name,
    artwork: initial.artwork || null,
    sourcePlaylistId: initial.sourcePlaylistId || null,
    creatorName: initial.creatorName || null,
    socialLinks: initial.socialLinks || [],
    tracks: (initial.tracks || []).map((track) => ({
      id: track.videoId,
      title: track.title,
      artist: track.artist,
      thumbnail: track.thumbnail,
      duration: null,
    })),
  };
}

export default function MusicApp({ initialPlaylist = null }) {
  const player = useAudioPlayer();
  const { currentTrack, loadPlaylist, playTrack, openPlaylist, setPlaylistLoading, playlistLoading, autoplay } = player;
  const [fetchedPlaylist, setFetchedPlaylist] = useState(null);
  const autoplayRef = useRef(autoplay);

  const playlist = initialPlaylist ? toPlayerPlaylist(initialPlaylist) : fetchedPlaylist;

  useEffect(() => {
    autoplayRef.current = autoplay;
  }, [autoplay]);

  useEffect(() => {
    let cancelled = false;

    const fetchAndPlayPlaylist = (playlistId, name, artwork = null) => fetchPlaylistTracks(playlistId)
      .then((tracks) => {
        if (cancelled) return;
        const p = { id: playlistId, name, artwork: artwork || tracks[0]?.thumbnail || null, tracks };
        setFetchedPlaylist(p);
        loadPlaylist(p);
        if (autoplayRef.current && p.tracks.length > 0) playTrack(p.tracks[0], { queue: p.tracks });

        // Keep a derived YouTube cover in MongoDB so the public collection card
        // can display it on later visits. Uploaded artwork is never overwritten.
        if (initialPlaylist?.slug && !initialPlaylist.artwork && p.artwork) {
          apiFetch(`/api/playlists/${initialPlaylist.slug}/cover`, {
            method: 'POST',
            body: JSON.stringify({ thumbnail: p.artwork }),
          }).catch(() => { });
        }
      })
      .catch(() => {
        if (!cancelled) setFetchedPlaylist(null);
      })
      .finally(() => {
        if (!cancelled) setPlaylistLoading(false);
      });

    if (initialPlaylist) {
      const p = toPlayerPlaylist(initialPlaylist);
      if (p.tracks.length > 0) {
        loadPlaylist(p);
        if (autoplayRef.current) playTrack(p.tracks[0], { queue: p.tracks });
        setPlaylistLoading(false);
      } else if (p.sourcePlaylistId) {
        fetchAndPlayPlaylist(p.sourcePlaylistId, p.name, p.artwork);
      } else {
        setPlaylistLoading(false);
      }
    } else {
      fetchAndPlayPlaylist(PLAYLIST_ID, 'YouTube Playlist', DEFAULT_ARTWORK);
      // Home deliberately stays empty until the visitor opens or creates a collection.
      setPlaylistLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [initialPlaylist, loadPlaylist, playTrack, setPlaylistLoading]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <Background track={currentTrack} artwork={player.artwork} />
      <div className="relative z-10 flex min-h-screen flex-col items-center px-6">
        <Header />

        <main className="flex w-full flex-1 flex-col items-center justify-center gap-8 pb-[calc(env(safe-area-inset-bottom)+170px)] pt-20 md:gap-12 md:pb-56 md:pt-24">
          {initialPlaylist && <CreatorLinks name={initialPlaylist.creatorName} links={initialPlaylist.socialLinks} />}
          {!initialPlaylist ? (
            <section className="glass max-w-md rounded-[32px] p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.35)] md:p-8">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 ring-1 ring-accent/25">
                <Music2 size={25} className="text-accent" />
              </span>
              <h1 className="mt-5 font-display text-2xl font-bold md:text-3xl">Create your collection</h1>
              <p className="mt-2 text-sm leading-6 text-soft">Build a playlist, add a YouTube video or playlist link, then share it with anyone.</p>
              <div className="mt-5 space-y-2 text-left text-xs text-muted">
                <p className="flex items-center gap-2"><Plus size={14} className="text-accent" /> Sign in and create your playlist.</p>
                <p className="flex items-center gap-2"><ListMusic size={14} className="text-accent" /> Add songs, artwork, and your links.</p>
                <p className="flex items-center gap-2"><CheckCircle2 size={14} className="text-accent" /> Share your collection when it is ready.</p>
              </div>
            </section>
          ) : (
            <button
              type="button"
              onClick={openPlaylist}
              className="glass flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white/85 transition-all hover:bg-white/10 active:scale-95"
            >
              <ListMusic className="h-4 w-4 text-accent" />
              Playlist
            </button>
          )}
        </main>
      </div>

      <MusicPlayer player={player} />
      <PlaylistDrawer player={player} playlist={playlist} loading={playlistLoading} />
      <QueueDrawer player={player} />
    </div>
  );
}

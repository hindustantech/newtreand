'use client';

import { useState } from 'react';
import { ExternalLink, ListMusic, LogOut, Music2, User as UserIcon, Loader2 } from 'lucide-react';
import { SPOTIFY_URL, YOUTUBE_MUSIC_URL } from '../lib/config.js';
import { useAuth } from '../hooks/use-auth.js';
import LiveClock from './LiveClock.js';
import YoutubeIcon from './YoutubeIcon.js';
import AuthModal from './AuthModal.js';
import MyPlaylists from './MyPlaylists.js';
import Collections from './Collections.js';

export default function Header() {
  const { user, loading, login, register, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [playlistsOpen, setPlaylistsOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);

  return (
    <>
      <header
        className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-4 md:px-10 md:py-6"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
      >
        <LiveClock className="pointer-events-auto" />

        <nav className="pointer-events-auto flex items-center gap-2.5 md:gap-4">
          <a
            href={SPOTIFY_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 text-xs text-soft/90 transition hover:text-white sm:flex"
          >
            <Music2 size={14} />
            Spotify
          </a>
          <button
            type="button"
            onClick={() => setCollectionsOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15 active:scale-95"
          >
            <ListMusic size={13} className="text-accent" />
            Collections
          </button>
          <a
            href={YOUTUBE_MUSIC_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 text-xs text-soft/90 transition hover:text-white sm:flex"
          >
            <YoutubeIcon size={14} />
            YT Music
            <ExternalLink size={11} className="opacity-60" />
          </a>

          {loading ? (
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/60">
              <Loader2 size={13} className="animate-spin" />
            </span>
          ) : user ? (
            <>
              <span
                title={user.email}
                className="hidden max-w-[160px] items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white sm:flex"
              >
                <UserIcon size={13} />
                <span className="truncate">{user.email}</span>
              </span>
              <button
                type="button"
                onClick={() => setPlaylistsOpen(true)}
                className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15 active:scale-95"
              >
                <ListMusic size={13} className="text-accent" />
                Playlists
              </button>
              <button
                type="button"
                onClick={logout}
                aria-label="Log out"
                title="Log out"
                className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15 active:scale-95"
              >
                <LogOut size={13} />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15 active:scale-95"
            >
              <UserIcon size={13} />
              Login
            </button>
          )}
        </nav>
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} login={login} register={register} />
      <MyPlaylists open={playlistsOpen} onClose={() => setPlaylistsOpen(false)} user={user} />
      <Collections open={collectionsOpen} onClose={() => setCollectionsOpen(false)} />
    </>
  );
}

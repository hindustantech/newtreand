'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Plus,
  Play,
  Trash2,
  Pencil,
  Loader2,
  Check,
  ListMusic,
  ImagePlus,
  ImageOff,
} from 'lucide-react';
import { useMediaQuery } from '../hooks/use-media-query.js';
import { apiFetch } from '../lib/client-fetch.js';

export default function MyPlaylists({ open, onClose, user }) {
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [playlists, setPlaylists] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState('');
  const [urls, setUrls] = useState('');
  const [editingSlug, setEditingSlug] = useState(null);
  const [editName, setEditName] = useState('');
  const [addUrl, setAddUrl] = useState('');
  const [creatorName, setCreatorName] = useState('');
  const [socialLinks, setSocialLinks] = useState('');

  const fetchPlaylists = useCallback(async () => apiFetch('/api/playlists'), []);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchPlaylists();
      setPlaylists(data.playlists);
      setError(null);
    } catch (err) {
      setError(err.message);
      setPlaylists([]);
    }
  }, [fetchPlaylists]);

  useEffect(() => {
    if (!open || !user) return undefined;
    fetchPlaylists()
      .then((data) => {
        setPlaylists(data.playlists);
        setError(null);
      })
      .catch((err) => {
        setError(err.message);
        setPlaylists([]);
      });
    return undefined;
  }, [open, user, fetchPlaylists]);

  const createPlaylist = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const data = await apiFetch('/api/playlists', {
        method: 'POST',
        body: JSON.stringify({
          name,
          tracks: urls
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean),
        }),
      });
      router.push(`/${data.playlist.slug}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const renamePlaylist = async (slug) => {
    if (!editName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/playlists/${slug}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName,
          creatorName,
          socialLinks: socialLinks.split('\n').map((link) => link.trim()).filter(Boolean),
        }),
      });
      setEditingSlug(null);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const addTrack = async (slug) => {
    if (!addUrl.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/playlists/${slug}/tracks`, {
        method: 'POST',
        body: JSON.stringify({ tracks: [addUrl] }),
      });
      setAddUrl('');
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeTrack = async (slug, videoId) => {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/playlists/${slug}/tracks`, {
        method: 'DELETE',
        body: JSON.stringify({ videoId }),
      });
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const deletePlaylist = async (slug) => {
    if (!window.confirm('Delete this playlist permanently?')) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/playlists/${slug}`, { method: 'DELETE' });
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const uploadArtwork = async (slug, file) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      await apiFetch(`/api/playlists/${slug}/artwork`, { method: 'PUT', body: form });
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeArtwork = async (slug) => {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/playlists/${slug}/artwork`, { method: 'DELETE' });
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const sheet = isMobile
    ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }
    : { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="mp-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-base/60"
          />
          <motion.div
            key="mp-sheet"
            initial={sheet.initial}
            animate={sheet.animate}
            exit={sheet.exit}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
            className="glass-strong fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-[36px] md:inset-y-0 md:right-0 md:left-auto md:w-[320px] md:max-h-none md:rounded-none md:rounded-l-[32px] md:border-y-0 md:border-r-0"
          >
            <div className="flex items-center gap-3 px-6 pt-4 md:px-4 md:pt-5">
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-display text-lg font-bold">My Playlists</h2>
                <p className="truncate text-xs text-muted">{user?.email}</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-soft transition hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="nice-scroll flex-1 overflow-y-auto px-5 pb-8 pt-4 md:px-3">
              <form onSubmit={createPlaylist} className="rounded-3xl border border-white/10 bg-white/5 p-4 md:rounded-2xl md:p-3">
                <p className="mb-3 text-xs font-semibold text-soft">Create a playlist</p>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Playlist name"
                  className="mb-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-accent/60 md:px-3 md:text-xs"
                />
                <textarea
                  value={urls}
                  onChange={(event) => setUrls(event.target.value)}
                  placeholder={'YouTube video or playlist URLs, one per line\ne.g. https://youtube.com/playlist?list=...'}
                  rows={3}
                  className="mb-3 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-accent/60 md:px-3 md:text-xs"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-2.5 text-sm font-semibold text-base transition hover:scale-[1.01] active:scale-95 disabled:opacity-60"
                >
                  {busy ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  Create
                </button>
              </form>

              {error && (
                <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>
              )}

              <div className="mt-5 space-y-3">
                {playlists === null && (
                  <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted">
                    <Loader2 size={14} className="animate-spin" /> Loading playlists…
                  </div>
                )}
                {playlists?.length === 0 && (
                  <p className="py-8 text-center text-xs text-muted">
                    No playlists yet — create your first one above.
                  </p>
                )}
                {playlists?.map((p) => (
                  <div key={p.slug} className="rounded-3xl border border-white/10 bg-white/5 p-4 md:rounded-2xl md:p-3">
                    <div className="flex items-center gap-3 md:flex-wrap md:gap-2">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 md:h-8 md:w-8 md:rounded-xl">
                        <ListMusic size={17} className="text-accent md:h-4 md:w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        {editingSlug === p.slug ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(event) => setEditName(event.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-sm text-white outline-none focus:border-accent/60"
                          />
                        ) : (
                          <p className="truncate text-sm font-semibold">{p.name}</p>
                        )}
                        <p className="text-xs text-muted">
                          {p.trackCount} song{p.trackCount === 1 ? '' : 's'} · /{p.slug}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 md:ml-10 md:w-[calc(100%-40px)] md:justify-end">
                        <a
                          href={`/${p.slug}`}
                          aria-label="Play"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base transition hover:scale-105 active:scale-95"
                        >
                          <Play size={14} fill="currentColor" />
                        </a>
                        <button
                          type="button"
                          aria-label="Edit"
                          onClick={() => {
                            if (editingSlug === p.slug) {
                              setEditingSlug(null);
                            } else {
                              setEditingSlug(p.slug);
                              setEditName(p.name);
                              setCreatorName(p.creatorName || '');
                              setSocialLinks((p.socialLinks || []).join('\n'));
                            }
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-soft transition hover:bg-white/10"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete"
                          onClick={() => deletePlaylist(p.slug)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-soft transition hover:bg-red-500/20 hover:text-red-300"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3 md:flex-col md:items-stretch md:gap-2">
                      <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/10">
                        {p.artwork ? (
                          <img src={p.artwork} alt="" className="h-full w-full object-cover" />
                        ) : p.trackPreview?.[0]?.thumbnail ? (
                          <img src={p.trackPreview[0].thumbnail} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="block h-full w-full bg-white/5" />
                        )}
                      </span>
                      <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-soft transition hover:bg-white/15 md:justify-center">
                        <ImagePlus size={13} />
                        {p.artwork ? 'Replace' : 'Add artwork'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={busy}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) uploadArtwork(p.slug, file);
                            event.target.value = '';
                          }}
                        />
                      </label>
                      {p.artwork && (
                        <button
                          type="button"
                          onClick={() => removeArtwork(p.slug)}
                          disabled={busy}
                          aria-label="Remove artwork"
                          className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-soft transition hover:bg-red-500/20 hover:text-red-300 disabled:opacity-60 md:justify-center"
                        >
                          <ImageOff size={13} />
                          Remove
                        </button>
                      )}
                    </div>

                    {editingSlug === p.slug && (
                      <div className="mt-3 space-y-2">
                        <div className="flex gap-2 md:flex-col">
                          <input
                            type="text"
                            value={editName}
                            onChange={(event) => setEditName(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') renamePlaylist(p.slug);
                            }}
                            placeholder="New name"
                            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-accent/60"
                          />
                          <button
                            type="button"
                            onClick={() => renamePlaylist(p.slug)}
                            disabled={busy}
                            className="flex items-center justify-center gap-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-soft transition hover:bg-white/15 disabled:opacity-60"
                          >
                            {busy ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Check size={12} />
                            )}
                            Save changes
                          </button>
                        </div>
                        <input
                          type="text"
                          value={creatorName}
                          onChange={(event) => setCreatorName(event.target.value)}
                          placeholder="Your public display name (optional)"
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-accent/60"
                        />
                        <textarea
                          value={socialLinks}
                          onChange={(event) => setSocialLinks(event.target.value)}
                          placeholder={'Social links (optional), one HTTPS URL per line\ne.g. https://instagram.com/yourname'}
                          rows={3}
                          className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-accent/60"
                        />
                        <div className="flex gap-2 md:flex-col">
                          <input
                            type="text"
                            value={addUrl}
                            onChange={(event) => setAddUrl(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') addTrack(p.slug);
                            }}
                            placeholder="Paste a YouTube video or playlist URL"
                            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-accent/60"
                          />
                          <button
                            type="button"
                            onClick={() => addTrack(p.slug)}
                            disabled={busy}
                            className="flex items-center gap-1 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-soft transition hover:bg-white/15 disabled:opacity-60"
                          >
                            <Plus size={12} />
                            Add
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {p.trackPreview?.length ? (
                            p.trackPreview.map((track) => (
                              <div
                                key={track.videoId}
                                className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2"
                              >
                                <img
                                  src={track.thumbnail}
                                  alt=""
                                  className="h-8 w-12 rounded-lg object-cover"
                                />
                                <p className="min-w-0 flex-1 truncate text-xs">{track.title}</p>
                                <button
                                  type="button"
                                  onClick={() => removeTrack(p.slug, track.videoId)}
                                  disabled={busy}
                                  className="text-soft transition hover:text-red-300"
                                  aria-label="Remove track"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="px-1 text-xs text-muted">
                              No tracks yet. Add one above.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

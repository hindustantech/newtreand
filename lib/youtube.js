import { ytEmbed } from './yt-embed.js';

const OEMBED_URL = 'https://www.youtube.com/oembed';
const VIDEO_ID_RE =
  /(?:youtube\.com\/(?:watch\?[^#]*v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

export function parseYouTubeId(input) {
  const value = String(input || '').trim();
  const match = value.match(VIDEO_ID_RE);
  if (match) return match[1];
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  return null;
}

export function parseYouTubePlaylistId(input) {
  const value = String(input || '').trim();
  try {
    const url = new URL(value);
    const playlistId = url.searchParams.get('list');
    if (playlistId && /^[A-Za-z0-9_-]{10,}$/.test(playlistId)) return playlistId;
  } catch {
    // A raw playlist ID is also useful when sharing a collection internally.
  }
  return /^[A-Za-z0-9_-]{10,}$/.test(value) ? value : null;
}

function thumbnailUrl(videoId) {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}

async function oembedTrack(videoId) {
  const url =
    `${OEMBED_URL}?format=json&url=` +
    encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`);
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return {
    title: data.title || 'Unknown',
    artist: data.author_name || 'YouTube',
    thumbnail: data.thumbnail_url || thumbnailUrl(videoId),
  };
}

export async function buildTrack(videoId) {
  const meta = await oembedTrack(videoId);
  return {
    videoId,
    title: meta?.title || 'Unknown',
    artist: meta?.artist || 'YouTube',
    thumbnail: meta?.thumbnail || thumbnailUrl(videoId),
  };
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

async function waitForPlaylistIds(timeoutMs = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const ids = await ytEmbed.getPlaylist();
    if (ids.length) return ids;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Could not read the playlist from the player');
}

// No API key needed: the hidden IFrame player reports the playlist video IDs,
// then the oEmbed endpoint supplies titles/artists for each video.
export async function fetchPlaylistTracks(playlistId) {
  await ytEmbed.ensurePlayer();
  await ytEmbed.cuePlaylistDirect(playlistId);
  const ids = await waitForPlaylistIds();

  const tracks = ids.map((id, index) => ({
    id,
    title: `Track ${index + 1}`,
    artist: 'YouTube',
    thumbnail: thumbnailUrl(id),
    duration: null,
  }));

  await mapWithConcurrency(tracks, 4, async (track) => {
    const meta = await oembedTrack(track.id);
    if (meta) {
      track.title = meta.title;
      track.artist = meta.artist;
      track.thumbnail = meta.thumbnail;
    }
  });
  return tracks;
}

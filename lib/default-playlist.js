import { parseYouTubePlaylistId } from './youtube.js';
import { fetchPlaylistTracks } from './youtube.js';

let cachedPlaylist = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 1000 * 60 * 60;

export async function getDefaultPlaylist() {
  const url = process.env.MAIN_PLAYLIST_URL;
  if (!url) return null;

  if (cachedPlaylist && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedPlaylist;
  }

  const playlistId = parseYouTubePlaylistId(url);
  if (!playlistId) return null;

  try {
    const tracks = await fetchPlaylistTracks(playlistId);
    if (!tracks.length) return null;

    cachedPlaylist = {
      id: playlistId,
      name: 'Featured Playlist',
      slug: 'featured',
      artwork: tracks[0]?.thumbnail || null,
      sourcePlaylistId: playlistId,
      creatorName: null,
      socialLinks: [],
      tracks: tracks.map((t) => ({
        videoId: t.id,
        title: t.title,
        artist: t.artist,
        thumbnail: t.thumbnail,
      })),
    };
    cacheTimestamp = Date.now();
    return cachedPlaylist;
  } catch {
    return null;
  }
}
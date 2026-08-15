export function serializeTrack(track = {}) {
  return {
    videoId: String(track.videoId || ''),
    title: String(track.title || 'Unknown track'),
    artist: String(track.artist || 'YouTube'),
    thumbnail: typeof track.thumbnail === 'string' ? track.thumbnail : '',
  };
}

export function sanitizeSocialLinks(value) {
  const links = Array.isArray(value) ? value : [];
  const unique = new Set();

  for (const rawLink of links) {
    try {
      const url = new URL(String(rawLink).trim());
      if (url.protocol === 'https:' && unique.size < 5) unique.add(url.toString());
    } catch {
      // Ignore malformed links rather than exposing them publicly.
    }
  }
  return [...unique];
}

// MongoDB BSON values (ObjectId and Date) must never cross an RSC client boundary.
export function serializePlaylist(playlist, { includeTracks = true } = {}) {
  if (!playlist) return null;

  const tracks = Array.isArray(playlist.tracks) ? playlist.tracks : [];
  return {
    id: playlist._id?.toString?.() || String(playlist.id || ''),
    name: String(playlist.name || 'Untitled playlist'),
    slug: String(playlist.slug || ''),
    artwork: typeof playlist.artwork === 'string' ? playlist.artwork : null,
    sourcePlaylistId:
      typeof playlist.sourcePlaylistId === 'string' ? playlist.sourcePlaylistId : null,
    creatorName: typeof playlist.creatorName === 'string' ? playlist.creatorName : null,
    socialLinks: sanitizeSocialLinks(playlist.socialLinks),
    trackCount: tracks.length,
    ...(includeTracks ? { tracks: tracks.map(serializeTrack) } : {}),
  };
}

import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../lib/auth.js';
import { connectToDatabase } from '../../../../../lib/mongodb.js';
import { buildTrack, parseYouTubeId, parseYouTubePlaylistId } from '../../../../../lib/youtube.js';
import { requireCsrf } from '../../../../../lib/csrf.js';

async function getOwnedPlaylist(slug, userId) {
  const db = await connectToDatabase();
  const playlist = await db.collection('playlists').findOne({ slug });
  if (!playlist || playlist.userId.toString() !== userId.toString()) return null;
  return { db, playlist };
}

export async function POST(request, { params }) {
  const csrfDenied = await requireCsrf(request);
  if (csrfDenied) return csrfDenied;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Login required' }, { status: 401 });
  }

  const { slug } = await params;
  const found = await getOwnedPlaylist(slug, user._id);
  if (!found) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const ids = [];
  let sourcePlaylistId = null;
  for (const entry of Array.isArray(body.tracks) ? body.tracks : []) {
    const playlistId = parseYouTubePlaylistId(entry);
    if (playlistId && !sourcePlaylistId) sourcePlaylistId = playlistId;
    const videoId = parseYouTubeId(entry);
    if (videoId && !ids.includes(videoId)) ids.push(videoId);
  }
  if (!ids.length && !sourcePlaylistId) {
    return NextResponse.json({ error: 'Provide a valid YouTube video or playlist URL' }, { status: 400 });
  }

  const existing = new Set((found.playlist.tracks || []).map((t) => t.videoId));
  const newTracks = [];
  for (let i = 0; i < ids.length; i += 4) {
    const batch = await Promise.all(ids.slice(i, i + 4).map((id) => buildTrack(id)));
    for (const track of batch) {
      if (!existing.has(track.videoId)) newTracks.push(track);
    }
  }

  const update = {
    $push: { tracks: { $each: newTracks } },
    $set: { updatedAt: new Date() },
  };
  if (sourcePlaylistId) update.$set.sourcePlaylistId = sourcePlaylistId;

  const result = await found.db
    .collection('playlists')
    .findOneAndUpdate(
      { slug },
      update,
      { returnDocument: 'after' },
    );

  return NextResponse.json({ playlist: result }, { status: 201 });
}

export async function DELETE(request, { params }) {
  const csrfDenied = await requireCsrf(request);
  if (csrfDenied) return csrfDenied;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Login required' }, { status: 401 });
  }

  const { slug } = await params;
  const found = await getOwnedPlaylist(slug, user._id);
  if (!found) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const videoId = parseYouTubeId(body.videoId);
  if (!videoId) {
    return NextResponse.json({ error: 'Invalid video ID' }, { status: 400 });
  }

  const result = await found.db
    .collection('playlists')
    .findOneAndUpdate(
      { slug },
      { $pull: { tracks: { videoId } }, $set: { updatedAt: new Date() } },
      { returnDocument: 'after' },
    );

  return NextResponse.json({ playlist: result });
}

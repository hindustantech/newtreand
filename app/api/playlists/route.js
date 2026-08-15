import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/auth.js';
import { connectToDatabase } from '../../../lib/mongodb.js';
import { makeUniqueSlug } from '../../../lib/slug.js';
import { buildTrack, parseYouTubeId, parseYouTubePlaylistId } from '../../../lib/youtube.js';
import { requireCsrf } from '../../../lib/csrf.js';

function requireUser(user) {
  if (!user) {
    return NextResponse.json({ error: 'Login required' }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const user = await getCurrentUser();
  const denied = requireUser(user);
  if (denied) return denied;

  const db = await connectToDatabase();
  const playlists = await db
    .collection('playlists')
    .aggregate([
      { $match: { userId: user._id } },
      { $sort: { createdAt: -1 } },
      {
        $project: {
          name: 1,
          slug: 1,
          artwork: 1,
          creatorName: 1,
          socialLinks: 1,
          trackCount: { $size: '$tracks' },
          trackPreview: { $slice: ['$tracks', 3] },
        },
      },
    ])
    .toArray();

  return NextResponse.json({
    playlists: playlists.map((p) => ({
      id: p._id.toString(),
      name: p.name,
      slug: p.slug,
      artwork: p.artwork || null,
      creatorName: p.creatorName || '',
      socialLinks: p.socialLinks || [],
      trackCount: p.trackCount,
      trackPreview: p.trackPreview || [],
    })),
  });
}

export async function POST(request) {
  const csrfDenied = await requireCsrf(request);
  if (csrfDenied) return csrfDenied;

  const user = await getCurrentUser();
  const denied = requireUser(user);
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const name = String(body.name || '').trim();
  if (!name) {
    return NextResponse.json({ error: 'Playlist name is required' }, { status: 400 });
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
    return NextResponse.json({ error: 'Add a YouTube video or playlist URL' }, { status: 400 });
  }

  const tracks = [];
  for (let i = 0; i < ids.length; i += 4) {
    const batch = await Promise.all(ids.slice(i, i + 4).map((id) => buildTrack(id)));
    tracks.push(...batch);
  }

  const db = await connectToDatabase();
  const playlist = {
    userId: user._id,
    name,
    slug: '',
    tracks,
    sourcePlaylistId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let result = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    playlist.slug = makeUniqueSlug(name);
    try {
      result = await db.collection('playlists').insertOne(playlist);
      break;
    } catch (error) {
      if (error?.code !== 11000) throw error;
    }
  }
  if (!result) {
    return NextResponse.json({ error: 'Could not create playlist, try again' }, { status: 500 });
  }

  return NextResponse.json(
    {
      playlist: {
        id: result.insertedId.toString(),
        name: playlist.name,
        slug: playlist.slug,
        tracks: playlist.tracks,
        sourcePlaylistId: playlist.sourcePlaylistId,
      },
    },
    { status: 201 },
  );
}

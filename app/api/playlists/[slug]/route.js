import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/auth.js';
import { connectToDatabase } from '../../../../lib/mongodb.js';
import { requireCsrf } from '../../../../lib/csrf.js';
import { sanitizeSocialLinks, serializePlaylist } from '../../../../lib/playlists.js';

async function findPlaylist(slug) {
  const db = await connectToDatabase();
  return db.collection('playlists').findOne({ slug });
}

export async function GET(_request, { params }) {
  const { slug } = await params;
  const playlist = await findPlaylist(slug);
  if (!playlist) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
  }
  return NextResponse.json({
    playlist: serializePlaylist(playlist),
  });
}

export async function PATCH(request, { params }) {
  const csrfDenied = await requireCsrf(request);
  if (csrfDenied) return csrfDenied;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Login required' }, { status: 401 });
  }

  const { slug } = await params;
  const db = await connectToDatabase();
  const playlist = await db.collection('playlists').findOne({ slug });
  if (!playlist) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
  }
  if (playlist.userId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: 'You can only edit your own playlists' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const update = { updatedAt: new Date() };
  if (typeof body.name === 'string' && body.name.trim()) {
    update.name = body.name.trim();
  }
  if (typeof body.creatorName === 'string') {
    update.creatorName = body.creatorName.trim().slice(0, 60);
  }
  if (Array.isArray(body.socialLinks)) {
    update.socialLinks = sanitizeSocialLinks(body.socialLinks);
  }

  const result = await db
    .collection('playlists')
    .findOneAndUpdate({ slug }, { $set: update }, { returnDocument: 'after' });

  return NextResponse.json({
    playlist: {
      id: result._id.toString(),
      name: result.name,
      slug: result.slug,
      tracks: result.tracks || [],
    },
  });
}

export async function DELETE(request, { params }) {
  const csrfDenied = await requireCsrf(request);
  if (csrfDenied) return csrfDenied;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Login required' }, { status: 401 });
  }

  const { slug } = await params;
  const db = await connectToDatabase();
  const playlist = await db.collection('playlists').findOne({ slug });
  if (!playlist) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
  }
  if (playlist.userId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: 'You can only delete your own playlists' }, { status: 403 });
  }

  await db.collection('playlists').deleteOne({ slug });
  return NextResponse.json({ ok: true });
}

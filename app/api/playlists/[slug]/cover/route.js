import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../lib/auth.js';
import { connectToDatabase } from '../../../../../lib/mongodb.js';
import { requireCsrf } from '../../../../../lib/csrf.js';

function isYouTubeThumbnail(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'i.ytimg.com' &&
      /^\/vi\/[A-Za-z0-9_-]{11}\//.test(url.pathname)
    );
  } catch {
    return false;
  }
}

// Saves the first fetched YouTube thumbnail only when the owner has not uploaded artwork.
export async function POST(request, { params }) {
  const csrfDenied = await requireCsrf(request);
  if (csrfDenied) return csrfDenied;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!isYouTubeThumbnail(body.thumbnail)) {
    return NextResponse.json({ error: 'Invalid YouTube thumbnail' }, { status: 400 });
  }

  const { slug } = await params;
  const db = await connectToDatabase();
  const result = await db.collection('playlists').findOneAndUpdate(
    { slug, userId: user._id, artwork: { $in: [null, ''] } },
    { $set: { artwork: body.thumbnail, updatedAt: new Date() } },
    { returnDocument: 'after' },
  );

  if (!result) {
    const playlist = await db.collection('playlists').findOne({ slug });
    if (!playlist) return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    if (playlist.userId.toString() !== user._id.toString()) {
      return NextResponse.json({ error: 'You can only edit your own playlists' }, { status: 403 });
    }
    return NextResponse.json({ artwork: playlist.artwork || null });
  }

  return NextResponse.json({ artwork: result.artwork });
}

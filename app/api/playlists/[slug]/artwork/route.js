import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../../lib/auth.js';
import { connectToDatabase } from '../../../../../lib/mongodb.js';
import { requireCsrf } from '../../../../../lib/csrf.js';
import { createRateLimit, clientKey } from '../../../../../lib/rate-limit.js';
import { uploadArtwork, deleteArtwork, artworkPublicId } from '../../../../../lib/cloudinary.js';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const uploadLimiter = createRateLimit({ windowMs: 60 * 60 * 1000, max: 30 });

async function getOwnedPlaylist(slug, userId) {
  const db = await connectToDatabase();
  const playlist = await db.collection('playlists').findOne({ slug });
  if (!playlist || playlist.userId.toString() !== userId.toString()) return null;
  return { db, playlist };
}

export async function PUT(request, { params }) {
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

  const limited = uploadLimiter(clientKey(request));
  if (!limited.allowed) {
    return NextResponse.json(
      { error: `Too many uploads, try again in ${limited.retryAfter}s` },
      { status: 429 },
    );
  }

  let file;
  try {
    const form = await request.formData();
    file = form.get('file');
  } catch {
    return NextResponse.json({ error: 'Invalid upload' }, { status: 400 });
  }

  if (!file || typeof file.arrayBuffer !== 'function') {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 });
  }

  const type = String(file.type || '');
  if (!type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: 'Image must be between 1 byte and 5 MB' },
      { status: 400 },
    );
  }

  let uploaded;
  try {
    uploaded = await uploadArtwork(buffer, slug);
  } catch {
    return NextResponse.json({ error: 'Could not upload image, try again' }, { status: 502 });
  }

  const result = await found.db.collection('playlists').findOneAndUpdate(
    { slug },
    {
      $set: {
        artwork: uploaded.url,
        artworkPublicId: uploaded.publicId,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' },
  );

  return NextResponse.json({ artwork: result?.artwork || uploaded.url });
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

  const publicId = found.playlist.artworkPublicId || artworkPublicId(slug);
  if (found.playlist.artwork) {
    try {
      await deleteArtwork(publicId);
    } catch {
      // ignore Cloudinary cleanup failures; still clear the local field
    }
  }

  await found.db.collection('playlists').findOneAndUpdate(
    { slug },
    { $unset: { artwork: '', artworkPublicId: '' }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after' },
  );

  return NextResponse.json({ ok: true });
}

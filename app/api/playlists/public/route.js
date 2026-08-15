import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongodb.js';
import { serializePlaylist } from '../../../../lib/playlists.js';

// This endpoint deliberately exposes only share-safe playlist information.
// Managing playlists remains protected by the authenticated endpoints.
export async function GET() {
  const db = await connectToDatabase();
  const playlists = await db
    .collection('playlists')
    .find({}, { projection: { name: 1, slug: 1, artwork: 1, tracks: 1, creatorName: 1, socialLinks: 1, createdAt: 1 } })
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json({
    playlists: playlists.map((playlist) => serializePlaylist(playlist, { includeTracks: false })),
  });
}

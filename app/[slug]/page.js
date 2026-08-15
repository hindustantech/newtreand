import { notFound } from 'next/navigation';
import MusicApp from '../../components/MusicApp.js';
import { APP_TITLE } from '../../lib/config.js';
import { connectToDatabase } from '../../lib/mongodb.js';
import { serializePlaylist } from '../../lib/playlists.js';

async function getPlaylistBySlug(slug) {
  try {
    const db = await connectToDatabase();
    return db.collection('playlists').findOne({ slug });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const playlist = await getPlaylistBySlug(slug);
  if (!playlist) return { title: `Not found | ${APP_TITLE}` };

  const trackCount = playlist.tracks?.length || 0;
  const description = `${trackCount} song${trackCount === 1 ? '' : 's'} in ${playlist.name}`;
  return {
    title: playlist.name,
    description,
    openGraph: {
      title: playlist.name,
      description,
      ...(playlist.artwork ? { images: [{ url: playlist.artwork, alt: `${playlist.name} artwork` }] } : {}),
    },
    twitter: {
      card: playlist.artwork ? 'summary_large_image' : 'summary',
      title: playlist.name,
      description,
      ...(playlist.artwork ? { images: [playlist.artwork] } : {}),
    },
  };
}

export default async function PlaylistPage({ params }) {
  const { slug } = await params;
  const playlist = await getPlaylistBySlug(slug);
  if (!playlist) notFound();
  return <MusicApp initialPlaylist={serializePlaylist(playlist)} />;
}

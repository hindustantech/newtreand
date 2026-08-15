import MusicApp from '../components/MusicApp.js';
import { getDefaultPlaylist } from '../lib/default-playlist.js';

export default async function Home() {
  const initialPlaylist = await getDefaultPlaylist();
  return <MusicApp initialPlaylist={initialPlaylist} />;
}

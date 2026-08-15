'use client';

import { Globe2, Music2, Share2 } from 'lucide-react';

function socialMeta(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    if (host.includes('instagram.com')) return { label: 'Instagram', Icon: Share2 };
    if (host.includes('youtube.com') || host.includes('youtu.be')) return { label: 'YouTube', Icon: Music2 };
    if (host.includes('facebook.com')) return { label: 'Facebook', Icon: Share2 };
    if (host.includes('spotify.com') || host.includes('soundcloud.com') || host.includes('music.apple.com')) return { label: 'Music', Icon: Music2 };
    return { label: host, Icon: Globe2 };
  } catch {
    return { label: 'Website', Icon: Globe2 };
  }
}

export default function CreatorLinks({ name, links = [] }) {
  if (!name && !links.length) return null;

  return (
    <section className="glass max-w-md rounded-3xl px-4 py-3 text-center">
      {name && <p className="text-sm font-semibold text-white">Curated by {name}</p>}
      {links.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {links.map((url) => {
            const { label, Icon } = socialMeta(url);
            return (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-soft transition hover:bg-white/20 hover:text-white">
                <Icon size={13} />
                {label}
              </a>
            );
          })}
        </div>
      )}
    </section>
  );
}

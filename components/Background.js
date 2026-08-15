'use client';

import { useState } from 'react';
import { DEFAULT_ARTWORK } from '../lib/config.js';

export default function Background({ track, artwork }) {
  const url = artwork || track?.thumbnail || DEFAULT_ARTWORK;
  const [lastUrl, setLastUrl] = useState(url);
  const [layers, setLayers] = useState([{ url: DEFAULT_ARTWORK, key: 0, opacity: 1 }]);

  if (url !== lastUrl) {
    setLastUrl(url);
    setLayers((prev) =>
      [
        ...prev.map((layer) => ({ ...layer, opacity: 0 })),
        { url, key: Date.now(), opacity: 1 },
      ].slice(-2),
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-base">
      {layers.map((layer) => (
        <div
          key={layer.key}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            opacity: layer.opacity,
            backgroundImage: `url("${layer.url}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            backgroundRepeat: 'no-repeat',
            willChange: 'opacity',
          }}
        />
      ))}

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 30%, rgba(24,22,16,0.25) 0%, rgba(8,8,8,0.6) 60%, rgba(8,8,8,0.92) 100%)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-base/45 via-transparent to-base/70" />
    </div>
  );
}
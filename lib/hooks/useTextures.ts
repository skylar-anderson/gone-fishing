'use client';

import { useState, useEffect } from 'react';
import type { TileTextures, TextureExport } from '@/lib/types/textures';
import { createAllDefaultTextures } from '@/lib/textures/defaults';

let cachedTextures: TileTextures | null = null;

export function useTextures() {
  const [textures, setTextures] = useState<TileTextures>(cachedTextures || createAllDefaultTextures());
  const [loading, setLoading] = useState(!cachedTextures);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedTextures) {
      setTextures(cachedTextures);
      setLoading(false);
      return;
    }

    fetch('/api/textures')
      .then(res => res.json())
      .then((data: TextureExport) => {
        if (data.version === 1 && data.tileTextures) {
          cachedTextures = data.tileTextures;
          setTextures(data.tileTextures);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { textures, loading, error };
}

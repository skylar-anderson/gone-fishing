'use client';

import { useState, useEffect } from 'react';

export interface SceneMetadata {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

let cachedScenes: SceneMetadata[] | null = null;

export function useScenes() {
  const [scenes, setScenes] = useState<SceneMetadata[]>(cachedScenes || []);
  const [loading, setLoading] = useState(!cachedScenes);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedScenes) {
      setScenes(cachedScenes);
      setLoading(false);
      return;
    }

    fetch('/api/scenes')
      .then(res => res.json())
      .then((data: SceneMetadata[]) => {
        cachedScenes = data;
        setScenes(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { scenes, loading, error };
}

export function getDefaultSceneId(scenes: SceneMetadata[]): string {
  const pond = scenes.find(s => s.id === 'pond');
  if (pond) return pond.id;
  return scenes[0]?.id || 'pond';
}

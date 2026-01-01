'use client';

import { useCallback, useRef } from 'react';

interface UseSoundOptions {
  maxDuration?: number; // Stop playback after this many ms
}

export function useSound(src: string, options: UseSoundOptions = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const play = useCallback(() => {
    // Clean up any existing playback
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Create new audio instance
    const audio = new Audio(src);
    audioRef.current = audio;

    audio.play().catch(() => {
      // Ignore autoplay errors (browser may block until user interaction)
    });

    // Stop after maxDuration if specified
    if (options.maxDuration) {
      timeoutRef.current = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }, options.maxDuration);
    }
  }, [src, options.maxDuration]);

  return { play };
}

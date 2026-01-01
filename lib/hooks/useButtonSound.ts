'use client';

import { useCallback } from 'react';
import { useSound } from './useSound';

/**
 * Hook that returns a click handler wrapper that plays the button sound.
 * Usage: const withSound = useButtonSound();
 *        <button onClick={withSound(handleClick)}>
 */
export function useButtonSound() {
  const { play } = useSound('/sounds/button.wav');

  const withSound = useCallback(
    <T extends (...args: unknown[]) => unknown>(handler?: T) => {
      return (...args: Parameters<T>) => {
        play();
        return handler?.(...args);
      };
    },
    [play]
  );

  return withSound;
}

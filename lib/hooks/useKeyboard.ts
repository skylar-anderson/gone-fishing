'use client';

import { useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Direction, Position, ClientMessage } from '@/lib/types';
import { canMoveTo, getNewPosition } from '@/lib/utils/collision';
import { useSound } from './useSound';

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  W: 'up',
  s: 'down',
  S: 'down',
  a: 'left',
  A: 'left',
  d: 'right',
  D: 'right',
};

interface UseKeyboardOptions {
  sendMessage: (message: ClientMessage) => void;
}

export function useKeyboard({ sendMessage }: UseKeyboardOptions) {
  const { scene, position, isFishing, shopOpen, setFishing, updatePosition, setShopOpen } = useGameStore();
  const { play: playSplashSound } = useSound('/sounds/splash.wav');

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Handle escape key to close shop
      if (event.key === 'Escape') {
        if (shopOpen) {
          event.preventDefault();
          setShopOpen(false);
          sendMessage({ type: 'CLOSE_SHOP', payload: {} });
        }
        return;
      }

      // Don't handle other keys if shop is open
      if (shopOpen) return;

      // Handle shop key (E to open shop)
      if (event.key === 'e' || event.key === 'E') {
        event.preventDefault();
        if (!isFishing) {
          sendMessage({ type: 'OPEN_SHOP', payload: {} });
        }
        return;
      }

      // Handle fishing key
      if (event.key === ' ' || event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        if (!isFishing) {
          playSplashSound();
          setFishing(true);
          sendMessage({ type: 'START_FISHING', payload: {} });
        }
        return;
      }

      // Don't move while fishing
      if (isFishing) return;

      // Handle movement
      const direction = KEY_TO_DIRECTION[event.key];
      if (!direction || !scene) return;

      event.preventDefault();

      const newPosition = getNewPosition(position, direction);

      if (canMoveTo(scene.map, newPosition)) {
        // Update local state immediately for responsiveness
        updatePosition(newPosition, direction);

        // Send to server
        sendMessage({
          type: 'MOVE',
          payload: { position: newPosition, direction },
        });
      } else {
        // Just update direction even if we can't move
        updatePosition(position, direction);
      }
    },
    [scene, position, isFishing, shopOpen, setFishing, updatePosition, setShopOpen, sendMessage, playSplashSound]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

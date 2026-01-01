'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';

const MOVEMENT_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'w', 'W', 'a', 'A', 's', 'S', 'd', 'D'
]);

const STOP_DEBOUNCE_MS = 150;

export function useWalkingSound() {
  const isFishing = useGameStore(state => state.isFishing);
  const shopOpen = useGameStore(state => state.shopOpen);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const heldKeysRef = useRef<Set<string>>(new Set());
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use refs for state to avoid stale closures in event handlers
  const stateRef = useRef({ isFishing, shopOpen });
  stateRef.current = { isFishing, shopOpen };

  const startSound = useCallback(() => {
    // Don't start if fishing or shop is open
    if (stateRef.current.isFishing || stateRef.current.shopOpen) return;

    // Cancel any pending stop
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }

    // Create audio if needed
    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/walking.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.6;
    }

    // Start if not already playing
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  }, []);

  const stopSound = useCallback((immediate = false) => {
    // Cancel any pending stop first
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }

    if (immediate) {
      // Stop immediately
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } else {
      // Debounced stop
      stopTimeoutRef.current = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        stopTimeoutRef.current = null;
      }, STOP_DEBOUNCE_MS);
    }
  }, []);

  // Stop sound when fishing starts or shop opens
  useEffect(() => {
    if (isFishing || shopOpen) {
      heldKeysRef.current.clear();
      stopSound(true);
    }
  }, [isFishing, shopOpen, stopSound]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (!MOVEMENT_KEYS.has(e.key)) return;
      if (stateRef.current.isFishing || stateRef.current.shopOpen) return;

      const wasEmpty = heldKeysRef.current.size === 0;
      heldKeysRef.current.add(e.key);

      if (wasEmpty) {
        startSound();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!MOVEMENT_KEYS.has(e.key)) return;

      heldKeysRef.current.delete(e.key);

      if (heldKeysRef.current.size === 0) {
        stopSound(false); // Debounced stop
      }
    };

    // Stop sound when window loses focus
    const handleBlur = () => {
      heldKeysRef.current.clear();
      stopSound(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
      }
    };
  }, [startSound, stopSound]);
}

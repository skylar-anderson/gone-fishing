'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Hook that returns true briefly when a value increases.
 * Useful for triggering animations on value changes.
 */
export function useAnimateOnChange(
  value: number,
  duration: number = 300
): boolean {
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValueRef = useRef(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only animate if value increased
    if (value > prevValueRef.current) {
      setIsAnimating(true);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Reset animation state after duration
      timeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
      }, duration);
    }

    prevValueRef.current = value;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, duration]);

  return isAnimating;
}

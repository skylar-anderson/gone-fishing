'use client';

import { useRef, useEffect, useState } from 'react';
import { Position } from '@/lib/types';

const LERP_FACTOR = 0.25; // Adjust for speed (higher = faster snap)
const SNAP_THRESHOLD = 0.01; // Snap to target when within this distance

function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

export interface InterpolatedPosition {
  x: number;
  y: number;
}

export function useInterpolatedPosition(target: Position): InterpolatedPosition {
  const [visual, setVisual] = useState<InterpolatedPosition>({
    x: target.x,
    y: target.y,
  });
  const frameRef = useRef<number | null>(null);
  const targetRef = useRef(target);

  // Update target ref when prop changes
  targetRef.current = target;

  useEffect(() => {
    const animate = () => {
      setVisual((prev) => {
        const dx = Math.abs(targetRef.current.x - prev.x);
        const dy = Math.abs(targetRef.current.y - prev.y);

        // Snap if close enough to avoid infinite tiny updates
        if (dx < SNAP_THRESHOLD && dy < SNAP_THRESHOLD) {
          return { x: targetRef.current.x, y: targetRef.current.y };
        }

        return {
          x: lerp(prev.x, targetRef.current.x, LERP_FACTOR),
          y: lerp(prev.y, targetRef.current.y, LERP_FACTOR),
        };
      });
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return visual;
}

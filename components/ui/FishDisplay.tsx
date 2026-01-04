'use client';

import { useFishSpriteStore } from '@/store/fishSpriteStore';

interface FishDisplayProps {
  fishId: string;
  emoji: string;
  size?: number; // Display size in pixels
  className?: string;
}

/**
 * Renders a fish sprite if available, otherwise falls back to emoji.
 * Uses sprites from the fish sprite store (localStorage).
 */
export function FishDisplay({ fishId, emoji, size = 64, className = '' }: FishDisplayProps) {
  const sprites = useFishSpriteStore((state) => state.sprites);
  const sprite = sprites[fishId];

  // Check if sprite has any visible (non-transparent) pixels
  const hasVisiblePixels = sprite?.pixels.some((row) =>
    row.some((pixel) => pixel !== 'transparent')
  );

  if (sprite && hasVisiblePixels) {
    const pixelSize = size / sprite.width;

    return (
      <div
        className={`inline-block ${className}`}
        style={{
          // Checkerboard background for transparency
          backgroundImage: `
            linear-gradient(45deg, #374151 25%, transparent 25%),
            linear-gradient(-45deg, #374151 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, #374151 75%),
            linear-gradient(-45deg, transparent 75%, #374151 75%)
          `,
          backgroundSize: `${Math.max(4, size / 16)}px ${Math.max(4, size / 16)}px`,
          backgroundPosition: '0 0, 0 2px, 2px -2px, -2px 0px',
          backgroundColor: '#1f2937',
          borderRadius: '4px',
        }}
      >
        <svg width={size} height={size}>
          {sprite.pixels.map((row, y) =>
            row.map((color, x) =>
              color !== 'transparent' ? (
                <rect
                  key={`${x}-${y}`}
                  x={x * pixelSize}
                  y={y * pixelSize}
                  width={pixelSize}
                  height={pixelSize}
                  fill={color}
                />
              ) : null
            )
          )}
        </svg>
      </div>
    );
  }

  // Fall back to emoji
  const emojiSizeClass = size >= 64 ? 'text-6xl' : size >= 32 ? 'text-2xl' : 'text-xl';
  return <span className={`${emojiSizeClass} ${className}`}>{emoji}</span>;
}

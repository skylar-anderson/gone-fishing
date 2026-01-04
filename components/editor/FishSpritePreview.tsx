'use client';

import type { FishSprite } from '@/lib/types/fishSprites';

interface FishSpritePreviewProps {
  sprite: FishSprite;
  emoji: string;
  fishName: string;
}

export function FishSpritePreview({ sprite, emoji, fishName }: FishSpritePreviewProps) {
  // Display sprite at 64x64 (half size for preview)
  const displaySize = 64;
  const pixelSize = displaySize / sprite.width;

  return (
    <div className="space-y-4">
      {/* Sprite preview */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-2">Preview</h3>
        <div
          className="inline-block rounded border border-gray-600"
          style={{
            // Checkerboard background for transparency
            backgroundImage: `
              linear-gradient(45deg, #374151 25%, transparent 25%),
              linear-gradient(-45deg, #374151 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #374151 75%),
              linear-gradient(-45deg, transparent 75%, #374151 75%)
            `,
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
            backgroundColor: '#1f2937',
          }}
        >
          <svg width={displaySize} height={displaySize}>
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
      </div>

      {/* Emoji comparison */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-2">Original Emoji</h3>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{emoji}</span>
          <div className="text-xs text-gray-500">
            <div>{fishName}</div>
            <div className="text-gray-600">Reference</div>
          </div>
        </div>
      </div>

      {/* Small preview (how it appears in inventory) */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-2">Inventory Size</h3>
        <div
          className="inline-block rounded border border-gray-600"
          style={{
            backgroundImage: `
              linear-gradient(45deg, #374151 25%, transparent 25%),
              linear-gradient(-45deg, #374151 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #374151 75%),
              linear-gradient(-45deg, transparent 75%, #374151 75%)
            `,
            backgroundSize: '4px 4px',
            backgroundPosition: '0 0, 0 2px, 2px -2px, -2px 0px',
            backgroundColor: '#1f2937',
          }}
        >
          <svg width={32} height={32}>
            {sprite.pixels.map((row, y) =>
              row.map((color, x) =>
                color !== 'transparent' ? (
                  <rect
                    key={`small-${x}-${y}`}
                    x={x * (32 / sprite.width)}
                    y={y * (32 / sprite.height)}
                    width={32 / sprite.width}
                    height={32 / sprite.height}
                    fill={color}
                  />
                ) : null
              )
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}

'use client';

import type { PixelTexture } from '@/lib/types/textures';

interface TexturePreviewProps {
  texture: PixelTexture;
}

export function TexturePreview({ texture }: TexturePreviewProps) {
  // Tiled preview matching in-game appearance
  // Textures are 16x16, tiles render at 16px (1:1), preview scales up for visibility
  const tileCount = 4;
  const displaySize = 160; // Total preview size
  const tileSize = displaySize / tileCount; // 40px per tile in preview (2.5x game scale)
  const pixelSize = tileSize / texture.width;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-400">Preview</h3>
      <p className="text-xs text-gray-500">As it appears in-game (tiled)</p>

      <svg
        width={displaySize}
        height={displaySize}
        className="border border-gray-600 rounded"
      >
        {Array.from({ length: tileCount }).map((_, tileY) =>
          Array.from({ length: tileCount }).map((_, tileX) => (
            <g
              key={`tile-${tileX}-${tileY}`}
              transform={`translate(${tileX * tileSize}, ${tileY * tileSize})`}
            >
              {texture.pixels.map((row, y) =>
                row.map((color, x) => (
                  <rect
                    key={`${x}-${y}`}
                    x={x * pixelSize}
                    y={y * pixelSize}
                    width={pixelSize}
                    height={pixelSize}
                    fill={color}
                  />
                ))
              )}
            </g>
          ))
        )}
      </svg>
    </div>
  );
}

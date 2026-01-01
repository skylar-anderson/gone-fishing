'use client';

import type { PixelTexture } from '@/lib/types/textures';

interface TexturePreviewProps {
  texture: PixelTexture;
}

function renderTextureSVG(texture: PixelTexture, size: number) {
  const pixelSize = size / texture.width;

  return (
    <svg width={size} height={size} className="border border-gray-600 rounded">
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
    </svg>
  );
}

function renderTiledPreview(texture: PixelTexture, tileCount: number, tileSize: number) {
  const totalSize = tileCount * tileSize;
  const pixelSize = tileSize / texture.width;

  return (
    <svg width={totalSize} height={totalSize} className="border border-gray-600 rounded">
      {Array.from({ length: tileCount }).map((_, tileY) =>
        Array.from({ length: tileCount }).map((_, tileX) => (
          <g key={`tile-${tileX}-${tileY}`} transform={`translate(${tileX * tileSize}, ${tileY * tileSize})`}>
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
  );
}

export function TexturePreview({ texture }: TexturePreviewProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-400">Preview</h3>

      {/* 1x size (actual game size, very small) */}
      <div>
        <div className="text-xs text-gray-500 mb-1">1x (16px)</div>
        {renderTextureSVG(texture, 16)}
      </div>

      {/* 2x size */}
      <div>
        <div className="text-xs text-gray-500 mb-1">2x (32px)</div>
        {renderTextureSVG(texture, 32)}
      </div>

      {/* 4x size */}
      <div>
        <div className="text-xs text-gray-500 mb-1">4x (64px)</div>
        {renderTextureSVG(texture, 64)}
      </div>

      {/* Tiled 3x3 preview */}
      <div>
        <div className="text-xs text-gray-500 mb-1">Tiled (3x3)</div>
        {renderTiledPreview(texture, 3, 32)}
      </div>
    </div>
  );
}

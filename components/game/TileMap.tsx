'use client';

import { memo } from 'react';
import { TileMap as TileMapType } from '@/lib/types';
import type { TileTextures } from '@/lib/types/textures';
import { createAllDefaultTextures } from '@/lib/textures/defaults';
import { renderAllPatterns, getPatternFill } from '@/lib/textures/patterns';

interface TileMapProps {
  map: TileMapType;
  textures?: TileTextures;
}

// Lazily create default textures (only once)
let defaultTextures: TileTextures | null = null;
function getDefaultTextures(): TileTextures {
  if (!defaultTextures) {
    defaultTextures = createAllDefaultTextures();
  }
  return defaultTextures;
}

export const TileMap = memo(function TileMap({ map, textures }: TileMapProps) {
  const activeTextures = textures ?? getDefaultTextures();

  return (
    <g className="tile-map">
      {renderAllPatterns(activeTextures, map.tileSize)}
      {map.tiles.map((row, y) =>
        row.map((tile, x) => (
          <rect
            key={`${x}-${y}`}
            x={x * map.tileSize}
            y={y * map.tileSize}
            width={map.tileSize}
            height={map.tileSize}
            fill={getPatternFill(tile.type)}
          />
        ))
      )}
    </g>
  );
});

'use client';

import { TileMap as TileMapType, TileType } from '@/lib/types';

const TILE_COLORS: Record<TileType, string> = {
  grass: '#4ade80',
  dirt: '#a16207',
  sand: '#fde047',
  water: '#38bdf8',
  deep_water: '#1d4ed8',
  dock: '#78716c',
  mud: '#713f12',
  rock: '#6b7280',
  shop: '#a855f7',
};

interface TileMapProps {
  map: TileMapType;
  backgroundImage?: string;
}

export function TileMap({ map, backgroundImage }: TileMapProps) {
  const width = map.width * map.tileSize;
  const height = map.height * map.tileSize;

  // If we have a background image, render it instead of tile colors
  if (backgroundImage) {
    return (
      <g className="tile-map">
        <image
          href={backgroundImage}
          x={0}
          y={0}
          width={width}
          height={height}
          preserveAspectRatio="none"
        />
      </g>
    );
  }

  // Fallback to colored tiles
  return (
    <g className="tile-map">
      {map.tiles.map((row, y) =>
        row.map((tile, x) => (
          <rect
            key={`${x}-${y}`}
            x={x * map.tileSize}
            y={y * map.tileSize}
            width={map.tileSize}
            height={map.tileSize}
            fill={TILE_COLORS[tile.type]}
          />
        ))
      )}
    </g>
  );
}

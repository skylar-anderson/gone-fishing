'use client';

import type { TileType } from '@/lib/types';
import type { TileTextures } from '@/lib/types/textures';
import { ALL_TILE_TYPES, getBaseColor } from '@/lib/textures/defaults';

interface TileTypeSelectorProps {
  selectedType: TileType;
  onSelect: (type: TileType) => void;
  textures: TileTextures;
}

const TILE_LABELS: Record<TileType, string> = {
  grass: 'Grass',
  dirt: 'Dirt',
  sand: 'Sand',
  water: 'Water',
  deep_water: 'Deep',
  dock: 'Dock',
  mud: 'Mud',
  rock: 'Rock',
  shop: 'Shop',
};

export function TileTypeSelector({ selectedType, onSelect, textures }: TileTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-400">Tile Type</h3>
      <div className="grid grid-cols-3 gap-2">
        {ALL_TILE_TYPES.map((type) => {
          const texture = textures[type];
          const isSelected = type === selectedType;

          return (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className={`p-2 rounded text-xs font-medium transition-all ${
                isSelected
                  ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800'
                  : 'hover:opacity-80'
              }`}
              style={{ backgroundColor: getBaseColor(type) }}
              title={TILE_LABELS[type]}
            >
              {/* Mini texture preview */}
              <div className="w-full aspect-square mb-1 rounded overflow-hidden">
                <svg viewBox="0 0 16 16" className="w-full h-full">
                  {texture.pixels.map((row, y) =>
                    row.map((color, x) => (
                      <rect
                        key={`${x}-${y}`}
                        x={x}
                        y={y}
                        width={1}
                        height={1}
                        fill={color}
                      />
                    ))
                  )}
                </svg>
              </div>
              <div className="text-black/70 text-[10px] truncate">{TILE_LABELS[type]}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

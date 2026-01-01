import type { TileType } from '@/lib/types';
import type { PixelTexture, TileTextures } from '@/lib/types/textures';

const TILE_BASE_COLORS: Record<TileType, string> = {
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

const TILE_NAMES: Record<TileType, string> = {
  grass: 'Grass',
  dirt: 'Dirt',
  sand: 'Sand',
  water: 'Water',
  deep_water: 'Deep Water',
  dock: 'Dock',
  mud: 'Mud',
  rock: 'Rock',
  shop: 'Shop',
};

// Slightly vary a hex color's lightness
function varyColor(hex: string, variance: number): string {
  // Parse hex to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Random variation
  const variation = Math.floor(Math.random() * variance * 2) - variance;

  // Apply variation and clamp
  const newR = Math.max(0, Math.min(255, r + variation));
  const newG = Math.max(0, Math.min(255, g + variation));
  const newB = Math.max(0, Math.min(255, b + variation));

  // Convert back to hex
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

export function createDefaultTexture(type: TileType): PixelTexture {
  const baseColor = TILE_BASE_COLORS[type];
  const pixels: string[][] = [];

  for (let y = 0; y < 16; y++) {
    const row: string[] = [];
    for (let x = 0; x < 16; x++) {
      // Add subtle random variation to base color for visual interest
      row.push(varyColor(baseColor, 15));
    }
    pixels.push(row);
  }

  return {
    id: type,
    name: TILE_NAMES[type],
    width: 16,
    height: 16,
    pixels,
  };
}

export function createSolidTexture(type: TileType): PixelTexture {
  const baseColor = TILE_BASE_COLORS[type];
  const pixels: string[][] = [];

  for (let y = 0; y < 16; y++) {
    const row: string[] = [];
    for (let x = 0; x < 16; x++) {
      row.push(baseColor);
    }
    pixels.push(row);
  }

  return {
    id: type,
    name: TILE_NAMES[type],
    width: 16,
    height: 16,
    pixels,
  };
}

export function createAllDefaultTextures(): TileTextures {
  const types: TileType[] = ['grass', 'dirt', 'sand', 'water', 'deep_water', 'dock', 'mud', 'rock', 'shop'];
  const textures: Partial<TileTextures> = {};

  for (const type of types) {
    textures[type] = createDefaultTexture(type);
  }

  return textures as TileTextures;
}

export function getBaseColor(type: TileType): string {
  return TILE_BASE_COLORS[type];
}

export const ALL_TILE_TYPES: TileType[] = ['grass', 'dirt', 'sand', 'water', 'deep_water', 'dock', 'mud', 'rock', 'shop'];

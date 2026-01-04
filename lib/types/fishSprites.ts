// Fish sprite types for the pixel art editor

export interface FishSprite {
  fishId: string;
  width: number;
  height: number;
  pixels: string[][]; // 2D array of hex colors or "transparent"
}

export interface FishSpriteExport {
  version: 1;
  exportedAt: string;
  sprites: Record<string, FishSprite>;
}

// Type for all fish sprites keyed by fish ID
export type FishSprites = Record<string, FishSprite>;

// Sprite dimensions
export const SPRITE_WIDTH = 128;
export const SPRITE_HEIGHT = 128;

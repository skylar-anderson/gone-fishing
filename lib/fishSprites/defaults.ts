import type { FishSprite } from '@/lib/types/fishSprites';
import { SPRITE_WIDTH, SPRITE_HEIGHT } from '@/lib/types/fishSprites';

/**
 * Creates an empty transparent sprite for a fish
 */
export function createEmptySprite(fishId: string): FishSprite {
  const pixels: string[][] = [];
  for (let y = 0; y < SPRITE_HEIGHT; y++) {
    const row: string[] = [];
    for (let x = 0; x < SPRITE_WIDTH; x++) {
      row.push('transparent');
    }
    pixels.push(row);
  }

  return {
    fishId,
    width: SPRITE_WIDTH,
    height: SPRITE_HEIGHT,
    pixels,
  };
}

/**
 * Creates a sprite filled with a solid color
 */
export function createSolidSprite(fishId: string, color: string): FishSprite {
  const pixels: string[][] = [];
  for (let y = 0; y < SPRITE_HEIGHT; y++) {
    const row: string[] = [];
    for (let x = 0; x < SPRITE_WIDTH; x++) {
      row.push(color);
    }
    pixels.push(row);
  }

  return {
    fishId,
    width: SPRITE_WIDTH,
    height: SPRITE_HEIGHT,
    pixels,
  };
}

/**
 * Check if a sprite has any non-transparent pixels
 */
export function hasVisiblePixels(sprite: FishSprite): boolean {
  for (const row of sprite.pixels) {
    for (const pixel of row) {
      if (pixel !== 'transparent') {
        return true;
      }
    }
  }
  return false;
}

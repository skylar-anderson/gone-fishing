import fs from 'fs';
import path from 'path';
import type { FishSprites, FishSpriteExport } from '@/lib/types/fishSprites';

const SPRITES_FILE = path.join(process.cwd(), 'data', 'fish-sprites.json');

let spritesCache: FishSprites | null = null;

/**
 * Load fish sprites from the data file
 */
export function loadFishSprites(): FishSprites {
  if (spritesCache) {
    return spritesCache;
  }

  try {
    if (fs.existsSync(SPRITES_FILE)) {
      const data = fs.readFileSync(SPRITES_FILE, 'utf-8');
      const parsed = JSON.parse(data) as FishSpriteExport;
      if (parsed.version === 1 && parsed.sprites) {
        spritesCache = parsed.sprites;
        return spritesCache;
      }
    }
  } catch (error) {
    console.error('Failed to load fish sprites:', error);
  }

  // Return empty object if no file or error
  spritesCache = {};
  return spritesCache;
}

/**
 * Save fish sprites to the data file
 */
export function saveFishSprites(sprites: FishSprites): void {
  const exportData: FishSpriteExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    sprites,
  };

  fs.writeFileSync(SPRITES_FILE, JSON.stringify(exportData, null, 2));
  spritesCache = sprites;
}

/**
 * Get a specific fish sprite by ID
 */
export function getFishSprite(fishId: string): FishSprites[string] | undefined {
  const sprites = loadFishSprites();
  return sprites[fishId];
}

/**
 * Clear the sprites cache (useful after updates)
 */
export function clearSpritesCache(): void {
  spritesCache = null;
}

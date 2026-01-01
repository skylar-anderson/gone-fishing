/**
 * Texture Registry - Single source of truth for tile textures
 *
 * Textures are stored in data/textures.json
 * Use the texture editor at /editor to modify and export textures.
 */

import fs from 'fs';
import path from 'path';
import type { TileTextures, TextureExport } from '@/lib/types/textures';
import { createAllDefaultTextures } from './defaults';

const TEXTURES_FILE = path.join(process.cwd(), 'data', 'textures.json');

let _cachedTextures: TileTextures | null = null;

/**
 * Loads textures from data/textures.json, falling back to generated defaults
 */
export function loadTextures(): TileTextures {
  if (_cachedTextures) {
    return _cachedTextures;
  }

  try {
    if (fs.existsSync(TEXTURES_FILE)) {
      const data = JSON.parse(fs.readFileSync(TEXTURES_FILE, 'utf8')) as TextureExport;
      if (data.version === 1 && data.tileTextures) {
        _cachedTextures = data.tileTextures;
        return _cachedTextures;
      }
    }
  } catch (err) {
    console.warn('Failed to load textures.json, using defaults:', err);
  }

  // Fall back to generated defaults
  _cachedTextures = createAllDefaultTextures();
  return _cachedTextures;
}

/**
 * Clears the texture cache (useful for hot reloading)
 */
export function clearTextureCache(): void {
  _cachedTextures = null;
}

/**
 * Checks if a custom textures file exists
 */
export function hasCustomTextures(): boolean {
  return fs.existsSync(TEXTURES_FILE);
}

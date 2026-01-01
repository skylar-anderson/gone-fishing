import type { TileType } from './index';

export interface PixelTexture {
  id: string;
  name: string;
  width: number;
  height: number;
  pixels: string[][]; // 2D array of hex colors like "#4ade80"
}

export interface TextureExport {
  version: number;
  exportedAt: string;
  tileTextures: Record<TileType, PixelTexture>;
}

export type TileTextures = Record<TileType, PixelTexture>;

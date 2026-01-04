import type { TileTextures, PixelTexture } from '@/lib/types/textures';
import type { TileType } from '@/lib/types';

// Lazy load the WASM module
let wasmModule: typeof import('./pkg/fishing_png_generator') | null = null;
let wasmLoadPromise: Promise<typeof import('./pkg/fishing_png_generator')> | null = null;

/**
 * Initialize and get the WASM module
 */
export async function initWasm(): Promise<typeof import('./pkg/fishing_png_generator')> {
  if (wasmModule) {
    return wasmModule;
  }

  if (wasmLoadPromise) {
    return wasmLoadPromise;
  }

  wasmLoadPromise = import('./pkg/fishing_png_generator').then((module) => {
    wasmModule = module;
    return module;
  });

  return wasmLoadPromise;
}

/**
 * Generate a PNG blob from a 2D array of hex colors
 */
export async function generateTexturePng(pixels: string[][]): Promise<Blob> {
  const wasm = await initWasm();
  const pngBytes = wasm.generate_texture_png(JSON.stringify(pixels));
  // Convert Uint8Array to regular array buffer for Blob compatibility
  return new Blob([new Uint8Array(pngBytes)], { type: 'image/png' });
}

/**
 * Generate a data URL from a 2D array of hex colors
 */
export async function generateTexturePngDataUrl(pixels: string[][]): Promise<string> {
  const wasm = await initWasm();
  const pngBytes = wasm.generate_texture_png(JSON.stringify(pixels));
  const base64 = uint8ArrayToBase64(pngBytes);
  return `data:image/png;base64,${base64}`;
}

/**
 * Generate PNGs for all textures at once (more efficient)
 * Returns a map of tile type to base64 data URL
 */
export async function generateAllTexturePngs(
  textures: TileTextures
): Promise<Record<TileType, string>> {
  const wasm = await initWasm();

  // Convert textures to the format expected by WASM
  const texturePixels: Record<string, string[][]> = {};
  for (const [tileType, texture] of Object.entries(textures)) {
    texturePixels[tileType] = texture.pixels;
  }

  const resultJson = wasm.generate_all_texture_pngs(JSON.stringify(texturePixels));
  const base64Map: Record<string, string> = JSON.parse(resultJson);

  // Convert base64 to data URLs
  const dataUrls: Record<string, string> = {};
  for (const [tileType, base64] of Object.entries(base64Map)) {
    dataUrls[tileType] = `data:image/png;base64,${base64}`;
  }

  return dataUrls as Record<TileType, string>;
}

/**
 * Generate a complete scene PNG from a tile grid and textures
 */
export async function generateScenePng(
  tileGrid: string[][],
  textures: TileTextures,
  tileSize: number
): Promise<Blob> {
  const wasm = await initWasm();

  // Convert textures to the format expected by WASM
  const texturePixels: Record<string, string[][]> = {};
  for (const [tileType, texture] of Object.entries(textures)) {
    texturePixels[tileType] = texture.pixels;
  }

  const pngBytes = wasm.generate_scene_png(
    JSON.stringify(tileGrid),
    JSON.stringify(texturePixels),
    tileSize
  );

  return new Blob([new Uint8Array(pngBytes)], { type: 'image/png' });
}

/**
 * Generate a complete scene PNG and return as data URL
 */
export async function generateScenePngDataUrl(
  tileGrid: string[][],
  textures: TileTextures,
  tileSize: number
): Promise<string> {
  const wasm = await initWasm();

  // Convert textures to the format expected by WASM
  const texturePixels: Record<string, string[][]> = {};
  for (const [tileType, texture] of Object.entries(textures)) {
    texturePixels[tileType] = texture.pixels;
  }

  const pngBytes = wasm.generate_scene_png(
    JSON.stringify(tileGrid),
    JSON.stringify(texturePixels),
    tileSize
  );

  const base64 = uint8ArrayToBase64(pngBytes);
  return `data:image/png;base64,${base64}`;
}

/**
 * Convert Uint8Array to base64 string
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Create an HTMLImageElement from a data URL
 */
export function createImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Generate HTMLImageElements for all textures
 */
export async function generateAllTextureImages(
  textures: TileTextures
): Promise<Record<TileType, HTMLImageElement>> {
  const dataUrls = await generateAllTexturePngs(textures);
  const images: Record<string, HTMLImageElement> = {};

  await Promise.all(
    Object.entries(dataUrls).map(async ([tileType, dataUrl]) => {
      images[tileType] = await createImageFromDataUrl(dataUrl);
    })
  );

  return images as Record<TileType, HTMLImageElement>;
}

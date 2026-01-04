'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TileTextures } from '@/lib/types/textures';
import type { TileType } from '@/lib/types';
import { createAllDefaultTextures } from '@/lib/textures/defaults';

// Cache for generated PNG data URLs
let pngCache: Record<TileType, string> | null = null;
let imageCache: Record<TileType, HTMLImageElement> | null = null;
let cacheVersion = 0;

// Track if WASM is available
let wasmAvailable: boolean | null = null;

/**
 * Check if WASM PNG generation is available
 */
async function checkWasmAvailable(): Promise<boolean> {
  if (wasmAvailable !== null) return wasmAvailable;

  try {
    const { initWasm } = await import('@/lib/wasm/pngGenerator');
    await initWasm();
    wasmAvailable = true;
    return true;
  } catch (err) {
    console.warn('WASM PNG generation not available:', err);
    wasmAvailable = false;
    return false;
  }
}

/**
 * Generate PNG data URLs for all textures using WASM
 */
async function generatePngDataUrls(
  textures: TileTextures
): Promise<Record<TileType, string>> {
  const { generateAllTexturePngs } = await import('@/lib/wasm/pngGenerator');
  return generateAllTexturePngs(textures);
}

/**
 * Create HTMLImageElements from data URLs
 */
async function createImages(
  dataUrls: Record<TileType, string>
): Promise<Record<TileType, HTMLImageElement>> {
  const images: Record<string, HTMLImageElement> = {};

  await Promise.all(
    Object.entries(dataUrls).map(
      ([tileType, dataUrl]) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            images[tileType] = img;
            resolve();
          };
          img.onerror = reject;
          img.src = dataUrl;
        })
    )
  );

  return images as Record<TileType, HTMLImageElement>;
}

/**
 * Hook to get PNG textures with caching
 */
export function usePngTextures(textures?: TileTextures) {
  const [pngUrls, setPngUrls] = useState<Record<TileType, string> | null>(pngCache);
  const [images, setImages] = useState<Record<TileType, HTMLImageElement> | null>(imageCache);
  const [loading, setLoading] = useState(!pngCache);
  const [error, setError] = useState<string | null>(null);
  const [isWasmReady, setIsWasmReady] = useState(wasmAvailable === true);

  const regenerate = useCallback(async (newTextures: TileTextures) => {
    try {
      setLoading(true);
      setError(null);

      const available = await checkWasmAvailable();
      setIsWasmReady(available);

      if (!available) {
        throw new Error('WASM not available');
      }

      const urls = await generatePngDataUrls(newTextures);
      pngCache = urls;
      setPngUrls(urls);

      const imgs = await createImages(urls);
      imageCache = imgs;
      setImages(imgs);

      cacheVersion++;
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PNGs');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const activeTextures = textures || createAllDefaultTextures();

    // If we have cache and no new textures, use cache
    if (pngCache && imageCache && !textures) {
      setPngUrls(pngCache);
      setImages(imageCache);
      setLoading(false);
      return;
    }

    // Generate PNGs
    regenerate(activeTextures);
  }, [textures, regenerate]);

  return {
    pngUrls,
    images,
    loading,
    error,
    isWasmReady,
    regenerate,
    cacheVersion,
  };
}

/**
 * Preload all texture images (call early in app lifecycle)
 */
export async function preloadPngTextures(
  textures?: TileTextures
): Promise<Record<TileType, HTMLImageElement> | null> {
  try {
    const available = await checkWasmAvailable();
    if (!available) return null;

    const activeTextures = textures || createAllDefaultTextures();

    const urls = await generatePngDataUrls(activeTextures);
    pngCache = urls;

    const imgs = await createImages(urls);
    imageCache = imgs;

    return imgs;
  } catch (err) {
    console.error('Failed to preload PNG textures:', err);
    return null;
  }
}

/**
 * Get cached images synchronously (returns null if not ready)
 */
export function getCachedImages(): Record<TileType, HTMLImageElement> | null {
  return imageCache;
}

/**
 * Get cached PNG data URLs synchronously (returns null if not ready)
 */
export function getCachedPngUrls(): Record<TileType, string> | null {
  return pngCache;
}

/**
 * Clear the PNG cache (useful when textures are edited)
 */
export function clearPngCache(): void {
  pngCache = null;
  imageCache = null;
  cacheVersion++;
}

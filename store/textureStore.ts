'use client';

import { create } from 'zustand';
import type { TileType } from '@/lib/types';
import type { PixelTexture, TileTextures } from '@/lib/types/textures';
import { createAllDefaultTextures, createSolidTexture, ALL_TILE_TYPES } from '@/lib/textures/defaults';

interface TextureEditorState {
  // Current editing state
  selectedTileType: TileType;
  currentColor: string;
  isDrawing: boolean;

  // Textures (all tile types)
  textures: TileTextures;

  // Color palette
  recentColors: string[];

  // UI state
  showGrid: boolean;

  // Actions
  setSelectedTileType: (type: TileType) => void;
  setCurrentColor: (color: string) => void;
  setPixel: (x: number, y: number, color: string) => void;
  setDrawing: (isDrawing: boolean) => void;
  fillAll: (color: string) => void;
  clearTexture: () => void;
  resetToDefault: () => void;
  loadTextures: (textures: TileTextures) => void;
  addRecentColor: (color: string) => void;
  setShowGrid: (show: boolean) => void;
  getCurrentTexture: () => PixelTexture;
}

export const useTextureStore = create<TextureEditorState>((set, get) => ({
  // Initial state
  selectedTileType: 'grass',
  currentColor: '#4ade80',
  isDrawing: false,
  textures: createAllDefaultTextures(),
  recentColors: ['#4ade80', '#a16207', '#fde047', '#38bdf8', '#1d4ed8', '#78716c', '#713f12', '#6b7280', '#a855f7', '#ffffff', '#000000'],
  showGrid: true,

  setSelectedTileType: (type) => set({ selectedTileType: type }),

  setCurrentColor: (color) => set({ currentColor: color }),

  setPixel: (x, y, color) =>
    set((state) => {
      const texture = state.textures[state.selectedTileType];
      const newPixels = texture.pixels.map((row, rowIndex) =>
        rowIndex === y ? row.map((pixel, colIndex) => (colIndex === x ? color : pixel)) : [...row]
      );

      return {
        textures: {
          ...state.textures,
          [state.selectedTileType]: {
            ...texture,
            pixels: newPixels,
          },
        },
      };
    }),

  setDrawing: (isDrawing) => set({ isDrawing }),

  fillAll: (color) =>
    set((state) => {
      const texture = state.textures[state.selectedTileType];
      const newPixels = texture.pixels.map((row) => row.map(() => color));

      return {
        textures: {
          ...state.textures,
          [state.selectedTileType]: {
            ...texture,
            pixels: newPixels,
          },
        },
      };
    }),

  clearTexture: () =>
    set((state) => {
      const type = state.selectedTileType;
      return {
        textures: {
          ...state.textures,
          [type]: createSolidTexture(type),
        },
      };
    }),

  resetToDefault: () =>
    set({
      textures: createAllDefaultTextures(),
    }),

  loadTextures: (textures) => set({ textures }),

  addRecentColor: (color) =>
    set((state) => {
      const filtered = state.recentColors.filter((c) => c !== color);
      return {
        recentColors: [color, ...filtered].slice(0, 16),
      };
    }),

  setShowGrid: (show) => set({ showGrid: show }),

  getCurrentTexture: () => {
    const state = get();
    return state.textures[state.selectedTileType];
  },
}));

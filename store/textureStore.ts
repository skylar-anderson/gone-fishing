'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TileType } from '@/lib/types';
import type { PixelTexture, TileTextures } from '@/lib/types/textures';
import { createAllDefaultTextures, createSolidTexture } from '@/lib/textures/defaults';

// Deep clone helper for textures
function cloneTextures(textures: TileTextures): TileTextures {
  const cloned: Partial<TileTextures> = {};
  for (const key of Object.keys(textures) as TileType[]) {
    cloned[key] = {
      ...textures[key],
      pixels: textures[key].pixels.map(row => [...row]),
    };
  }
  return cloned as TileTextures;
}

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

  // History for undo/redo (stores full texture snapshots)
  history: TileTextures[];
  historyIndex: number;
  maxHistorySize: number;

  // Dirty tracking
  isDirty: boolean;
  lastSavedAt: number | null;

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

  // History actions
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  markSaved: () => void;
}

export const useTextureStore = create<TextureEditorState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedTileType: 'grass',
      currentColor: '#4ade80',
      isDrawing: false,
      textures: createAllDefaultTextures(),
      recentColors: ['#4ade80', '#a16207', '#fde047', '#38bdf8', '#1d4ed8', '#78716c', '#713f12', '#6b7280', '#a855f7', '#ffffff', '#000000'],
      showGrid: true,

      // History state
      history: [],
      historyIndex: -1,
      maxHistorySize: 50,

      // Dirty tracking
      isDirty: false,
      lastSavedAt: null,

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
            isDirty: true,
          };
        }),

      setDrawing: (isDrawing) => set({ isDrawing }),

      fillAll: (color) => {
        get().pushHistory();
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
            isDirty: true,
          };
        });
      },

      clearTexture: () => {
        get().pushHistory();
        set((state) => {
          const type = state.selectedTileType;
          return {
            textures: {
              ...state.textures,
              [type]: createSolidTexture(type),
            },
            isDirty: true,
          };
        });
      },

      resetToDefault: () => {
        get().pushHistory();
        set({
          textures: createAllDefaultTextures(),
          isDirty: true,
        });
      },

      loadTextures: (textures) => {
        get().pushHistory();
        set({
          textures,
          isDirty: true,
        });
      },

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

      // Push current state to history (call before making changes)
      pushHistory: () =>
        set((state) => {
          const cloned = cloneTextures(state.textures);
          // Truncate any redo history
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(cloned);
          // Limit history size
          if (newHistory.length > state.maxHistorySize) {
            newHistory.shift();
          }
          return {
            history: newHistory,
            historyIndex: newHistory.length - 1,
          };
        }),

      undo: () =>
        set((state) => {
          if (state.historyIndex < 0) return state;
          const textures = cloneTextures(state.history[state.historyIndex]);
          return {
            textures,
            historyIndex: state.historyIndex - 1,
            isDirty: true,
          };
        }),

      redo: () =>
        set((state) => {
          if (state.historyIndex >= state.history.length - 1) return state;
          const newIndex = state.historyIndex + 1;
          // We need the state AFTER the change, which is the next index + 1
          // But since we store the state BEFORE changes, we need to handle this differently
          // Actually, let's reconsider: history stores states BEFORE changes
          // So to redo, we need to go forward and re-apply
          // This is tricky - let's store both before and after, or just store snapshots
          // For simplicity, let's just move forward and restore that snapshot
          if (newIndex + 1 < state.history.length) {
            return {
              textures: cloneTextures(state.history[newIndex + 1]),
              historyIndex: newIndex,
              isDirty: true,
            };
          }
          return state;
        }),

      canUndo: () => {
        const state = get();
        return state.historyIndex >= 0;
      },

      canRedo: () => {
        const state = get();
        return state.historyIndex < state.history.length - 2;
      },

      markSaved: () => set({ isDirty: false, lastSavedAt: Date.now() }),
    }),
    {
      name: 'texture-editor-storage',
      partialize: (state) => ({
        textures: state.textures,
        recentColors: state.recentColors,
        selectedTileType: state.selectedTileType,
        currentColor: state.currentColor,
        showGrid: state.showGrid,
        lastSavedAt: state.lastSavedAt,
      }),
    }
  )
);

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FishSprite, FishSprites } from '@/lib/types/fishSprites';
import { createEmptySprite, hasVisiblePixels } from '@/lib/fishSprites/defaults';

// Deep clone helper for sprites
function cloneSprites(sprites: FishSprites): FishSprites {
  const cloned: FishSprites = {};
  for (const key of Object.keys(sprites)) {
    cloned[key] = {
      ...sprites[key],
      pixels: sprites[key].pixels.map(row => [...row]),
    };
  }
  return cloned;
}

interface FishSpriteEditorState {
  // Current editing state
  selectedFishId: string;
  currentColor: string;
  isDrawing: boolean;
  brushSize: 1 | 2 | 3 | 4;

  // All sprites keyed by fish ID
  sprites: FishSprites;

  // Color palette
  recentColors: string[];

  // UI state
  showGrid: boolean;

  // History for undo/redo (stores full sprite snapshots)
  history: FishSprites[];
  historyIndex: number;
  maxHistorySize: number;

  // Dirty tracking
  isDirty: boolean;
  lastSavedAt: number | null;

  // Actions
  setSelectedFishId: (id: string) => void;
  setCurrentColor: (color: string) => void;
  setBrushSize: (size: 1 | 2 | 3 | 4) => void;
  setPixel: (x: number, y: number, color: string) => void;
  setDrawing: (isDrawing: boolean) => void;
  fillAll: (color: string) => void;
  clearSprite: () => void;
  loadSprites: (sprites: FishSprites) => void;
  addRecentColor: (color: string) => void;
  setShowGrid: (show: boolean) => void;
  getCurrentSprite: () => FishSprite;
  ensureSpriteExists: (fishId: string) => void;
  hasSprite: (fishId: string) => boolean;

  // History actions
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  markSaved: () => void;
}

export const useFishSpriteStore = create<FishSpriteEditorState>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedFishId: 'bluegill', // Default to first pond fish
      currentColor: '#3b82f6', // Nice blue for fish
      isDrawing: false,
      brushSize: 1,
      sprites: {},
      recentColors: [
        '#3b82f6', // Blue
        '#22c55e', // Green
        '#eab308', // Yellow
        '#ef4444', // Red
        '#8b5cf6', // Purple
        '#f97316', // Orange
        '#06b6d4', // Cyan
        '#ec4899', // Pink
        '#ffffff', // White
        '#000000', // Black
        '#6b7280', // Gray
      ],
      showGrid: true,

      // History state
      history: [],
      historyIndex: -1,
      maxHistorySize: 50,

      // Dirty tracking
      isDirty: false,
      lastSavedAt: null,

      setSelectedFishId: (id) => {
        // Ensure sprite exists when selecting
        const state = get();
        if (!state.sprites[id]) {
          set({
            selectedFishId: id,
            sprites: {
              ...state.sprites,
              [id]: createEmptySprite(id),
            },
          });
        } else {
          set({ selectedFishId: id });
        }
      },

      setCurrentColor: (color) => set({ currentColor: color }),

      setBrushSize: (size) => set({ brushSize: size }),

      setPixel: (x, y, color) =>
        set((state) => {
          const fishId = state.selectedFishId;
          const sprite = state.sprites[fishId] || createEmptySprite(fishId);
          const brushSize = state.brushSize;

          // Calculate the offset for centering the brush
          const offset = Math.floor(brushSize / 2);

          // Create new pixels array with brush applied
          const newPixels = sprite.pixels.map((row, rowIndex) => {
            // Check if this row is within brush range
            const rowInRange = rowIndex >= y - offset && rowIndex < y - offset + brushSize;
            if (!rowInRange) return [...row];

            return row.map((pixel, colIndex) => {
              // Check if this column is within brush range
              const colInRange = colIndex >= x - offset && colIndex < x - offset + brushSize;
              if (colInRange) return color;
              return pixel;
            });
          });

          return {
            sprites: {
              ...state.sprites,
              [fishId]: {
                ...sprite,
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
          const fishId = state.selectedFishId;
          const sprite = state.sprites[fishId] || createEmptySprite(fishId);
          const newPixels = sprite.pixels.map((row) => row.map(() => color));

          return {
            sprites: {
              ...state.sprites,
              [fishId]: {
                ...sprite,
                pixels: newPixels,
              },
            },
            isDirty: true,
          };
        });
      },

      clearSprite: () => {
        get().pushHistory();
        set((state) => {
          const fishId = state.selectedFishId;
          return {
            sprites: {
              ...state.sprites,
              [fishId]: createEmptySprite(fishId),
            },
            isDirty: true,
          };
        });
      },

      loadSprites: (sprites) => {
        get().pushHistory();
        set({
          sprites,
          isDirty: true,
        });
      },

      addRecentColor: (color) =>
        set((state) => {
          // Don't add transparent to recent colors
          if (color === 'transparent') return state;
          const filtered = state.recentColors.filter((c) => c !== color);
          return {
            recentColors: [color, ...filtered].slice(0, 16),
          };
        }),

      setShowGrid: (show) => set({ showGrid: show }),

      getCurrentSprite: () => {
        const state = get();
        const fishId = state.selectedFishId;
        return state.sprites[fishId] || createEmptySprite(fishId);
      },

      ensureSpriteExists: (fishId) => {
        const state = get();
        if (!state.sprites[fishId]) {
          set({
            sprites: {
              ...state.sprites,
              [fishId]: createEmptySprite(fishId),
            },
          });
        }
      },

      hasSprite: (fishId) => {
        const state = get();
        const sprite = state.sprites[fishId];
        return sprite ? hasVisiblePixels(sprite) : false;
      },

      // Push current state to history (call before making changes)
      pushHistory: () =>
        set((state) => {
          const cloned = cloneSprites(state.sprites);
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
          const sprites = cloneSprites(state.history[state.historyIndex]);
          return {
            sprites,
            historyIndex: state.historyIndex - 1,
            isDirty: true,
          };
        }),

      redo: () =>
        set((state) => {
          if (state.historyIndex >= state.history.length - 1) return state;
          const newIndex = state.historyIndex + 1;
          if (newIndex + 1 < state.history.length) {
            return {
              sprites: cloneSprites(state.history[newIndex + 1]),
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
      name: 'fish-sprite-editor-storage',
      partialize: (state) => ({
        sprites: state.sprites,
        recentColors: state.recentColors,
        selectedFishId: state.selectedFishId,
        currentColor: state.currentColor,
        brushSize: state.brushSize,
        showGrid: state.showGrid,
        lastSavedAt: state.lastSavedAt,
      }),
    }
  )
);

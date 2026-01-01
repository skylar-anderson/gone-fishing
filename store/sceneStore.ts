'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TileType } from '@/lib/types';

export interface TileConfig {
  type: TileType;
  walkable: boolean;
  fishable: boolean;
  color: string;
  label: string;
  char: string;
}

export const TILE_CONFIGS: TileConfig[] = [
  { type: 'grass', walkable: true, fishable: false, color: '#4ade80', label: 'Grass', char: 'G' },
  { type: 'dirt', walkable: true, fishable: false, color: '#a16207', label: 'Dirt', char: 'D' },
  { type: 'sand', walkable: true, fishable: false, color: '#fde047', label: 'Sand', char: 'S' },
  { type: 'water', walkable: false, fishable: true, color: '#38bdf8', label: 'Water', char: 'W' },
  { type: 'deep_water', walkable: false, fishable: true, color: '#0369a1', label: 'Deep Water', char: 'X' },
  { type: 'dock', walkable: true, fishable: true, color: '#92400e', label: 'Dock', char: 'P' },
  { type: 'mud', walkable: true, fishable: false, color: '#78350f', label: 'Mud', char: 'M' },
  { type: 'rock', walkable: false, fishable: false, color: '#6b7280', label: 'Rock', char: 'R' },
  { type: 'shop', walkable: true, fishable: false, color: '#c084fc', label: 'Shop', char: 'H' },
];

const DEFAULT_WIDTH = 64;
const DEFAULT_HEIGHT = 48;

// Deep clone helper for grid
function cloneGrid(grid: string[][]): string[][] {
  return grid.map(row => [...row]);
}

interface HistorySnapshot {
  grid: string[][];
  sceneName: string;
  sceneId: string;
  sceneDescription: string;
  sceneEmoji: string;
  width: number;
  height: number;
  spawnX: number;
  spawnY: number;
}

interface SceneEditorState {
  // Scene metadata
  sceneName: string;
  sceneId: string;
  sceneDescription: string;
  sceneEmoji: string;

  // Grid dimensions
  width: number;
  height: number;

  // Spawn point
  spawnX: number;
  spawnY: number;

  // Current selected tile
  selectedTile: TileConfig;

  // Grid data
  grid: string[][];

  // Drawing state (not persisted)
  isDrawing: boolean;

  // History for undo/redo
  history: HistorySnapshot[];
  historyIndex: number;
  maxHistorySize: number;

  // Dirty tracking
  isDirty: boolean;
  lastSavedAt: number | null;

  // Actions
  setSceneName: (name: string) => void;
  setSceneId: (id: string) => void;
  setSceneDescription: (desc: string) => void;
  setSceneEmoji: (emoji: string) => void;
  setSpawnX: (x: number) => void;
  setSpawnY: (y: number) => void;
  setSelectedTile: (tile: TileConfig) => void;
  setCell: (row: number, col: number) => void;
  setIsDrawing: (drawing: boolean) => void;
  resizeGrid: (newWidth: number, newHeight: number) => void;
  fillAll: () => void;
  clearAll: () => void;
  loadFromJSON: (data: SceneJSON) => void;
  generateJSON: () => string;

  // History actions
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  markSaved: () => void;
}

interface SceneJSON {
  id?: string;
  name?: string;
  description?: string;
  emoji?: string;
  spawnPoint?: { x?: number; y?: number };
  map?: {
    data?: string[];
    width?: number;
    height?: number;
  };
}

function createSnapshot(state: SceneEditorState): HistorySnapshot {
  return {
    grid: cloneGrid(state.grid),
    sceneName: state.sceneName,
    sceneId: state.sceneId,
    sceneDescription: state.sceneDescription,
    sceneEmoji: state.sceneEmoji,
    width: state.width,
    height: state.height,
    spawnX: state.spawnX,
    spawnY: state.spawnY,
  };
}

export const useSceneStore = create<SceneEditorState>()(
  persist(
    (set, get) => ({
      // Initial state
      sceneName: 'New Scene',
      sceneId: 'new_scene',
      sceneDescription: 'A new fishing location.',
      sceneEmoji: '🎣',
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      spawnX: 20,
      spawnY: 32,
      selectedTile: TILE_CONFIGS[0],
      grid: Array(DEFAULT_HEIGHT).fill(null).map(() => Array(DEFAULT_WIDTH).fill('G')),
      isDrawing: false,

      // History state
      history: [],
      historyIndex: -1,
      maxHistorySize: 50,

      // Dirty tracking
      isDirty: false,
      lastSavedAt: null,

      setSceneName: (name) => set({ sceneName: name, isDirty: true }),
      setSceneId: (id) => set({ sceneId: id, isDirty: true }),
      setSceneDescription: (desc) => set({ sceneDescription: desc, isDirty: true }),
      setSceneEmoji: (emoji) => set({ sceneEmoji: emoji, isDirty: true }),
      setSpawnX: (x) => set({ spawnX: x, isDirty: true }),
      setSpawnY: (y) => set({ spawnY: y, isDirty: true }),
      setSelectedTile: (tile) => set({ selectedTile: tile }),
      setIsDrawing: (drawing) => set({ isDrawing: drawing }),

      setCell: (row, col) =>
        set((state) => {
          const newGrid = state.grid.map((r, i) =>
            i === row ? r.map((c, j) => (j === col ? state.selectedTile.char : c)) : r
          );
          return { grid: newGrid, isDirty: true };
        }),

      resizeGrid: (newWidth, newHeight) => {
        get().pushHistory();
        set((state) => {
          const newGrid: string[][] = [];
          for (let y = 0; y < newHeight; y++) {
            const row: string[] = [];
            for (let x = 0; x < newWidth; x++) {
              row.push(state.grid[y]?.[x] ?? 'G');
            }
            newGrid.push(row);
          }
          return { grid: newGrid, width: newWidth, height: newHeight, isDirty: true };
        });
      },

      fillAll: () => {
        get().pushHistory();
        set((state) => ({
          grid: Array(state.height).fill(null).map(() => Array(state.width).fill(state.selectedTile.char)),
          isDirty: true,
        }));
      },

      clearAll: () => {
        get().pushHistory();
        set((state) => ({
          grid: Array(state.height).fill(null).map(() => Array(state.width).fill('G')),
          isDirty: true,
        }));
      },

      loadFromJSON: (data) => {
        get().pushHistory();
        set((state) => {
          const updates: Partial<SceneEditorState> = { isDirty: true };

          if (data.id) updates.sceneId = data.id;
          if (data.name) updates.sceneName = data.name;
          if (data.description) updates.sceneDescription = data.description;
          if (data.emoji) updates.sceneEmoji = data.emoji;
          if (data.spawnPoint?.x !== undefined) updates.spawnX = data.spawnPoint.x;
          if (data.spawnPoint?.y !== undefined) updates.spawnY = data.spawnPoint.y;

          if (data.map?.data && Array.isArray(data.map.data)) {
            const newHeight = data.map.data.length;
            const newWidth = data.map.data[0]?.length ?? DEFAULT_WIDTH;
            updates.width = newWidth;
            updates.height = newHeight;
            updates.grid = data.map.data.map((row: string) => row.split(''));
          }

          return updates;
        });
      },

      generateJSON: () => {
        const state = get();
        // Build legend from used tiles
        const usedChars = new Set<string>();
        state.grid.forEach(row => row.forEach(char => usedChars.add(char)));

        const legend: Record<string, { type: TileType; walkable: boolean; fishable: boolean }> = {};
        TILE_CONFIGS.forEach(config => {
          if (usedChars.has(config.char)) {
            legend[config.char] = {
              type: config.type,
              walkable: config.walkable,
              fishable: config.fishable,
            };
          }
        });

        const sceneData = {
          id: state.sceneId,
          name: state.sceneName,
          description: state.sceneDescription,
          emoji: state.sceneEmoji,
          spawnPoint: { x: state.spawnX, y: state.spawnY },
          map: {
            width: state.width,
            height: state.height,
            tileSize: 16,
            legend,
            data: state.grid.map(row => row.join('')),
          },
          exits: [],
        };

        return JSON.stringify(sceneData, null, 2);
      },

      // Push current state to history (call before making changes)
      pushHistory: () =>
        set((state) => {
          const snapshot = createSnapshot(state);
          // Truncate any redo history
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(snapshot);
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
          const snapshot = state.history[state.historyIndex];
          return {
            grid: cloneGrid(snapshot.grid),
            sceneName: snapshot.sceneName,
            sceneId: snapshot.sceneId,
            sceneDescription: snapshot.sceneDescription,
            sceneEmoji: snapshot.sceneEmoji,
            width: snapshot.width,
            height: snapshot.height,
            spawnX: snapshot.spawnX,
            spawnY: snapshot.spawnY,
            historyIndex: state.historyIndex - 1,
            isDirty: true,
          };
        }),

      redo: () =>
        set((state) => {
          if (state.historyIndex >= state.history.length - 1) return state;
          const newIndex = state.historyIndex + 1;
          if (newIndex + 1 < state.history.length) {
            const snapshot = state.history[newIndex + 1];
            return {
              grid: cloneGrid(snapshot.grid),
              sceneName: snapshot.sceneName,
              sceneId: snapshot.sceneId,
              sceneDescription: snapshot.sceneDescription,
              sceneEmoji: snapshot.sceneEmoji,
              width: snapshot.width,
              height: snapshot.height,
              spawnX: snapshot.spawnX,
              spawnY: snapshot.spawnY,
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
      name: 'scene-editor-storage',
      partialize: (state) => ({
        sceneName: state.sceneName,
        sceneId: state.sceneId,
        sceneDescription: state.sceneDescription,
        sceneEmoji: state.sceneEmoji,
        width: state.width,
        height: state.height,
        spawnX: state.spawnX,
        spawnY: state.spawnY,
        selectedTile: state.selectedTile,
        grid: state.grid,
        lastSavedAt: state.lastSavedAt,
      }),
    }
  )
);

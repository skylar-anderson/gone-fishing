'use client';

import { create } from 'zustand';
import {
  SceneId,
  Scene,
  Position,
  Direction,
  OtherPlayer,
  Fish,
  InventoryItem,
  PlayerData,
  ShopState,
  ChatMessage,
} from '@/lib/types';

export interface Toast {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
}

interface GameState {
  // Connection state
  connected: boolean;
  connecting: boolean;

  // Player state
  playerName: string | null;
  position: Position;
  direction: Direction;
  inventory: InventoryItem[];
  money: number;
  poleLevel: number;

  // Scene state
  currentScene: SceneId | null;
  scene: Scene | null;

  // Other players
  otherPlayers: Map<string, OtherPlayer>;

  // Fishing state
  isFishing: boolean;
  lastCatch: Fish | null;
  showCatchModal: boolean;

  // Shop state
  shopOpen: boolean;
  shopData: ShopState | null;

  // Chat state
  chatMessages: ChatMessage[];

  // Auth state
  authError: string | null;

  // Toast state
  toasts: Toast[];

  // Actions
  setConnecting: (connecting: boolean) => void;
  setConnected: (connected: boolean) => void;
  setPlayerName: (name: string) => void;
  setPlayerData: (data: PlayerData) => void;
  setScene: (scene: Scene) => void;
  setCurrentScene: (sceneId: SceneId) => void;
  updatePosition: (position: Position, direction: Direction) => void;
  setOtherPlayers: (players: OtherPlayer[]) => void;
  addOtherPlayer: (player: OtherPlayer) => void;
  removeOtherPlayer: (name: string) => void;
  updateOtherPlayer: (name: string, updates: Partial<OtherPlayer>) => void;
  setFishing: (isFishing: boolean) => void;
  setCatch: (fish: Fish | null) => void;
  setShowCatchModal: (show: boolean) => void;
  updateInventory: (inventory: InventoryItem[], money: number) => void;
  setPoleLevel: (level: number) => void;
  setShopOpen: (open: boolean) => void;
  setShopData: (data: ShopState | null) => void;
  setChatMessages: (messages: ChatMessage[]) => void;
  addChatMessage: (message: ChatMessage) => void;
  setAuthError: (error: string | null) => void;
  addToast: (message: string, type?: 'error' | 'success' | 'info') => void;
  removeToast: (id: string) => void;
  reset: () => void;
}

const initialState = {
  connected: false,
  connecting: false,
  playerName: null,
  position: { x: 0, y: 0 },
  direction: 'down' as Direction,
  inventory: [],
  money: 0,
  poleLevel: 1,
  currentScene: null,
  scene: null,
  otherPlayers: new Map<string, OtherPlayer>(),
  isFishing: false,
  lastCatch: null,
  showCatchModal: false,
  shopOpen: false,
  shopData: null,
  chatMessages: [] as ChatMessage[],
  authError: null as string | null,
  toasts: [] as Toast[],
};

export const useGameStore = create<GameState>((set) => ({
  ...initialState,

  setConnecting: (connecting) => set({ connecting }),

  setConnected: (connected) => set({ connected, connecting: false }),

  setPlayerName: (name) => set({ playerName: name }),

  setPlayerData: (data) =>
    set({
      playerName: data.name,
      inventory: data.inventory,
      money: data.money,
      poleLevel: data.poleLevel || 1,
      position: data.lastPosition,
    }),

  setScene: (scene) =>
    set({
      scene,
      currentScene: scene.id,
      position: scene.spawnPoint,
    }),

  setCurrentScene: (sceneId) => set({ currentScene: sceneId }),

  updatePosition: (position, direction) => set({ position, direction }),

  setOtherPlayers: (players) => {
    const map = new Map<string, OtherPlayer>();
    for (const player of players) {
      map.set(player.name.toLowerCase(), player);
    }
    return set({ otherPlayers: map });
  },

  addOtherPlayer: (player) =>
    set((state) => {
      const newMap = new Map(state.otherPlayers);
      newMap.set(player.name.toLowerCase(), player);
      return { otherPlayers: newMap };
    }),

  removeOtherPlayer: (name) =>
    set((state) => {
      const newMap = new Map(state.otherPlayers);
      newMap.delete(name.toLowerCase());
      return { otherPlayers: newMap };
    }),

  updateOtherPlayer: (name, updates) =>
    set((state) => {
      const newMap = new Map(state.otherPlayers);
      const existing = newMap.get(name.toLowerCase());
      if (existing) {
        newMap.set(name.toLowerCase(), { ...existing, ...updates });
      }
      return { otherPlayers: newMap };
    }),

  setFishing: (isFishing) => set({ isFishing }),

  setCatch: (fish) => set({ lastCatch: fish, showCatchModal: fish !== null }),

  setShowCatchModal: (show) => set({ showCatchModal: show }),

  updateInventory: (inventory, money) => set({ inventory, money }),

  setPoleLevel: (level) => set({ poleLevel: level }),

  setShopOpen: (open) => set({ shopOpen: open }),

  setShopData: (data) => set({ shopData: data, shopOpen: data !== null }),

  setChatMessages: (messages) => set({ chatMessages: messages }),

  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),

  setAuthError: (error) => set({ authError: error }),

  addToast: (message, type = 'error') =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { id: `${Date.now()}-${Math.random()}`, message, type },
      ],
    })),

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  reset: () => set(initialState),
}));

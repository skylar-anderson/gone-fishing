// Scene types
// SceneId is now a string to support dynamic scene discovery
// Scenes are auto-discovered from data/scenes/*.json files
export type SceneId = string;

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Position {
  x: number;
  y: number;
}

// Tile types
export type TileType = 'grass' | 'dirt' | 'sand' | 'water' | 'deep_water' | 'dock' | 'mud' | 'rock' | 'shop';

export interface Tile {
  type: TileType;
  walkable: boolean;
  fishable: boolean;
}

export interface TileMap {
  width: number;
  height: number;
  tileSize: number;
  tiles: Tile[][];
}

export interface SceneExit {
  position: Position;
  target: SceneId;
  direction: Direction;
}

export interface Scene {
  id: SceneId;
  name: string;
  description: string;
  emoji?: string;
  spawnPoint: Position;
  map: TileMap;
  exits: SceneExit[];
}

// Fish types
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Fish {
  id: string;
  name: string;
  rarity: Rarity;
  catchChance: number;
  value: number;
  description: string;
  emoji: string;
}

export interface FishConfig {
  scene: SceneId;
  fish: Fish[];
}

// Inventory types
export interface InventoryItem {
  id: string;
  fishId: string;
  fish: Fish;
  caughtAt: string;
  caughtIn: SceneId;
}

// Player types
export interface Player {
  name: string;
  position: Position;
  currentScene: SceneId;
  direction: Direction;
}

export interface LocalPlayer extends Player {
  inventory: InventoryItem[];
  money: number;
}

export interface OtherPlayer extends Player {
  isFishing: boolean;
}

export interface PlayerData {
  name: string;
  inventory: InventoryItem[];
  money: number;
  poleLevel: number;
  lastScene: SceneId;
  lastPosition: Position;
  createdAt: string;
  lastLogin: string;
}

// Chat types
export interface ChatMessage {
  id: number;
  playerName: string;
  message: string;
  sceneId: SceneId;
  createdAt: string;
}

// WebSocket message types
export type ClientMessage =
  | { type: 'JOIN'; payload: { name: string; scene: SceneId; password: string; isRegistering?: boolean } }
  | { type: 'SESSION_RESTORE'; payload: { token: string } }
  | { type: 'MOVE'; payload: { position: Position; direction: Direction } }
  | { type: 'CHANGE_SCENE'; payload: { scene: SceneId } }
  | { type: 'START_FISHING'; payload: Record<string, never> }
  | { type: 'CANCEL_FISHING'; payload: Record<string, never> }
  | { type: 'SELL_FISH'; payload: { inventoryItemId: string } }
  | { type: 'OPEN_SHOP'; payload: Record<string, never> }
  | { type: 'BUY_POLE_UPGRADE'; payload: Record<string, never> }
  | { type: 'CLOSE_SHOP'; payload: Record<string, never> }
  | { type: 'SEND_CHAT'; payload: { message: string } };

// Shop types
export interface ShopState {
  currentPole: {
    level: number;
    name: string;
    emoji: string;
  };
  nextPole: {
    level: number;
    name: string;
    price: number;
    description: string;
    emoji: string;
  } | null;
  canAfford: boolean;
  playerMoney: number;
}

export type ServerMessage =
  | { type: 'WELCOME'; payload: { player: PlayerData; scene: Scene; isNewPlayer?: boolean } }
  | { type: 'SESSION_CREATED'; payload: { token: string } }
  | { type: 'PLAYER_JOINED'; payload: OtherPlayer }
  | { type: 'PLAYER_LEFT'; payload: { name: string } }
  | { type: 'PLAYER_UPDATE'; payload: { name: string; position: Position; direction: Direction; isFishing?: boolean } }
  | { type: 'SCENE_STATE'; payload: { players: OtherPlayer[]; scene: Scene } }
  | { type: 'FISHING_START'; payload: { name: string } }
  | { type: 'FISHING_RESULT'; payload: { success: boolean; fish?: Fish } }
  | { type: 'INVENTORY_UPDATE'; payload: { inventory: InventoryItem[]; money: number } }
  | { type: 'SHOP_OPENED'; payload: ShopState }
  | { type: 'SHOP_CLOSED'; payload: Record<string, never> }
  | { type: 'PURCHASE_SUCCESS'; payload: { poleLevel: number; money: number; poleName: string; poleEmoji: string } }
  | { type: 'AUTH_ERROR'; payload: { message: string; code: 'INVALID_CREDENTIALS' | 'PLAYER_NOT_FOUND' | 'NAME_TAKEN' } }
  | { type: 'CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'CHAT_HISTORY'; payload: { messages: ChatMessage[] } }
  | { type: 'ERROR'; payload: { message: string; code: string } };

// Server-side player state (used by SceneManager)
export interface ServerPlayerState {
  name: string;
  position: Position;
  direction: Direction;
  isFishing: boolean;
}

import fs from 'fs';
import path from 'path';
import { PlayerData, SceneId, Position, InventoryItem } from '@/lib/types';

const PERSISTENCE_FILE = path.join(process.cwd(), 'persistence', 'players.json');

interface PlayersFile {
  players: Record<string, PlayerData>;
}

function ensurePersistenceDir(): void {
  const dir = path.dirname(PERSISTENCE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readPlayersFile(): PlayersFile {
  try {
    const data = fs.readFileSync(PERSISTENCE_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return { players: {} };
  }
}

function writePlayersFile(data: PlayersFile): void {
  ensurePersistenceDir();
  fs.writeFileSync(PERSISTENCE_FILE, JSON.stringify(data, null, 2));
}

export class PlayerManager {
  private cache: Map<string, PlayerData> = new Map();
  private dirty: Set<string> = new Set();
  private saveInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Auto-save every 30 seconds
    this.saveInterval = setInterval(() => this.flush(), 30000);
  }

  async get(name: string): Promise<PlayerData | null> {
    const key = name.toLowerCase();

    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const file = readPlayersFile();
    const player = file.players[key] || null;
    if (player) {
      // Migrate existing players without poleLevel
      if (player.poleLevel === undefined) {
        player.poleLevel = 1;
      }
      this.cache.set(key, player);
    }
    return player;
  }

  async create(name: string, scene: SceneId = 'pond'): Promise<PlayerData> {
    const key = name.toLowerCase();

    const newPlayer: PlayerData = {
      name,
      inventory: [],
      money: 0,
      poleLevel: 1,
      lastScene: scene,
      lastPosition: { x: 5, y: 8 },
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    this.cache.set(key, newPlayer);
    this.dirty.add(key);
    this.flush(); // Save immediately for new players

    return newPlayer;
  }

  async update(name: string, updates: Partial<PlayerData>): Promise<PlayerData | null> {
    const key = name.toLowerCase();
    const player = await this.get(name);

    if (!player) {
      return null;
    }

    const updated: PlayerData = {
      ...player,
      ...updates,
      lastLogin: new Date().toISOString(),
    };

    this.cache.set(key, updated);
    this.dirty.add(key);

    return updated;
  }

  async addToInventory(name: string, item: InventoryItem): Promise<PlayerData | null> {
    const player = await this.get(name);
    if (!player) return null;

    player.inventory.push(item);
    this.dirty.add(name.toLowerCase());
    return player;
  }

  async removeFromInventory(name: string, itemId: string): Promise<{ player: PlayerData; item: InventoryItem } | null> {
    const player = await this.get(name);
    if (!player) return null;

    const index = player.inventory.findIndex((i) => i.id === itemId);
    if (index === -1) return null;

    const [item] = player.inventory.splice(index, 1);
    this.dirty.add(name.toLowerCase());

    return { player, item };
  }

  async addMoney(name: string, amount: number): Promise<PlayerData | null> {
    const player = await this.get(name);
    if (!player) return null;

    player.money += amount;
    this.dirty.add(name.toLowerCase());
    return player;
  }

  async upgradePole(name: string, price: number): Promise<PlayerData | null> {
    const player = await this.get(name);
    if (!player) return null;
    if (player.poleLevel >= 6) return null;
    if (player.money < price) return null;

    player.poleLevel += 1;
    player.money -= price;
    this.dirty.add(name.toLowerCase());
    return player;
  }

  async updatePosition(name: string, position: Position, scene: SceneId): Promise<void> {
    const player = await this.get(name);
    if (!player) return;

    player.lastPosition = position;
    player.lastScene = scene;
    this.dirty.add(name.toLowerCase());
  }

  flush(): void {
    if (this.dirty.size === 0) return;

    const file = readPlayersFile();

    for (const key of this.dirty) {
      const player = this.cache.get(key);
      if (player) {
        file.players[key] = player;
      }
    }

    writePlayersFile(file);
    this.dirty.clear();
  }

  shutdown(): void {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
    this.flush();
  }
}

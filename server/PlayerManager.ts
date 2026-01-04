import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db, players, inventoryItems } from '@/lib/db';
import type { PlayerData, SceneId, Position, InventoryItem, Fish } from '@/lib/types';

const SALT_ROUNDS = 10;

export class PlayerManager {
  // Check if a player exists by name
  async playerExists(name: string): Promise<boolean> {
    const key = name.toLowerCase();
    const result = await db.select({ id: players.id })
      .from(players)
      .where(eq(players.nameLower, key))
      .limit(1);
    return result.length > 0;
  }

  // Validate password for a player
  async validatePassword(name: string, password: string): Promise<boolean> {
    const key = name.toLowerCase();
    const result = await db.select({ passwordHash: players.passwordHash })
      .from(players)
      .where(eq(players.nameLower, key))
      .limit(1);

    if (result.length === 0) return false;
    return await bcrypt.compare(password, result[0].passwordHash);
  }

  // Get raw player row with ID (for session creation)
  async getPlayerRow(name: string): Promise<typeof players.$inferSelect | null> {
    const key = name.toLowerCase();
    const result = await db.select()
      .from(players)
      .where(eq(players.nameLower, key))
      .limit(1);
    return result[0] || null;
  }

  // Get player by name with inventory
  async get(name: string): Promise<PlayerData | null> {
    const key = name.toLowerCase();

    const playerRows = await db.select()
      .from(players)
      .where(eq(players.nameLower, key))
      .limit(1);

    if (playerRows.length === 0) return null;

    const player = playerRows[0];

    // Fetch inventory items
    const items = await db.select()
      .from(inventoryItems)
      .where(eq(inventoryItems.playerId, player.id));

    return this.toPlayerData(player, items);
  }

  // Create a new player with password
  async create(name: string, scene: SceneId = 'pond', password: string): Promise<PlayerData> {
    const key = name.toLowerCase();
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [newPlayer] = await db.insert(players)
      .values({
        name,
        nameLower: key,
        passwordHash,
        money: 0,
        poleLevel: 1,
        lastScene: scene,
        lastPositionX: 5,
        lastPositionY: 8,
      })
      .returning();

    return this.toPlayerData(newPlayer, []);
  }

  // Update player data
  async update(name: string, updates: Partial<PlayerData>): Promise<PlayerData | null> {
    const key = name.toLowerCase();

    const updateData: Record<string, unknown> = {
      lastLogin: new Date(),
    };

    if (updates.money !== undefined) updateData.money = updates.money;
    if (updates.poleLevel !== undefined) updateData.poleLevel = updates.poleLevel;
    if (updates.lastScene !== undefined) updateData.lastScene = updates.lastScene;
    if (updates.lastPosition !== undefined) {
      updateData.lastPositionX = updates.lastPosition.x;
      updateData.lastPositionY = updates.lastPosition.y;
    }

    const [updated] = await db.update(players)
      .set(updateData)
      .where(eq(players.nameLower, key))
      .returning();

    if (!updated) return null;

    // Fetch inventory to return full PlayerData
    const items = await db.select()
      .from(inventoryItems)
      .where(eq(inventoryItems.playerId, updated.id));

    return this.toPlayerData(updated, items);
  }

  // Add item to inventory
  async addToInventory(name: string, item: InventoryItem): Promise<PlayerData | null> {
    const key = name.toLowerCase();

    // Get player ID
    const playerRows = await db.select({ id: players.id })
      .from(players)
      .where(eq(players.nameLower, key))
      .limit(1);

    if (playerRows.length === 0) return null;

    const playerId = playerRows[0].id;

    // Insert inventory item
    await db.insert(inventoryItems).values({
      id: item.id,
      playerId,
      fishId: item.fishId,
      fishData: item.fish,
      caughtAt: new Date(item.caughtAt),
      caughtIn: item.caughtIn,
    });

    return this.get(name);
  }

  // Remove item from inventory
  async removeFromInventory(name: string, itemId: string): Promise<{ player: PlayerData; item: InventoryItem } | null> {
    const key = name.toLowerCase();

    // Get the item first
    const itemRows = await db.select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, itemId))
      .limit(1);

    if (itemRows.length === 0) return null;

    const itemRow = itemRows[0];

    // Delete the item
    await db.delete(inventoryItems).where(eq(inventoryItems.id, itemId));

    // Get updated player
    const player = await this.get(name);
    if (!player) return null;

    const item: InventoryItem = {
      id: itemRow.id,
      fishId: itemRow.fishId,
      fish: itemRow.fishData as Fish,
      caughtAt: itemRow.caughtAt.toISOString(),
      caughtIn: itemRow.caughtIn,
    };

    return { player, item };
  }

  // Add money to player
  async addMoney(name: string, amount: number): Promise<PlayerData | null> {
    const key = name.toLowerCase();

    // Get current money
    const playerRows = await db.select({ id: players.id, money: players.money })
      .from(players)
      .where(eq(players.nameLower, key))
      .limit(1);

    if (playerRows.length === 0) return null;

    const newMoney = playerRows[0].money + amount;

    await db.update(players)
      .set({ money: newMoney })
      .where(eq(players.nameLower, key));

    return this.get(name);
  }

  // Upgrade pole and deduct money
  async upgradePole(name: string, price: number): Promise<PlayerData | null> {
    const key = name.toLowerCase();

    // Get current player data
    const playerRows = await db.select({ id: players.id, poleLevel: players.poleLevel, money: players.money })
      .from(players)
      .where(eq(players.nameLower, key))
      .limit(1);

    if (playerRows.length === 0) return null;

    const player = playerRows[0];
    if (player.poleLevel >= 6) return null;
    if (player.money < price) return null;

    await db.update(players)
      .set({
        poleLevel: player.poleLevel + 1,
        money: player.money - price,
      })
      .where(eq(players.nameLower, key));

    return this.get(name);
  }

  // Update player position and scene
  async updatePosition(name: string, position: Position, scene: SceneId): Promise<void> {
    const key = name.toLowerCase();

    await db.update(players)
      .set({
        lastPositionX: position.x,
        lastPositionY: position.y,
        lastScene: scene,
      })
      .where(eq(players.nameLower, key));
  }

  // Convert database row to PlayerData
  private toPlayerData(
    player: typeof players.$inferSelect,
    items: (typeof inventoryItems.$inferSelect)[]
  ): PlayerData {
    return {
      name: player.name,
      inventory: items.map((item) => ({
        id: item.id,
        fishId: item.fishId,
        fish: item.fishData as Fish,
        caughtAt: item.caughtAt.toISOString(),
        caughtIn: item.caughtIn,
      })),
      money: player.money,
      poleLevel: player.poleLevel,
      lastScene: player.lastScene,
      lastPosition: { x: player.lastPositionX, y: player.lastPositionY },
      createdAt: player.createdAt.toISOString(),
      lastLogin: player.lastLogin.toISOString(),
    };
  }

  // No-ops for backward compatibility
  flush(): void {
    // Database writes are immediate, no flush needed
  }

  shutdown(): void {
    // No cleanup needed for serverless database
  }
}

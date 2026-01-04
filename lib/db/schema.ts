import { pgTable, text, integer, timestamp, uuid, jsonb, serial, index } from 'drizzle-orm/pg-core';
import type { Fish, SceneId } from '@/lib/types';

// Players table - main user data
export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  nameLower: text('name_lower').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  money: integer('money').notNull().default(0),
  poleLevel: integer('pole_level').notNull().default(1),
  lastScene: text('last_scene').notNull().default('pond'),
  lastPositionX: integer('last_position_x').notNull().default(5),
  lastPositionY: integer('last_position_y').notNull().default(8),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastLogin: timestamp('last_login').notNull().defaultNow(),
});

// Sessions table - persistent login sessions
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: integer('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('sessions_token_idx').on(table.token),
  index('sessions_player_id_idx').on(table.playerId),
]);

// Inventory items table - normalized from embedded array
export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: integer('player_id').notNull().references(() => players.id, { onDelete: 'cascade' }),
  fishId: text('fish_id').notNull(),
  fishData: jsonb('fish_data').notNull().$type<Fish>(),
  caughtAt: timestamp('caught_at').notNull().defaultNow(),
  caughtIn: text('caught_in').notNull().$type<SceneId>(),
});

// Chat messages table - per-scene chat history
export const chatMessages = pgTable('chat_messages', {
  id: serial('id').primaryKey(),
  sceneId: text('scene_id').notNull(),
  playerName: text('player_name').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('chat_messages_scene_created_idx').on(table.sceneId, table.createdAt),
]);

// Game assets table - stores textures, sprites, and other configurable assets
export const gameAssets = pgTable('game_assets', {
  id: serial('id').primaryKey(),
  assetType: text('asset_type').notNull(), // 'textures', 'fish_sprites', etc.
  assetKey: text('asset_key').notNull().default('default'), // For multiple versions
  data: jsonb('data').notNull(), // The actual asset data (textures, etc.)
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedBy: text('updated_by'), // Player name who made the change
}, (table) => [
  index('game_assets_type_key_idx').on(table.assetType, table.assetKey),
]);

// Type exports for use in application code
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type InventoryItemRow = typeof inventoryItems.$inferSelect;
export type NewInventoryItem = typeof inventoryItems.$inferInsert;
export type ChatMessageRow = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
export type GameAssetRow = typeof gameAssets.$inferSelect;
export type NewGameAsset = typeof gameAssets.$inferInsert;
export type SessionRow = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

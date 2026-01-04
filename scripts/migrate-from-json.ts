/**
 * Migration script to move player data from players.json to Postgres
 *
 * Usage: npx tsx scripts/migrate-from-json.ts
 *
 * Note: This script creates temporary passwords for existing players.
 * Players will need to contact you for their temporary password.
 */

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { players, inventoryItems } from '../lib/db/schema';
import type { PlayerData, InventoryItem } from '../lib/types';

const SALT_ROUNDS = 10;

interface PlayersFile {
  players: Record<string, PlayerData>;
}

async function migrate() {
  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  // Initialize database connection
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  // Read players.json
  const playersFilePath = path.join(process.cwd(), 'persistence', 'players.json');

  if (!fs.existsSync(playersFilePath)) {
    console.log('No players.json file found. Nothing to migrate.');
    return;
  }

  const fileContent = fs.readFileSync(playersFilePath, 'utf8');
  const playersData: PlayersFile = JSON.parse(fileContent);

  const playerEntries = Object.entries(playersData.players);
  console.log(`Found ${playerEntries.length} players to migrate`);

  const tempPasswords: Record<string, string> = {};

  for (const [key, playerData] of playerEntries) {
    try {
      // Generate temporary password
      const tempPassword = generateTempPassword();
      const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);

      // Insert player
      const [insertedPlayer] = await db.insert(players).values({
        name: playerData.name,
        nameLower: key,
        passwordHash,
        money: playerData.money,
        poleLevel: playerData.poleLevel || 1,
        lastScene: playerData.lastScene,
        lastPositionX: playerData.lastPosition.x,
        lastPositionY: playerData.lastPosition.y,
        createdAt: new Date(playerData.createdAt),
        lastLogin: new Date(playerData.lastLogin),
      }).returning();

      tempPasswords[playerData.name] = tempPassword;
      console.log(`Migrated player: ${playerData.name}`);

      // Insert inventory items
      if (playerData.inventory && playerData.inventory.length > 0) {
        for (const item of playerData.inventory) {
          await db.insert(inventoryItems).values({
            id: item.id,
            playerId: insertedPlayer.id,
            fishId: item.fishId,
            fishData: item.fish,
            caughtAt: new Date(item.caughtAt),
            caughtIn: item.caughtIn,
          });
        }
        console.log(`  - Migrated ${playerData.inventory.length} inventory items`);
      }
    } catch (error) {
      console.error(`Failed to migrate player ${playerData.name}:`, error);
    }
  }

  // Output temporary passwords
  console.log('\n=== Migration Complete ===\n');
  console.log('Temporary passwords (share with players privately):');
  console.log('------------------------------------------------');
  for (const [name, password] of Object.entries(tempPasswords)) {
    console.log(`${name}: ${password}`);
  }
  console.log('------------------------------------------------');
  console.log('\nPlayers should change their passwords after first login.');
}

function generateTempPassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

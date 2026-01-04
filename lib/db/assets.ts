import { db, gameAssets } from './index';
import { eq, and } from 'drizzle-orm';

/**
 * Generic asset loader with database-first, file-fallback pattern.
 * Eliminates duplicate load/save code across API routes.
 */
export async function loadAsset<T>(
  assetType: string,
  assetKey: string,
  fallbackLoader: () => T | Promise<T>
): Promise<T> {
  try {
    const result = await db
      .select()
      .from(gameAssets)
      .where(and(
        eq(gameAssets.assetType, assetType),
        eq(gameAssets.assetKey, assetKey)
      ))
      .limit(1);

    if (result.length > 0 && result[0].data) {
      return result[0].data as T;
    }
  } catch (err) {
    console.warn(`Failed to load ${assetType}/${assetKey} from database:`, err);
  }

  // Fall back to file/default loader
  return fallbackLoader();
}

/**
 * Generic asset saver with upsert pattern.
 */
export async function saveAsset<T>(
  assetType: string,
  assetKey: string,
  data: T
): Promise<void> {
  const existing = await db
    .select({ id: gameAssets.id })
    .from(gameAssets)
    .where(and(
      eq(gameAssets.assetType, assetType),
      eq(gameAssets.assetKey, assetKey)
    ))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(gameAssets)
      .set({
        data,
        updatedAt: new Date(),
      })
      .where(eq(gameAssets.id, existing[0].id));
  } else {
    await db.insert(gameAssets).values({
      assetType,
      assetKey,
      data,
      updatedAt: new Date(),
    });
  }
}

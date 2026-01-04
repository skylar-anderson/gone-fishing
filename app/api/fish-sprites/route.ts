import { NextRequest, NextResponse } from 'next/server';
import { loadAsset, saveAsset } from '@/lib/db/assets';
import { loadFishSprites as loadSpritesFromFile } from '@/lib/fishSprites/registry';
import type { FishSpriteExport, FishSprites } from '@/lib/types/fishSprites';

const ASSET_TYPE = 'fish_sprites';
const ASSET_KEY = 'default';

export async function GET() {
  try {
    const sprites = await loadAsset<FishSprites>(
      ASSET_TYPE,
      ASSET_KEY,
      loadSpritesFromFile
    );

    return NextResponse.json({
      version: 1,
      exportedAt: new Date().toISOString(),
      sprites,
    } satisfies FishSpriteExport);
  } catch (error) {
    console.error('Failed to load fish sprites:', error);
    return NextResponse.json({
      version: 1,
      exportedAt: new Date().toISOString(),
      sprites: {},
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json() as FishSpriteExport;

    if (data.version !== 1 || !data.sprites) {
      return NextResponse.json({ error: 'Invalid sprite data format' }, { status: 400 });
    }

    await saveAsset(ASSET_TYPE, ASSET_KEY, data.sprites);

    return NextResponse.json({
      success: true,
      savedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to save fish sprites:', error);
    return NextResponse.json({ error: 'Failed to save fish sprites' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { loadAsset, saveAsset } from '@/lib/db/assets';
import { loadTextures as loadTexturesFromFile } from '@/lib/textures/registry';
import type { TextureExport, TileTextures } from '@/lib/types/textures';

const ASSET_TYPE = 'textures';
const ASSET_KEY = 'default';

export async function GET() {
  try {
    const textures = await loadAsset<TileTextures>(
      ASSET_TYPE,
      ASSET_KEY,
      loadTexturesFromFile
    );

    return NextResponse.json({
      version: 1,
      exportedAt: new Date().toISOString(),
      tileTextures: textures,
    } satisfies TextureExport);
  } catch (err) {
    console.error('Failed to load textures:', err);
    return NextResponse.json({
      version: 1,
      exportedAt: new Date().toISOString(),
      tileTextures: loadTexturesFromFile(),
    });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json() as TextureExport;

    if (data.version !== 1 || !data.tileTextures) {
      return NextResponse.json({ error: 'Invalid texture format' }, { status: 400 });
    }

    await saveAsset(ASSET_TYPE, ASSET_KEY, data.tileTextures);

    return NextResponse.json({
      success: true,
      savedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to save textures:', err);
    return NextResponse.json({ error: 'Failed to save textures' }, { status: 500 });
  }
}

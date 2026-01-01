import { NextResponse } from 'next/server';
import { loadTextures, saveTextures, clearTextureCache } from '@/lib/textures/registry';
import type { TextureExport } from '@/lib/types/textures';

export async function GET() {
  const textures = loadTextures();

  const response: TextureExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    tileTextures: textures,
  };

  return NextResponse.json(response);
}

export async function POST(request: Request) {
  try {
    const data = await request.json() as TextureExport;

    if (data.version !== 1 || !data.tileTextures) {
      return NextResponse.json({ error: 'Invalid texture format' }, { status: 400 });
    }

    saveTextures(data.tileTextures);
    clearTextureCache();

    return NextResponse.json({ success: true, savedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save textures' }, { status: 500 });
  }
}

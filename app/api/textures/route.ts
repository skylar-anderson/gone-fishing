import { NextResponse } from 'next/server';
import { loadTextures } from '@/lib/textures/registry';
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

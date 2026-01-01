import { NextResponse } from 'next/server';
import { getSceneMetadata } from '@/lib/scenes/registry';

export async function GET() {
  const scenes = getSceneMetadata();
  return NextResponse.json(scenes);
}

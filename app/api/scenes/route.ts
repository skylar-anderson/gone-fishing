import { NextRequest, NextResponse } from 'next/server';
import { loadAsset, saveAsset } from '@/lib/db/assets';
import { getSceneMetadata } from '@/lib/scenes/registry';
import fs from 'fs';
import path from 'path';

const ASSET_TYPE = 'scene';

interface SceneData {
  id: string;
  name: string;
  description: string;
  emoji: string;
  spawnPoint: { x: number; y: number };
  map: {
    width: number;
    height: number;
    tileSize: number;
    legend: Record<string, { type: string; walkable: boolean; fishable: boolean }>;
    data: string[];
  };
}

function loadSceneFromFile(sceneId: string): SceneData | null {
  try {
    const filePath = path.join(process.cwd(), 'data', 'scenes', `${sceneId}.json`);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {
    console.warn(`Failed to load scene ${sceneId} from file:`, err);
  }
  return null;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const sceneId = url.searchParams.get('id');

  // If specific scene requested, return full scene data
  if (sceneId) {
    const scene = await loadAsset<SceneData | null>(
      ASSET_TYPE,
      sceneId,
      () => loadSceneFromFile(sceneId)
    );

    if (scene) {
      return NextResponse.json(scene);
    }
    return NextResponse.json({ error: 'Scene not found' }, { status: 404 });
  }

  // Otherwise return metadata list
  return NextResponse.json(getSceneMetadata());
}

export async function POST(request: NextRequest) {
  try {
    const sceneData = await request.json() as SceneData;

    if (!sceneData.id || !sceneData.map?.data) {
      return NextResponse.json({ error: 'Invalid scene data' }, { status: 400 });
    }

    await saveAsset(ASSET_TYPE, sceneData.id, sceneData);

    return NextResponse.json({
      success: true,
      savedAt: new Date().toISOString(),
      sceneId: sceneData.id,
    });
  } catch (error) {
    console.error('Failed to save scene:', error);
    return NextResponse.json({ error: 'Failed to save scene' }, { status: 500 });
  }
}

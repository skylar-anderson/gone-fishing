import { NextRequest, NextResponse } from 'next/server';
import { loadAsset, saveAsset } from '@/lib/db/assets';
import { loadFishConfig } from '@/lib/utils/yaml';
import { getSceneIds } from '@/lib/scenes/registry';
import type { Fish, SceneId } from '@/lib/types';

const ASSET_TYPE = 'fish_config';

interface FishConfigData {
  scene: SceneId;
  fish: Fish[];
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const sceneId = url.searchParams.get('scene') as SceneId | null;

    // If specific scene requested, return just that scene's fish
    if (sceneId) {
      const data = await loadAsset<FishConfigData | null>(
        ASSET_TYPE,
        sceneId,
        () => {
          const config = loadFishConfig(sceneId);
          return config ? { scene: sceneId, fish: config.fish } : null;
        }
      );

      return NextResponse.json({
        scene: sceneId,
        fish: data?.fish || [],
      });
    }

    // Otherwise return all fish by scene
    const sceneIds = getSceneIds();
    const fishByScene: Record<string, Fish[]> = {};

    for (const scene of sceneIds) {
      const data = await loadAsset<FishConfigData | null>(
        ASSET_TYPE,
        scene,
        () => {
          const config = loadFishConfig(scene);
          return config ? { scene, fish: config.fish } : null;
        }
      );
      fishByScene[scene] = data?.fish || [];
    }

    return NextResponse.json(fishByScene);
  } catch (error) {
    console.error('Failed to load fish data:', error);
    return NextResponse.json({ error: 'Failed to load fish data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json() as FishConfigData;

    if (!data.scene || !Array.isArray(data.fish)) {
      return NextResponse.json({ error: 'Invalid fish config format' }, { status: 400 });
    }

    await saveAsset(ASSET_TYPE, data.scene, data);

    return NextResponse.json({
      success: true,
      savedAt: new Date().toISOString(),
      scene: data.scene,
      fishCount: data.fish.length,
    });
  } catch (error) {
    console.error('Failed to save fish config:', error);
    return NextResponse.json({ error: 'Failed to save fish config' }, { status: 500 });
  }
}

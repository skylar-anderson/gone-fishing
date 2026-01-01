import yaml from 'yaml';
import fs from 'fs';
import path from 'path';
import { Fish, SceneId } from '@/lib/types';
import { getSceneIds } from '@/lib/scenes/registry';

export interface FishConfig {
  scene: SceneId;
  fish: Fish[];
}

export function loadFishConfig(scene: SceneId): FishConfig | null {
  const filePath = path.join(process.cwd(), 'data', 'fish', `${scene}.yaml`);

  // Return null if no fish config exists for this scene
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  return yaml.parse(fileContents) as FishConfig;
}

export function loadAllFish(): Map<SceneId, Fish[]> {
  const sceneIds = getSceneIds();
  const fishMap = new Map<SceneId, Fish[]>();

  for (const sceneId of sceneIds) {
    const config = loadFishConfig(sceneId);
    if (config) {
      fishMap.set(sceneId, config.fish);
    } else {
      // Scene exists but has no fish - use empty array
      fishMap.set(sceneId, []);
    }
  }

  return fishMap;
}

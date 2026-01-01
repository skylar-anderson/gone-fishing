import yaml from 'yaml';
import fs from 'fs';
import path from 'path';
import { Fish, SceneId } from '@/lib/types';

export interface FishConfig {
  scene: SceneId;
  fish: Fish[];
}

export function loadFishConfig(scene: SceneId): FishConfig {
  const filePath = path.join(process.cwd(), 'data', 'fish', `${scene}.yaml`);
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return yaml.parse(fileContents) as FishConfig;
}

export function loadAllFish(): Map<SceneId, Fish[]> {
  const scenes: SceneId[] = ['swamp', 'pond', 'river', 'ocean'];
  const fishMap = new Map<SceneId, Fish[]>();

  for (const scene of scenes) {
    const config = loadFishConfig(scene);
    fishMap.set(scene, config.fish);
  }

  return fishMap;
}

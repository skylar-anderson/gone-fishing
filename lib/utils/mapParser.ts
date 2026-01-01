import fs from 'fs';
import path from 'path';
import { Scene, SceneId, Tile, TileMap, SceneExit } from '@/lib/types';
import { getSceneIds } from '@/lib/scenes/registry';

interface RawSceneData {
  id: string;
  name: string;
  description: string;
  spawnPoint: { x: number; y: number };
  map: {
    width: number;
    height: number;
    tileSize: number;
    legend: Record<string, Omit<Tile, 'char'>>;
    data: string[];
  };
  exits: Array<{
    position: { x: number; y: number };
    target: string;
    direction: string;
  }>;
}

export function parseSceneData(raw: RawSceneData): Scene {
  const tiles: Tile[][] = [];

  for (let y = 0; y < raw.map.data.length; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < raw.map.data[y].length; x++) {
      const char = raw.map.data[y][x];
      const tileInfo = raw.map.legend[char];
      if (!tileInfo) {
        throw new Error(`Unknown tile character '${char}' at position (${x}, ${y}) in scene ${raw.id}`);
      }
      row.push({
        type: tileInfo.type,
        walkable: tileInfo.walkable,
        fishable: tileInfo.fishable,
      });
    }
    tiles.push(row);
  }

  const tileMap: TileMap = {
    width: raw.map.width,
    height: raw.map.height,
    tileSize: raw.map.tileSize,
    tiles,
  };

  const exits: SceneExit[] = (raw.exits || []).map((exit) => ({
    position: exit.position,
    target: exit.target as SceneId,
    direction: exit.direction as 'up' | 'down' | 'left' | 'right',
  }));

  return {
    id: raw.id as SceneId,
    name: raw.name,
    description: raw.description,
    spawnPoint: raw.spawnPoint,
    map: tileMap,
    exits,
  };
}

export function loadScene(sceneId: SceneId): Scene {
  const filePath = path.join(process.cwd(), 'data', 'scenes', `${sceneId}.json`);
  const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return parseSceneData(rawData);
}

export function loadAllScenes(): Map<SceneId, Scene> {
  const sceneIds = getSceneIds();
  const sceneMap = new Map<SceneId, Scene>();

  for (const sceneId of sceneIds) {
    sceneMap.set(sceneId, loadScene(sceneId));
  }

  return sceneMap;
}

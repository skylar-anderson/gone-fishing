/**
 * Scene Registry - Single source of truth for all scene data
 *
 * Scenes are auto-discovered by reading JSON files from data/scenes/
 * To add a new scene, simply create a new JSON file in that directory.
 */

import fs from 'fs';
import path from 'path';

export interface SceneMetadata {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

interface RawSceneJSON {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

// Directory where scene JSON files are stored
const SCENES_DIR = path.join(process.cwd(), 'data', 'scenes');

/**
 * Discovers all scene IDs by reading the scenes directory
 */
export function discoverSceneIds(): string[] {
  const files = fs.readdirSync(SCENES_DIR);
  return files
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace('.json', ''));
}

/**
 * Loads metadata for a single scene without parsing the full map data
 */
export function loadSceneMetadata(sceneId: string): SceneMetadata {
  const filePath = path.join(SCENES_DIR, `${sceneId}.json`);
  const rawData: RawSceneJSON = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  return {
    id: rawData.id,
    name: rawData.name,
    description: rawData.description,
    emoji: rawData.emoji || '🎣', // Default emoji if not specified
  };
}

/**
 * Loads metadata for all scenes
 */
export function loadAllSceneMetadata(): SceneMetadata[] {
  const sceneIds = discoverSceneIds();
  return sceneIds.map(id => loadSceneMetadata(id));
}

/**
 * Validates that a scene ID exists
 */
export function isValidSceneId(sceneId: string): boolean {
  const validIds = discoverSceneIds();
  return validIds.includes(sceneId);
}

/**
 * Gets the default scene (first scene alphabetically, or 'pond' if it exists)
 */
export function getDefaultSceneId(): string {
  const sceneIds = discoverSceneIds();
  if (sceneIds.includes('pond')) return 'pond';
  return sceneIds.sort()[0] || 'pond';
}

// Pre-computed scene data for module consumers
// This runs once when the module is first imported
let _cachedSceneIds: string[] | null = null;
let _cachedSceneMetadata: SceneMetadata[] | null = null;

export function getSceneIds(): string[] {
  if (!_cachedSceneIds) {
    _cachedSceneIds = discoverSceneIds();
  }
  return _cachedSceneIds;
}

export function getSceneMetadata(): SceneMetadata[] {
  if (!_cachedSceneMetadata) {
    _cachedSceneMetadata = loadAllSceneMetadata();
  }
  return _cachedSceneMetadata;
}

// Export a lookup map for quick access
export function getSceneMetadataMap(): Map<string, SceneMetadata> {
  const metadata = getSceneMetadata();
  return new Map(metadata.map(m => [m.id, m]));
}

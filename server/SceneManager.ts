import { Scene, SceneId, Position, Direction, ServerPlayerState, OtherPlayer } from '@/lib/types';
import { loadAllScenes } from '@/lib/utils/mapParser';
import { canFishAt } from '@/lib/utils/collision';

export class SceneManager {
  private scenes: Map<SceneId, Scene>;
  private playersByScene: Map<SceneId, Map<string, ServerPlayerState>>;

  constructor() {
    this.scenes = loadAllScenes();
    this.playersByScene = new Map();

    // Initialize player maps for each scene
    for (const sceneId of this.scenes.keys()) {
      this.playersByScene.set(sceneId, new Map());
    }
  }

  getScene(sceneId: SceneId): Scene | undefined {
    return this.scenes.get(sceneId);
  }

  addPlayer(sceneId: SceneId, playerName: string, position: Position): void {
    const players = this.playersByScene.get(sceneId);
    if (!players) return;

    players.set(playerName, {
      name: playerName,
      position,
      direction: 'down',
      isFishing: false,
    });
  }

  removePlayer(sceneId: SceneId, playerName: string): void {
    const players = this.playersByScene.get(sceneId);
    if (!players) return;

    players.delete(playerName);
  }

  updatePlayerPosition(
    sceneId: SceneId,
    playerName: string,
    position: Position,
    direction: Direction
  ): void {
    const players = this.playersByScene.get(sceneId);
    if (!players) return;

    const player = players.get(playerName);
    if (!player) return;

    player.position = position;
    player.direction = direction;
    player.isFishing = false; // Cancel fishing on move
  }

  setPlayerFishing(sceneId: SceneId, playerName: string, isFishing: boolean): void {
    const players = this.playersByScene.get(sceneId);
    if (!players) return;

    const player = players.get(playerName);
    if (!player) return;

    player.isFishing = isFishing;
  }

  getPlayerState(sceneId: SceneId, playerName: string): ServerPlayerState | undefined {
    const players = this.playersByScene.get(sceneId);
    if (!players) return undefined;

    return players.get(playerName);
  }

  getPlayersInScene(sceneId: SceneId): OtherPlayer[] {
    const players = this.playersByScene.get(sceneId);
    if (!players) return [];

    return Array.from(players.values()).map((p) => ({
      name: p.name,
      position: p.position,
      currentScene: sceneId,
      direction: p.direction,
      isFishing: p.isFishing,
    }));
  }

  getPlayerNames(sceneId: SceneId): string[] {
    const players = this.playersByScene.get(sceneId);
    if (!players) return [];

    return Array.from(players.keys());
  }

  canFishAtPosition(sceneId: SceneId, position: Position, direction: Direction): boolean {
    const scene = this.scenes.get(sceneId);
    if (!scene) return false;

    return canFishAt(scene.map, position, direction);
  }

  movePlayerToScene(
    fromScene: SceneId,
    toScene: SceneId,
    playerName: string
  ): Position | null {
    const targetScene = this.scenes.get(toScene);
    if (!targetScene) return null;

    // Get current player state
    const playerState = this.getPlayerState(fromScene, playerName);
    if (!playerState) return null;

    // Remove from old scene
    this.removePlayer(fromScene, playerName);

    // Add to new scene at spawn point
    this.addPlayer(toScene, playerName, targetScene.spawnPoint);

    return targetScene.spawnPoint;
  }
}

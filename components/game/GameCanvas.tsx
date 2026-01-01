'use client';

import { useGameStore } from '@/store/gameStore';
import { TileMap } from './TileMap';
import { Player } from './Player';
import { useTextures } from '@/lib/hooks/useTextures';

export function GameCanvas() {
  const { scene, playerName, position, direction, isFishing, otherPlayers } = useGameStore();
  const { textures } = useTextures();

  if (!scene || !playerName) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-800 rounded-lg">
        <p className="text-gray-400">Loading game...</p>
      </div>
    );
  }

  const { map } = scene;
  const viewportWidth = map.width * map.tileSize;
  const viewportHeight = map.height * map.tileSize;

  return (
    <div className="relative">
      <svg
        width={viewportWidth}
        height={viewportHeight}
        className="border-2 border-gray-700 rounded-lg shadow-lg"
        style={{ background: '#1a1a2e' }}
      >
        {/* Render tile map */}
        <TileMap map={map} textures={textures} />

        {/* Render other players */}
        {Array.from(otherPlayers.values()).map((player) => (
          <Player
            key={player.name}
            name={player.name}
            position={player.position}
            direction={player.direction}
            tileSize={map.tileSize}
            isLocal={false}
            isFishing={player.isFishing}
          />
        ))}

        {/* Render local player */}
        <Player
          name={playerName}
          position={position}
          direction={direction}
          tileSize={map.tileSize}
          isLocal={true}
          isFishing={isFishing}
        />
      </svg>

      {/* Controls hint */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-400 bg-black/50 px-2 py-1 rounded">
        Arrow keys to move | Space or F to fish
      </div>
    </div>
  );
}

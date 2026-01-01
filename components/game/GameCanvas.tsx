'use client';

import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { TileMap } from './TileMap';
import { InterpolatedPlayer } from './InterpolatedPlayer';
import { useTextures } from '@/lib/hooks/useTextures';

export function GameCanvas() {
  // Use individual selectors to prevent unnecessary re-renders
  const scene = useGameStore((state) => state.scene);
  const playerName = useGameStore((state) => state.playerName);
  const position = useGameStore((state) => state.position);
  const direction = useGameStore((state) => state.direction);
  const isFishing = useGameStore((state) => state.isFishing);
  const otherPlayers = useGameStore((state) => state.otherPlayers);
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

  // Memoize the other players array to avoid recreating on every render
  const otherPlayersList = useMemo(
    () => Array.from(otherPlayers.values()),
    [otherPlayers]
  );

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox={`0 0 ${viewportWidth} ${viewportHeight}`}
        preserveAspectRatio="xMidYMid meet"
        className="border-2 border-gray-700 rounded-lg shadow-lg w-full h-full max-w-full max-h-full"
        style={{ background: '#1a1a2e' }}
      >
        {/* Render tile map */}
        <TileMap map={map} textures={textures} />

        {/* Render other players with interpolation */}
        {otherPlayersList.map((player) => (
          <InterpolatedPlayer
            key={player.name}
            name={player.name}
            position={player.position}
            direction={player.direction}
            tileSize={map.tileSize}
            isLocal={false}
            isFishing={player.isFishing}
          />
        ))}

        {/* Render local player with interpolation */}
        <InterpolatedPlayer
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

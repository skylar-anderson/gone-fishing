'use client';

import { useGameStore } from '@/store/gameStore';

export function PlayerList() {
  const { playerName, otherPlayers, scene } = useGameStore();

  const allPlayers = [
    { name: playerName, isYou: true },
    ...Array.from(otherPlayers.values()).map((p) => ({ name: p.name, isYou: false })),
  ].filter((p) => p.name);

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-white text-lg font-bold mb-3">
        Players in {scene?.name || 'Area'}
      </h2>
      <div className="space-y-2">
        {allPlayers.map((player) => (
          <div
            key={player.name}
            className={`flex items-center gap-2 p-2 rounded ${
              player.isYou ? 'bg-blue-600/20' : 'bg-gray-700'
            }`}
          >
            <div
              className={`w-3 h-3 rounded-full ${
                player.isYou ? 'bg-blue-500' : 'bg-red-500'
              }`}
            />
            <span className={`${player.isYou ? 'text-blue-300' : 'text-gray-300'}`}>
              {player.name}
              {player.isYou && ' (you)'}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 text-gray-500 text-sm">
        {allPlayers.length} player{allPlayers.length !== 1 ? 's' : ''} online
      </div>
    </div>
  );
}

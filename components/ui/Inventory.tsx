'use client';

import { useGameStore } from '@/store/gameStore';
import { ClientMessage, Rarity } from '@/lib/types';
import { FishDisplay } from './FishDisplay';

interface InventoryProps {
  sendMessage: (message: ClientMessage) => void;
}

const RARITY_COLORS: Record<Rarity, string> = {
  common: 'text-gray-300',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
};

const RARITY_BG: Record<Rarity, string> = {
  common: 'bg-gray-700',
  uncommon: 'bg-green-900/30',
  rare: 'bg-blue-900/30',
  epic: 'bg-purple-900/30',
  legendary: 'bg-yellow-900/30 border border-yellow-600',
};

export function Inventory({ sendMessage }: InventoryProps) {
  const { inventory, money } = useGameStore();

  const handleSell = (itemId: string) => {
    sendMessage({ type: 'SELL_FISH', payload: { inventoryItemId: itemId } });
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white text-lg font-bold">Inventory</h2>
        <div className="text-yellow-400 font-bold">${money}</div>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {inventory.length === 0 ? (
          <p className="text-gray-400 text-center py-4">
            No fish caught yet! Stand near water and press Space to fish.
          </p>
        ) : (
          inventory.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-2 rounded ${RARITY_BG[item.fish.rarity]}`}
            >
              <div className="flex items-center gap-2">
                <FishDisplay fishId={item.fish.id} emoji={item.fish.emoji} size={32} />
                <div>
                  <div className={`font-medium ${RARITY_COLORS[item.fish.rarity]}`}>
                    {item.fish.name}
                  </div>
                  <div className="text-xs text-gray-400 capitalize">
                    {item.fish.rarity}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleSell(item.id)}
                className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
              >
                ${item.fish.value}
              </button>
            </div>
          ))
        )}
      </div>

      {inventory.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700 text-gray-400 text-sm">
          {inventory.length} fish in inventory
        </div>
      )}
    </div>
  );
}

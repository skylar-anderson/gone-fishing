'use client';

import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Rarity, ClientMessage } from '@/lib/types';
import { useSound } from '@/lib/hooks/useSound';

const RARITY_COLORS: Record<Rarity, string> = {
  common: 'text-gray-300',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
};

const RARITY_GLOW: Record<Rarity, string> = {
  common: '',
  uncommon: 'shadow-green-500/50',
  rare: 'shadow-blue-500/50',
  epic: 'shadow-purple-500/50',
  legendary: 'shadow-yellow-500/50 animate-pulse',
};

interface CatchModalProps {
  sendMessage: (message: ClientMessage) => void;
}

export function CatchModal({ sendMessage }: CatchModalProps) {
  const { lastCatch, showCatchModal, setShowCatchModal, inventory } = useGameStore();
  const { play: playInventorySound } = useSound('/sounds/inventory.wav');
  const { play: playCatchSound } = useSound('/sounds/catch.wav');

  // Play catch sound when modal opens with a successful catch
  useEffect(() => {
    if (showCatchModal && lastCatch) {
      playCatchSound();
    }
  }, [showCatchModal, lastCatch, playCatchSound]);

  // Auto-close after 2 seconds only for failed catches
  useEffect(() => {
    if (showCatchModal && !lastCatch) {
      const timer = setTimeout(() => {
        setShowCatchModal(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showCatchModal, lastCatch, setShowCatchModal]);

  if (!showCatchModal) return null;

  // No catch
  if (!lastCatch) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div className="bg-gray-800 border border-gray-600 rounded-xl p-6 shadow-2xl animate-bounce-in">
          <div className="text-center">
            <div className="text-4xl mb-2">😔</div>
            <h3 className="text-xl font-bold text-gray-300">Nothing caught...</h3>
            <p className="text-gray-500 text-sm mt-1">Better luck next time!</p>
          </div>
        </div>
      </div>
    );
  }

  // Find the most recently caught fish of this type in inventory
  const recentlyCaughtItem = [...inventory]
    .reverse()
    .find((item) => item.fishId === lastCatch.id);

  const handleKeep = () => {
    playInventorySound();
    setShowCatchModal(false);
  };

  const handleSell = () => {
    if (recentlyCaughtItem) {
      sendMessage({ type: 'SELL_FISH', payload: { inventoryItemId: recentlyCaughtItem.id } });
    }
    setShowCatchModal(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div
        className={`bg-gray-800 border-2 border-gray-600 rounded-xl p-8 shadow-2xl animate-bounce-in ${RARITY_GLOW[lastCatch.rarity]}`}
        style={{ boxShadow: lastCatch.rarity !== 'common' ? `0 0 30px 5px` : undefined }}
      >
        <div className="text-center">
          <div className="text-6xl mb-4">{lastCatch.emoji}</div>
          <h3 className={`text-2xl font-bold ${RARITY_COLORS[lastCatch.rarity]}`}>
            {lastCatch.name}
          </h3>
          <div className={`text-sm font-medium uppercase tracking-wider mt-1 ${RARITY_COLORS[lastCatch.rarity]}`}>
            {lastCatch.rarity}
          </div>
          <p className="text-gray-400 text-sm mt-3 max-w-xs">
            {lastCatch.description}
          </p>

          {/* Action buttons */}
          <div className="flex gap-3 mt-6 justify-center">
            <button
              onClick={handleKeep}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors"
            >
              Keep
            </button>
            <button
              onClick={handleSell}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors"
            >
              Sell (${lastCatch.value})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

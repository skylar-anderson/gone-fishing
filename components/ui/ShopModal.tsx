'use client';

import { useGameStore } from '@/store/gameStore';
import { ClientMessage } from '@/lib/types';

interface ShopModalProps {
  sendMessage: (message: ClientMessage) => void;
}

export function ShopModal({ sendMessage }: ShopModalProps) {
  const { shopOpen, shopData, setShopOpen } = useGameStore();

  if (!shopOpen || !shopData) return null;

  const handleClose = () => {
    setShopOpen(false);
    sendMessage({ type: 'CLOSE_SHOP', payload: {} });
  };

  const handleBuy = () => {
    sendMessage({ type: 'BUY_POLE_UPGRADE', payload: {} });
  };

  const { currentPole, nextPole, canAfford, playerMoney } = shopData;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
      <div className="bg-gray-800 border-2 border-purple-500 rounded-xl p-8 shadow-2xl max-w-md w-full mx-4">
        <div className="text-center">
          {/* Shop Header */}
          <div className="text-4xl mb-2">🏪</div>
          <h2 className="text-2xl font-bold text-purple-400 mb-6">Rod Shop</h2>

          {/* Current Pole */}
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <div className="text-sm text-gray-400 mb-1">Current Pole</div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl">{currentPole.emoji}</span>
              <span className="text-xl font-bold text-white">{currentPole.name}</span>
            </div>
            <div className="text-sm text-gray-400 mt-1">Level {currentPole.level}/6</div>
          </div>

          {/* Next Pole Upgrade */}
          {nextPole ? (
            <div className={`bg-gray-700 rounded-lg p-4 mb-6 border-2 ${canAfford ? 'border-green-500' : 'border-gray-600'}`}>
              <div className="text-sm text-gray-400 mb-1">Upgrade Available</div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-3xl">{nextPole.emoji}</span>
                <span className="text-xl font-bold text-white">{nextPole.name}</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">{nextPole.description}</p>
              <div className={`text-lg font-bold mt-3 ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                ${nextPole.price.toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="bg-gray-700 rounded-lg p-4 mb-6 border-2 border-yellow-500">
              <div className="text-2xl mb-2">🏆</div>
              <div className="text-xl font-bold text-yellow-400">MAX LEVEL!</div>
              <p className="text-gray-400 text-sm mt-2">You have the ultimate fishing rod!</p>
            </div>
          )}

          {/* Player Money */}
          <div className="text-lg text-gray-300 mb-4">
            Your Money: <span className="text-green-400 font-bold">${playerMoney.toLocaleString()}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            {nextPole && (
              <button
                onClick={handleBuy}
                disabled={!canAfford}
                className={`px-6 py-2 font-bold rounded-lg transition-colors ${
                  canAfford
                    ? 'bg-green-600 hover:bg-green-500 text-white cursor-pointer'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {canAfford ? 'Buy Upgrade' : 'Not Enough Money'}
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4">Press ESC to close</p>
        </div>
      </div>
    </div>
  );
}

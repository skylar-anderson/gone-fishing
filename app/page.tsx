'use client';

import { useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { useKeyboard } from '@/lib/hooks/useKeyboard';
import { LoginForm } from '@/components/ui/LoginForm';
import { GameCanvas } from '@/components/game/GameCanvas';
import { Inventory } from '@/components/ui/Inventory';
import { SceneSelector } from '@/components/ui/SceneSelector';
import { PlayerList } from '@/components/ui/PlayerList';
import { CatchModal } from '@/components/ui/CatchModal';
import { ShopModal } from '@/components/ui/ShopModal';
import { ToastContainer } from '@/components/ui/Toast';
import { SceneId } from '@/lib/types';
import { getPole } from '@/data/poles';

export default function Home() {
  const { connected, connecting, playerName, scene, money, poleLevel } = useGameStore();
  const { connect, sendMessage } = useWebSocket();
  const currentPole = getPole(poleLevel);

  // Handle keyboard input for movement
  useKeyboard({ sendMessage });

  const handleJoin = useCallback(
    (name: string, selectedScene: SceneId) => {
      connect(name, selectedScene);
    },
    [connect]
  );

  // Show login form if not connected
  if (!connected || !playerName) {
    return <LoginForm onJoin={handleJoin} isConnecting={connecting} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-4">
        <div className="flex justify-between items-center bg-gray-800 rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">🎣 Fishing Game</h1>
            <span className="text-gray-400">|</span>
            <span className="text-blue-400 font-medium">{playerName}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-purple-400 font-medium" title={currentPole.description}>
              {currentPole.emoji} {currentPole.name}
            </div>
            <span className="text-gray-600">|</span>
            <div className="text-yellow-400 font-bold text-lg">${money}</div>
            {scene && (
              <div className="text-gray-400">
                📍 {scene.name}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto">
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* Left sidebar */}
          <div className="lg:w-72 flex flex-col gap-4">
            <SceneSelector sendMessage={sendMessage} />
            <PlayerList />
          </div>

          {/* Game canvas */}
          <div className="flex-1 flex justify-center">
            <GameCanvas />
          </div>

          {/* Right sidebar - Inventory */}
          <div className="lg:w-72">
            <Inventory sendMessage={sendMessage} />
          </div>
        </div>
      </main>

      {/* Catch modal */}
      <CatchModal sendMessage={sendMessage} />

      {/* Shop modal */}
      <ShopModal sendMessage={sendMessage} />

      {/* Toast notifications */}
      <ToastContainer />

      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          60% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.3s ease-out;
        }
        @keyframes slide-in {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

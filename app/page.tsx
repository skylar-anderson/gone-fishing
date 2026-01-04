'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { useKeyboard } from '@/lib/hooks/useKeyboard';
import { useWalkingSound } from '@/lib/hooks/useWalkingSound';
import { useAuthRedirect } from '@/lib/hooks/useAuthRedirect';
import { GameRenderer } from '@/components/game/GameRenderer';
import { GameHeader } from '@/components/ui/GameHeader';
import { CatchModal } from '@/components/ui/CatchModal';
import { ShopModal } from '@/components/ui/ShopModal';
import { ToastContainer } from '@/components/ui/Toast';
import { Chat } from '@/components/ui/Chat';

export default function Home() {
  const router = useRouter();
  const { reset } = useGameStore();
  const { sendMessage, disconnect } = useWebSocket();
  const { isAuthenticated, isRestoring } = useAuthRedirect({ redirectUnauthenticated: true });

  useKeyboard({ sendMessage });
  useWalkingSound();

  const handleLogout = useCallback(async () => {
    // Delete session cookie first
    await fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
    disconnect();
    reset();
    router.replace('/login');
  }, [disconnect, reset, router]);

  // Show loading state while checking auth, restoring session, or redirecting
  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="text-white">{isRestoring ? 'Restoring session...' : 'Loading...'}</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col overflow-hidden">
      <GameHeader sendMessage={sendMessage} onLogout={handleLogout} />

      <main className="flex-1 relative overflow-hidden p-4">
        <GameRenderer />
        <Chat sendMessage={sendMessage} />
      </main>

      <CatchModal sendMessage={sendMessage} />
      <ShopModal sendMessage={sendMessage} />
      <ToastContainer />

      <style jsx global>{`
        @keyframes bounce-in {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in { animation: bounce-in 0.3s ease-out; }

        @keyframes slide-in {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.2s ease-out; }

        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(-8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.15s ease-out; }
      `}</style>
    </div>
  );
}

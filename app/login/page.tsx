'use client';

import { useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { useAuthRedirect } from '@/lib/hooks/useAuthRedirect';
import { LoginForm } from '@/components/ui/LoginForm';

export default function LoginPage() {
  const { connecting, authError } = useGameStore();
  const { connect } = useWebSocket();
  const { isAuthenticated } = useAuthRedirect({ redirectAuthenticated: true });

  const handleLogin = useCallback(
    (name: string, password: string) => {
      // For login, use player's last scene (server will restore it)
      // We pass 'pond' as default but server overrides with saved scene
      connect(name, 'pond', password, false);
    },
    [connect]
  );

  // Show loading state while redirecting
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="text-white">Redirecting to game...</div>
      </div>
    );
  }

  return (
    <LoginForm
      onSubmit={handleLogin}
      isConnecting={connecting}
      authError={authError}
      mode="login"
    />
  );
}

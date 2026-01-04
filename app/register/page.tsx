'use client';

import { useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useWebSocket } from '@/lib/hooks/useWebSocket';
import { useAuthRedirect } from '@/lib/hooks/useAuthRedirect';
import { LoginForm } from '@/components/ui/LoginForm';

export default function RegisterPage() {
  const { connecting, authError } = useGameStore();
  const { connect } = useWebSocket();
  const { isAuthenticated } = useAuthRedirect({ redirectAuthenticated: true });

  const handleRegister = useCallback(
    (name: string, password: string) => {
      // New accounts start in 'pond' scene
      connect(name, 'pond', password, true);
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
      onSubmit={handleRegister}
      isConnecting={connecting}
      authError={authError}
      mode="register"
    />
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SceneId } from '@/lib/types';
import { useButtonSound } from '@/lib/hooks/useButtonSound';
import { useSound } from '@/lib/hooks/useSound';

interface LoginFormProps {
  onSubmit: (name: string, password: string) => void;
  isConnecting: boolean;
  authError?: string | null;
  mode: 'login' | 'register';
}

export function LoginForm({ onSubmit, isConnecting, authError, mode }: LoginFormProps) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const { play: playButtonSound } = useSound('/sounds/button.wav');

  // Display either server auth error or local validation error
  const displayError = authError || localError;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setLocalError('Name must be at least 2 characters');
      return;
    }
    if (trimmedName.length > 16) {
      setLocalError('Name must be 16 characters or less');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedName)) {
      setLocalError('Name can only contain letters, numbers, and underscores');
      return;
    }
    if (password.length < 4) {
      setLocalError('Password must be at least 4 characters');
      return;
    }

    playButtonSound();
    onSubmit(trimmedName, password);
  };

  const isLogin = mode === 'login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="bg-gray-800 border-gray-900 border p-8 rounded-xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Welcome to Gone Fishing!
          </h1>
          <p className="text-gray-400">
            {isLogin ? 'Login to continue your adventure!' : 'Create an account to start fishing!'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your username..."
              disabled={isConnecting}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password..."
              disabled={isConnecting}
            />
          </div>

          {displayError && (
            <p className="text-sm text-red-400 bg-red-400/10 p-3 rounded-lg">
              {displayError}
            </p>
          )}

          <button
            type="submit"
            disabled={isConnecting || name.trim().length < 2 || password.length < 4}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
          >
            {isConnecting ? (isLogin ? 'Logging in...' : 'Creating account...') : isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href={isLogin ? '/register' : '/login'}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            {isLogin ? "Don't have an account? Create one" : 'Already have an account? Login'}
          </Link>
        </div>
      </div>
    </div>
  );
}

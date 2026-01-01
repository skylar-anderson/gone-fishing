'use client';

import { useState, useEffect } from 'react';
import { SceneId } from '@/lib/types';
import { useScenes, getDefaultSceneId } from '@/lib/hooks/useScenes';
import { useButtonSound } from '@/lib/hooks/useButtonSound';
import { useSound } from '@/lib/hooks/useSound';

interface LoginFormProps {
  onJoin: (name: string, scene: SceneId) => void;
  isConnecting: boolean;
}

export function LoginForm({ onJoin, isConnecting }: LoginFormProps) {
  const { scenes, loading: scenesLoading } = useScenes();
  const [name, setName] = useState('');
  const [selectedScene, setSelectedScene] = useState<SceneId>('');
  const [error, setError] = useState('');
  const withSound = useButtonSound();
  const { play: playButtonSound } = useSound('/sounds/button.wav');

  // Set default scene once scenes are loaded
  useEffect(() => {
    if (scenes.length > 0 && !selectedScene) {
      setSelectedScene(getDefaultSceneId(scenes));
    }
  }, [scenes, selectedScene]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    if (trimmedName.length > 16) {
      setError('Name must be 16 characters or less');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedName)) {
      setError('Name can only contain letters, numbers, and underscores');
      return;
    }

    setError('');
    playButtonSound();
    onJoin(trimmedName, selectedScene);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎣 Fishing Game</h1>
          <p className="text-gray-400">Enter your name to start fishing!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your name..."
              disabled={isConnecting}
              autoFocus
            />
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Choose Starting Location
            </label>
            {scenesLoading ? (
              <div className="text-gray-400 text-center py-4">Loading scenes...</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {scenes.map((scene) => (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={withSound(() => setSelectedScene(scene.id))}
                    disabled={isConnecting}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      selectedScene === scene.id
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{scene.emoji}</span>
                    <span className="text-sm font-medium">{scene.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isConnecting || !name.trim()}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
          >
            {isConnecting ? 'Connecting...' : 'Start Fishing!'}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>Your inventory is saved automatically.</p>
          <p>Use the same name to continue where you left off!</p>
        </div>
      </div>
    </div>
  );
}

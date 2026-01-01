'use client';

import { SceneId, ClientMessage } from '@/lib/types';
import { useGameStore } from '@/store/gameStore';
import { useScenes } from '@/lib/hooks/useScenes';
import { useButtonSound } from '@/lib/hooks/useButtonSound';

interface SceneSelectorProps {
  sendMessage: (message: ClientMessage) => void;
}

export function SceneSelector({ sendMessage }: SceneSelectorProps) {
  const { currentScene } = useGameStore();
  const { scenes, loading } = useScenes();
  const withSound = useButtonSound();

  const handleSceneChange = (sceneId: SceneId) => {
    if (sceneId === currentScene) return;
    sendMessage({ type: 'CHANGE_SCENE', payload: { scene: sceneId } });
  };

  if (loading) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
        <h2 className="text-white text-lg font-bold mb-3">Locations</h2>
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-white text-lg font-bold mb-3">Locations</h2>
      <div className="space-y-2">
        {scenes.map((scene) => (
          <button
            key={scene.id}
            onClick={withSound(() => handleSceneChange(scene.id))}
            disabled={scene.id === currentScene}
            className={`w-full text-left p-3 rounded transition-colors ${
              scene.id === currentScene
                ? 'bg-blue-600 text-white cursor-default'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{scene.emoji}</span>
              <div>
                <div className="font-medium">{scene.name}</div>
                <div className="text-xs opacity-70">{scene.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

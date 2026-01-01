'use client';

import { SceneId, ClientMessage } from '@/lib/types';
import { useGameStore } from '@/store/gameStore';

interface SceneSelectorProps {
  sendMessage: (message: ClientMessage) => void;
}

interface SceneInfo {
  id: SceneId;
  name: string;
  emoji: string;
  description: string;
}

const SCENES: SceneInfo[] = [
  {
    id: 'pond',
    name: 'Peaceful Pond',
    emoji: '🏞️',
    description: 'A quiet pond surrounded by grass',
  },
  {
    id: 'swamp',
    name: 'Murky Swamp',
    emoji: '🌿',
    description: 'A dark, foggy swamp',
  },
  {
    id: 'river',
    name: 'Rushing River',
    emoji: '🏔️',
    description: 'A fast-flowing mountain river',
  },
  {
    id: 'ocean',
    name: 'Ocean Beach',
    emoji: '🏖️',
    description: 'A sandy beach by the sea',
  },
];

export function SceneSelector({ sendMessage }: SceneSelectorProps) {
  const { currentScene } = useGameStore();

  const handleSceneChange = (sceneId: SceneId) => {
    if (sceneId === currentScene) return;
    sendMessage({ type: 'CHANGE_SCENE', payload: { scene: sceneId } });
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <h2 className="text-white text-lg font-bold mb-3">Locations</h2>
      <div className="space-y-2">
        {SCENES.map((scene) => (
          <button
            key={scene.id}
            onClick={() => handleSceneChange(scene.id)}
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

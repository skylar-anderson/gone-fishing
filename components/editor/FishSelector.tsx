'use client';

import type { Fish, SceneId } from '@/lib/types';

interface FishSelectorProps {
  selectedFishId: string;
  onSelect: (fishId: string) => void;
  fishByScene: Record<SceneId, Fish[]>;
  hasSprite: (fishId: string) => boolean;
}

const SCENE_NAMES: Record<string, string> = {
  pond: 'Pond',
  river: 'River',
  swamp: 'Swamp',
  ocean: 'Ocean',
};

const SCENE_ORDER = ['pond', 'river', 'swamp', 'ocean'];

export function FishSelector({ selectedFishId, onSelect, fishByScene, hasSprite }: FishSelectorProps) {
  // Sort scenes in a consistent order
  const sortedScenes = Object.keys(fishByScene).sort((a, b) => {
    const aIndex = SCENE_ORDER.indexOf(a);
    const bIndex = SCENE_ORDER.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">Select Fish</h3>
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {sortedScenes.map((sceneId) => {
          const fish = fishByScene[sceneId];
          if (!fish || fish.length === 0) return null;

          return (
            <div key={sceneId}>
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                {SCENE_NAMES[sceneId] || sceneId}
              </h4>
              <div className="grid grid-cols-2 gap-1">
                {fish.map((f) => {
                  const hasSpriteData = hasSprite(f.id);
                  return (
                    <button
                      key={f.id}
                      onClick={() => onSelect(f.id)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-all ${
                        selectedFishId === f.id
                          ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                      }`}
                      title={f.name}
                    >
                      <span className="text-base flex-shrink-0">{f.emoji}</span>
                      <span className="truncate flex-1 text-xs">{f.name}</span>
                      {hasSpriteData && (
                        <span
                          className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"
                          title="Has custom sprite"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

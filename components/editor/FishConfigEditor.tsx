'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Fish, SceneId } from '@/lib/types';

type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

const RARITIES: { value: Rarity; label: string; color: string }[] = [
  { value: 'common', label: 'Common', color: 'bg-gray-500' },
  { value: 'uncommon', label: 'Uncommon', color: 'bg-green-500' },
  { value: 'rare', label: 'Rare', color: 'bg-blue-500' },
  { value: 'epic', label: 'Epic', color: 'bg-purple-500' },
  { value: 'legendary', label: 'Legendary', color: 'bg-yellow-500' },
];

interface SceneMetadata {
  id: SceneId;
  name: string;
  emoji: string;
}

function FishCard({
  fish,
  onChange,
  onDelete,
}: {
  fish: Fish;
  onChange: (fish: Fish) => void;
  onDelete: () => void;
}) {
  const rarityConfig = RARITIES.find((r) => r.value === fish.rarity) || RARITIES[0];

  return (
    <div className="bg-gray-700 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{fish.emoji}</span>
          <div>
            <input
              type="text"
              value={fish.name}
              onChange={(e) => onChange({ ...fish, name: e.target.value })}
              className="bg-gray-600 rounded px-2 py-1 text-sm font-semibold w-40"
              placeholder="Fish Name"
            />
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded ${rarityConfig.color}`}>
                {rarityConfig.label}
              </span>
              <span className="text-xs text-gray-400">ID: {fish.id}</span>
            </div>
          </div>
        </div>
        <button
          onClick={onDelete}
          className="text-red-400 hover:text-red-300 text-sm px-2 py-1"
          title="Delete fish"
        >
          Delete
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">ID (unique)</label>
          <input
            type="text"
            value={fish.id}
            onChange={(e) => onChange({ ...fish, id: e.target.value })}
            className="w-full bg-gray-600 rounded px-2 py-1 text-sm"
            placeholder="fish_id"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Emoji</label>
          <input
            type="text"
            value={fish.emoji}
            onChange={(e) => onChange({ ...fish, emoji: e.target.value })}
            className="w-full bg-gray-600 rounded px-2 py-1 text-sm text-center"
            maxLength={4}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Rarity</label>
          <select
            value={fish.rarity}
            onChange={(e) => onChange({ ...fish, rarity: e.target.value as Rarity })}
            className="w-full bg-gray-600 rounded px-2 py-1 text-sm"
          >
            {RARITIES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Value (gold)</label>
          <input
            type="number"
            value={fish.value}
            onChange={(e) => onChange({ ...fish, value: parseInt(e.target.value) || 0 })}
            className="w-full bg-gray-600 rounded px-2 py-1 text-sm"
            min={0}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-gray-400 mb-1">Catch Chance (%)</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              value={fish.catchChance}
              onChange={(e) => onChange({ ...fish, catchChance: parseFloat(e.target.value) })}
              className="flex-1"
              min={0}
              max={100}
              step={0.1}
            />
            <input
              type="number"
              value={fish.catchChance}
              onChange={(e) => onChange({ ...fish, catchChance: parseFloat(e.target.value) || 0 })}
              className="w-20 bg-gray-600 rounded px-2 py-1 text-sm text-center"
              min={0}
              max={100}
              step={0.1}
            />
          </div>
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-gray-400 mb-1">Description</label>
          <textarea
            value={fish.description}
            onChange={(e) => onChange({ ...fish, description: e.target.value })}
            className="w-full bg-gray-600 rounded px-2 py-1 text-sm h-16 resize-none"
            placeholder="A description of the fish..."
          />
        </div>
      </div>
    </div>
  );
}

export function FishConfigEditor() {
  const [scenes, setScenes] = useState<SceneMetadata[]>([]);
  const [selectedScene, setSelectedScene] = useState<SceneId | null>(null);
  const [fish, setFish] = useState<Fish[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Load scenes list
  useEffect(() => {
    fetch('/api/scenes')
      .then((res) => res.json())
      .then((data: SceneMetadata[]) => {
        setScenes(data);
        if (data.length > 0 && !selectedScene) {
          setSelectedScene(data[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load scenes:', err);
        setLoading(false);
      });
  }, [selectedScene]);

  // Load fish for selected scene
  useEffect(() => {
    if (!selectedScene) return;

    setLoading(true);
    fetch(`/api/fish?scene=${selectedScene}`)
      .then((res) => res.json())
      .then((data: { scene: SceneId; fish: Fish[] }) => {
        setFish(data.fish || []);
        setIsDirty(false);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load fish:', err);
        setFish([]);
        setLoading(false);
      });
  }, [selectedScene]);

  const handleFishChange = useCallback((index: number, updatedFish: Fish) => {
    setFish((prev) => {
      const newFish = [...prev];
      newFish[index] = updatedFish;
      return newFish;
    });
    setIsDirty(true);
  }, []);

  const handleDeleteFish = useCallback((index: number) => {
    setFish((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  }, []);

  const handleAddFish = useCallback(() => {
    const newFish: Fish = {
      id: `new_fish_${Date.now()}`,
      name: 'New Fish',
      rarity: 'common',
      catchChance: 10,
      value: 10,
      emoji: '🐟',
      description: 'A new fish.',
    };
    setFish((prev) => [...prev, newFish]);
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedScene) return;

    try {
      setSaving(true);
      setSaveStatus(null);

      const response = await fetch('/api/fish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene: selectedScene, fish }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      setSaveStatus('Saved!');
      setIsDirty(false);
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      setSaveStatus('Failed to save');
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [selectedScene, fish]);

  // Calculate total catch chance
  const totalCatchChance = fish.reduce((sum, f) => sum + f.catchChance, 0);

  if (loading && scenes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 bg-gray-800 rounded-lg p-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Scene:</label>
            <select
              value={selectedScene || ''}
              onChange={(e) => setSelectedScene(e.target.value as SceneId)}
              className="bg-gray-700 rounded px-3 py-1.5 text-sm"
            >
              {scenes.map((scene) => (
                <option key={scene.id} value={scene.id}>
                  {scene.emoji} {scene.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddFish}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm font-medium"
          >
            + Add Fish
          </button>
        </div>
        <div className="flex items-center gap-4">
          {isDirty && (
            <span className="text-yellow-400 text-sm flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              Unsaved changes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              saving
                ? 'bg-gray-600 text-gray-400 cursor-wait'
                : saveStatus === 'Saved!'
                ? 'bg-green-600 text-white'
                : saveStatus === 'Failed to save'
                ? 'bg-red-600 text-white'
                : isDirty
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? 'Saving...' : saveStatus || 'Save to Server'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-sm text-gray-400">Fish Count:</span>
              <span className="ml-2 font-semibold">{fish.length}</span>
            </div>
            <div>
              <span className="text-sm text-gray-400">Total Catch Chance:</span>
              <span className={`ml-2 font-semibold ${totalCatchChance > 100 ? 'text-red-400' : totalCatchChance < 100 ? 'text-yellow-400' : 'text-green-400'}`}>
                {totalCatchChance.toFixed(1)}%
              </span>
              {totalCatchChance !== 100 && (
                <span className="ml-2 text-xs text-gray-500">
                  (should be ~100%)
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {RARITIES.map((r) => {
              const count = fish.filter((f) => f.rarity === r.value).length;
              return count > 0 ? (
                <span key={r.value} className={`px-2 py-0.5 rounded ${r.color}`}>
                  {count} {r.label}
                </span>
              ) : null;
            })}
          </div>
        </div>
      </div>

      {/* Fish List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-400">Loading fish...</div>
        </div>
      ) : fish.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <p className="text-gray-400 mb-4">No fish configured for this scene.</p>
          <button
            onClick={handleAddFish}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium"
          >
            Add First Fish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {fish.map((f, index) => (
            <FishCard
              key={f.id + '-' + index}
              fish={f}
              onChange={(updated) => handleFishChange(index, updated)}
              onDelete={() => handleDeleteFish(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

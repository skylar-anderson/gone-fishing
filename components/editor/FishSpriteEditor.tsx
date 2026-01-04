'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useFishSpriteStore } from '@/store/fishSpriteStore';
import { PixelCanvas } from './PixelCanvas';
import { ColorPicker } from './ColorPicker';
import { FishSelector } from './FishSelector';
import { FishSpritePreview } from './FishSpritePreview';
import type { Fish, SceneId } from '@/lib/types';
import type { FishSpriteExport } from '@/lib/types/fishSprites';

function SaveStatus({ isDirty, lastSavedAt }: { isDirty: boolean; lastSavedAt: number | null }) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isDirty) {
    return (
      <span className="text-yellow-400 text-sm flex items-center gap-1">
        <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
        Unsaved changes
      </span>
    );
  }

  if (lastSavedAt) {
    return (
      <span className="text-green-400 text-sm flex items-center gap-1">
        <span className="w-2 h-2 bg-green-400 rounded-full" />
        Saved to browser at {formatTime(lastSavedAt)}
      </span>
    );
  }

  return (
    <span className="text-gray-400 text-sm flex items-center gap-1">
      <span className="w-2 h-2 bg-gray-400 rounded-full" />
      Auto-saving to browser
    </span>
  );
}

function UndoRedoButtons({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}) {
  return (
    <div className="flex gap-1">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          canUndo
            ? 'bg-gray-600 hover:bg-gray-500 text-white'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
        title="Undo (Ctrl+Z)"
      >
        Undo
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
          canRedo
            ? 'bg-gray-600 hover:bg-gray-500 text-white'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
        title="Redo (Ctrl+Shift+Z)"
      >
        Redo
      </button>
    </div>
  );
}

export function FishSpriteEditor() {
  const {
    selectedFishId,
    currentColor,
    isDrawing,
    brushSize,
    sprites,
    recentColors,
    showGrid,
    isDirty,
    lastSavedAt,
    setSelectedFishId,
    setCurrentColor,
    setBrushSize,
    setPixel,
    setDrawing,
    fillAll,
    clearSprite,
    loadSprites,
    addRecentColor,
    setShowGrid,
    getCurrentSprite,
    hasSprite,
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    markSaved,
  } = useFishSpriteStore();

  const [fishByScene, setFishByScene] = useState<Record<SceneId, Fish[]>>({});
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadedFromServer, setLoadedFromServer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Track when drawing starts to push history once per stroke
  const strokeStartedRef = useRef(false);

  // Load fish data from API
  useEffect(() => {
    fetch('/api/fish')
      .then((res) => res.json())
      .then((data) => {
        setFishByScene(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load fish data:', err);
        setLoading(false);
      });
  }, []);

  // Load sprites from server on mount (if not already in localStorage)
  useEffect(() => {
    if (loadedFromServer) return;

    const stored = localStorage.getItem('fish-sprite-editor-storage');
    if (stored) {
      setLoadedFromServer(true);
      return;
    }

    fetch('/api/fish-sprites')
      .then((res) => res.json())
      .then((data: FishSpriteExport) => {
        if (data.version === 1 && data.sprites) {
          loadSprites(data.sprites);
        }
        setLoadedFromServer(true);
      })
      .catch((err) => {
        console.warn('Failed to load fish sprites from server:', err);
        setLoadedFromServer(true);
      });
  }, [loadedFromServer, loadSprites]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          if (canRedo()) redo();
        } else {
          if (canUndo()) undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  // Mark as saved periodically when dirty
  useEffect(() => {
    if (isDirty) {
      const timer = setTimeout(() => {
        markSaved();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isDirty, sprites, markSaved]);

  const currentSprite = getCurrentSprite();

  // Find the current fish object
  const currentFish = Object.values(fishByScene)
    .flat()
    .find((f) => f.id === selectedFishId);

  const handlePixelChange = useCallback(
    (x: number, y: number) => {
      setPixel(x, y, currentColor);
      if (currentColor !== 'transparent') {
        addRecentColor(currentColor);
      }
    },
    [currentColor, setPixel, addRecentColor]
  );

  const handleColorChange = useCallback(
    (color: string) => {
      setCurrentColor(color);
    },
    [setCurrentColor]
  );

  const handleMouseDown = useCallback(() => {
    if (!strokeStartedRef.current) {
      pushHistory();
      strokeStartedRef.current = true;
    }
    setDrawing(true);
  }, [pushHistory, setDrawing]);

  const handleMouseUp = useCallback(() => {
    setDrawing(false);
    strokeStartedRef.current = false;
  }, [setDrawing]);

  const handleExport = useCallback(() => {
    const exportData: FishSpriteExport = {
      version: 1,
      exportedAt: new Date().toISOString(),
      sprites,
    };

    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [sprites]);

  const handleImport = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const data = JSON.parse(text) as FishSpriteExport;
      if (data.version === 1 && data.sprites) {
        loadSprites(data.sprites);
      }
    } catch {
      alert('Failed to import sprites. Make sure you have valid JSON in your clipboard.');
    }
  }, [loadSprites]);

  const handleSaveToServer = useCallback(async () => {
    try {
      setSaving(true);
      setSaveStatus(null);

      const exportData: FishSpriteExport = {
        version: 1,
        exportedAt: new Date().toISOString(),
        sprites,
      };

      const response = await fetch('/api/fish-sprites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      setSaveStatus('Saved!');
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (err) {
      setSaveStatus('Failed to save');
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [sprites]);

  const handleSetEraser = useCallback(() => {
    setCurrentColor('transparent');
  }, [setCurrentColor]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading fish data...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 bg-gray-800 rounded-lg p-3">
        <div className="flex items-center gap-4">
          <UndoRedoButtons
            canUndo={canUndo()}
            canRedo={canRedo()}
            onUndo={undo}
            onRedo={redo}
          />
        </div>
        <SaveStatus isDirty={isDirty} lastSavedAt={lastSavedAt} />
      </div>

      <div className="flex gap-6">
        {/* Left Panel - Fish Selection & Color */}
        <div className="w-64 space-y-4">
          <FishSelector
            selectedFishId={selectedFishId}
            onSelect={setSelectedFishId}
            fishByScene={fishByScene}
            hasSprite={hasSprite}
          />

          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Color</h3>
            <ColorPicker color={currentColor === 'transparent' ? '#000000' : currentColor} onChange={handleColorChange} />

            {/* Eraser button */}
            <button
              onClick={handleSetEraser}
              className={`w-full mt-3 px-4 py-2 rounded text-sm font-medium transition-colors ${
                currentColor === 'transparent'
                  ? 'bg-pink-600 text-white ring-2 ring-pink-400'
                  : 'bg-gray-600 hover:bg-gray-500 text-white'
              }`}
            >
              Eraser (Transparent)
            </button>
          </div>

          {/* Brush Size */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Brush Size</h3>
            <div className="grid grid-cols-4 gap-1">
              {([1, 2, 3, 4] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setBrushSize(size)}
                  className={`flex flex-col items-center justify-center p-2 rounded text-xs font-medium transition-colors ${
                    brushSize === size
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  }`}
                  title={`${size}x${size} (${size * size} pixels)`}
                >
                  <div
                    className="mb-1 bg-current"
                    style={{
                      width: `${size * 4}px`,
                      height: `${size * 4}px`,
                    }}
                  />
                  <span>{size}x{size}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Colors */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Recent Colors</h3>
            <div className="flex flex-wrap gap-1">
              {recentColors.map((color, i) => (
                <button
                  key={`${color}-${i}`}
                  onClick={() => setCurrentColor(color)}
                  className={`w-6 h-6 rounded border transition-all ${
                    color === currentColor
                      ? 'border-white ring-1 ring-white'
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Center Panel - Canvas */}
        <div className="flex-1">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="text-2xl">{currentFish?.emoji || '?'}</span>
                <span>{currentFish?.name || 'Select a fish'}</span>
              </h3>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-400">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="rounded"
                  />
                  Show Grid
                </label>
              </div>
            </div>

            {/* Canvas with checkerboard background */}
            <div
              className="inline-block rounded border border-gray-600"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, #374151 25%, transparent 25%),
                  linear-gradient(-45deg, #374151 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #374151 75%),
                  linear-gradient(-45deg, transparent 75%, #374151 75%)
                `,
                backgroundSize: '12px 12px',
                backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
                backgroundColor: '#1f2937',
              }}
            >
              <PixelCanvas
                pixels={currentSprite.pixels}
                onPixelChange={handlePixelChange}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                isDrawing={isDrawing}
                pixelSize={6}
                showGrid={showGrid}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => fillAll(currentColor)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
              >
                Fill All
              </button>
              <button
                onClick={clearSprite}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Preview & Export */}
        <div className="w-48 space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <FishSpritePreview
              sprite={currentSprite}
              emoji={currentFish?.emoji || '?'}
              fishName={currentFish?.name || 'Unknown'}
            />
          </div>

          <div className="bg-gray-800 rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Save</h3>
            <button
              onClick={handleSaveToServer}
              disabled={saving}
              className={`w-full px-4 py-2 rounded text-sm font-medium transition-colors ${
                saveStatus === 'Saved!'
                  ? 'bg-green-600 text-white'
                  : saveStatus === 'Failed to save'
                  ? 'bg-red-600 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {saving ? 'Saving...' : saveStatus || 'Save to Server'}
            </button>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Export / Import</h3>
            <button
              onClick={handleExport}
              className={`w-full px-4 py-2 rounded text-sm font-medium transition-colors ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {copied ? 'Copied!' : 'Copy JSON'}
            </button>
            <button
              onClick={handleImport}
              className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm font-medium"
            >
              Paste JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

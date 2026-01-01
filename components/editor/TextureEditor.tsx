'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import { useTextureStore } from '@/store/textureStore';
import { PixelCanvas } from './PixelCanvas';
import { ColorPicker } from './ColorPicker';
import { TileTypeSelector } from './TileTypeSelector';
import { TexturePreview } from './TexturePreview';
import type { TextureExport } from '@/lib/types/textures';

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

export function TextureEditor() {
  const {
    selectedTileType,
    currentColor,
    isDrawing,
    textures,
    recentColors,
    showGrid,
    isDirty,
    lastSavedAt,
    setSelectedTileType,
    setCurrentColor,
    setPixel,
    setDrawing,
    fillAll,
    clearTexture,
    resetToDefault,
    loadTextures,
    addRecentColor,
    setShowGrid,
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    markSaved,
  } = useTextureStore();

  const [copied, setCopied] = useState(false);
  const [loadedFromServer, setLoadedFromServer] = useState(false);

  // Track when drawing starts to push history once per stroke
  const strokeStartedRef = useRef(false);

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
  }, [isDirty, textures, markSaved]);

  // Load textures from server on mount (if not already loaded from localStorage)
  useEffect(() => {
    if (loadedFromServer) return;

    // Only load from server if localStorage doesn't have data
    const stored = localStorage.getItem('texture-editor-storage');
    if (stored) {
      setLoadedFromServer(true);
      return;
    }

    fetch('/api/textures')
      .then(res => res.json())
      .then((data: TextureExport) => {
        if (data.version === 1 && data.tileTextures) {
          loadTextures(data.tileTextures);
        }
        setLoadedFromServer(true);
      })
      .catch(err => {
        console.warn('Failed to load textures from server:', err);
        setLoadedFromServer(true);
      });
  }, [loadedFromServer, loadTextures]);

  const currentTexture = textures[selectedTileType];

  const handlePixelChange = useCallback(
    (x: number, y: number) => {
      setPixel(x, y, currentColor);
      addRecentColor(currentColor);
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
    const exportData: TextureExport = {
      version: 1,
      exportedAt: new Date().toISOString(),
      tileTextures: textures,
    };

    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [textures]);

  const handleImport = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const data = JSON.parse(text) as TextureExport;
      if (data.version === 1 && data.tileTextures) {
        loadTextures(data.tileTextures);
      }
    } catch {
      alert('Failed to import textures. Make sure you have valid JSON in your clipboard.');
    }
  }, [loadTextures]);

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
      {/* Left Panel - Tile Selection & Color */}
      <div className="w-64 space-y-6">
        <TileTypeSelector
          selectedType={selectedTileType}
          onSelect={setSelectedTileType}
          textures={textures}
        />

        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Color</h3>
          <ColorPicker color={currentColor} onChange={handleColorChange} />
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
            <h3 className="text-lg font-semibold">
              Editing: {currentTexture.name}
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

          <PixelCanvas
            pixels={currentTexture.pixels}
            onPixelChange={handlePixelChange}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            isDrawing={isDrawing}
            pixelSize={24}
            showGrid={showGrid}
          />

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => fillAll(currentColor)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
            >
              Fill All
            </button>
            <button
              onClick={clearTexture}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm font-medium"
            >
              Clear
            </button>
            <button
              onClick={resetToDefault}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm font-medium"
            >
              Reset All
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Preview & Export */}
      <div className="w-48 space-y-6">
        <div className="bg-gray-800 rounded-lg p-4">
          <TexturePreview texture={currentTexture} />
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

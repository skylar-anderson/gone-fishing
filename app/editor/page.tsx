'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { EditorTabs, type EditorTab } from '@/components/editor/EditorTabs';
import { useSceneStore, TILE_CONFIGS } from '@/store/sceneStore';
import { useTextureStore } from '@/store/textureStore';
import { renderAllPatterns, getPatternFill } from '@/lib/textures/patterns';
import type { TileType } from '@/lib/types';

// Dynamic import with SSR disabled to avoid hydration mismatch from localStorage
const TextureEditor = dynamic(
  () => import('@/components/editor/TextureEditor').then(mod => ({ default: mod.TextureEditor })),
  { ssr: false, loading: () => <EditorLoading /> }
);

function EditorLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-gray-400">Loading editor...</div>
    </div>
  );
}

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

function SceneEditor() {
  const [mounted, setMounted] = useState(false);

  const {
    sceneName,
    sceneId,
    sceneDescription,
    sceneEmoji,
    width,
    height,
    spawnX,
    spawnY,
    selectedTile,
    grid,
    isDrawing,
    isDirty,
    lastSavedAt,
    setSceneName,
    setSceneId,
    setSceneDescription,
    setSceneEmoji,
    setSpawnX,
    setSpawnY,
    setSelectedTile,
    setCell,
    setIsDrawing,
    resizeGrid,
    fillAll,
    clearAll,
    loadFromJSON,
    generateJSON,
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    markSaved,
  } = useSceneStore();

  const [copied, setCopied] = useState(false);
  const [pasted, setPasted] = useState(false);
  const [pasteError, setPasteError] = useState('');

  // Track when drawing starts to push history once per stroke
  const [strokeStarted, setStrokeStarted] = useState(false);

  // Hydration guard - only render after client mount
  useEffect(() => {
    setMounted(true);
  }, []);

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
  }, [isDirty, grid, sceneName, sceneId, markSaved]);

  const handleMouseDown = useCallback((row: number, col: number) => {
    if (!strokeStarted) {
      pushHistory();
      setStrokeStarted(true);
    }
    setIsDrawing(true);
    setCell(row, col);
  }, [strokeStarted, pushHistory, setIsDrawing, setCell]);

  const handleMouseEnter = useCallback((row: number, col: number) => {
    if (isDrawing) {
      setCell(row, col);
    }
  }, [isDrawing, setCell]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
    setStrokeStarted(false);
  }, [setIsDrawing]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(generateJSON());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generateJSON]);

  const pasteFromClipboard = useCallback(async () => {
    try {
      setPasteError('');
      const text = await navigator.clipboard.readText();
      const data = JSON.parse(text);

      if (!data.map?.data || !Array.isArray(data.map.data)) {
        throw new Error('Invalid scene JSON: missing map.data');
      }

      loadFromJSON(data);

      setPasted(true);
      setTimeout(() => setPasted(false), 2000);
    } catch (err) {
      setPasteError(err instanceof Error ? err.message : 'Failed to parse JSON');
      setTimeout(() => setPasteError(''), 3000);
    }
  }, [loadFromJSON]);

  // Get textures from the texture store
  const textures = useTextureStore((state) => state.textures);

  const getTileType = (char: string): TileType => {
    return TILE_CONFIGS.find(c => c.char === char)?.type ?? 'grass';
  };

  // Don't render until client-side hydration is complete
  if (!mounted) {
    return <EditorLoading />;
  }

  return (
    <div
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
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

      <div className="flex gap-8">
        {/* Left Panel - Controls */}
        <div className="w-72 space-y-6">
          {/* Scene Metadata */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <h2 className="text-lg font-semibold border-b border-gray-700 pb-2">Scene Info</h2>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Scene ID</label>
              <input
                type="text"
                value={sceneId}
                onChange={(e) => setSceneId(e.target.value)}
                className="w-full bg-gray-700 rounded px-3 py-2 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={sceneName}
                  onChange={(e) => setSceneName(e.target.value)}
                  className="w-full bg-gray-700 rounded px-3 py-2 text-sm"
                />
              </div>
              <div className="w-16">
                <label className="block text-sm text-gray-400 mb-1">Emoji</label>
                <input
                  type="text"
                  value={sceneEmoji}
                  onChange={(e) => setSceneEmoji(e.target.value)}
                  className="w-full bg-gray-700 rounded px-3 py-2 text-sm text-center"
                  maxLength={2}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Description</label>
              <textarea
                value={sceneDescription}
                onChange={(e) => setSceneDescription(e.target.value)}
                className="w-full bg-gray-700 rounded px-3 py-2 text-sm h-20 resize-none"
              />
            </div>
          </div>

          {/* Grid Size */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <h2 className="text-lg font-semibold border-b border-gray-700 pb-2">Grid Size</h2>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-1">Width</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => resizeGrid(parseInt(e.target.value) || 1, height)}
                  min={1}
                  max={128}
                  className="w-full bg-gray-700 rounded px-3 py-2 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-1">Height</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => resizeGrid(width, parseInt(e.target.value) || 1)}
                  min={1}
                  max={128}
                  className="w-full bg-gray-700 rounded px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Spawn Point */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <h2 className="text-lg font-semibold border-b border-gray-700 pb-2">Spawn Point</h2>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-1">X</label>
                <input
                  type="number"
                  value={spawnX}
                  onChange={(e) => setSpawnX(parseInt(e.target.value) || 0)}
                  min={0}
                  max={width - 1}
                  className="w-full bg-gray-700 rounded px-3 py-2 text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-1">Y</label>
                <input
                  type="number"
                  value={spawnY}
                  onChange={(e) => setSpawnY(parseInt(e.target.value) || 0)}
                  min={0}
                  max={height - 1}
                  className="w-full bg-gray-700 rounded px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Tile Palette */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <h2 className="text-lg font-semibold border-b border-gray-700 pb-2">Tile Palette</h2>

            <div className="grid grid-cols-3 gap-2">
              {TILE_CONFIGS.map((config) => {
                const texture = textures[config.type];
                const pixelSize = 32 / 16; // 32px button / 16px texture
                return (
                  <button
                    key={config.type}
                    onClick={() => setSelectedTile(config)}
                    className={`rounded text-xs font-medium transition-all overflow-hidden ${
                      selectedTile.type === config.type
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800'
                        : 'hover:opacity-80'
                    }`}
                  >
                    <svg width={64} height={40} className="w-full">
                      <defs>
                        <pattern
                          id={`palette-${config.type}`}
                          width={32}
                          height={32}
                          patternUnits="userSpaceOnUse"
                        >
                          {texture.pixels.map((row, y) =>
                            row.map((color, x) => (
                              <rect
                                key={`${x}-${y}`}
                                x={x * pixelSize}
                                y={y * pixelSize}
                                width={pixelSize}
                                height={pixelSize}
                                fill={color}
                              />
                            ))
                          )}
                        </pattern>
                      </defs>
                      <rect width={64} height={40} fill={`url(#palette-${config.type})`} />
                      <text x={32} y={16} textAnchor="middle" className="fill-white text-[10px] font-bold" style={{ textShadow: '0 0 3px black, 0 0 3px black' }}>
                        {config.char}
                      </text>
                      <text x={32} y={28} textAnchor="middle" className="fill-white/80 text-[8px]" style={{ textShadow: '0 0 2px black, 0 0 2px black' }}>
                        {config.label}
                      </text>
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <h2 className="text-lg font-semibold border-b border-gray-700 pb-2">Actions</h2>

            <div className="flex gap-2">
              <button
                onClick={fillAll}
                className="flex-1 bg-blue-600 hover:bg-blue-700 rounded px-3 py-2 text-sm font-medium"
              >
                Fill All
              </button>
              <button
                onClick={clearAll}
                className="flex-1 bg-red-600 hover:bg-red-700 rounded px-3 py-2 text-sm font-medium"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Grid & JSON */}
        <div className="flex-1 space-y-6">
          {/* Grid Canvas */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-semibold border-b border-gray-700 pb-2 mb-4">Canvas</h2>
            <p className="text-sm text-gray-400 mb-4">Click and drag to draw tiles. Spawn point is marked with a star.</p>

            <svg
              width={width * 12}
              height={height * 12}
              className="border border-gray-600 rounded select-none"
              style={{ cursor: 'crosshair' }}
            >
              {renderAllPatterns(textures, 12)}
              {grid.map((row, y) =>
                row.map((char, x) => (
                  <rect
                    key={`${x}-${y}`}
                    x={x * 12}
                    y={y * 12}
                    width={12}
                    height={12}
                    fill={getPatternFill(getTileType(char))}
                    onMouseDown={() => handleMouseDown(y, x)}
                    onMouseEnter={() => handleMouseEnter(y, x)}
                  />
                ))
              )}
              {/* Spawn point marker */}
              <text
                x={spawnX * 12 + 6}
                y={spawnY * 12 + 9}
                textAnchor="middle"
                className="fill-yellow-300 text-[10px] font-bold pointer-events-none"
                style={{ textShadow: '0 0 2px black' }}
              >
                *
              </text>
            </svg>
          </div>

          {/* JSON Output */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between border-b border-gray-700 pb-2 mb-4">
              <h2 className="text-lg font-semibold">JSON Output</h2>
              <div className="flex gap-2">
                <button
                  onClick={pasteFromClipboard}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    pasted
                      ? 'bg-green-600 text-white'
                      : pasteError
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-600 hover:bg-gray-500 text-white'
                  }`}
                >
                  {pasted ? 'Loaded!' : pasteError ? 'Error!' : 'Paste JSON'}
                </button>
                <button
                  onClick={copyToClipboard}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {copied ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>
            </div>
            {pasteError && (
              <div className="mb-4 text-red-400 text-sm">{pasteError}</div>
            )}

            <pre className="bg-gray-900 rounded p-4 text-sm overflow-auto max-h-96 text-green-400 font-mono">
              {generateJSON()}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditorPage() {
  const [activeTab, setActiveTab] = useState<EditorTab>('scene');

  // Get dirty state from both editors for beforeunload warning
  const sceneIsDirty = useSceneStore((state) => state.isDirty);
  const textureIsDirty = useTextureStore((state) => state.isDirty);

  // Warn before leaving if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (sceneIsDirty || textureIsDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [sceneIsDirty, textureIsDirty]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Editor</h1>
        <div className="text-sm text-gray-400">
          Changes are automatically saved to your browser
        </div>
      </div>

      <EditorTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'scene' ? <SceneEditor /> : <TextureEditor />}
    </div>
  );
}

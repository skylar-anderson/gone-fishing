'use client';

import { useState, useCallback, useRef } from 'react';
import type { TileType } from '@/lib/types';

interface TileConfig {
  type: TileType;
  walkable: boolean;
  fishable: boolean;
  color: string;
  label: string;
  char: string;
}

const TILE_CONFIGS: TileConfig[] = [
  { type: 'grass', walkable: true, fishable: false, color: '#4ade80', label: 'Grass', char: 'G' },
  { type: 'dirt', walkable: true, fishable: false, color: '#a16207', label: 'Dirt', char: 'D' },
  { type: 'sand', walkable: true, fishable: false, color: '#fde047', label: 'Sand', char: 'S' },
  { type: 'water', walkable: false, fishable: true, color: '#38bdf8', label: 'Water', char: 'W' },
  { type: 'deep_water', walkable: false, fishable: true, color: '#0369a1', label: 'Deep Water', char: 'X' },
  { type: 'dock', walkable: true, fishable: true, color: '#92400e', label: 'Dock', char: 'P' },
  { type: 'mud', walkable: true, fishable: false, color: '#78350f', label: 'Mud', char: 'M' },
  { type: 'rock', walkable: false, fishable: false, color: '#6b7280', label: 'Rock', char: 'R' },
  { type: 'shop', walkable: true, fishable: false, color: '#c084fc', label: 'Shop', char: 'H' },
];

const DEFAULT_WIDTH = 64;
const DEFAULT_HEIGHT = 48;
const TILE_SIZE = 8;

export default function SceneEditorPage() {
  const [sceneName, setSceneName] = useState('New Scene');
  const [sceneId, setSceneId] = useState('new_scene');
  const [sceneDescription, setSceneDescription] = useState('A new fishing location.');
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [spawnX, setSpawnX] = useState(20);
  const [spawnY, setSpawnY] = useState(32);
  const [selectedTile, setSelectedTile] = useState<TileConfig>(TILE_CONFIGS[0]);
  const [grid, setGrid] = useState<string[][]>(() =>
    Array(DEFAULT_HEIGHT).fill(null).map(() => Array(DEFAULT_WIDTH).fill('G'))
  );
  const [isDrawing, setIsDrawing] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCellClick = useCallback((row: number, col: number) => {
    setGrid(prev => {
      const newGrid = prev.map(r => [...r]);
      newGrid[row][col] = selectedTile.char;
      return newGrid;
    });
  }, [selectedTile]);

  const handleMouseDown = useCallback((row: number, col: number) => {
    setIsDrawing(true);
    handleCellClick(row, col);
  }, [handleCellClick]);

  const handleMouseEnter = useCallback((row: number, col: number) => {
    if (isDrawing) {
      handleCellClick(row, col);
    }
  }, [isDrawing, handleCellClick]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const resizeGrid = useCallback((newWidth: number, newHeight: number) => {
    setGrid(prev => {
      const newGrid: string[][] = [];
      for (let y = 0; y < newHeight; y++) {
        const row: string[] = [];
        for (let x = 0; x < newWidth; x++) {
          row.push(prev[y]?.[x] ?? 'G');
        }
        newGrid.push(row);
      }
      return newGrid;
    });
    setWidth(newWidth);
    setHeight(newHeight);
  }, []);

  const fillAll = useCallback(() => {
    setGrid(Array(height).fill(null).map(() => Array(width).fill(selectedTile.char)));
  }, [height, width, selectedTile]);

  const clearAll = useCallback(() => {
    setGrid(Array(height).fill(null).map(() => Array(width).fill('G')));
  }, [height, width]);

  const generateJSON = useCallback(() => {
    // Build legend from used tiles
    const usedChars = new Set<string>();
    grid.forEach(row => row.forEach(char => usedChars.add(char)));

    const legend: Record<string, { type: TileType; walkable: boolean; fishable: boolean }> = {};
    TILE_CONFIGS.forEach(config => {
      if (usedChars.has(config.char)) {
        legend[config.char] = {
          type: config.type,
          walkable: config.walkable,
          fishable: config.fishable,
        };
      }
    });

    const sceneData = {
      id: sceneId,
      name: sceneName,
      description: sceneDescription,
      spawnPoint: { x: spawnX, y: spawnY },
      map: {
        width,
        height,
        tileSize: TILE_SIZE,
        legend,
        data: grid.map(row => row.join('')),
      },
      exits: [],
    };

    return JSON.stringify(sceneData, null, 2);
  }, [grid, sceneId, sceneName, sceneDescription, spawnX, spawnY, width, height]);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(generateJSON());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generateJSON]);

  const getTileColor = (char: string): string => {
    return TILE_CONFIGS.find(c => c.char === char)?.color ?? '#888';
  };

  return (
    <div
      className="min-h-screen bg-gray-900 text-white p-6"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <h1 className="text-3xl font-bold mb-6">Scene Editor</h1>

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

            <div>
              <label className="block text-sm text-gray-400 mb-1">Name</label>
              <input
                type="text"
                value={sceneName}
                onChange={(e) => setSceneName(e.target.value)}
                className="w-full bg-gray-700 rounded px-3 py-2 text-sm"
              />
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
                  max={32}
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
                  max={32}
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
              {TILE_CONFIGS.map((config) => (
                <button
                  key={config.type}
                  onClick={() => setSelectedTile(config)}
                  className={`p-2 rounded text-xs font-medium transition-all ${
                    selectedTile.type === config.type
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800'
                      : 'hover:opacity-80'
                  }`}
                  style={{ backgroundColor: config.color }}
                >
                  <div className="text-black font-bold">{config.char}</div>
                  <div className="text-black/70 text-[10px]">{config.label}</div>
                </button>
              ))}
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

            <div
              className="inline-block border border-gray-600 rounded overflow-hidden select-none"
              style={{ cursor: 'crosshair' }}
            >
              {grid.map((row, y) => (
                <div key={y} className="flex">
                  {row.map((char, x) => (
                    <div
                      key={`${x}-${y}`}
                      onMouseDown={() => handleMouseDown(y, x)}
                      onMouseEnter={() => handleMouseEnter(y, x)}
                      className="w-3 h-3 flex items-center justify-center text-[6px] font-bold border-0 transition-colors"
                      style={{ backgroundColor: getTileColor(char) }}
                      title={`(${x}, ${y}) - ${TILE_CONFIGS.find(c => c.char === char)?.label ?? char}`}
                    >
                      {spawnX === x && spawnY === y && (
                        <span className="text-yellow-300 text-[8px] drop-shadow-lg">*</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* JSON Output */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between border-b border-gray-700 pb-2 mb-4">
              <h2 className="text-lg font-semibold">JSON Output</h2>
              <button
                onClick={copyToClipboard}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
            </div>

            <pre className="bg-gray-900 rounded p-4 text-sm overflow-auto max-h-96 text-green-400 font-mono">
              {generateJSON()}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

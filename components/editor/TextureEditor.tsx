'use client';

import { useCallback, useState, useEffect } from 'react';
import { useTextureStore } from '@/store/textureStore';
import { PixelCanvas } from './PixelCanvas';
import { ColorPicker } from './ColorPicker';
import { TileTypeSelector } from './TileTypeSelector';
import { TexturePreview } from './TexturePreview';
import type { TextureExport } from '@/lib/types/textures';

export function TextureEditor() {
  const {
    selectedTileType,
    currentColor,
    isDrawing,
    textures,
    recentColors,
    showGrid,
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
  } = useTextureStore();

  const [copied, setCopied] = useState(false);
  const [loadedFromServer, setLoadedFromServer] = useState(false);

  // Load textures from server on mount (if not already loaded)
  useEffect(() => {
    if (loadedFromServer) return;

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
            onMouseDown={() => setDrawing(true)}
            onMouseUp={() => setDrawing(false)}
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
  );
}

'use client';

import { useRef, useEffect, useCallback, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { usePngTextures, preloadPngTextures } from '@/lib/hooks/usePngTextures';
import { useTextures } from '@/lib/hooks/useTextures';
import type { TileType, Direction, Position } from '@/lib/types';

const DIRECTION_ARROWS: Record<Direction, string> = {
  up: '^',
  down: 'v',
  left: '<',
  right: '>',
};

interface PlayerRenderData {
  name: string;
  position: Position;
  direction: Direction;
  isLocal: boolean;
  isFishing: boolean;
}

export function CanvasGameRenderer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);

  // Game state
  const scene = useGameStore((state) => state.scene);
  const playerName = useGameStore((state) => state.playerName);
  const position = useGameStore((state) => state.position);
  const direction = useGameStore((state) => state.direction);
  const isFishing = useGameStore((state) => state.isFishing);
  const otherPlayers = useGameStore((state) => state.otherPlayers);

  // Get textures
  const { textures } = useTextures();
  const { images, loading: imagesLoading, isWasmReady } = usePngTextures(textures);

  // Get canvas dimensions
  const canvasWidth = scene ? scene.map.width * scene.map.tileSize : 512;
  const canvasHeight = scene ? scene.map.height * scene.map.tileSize : 384;

  // Collect all players to render
  const allPlayers = useMemo((): PlayerRenderData[] => {
    if (!playerName) return [];

    const players: PlayerRenderData[] = [];

    // Add other players
    otherPlayers.forEach((player) => {
      players.push({
        name: player.name,
        position: player.position,
        direction: player.direction,
        isLocal: false,
        isFishing: player.isFishing || false,
      });
    });

    // Add local player
    players.push({
      name: playerName,
      position,
      direction,
      isLocal: true,
      isFishing,
    });

    return players;
  }, [playerName, position, direction, isFishing, otherPlayers]);

  // Render a single player
  const renderPlayer = useCallback(
    (ctx: CanvasRenderingContext2D, player: PlayerRenderData, tileSize: number) => {
      const x = player.position.x * tileSize + tileSize / 2;
      const y = player.position.y * tileSize + tileSize / 2;
      const playerRadius = 10;

      // Player body circle
      ctx.beginPath();
      ctx.arc(x, y, playerRadius, 0, Math.PI * 2);
      ctx.fillStyle = player.isLocal ? '#3b82f6' : '#ef4444';
      ctx.fill();
      ctx.strokeStyle = player.isLocal ? '#1d4ed8' : '#b91c1c';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Direction indicator
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(DIRECTION_ARROWS[player.direction], x, y);

      // Player name with stroke
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000';
      ctx.strokeText(player.name, x, y - playerRadius - 4);
      ctx.fillStyle = 'white';
      ctx.fillText(player.name, x, y - playerRadius - 4);

      // Fishing indicator
      if (player.isFishing) {
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('🎣', x, y + playerRadius + 2);
      }
    },
    []
  );

  // Main render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !scene || !images) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { map } = scene;
    const tileSize = map.tileSize;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render tiles using PNG images
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const tile = map.tiles[y]?.[x];
        if (!tile) continue;

        const tileType = tile.type as TileType;
        const img = images[tileType];

        if (img) {
          // Draw the pre-rendered PNG tile
          ctx.drawImage(img, x * tileSize, y * tileSize, tileSize, tileSize);
        } else {
          // Fallback to a solid color if image not loaded
          ctx.fillStyle = '#333';
          ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
      }
    }

    // Render all players
    for (const player of allPlayers) {
      renderPlayer(ctx, player, tileSize);
    }
  }, [scene, images, allPlayers, renderPlayer]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      render();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [render]);

  // Loading state
  if (!scene || !playerName) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-800 rounded-lg">
        <p className="text-gray-400">Loading game...</p>
      </div>
    );
  }

  if (imagesLoading || !isWasmReady) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-800 rounded-lg">
        <p className="text-gray-400">
          {!isWasmReady ? 'Initializing graphics engine...' : 'Loading textures...'}
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="border-2 border-gray-700 rounded-lg shadow-lg"
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          imageRendering: 'pixelated', // Keep pixel art crisp
        }}
      />

      {/* Controls hint */}
      <div className="absolute bottom-2 left-2 text-xs text-gray-400 bg-black/50 px-2 py-1 rounded">
        Arrow keys to move | Space or F to fish
      </div>
    </div>
  );
}

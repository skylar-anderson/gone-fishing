'use client';

import { Position, Direction } from '@/lib/types';

interface PlayerProps {
  name: string;
  position: Position;
  direction: Direction;
  tileSize: number;
  isLocal: boolean;
  isFishing?: boolean;
}

const DIRECTION_ARROWS: Record<Direction, string> = {
  up: '^',
  down: 'v',
  left: '<',
  right: '>',
};

export function Player({
  name,
  position,
  direction,
  tileSize,
  isLocal,
  isFishing = false,
}: PlayerProps) {
  const x = position.x * tileSize + tileSize / 2;
  const y = position.y * tileSize + tileSize / 2;

  // Use a fixed player size regardless of tile size for visibility
  const playerRadius = 10;
  const fontSize = 12;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Player body circle */}
      <circle
        r={playerRadius}
        fill={isLocal ? '#3b82f6' : '#ef4444'}
        stroke={isLocal ? '#1d4ed8' : '#b91c1c'}
        strokeWidth={2}
      />

      {/* Direction indicator */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fill="white"
        fontWeight="bold"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {DIRECTION_ARROWS[direction]}
      </text>

      {/* Player name */}
      <text
        y={-playerRadius - 4}
        textAnchor="middle"
        fontSize={10}
        fill="white"
        stroke="#000"
        strokeWidth={2}
        paintOrder="stroke"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {name}
      </text>

      {/* Fishing indicator */}
      {isFishing && (
        <g>
          <text
            y={playerRadius + 12}
            textAnchor="middle"
            fontSize={16}
            style={{ pointerEvents: 'none' }}
          >
            🎣
          </text>
        </g>
      )}
    </g>
  );
}

'use client';

import { useCallback } from 'react';

interface PixelCanvasProps {
  pixels: string[][];
  onPixelChange: (x: number, y: number) => void;
  onMouseDown: () => void;
  onMouseUp: () => void;
  isDrawing: boolean;
  pixelSize?: number;
  showGrid?: boolean;
}

export function PixelCanvas({
  pixels,
  onPixelChange,
  onMouseDown,
  onMouseUp,
  isDrawing,
  pixelSize = 24,
  showGrid = true,
}: PixelCanvasProps) {
  const width = pixels[0]?.length || 16;
  const height = pixels.length || 16;
  const canvasWidth = width * pixelSize;
  const canvasHeight = height * pixelSize;

  const handleMouseDown = useCallback(
    (x: number, y: number) => {
      onMouseDown();
      onPixelChange(x, y);
    },
    [onMouseDown, onPixelChange]
  );

  const handleMouseEnter = useCallback(
    (x: number, y: number) => {
      if (isDrawing) {
        onPixelChange(x, y);
      }
    },
    [isDrawing, onPixelChange]
  );

  return (
    <div
      className="inline-block select-none"
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{ cursor: 'crosshair' }}
    >
      <svg
        width={canvasWidth}
        height={canvasHeight}
        className="border border-gray-600 rounded"
        style={{ background: '#1a1a2e' }}
      >
        {/* Render pixels */}
        {pixels.map((row, y) =>
          row.map((color, x) => (
            <rect
              key={`${x}-${y}`}
              x={x * pixelSize}
              y={y * pixelSize}
              width={pixelSize}
              height={pixelSize}
              fill={color}
              onMouseDown={() => handleMouseDown(x, y)}
              onMouseEnter={() => handleMouseEnter(x, y)}
              className="transition-opacity hover:opacity-80"
            />
          ))
        )}

        {/* Grid overlay */}
        {showGrid && (
          <g className="pointer-events-none">
            {/* Vertical lines */}
            {Array.from({ length: width + 1 }).map((_, i) => (
              <line
                key={`v-${i}`}
                x1={i * pixelSize}
                y1={0}
                x2={i * pixelSize}
                y2={canvasHeight}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={1}
              />
            ))}
            {/* Horizontal lines */}
            {Array.from({ length: height + 1 }).map((_, i) => (
              <line
                key={`h-${i}`}
                x1={0}
                y1={i * pixelSize}
                x2={canvasWidth}
                y2={i * pixelSize}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={1}
              />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}

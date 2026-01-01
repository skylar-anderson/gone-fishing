import type { TileType } from '@/lib/types';
import type { PixelTexture, TileTextures } from '@/lib/types/textures';
import type { ReactNode } from 'react';

/**
 * Generates an SVG pattern ID for a tile type
 */
export function getPatternId(tileType: TileType): string {
  return `tile-pattern-${tileType}`;
}

/**
 * Generates an SVG pattern URL reference for use in fill attributes
 */
export function getPatternFill(tileType: TileType): string {
  return `url(#${getPatternId(tileType)})`;
}

/**
 * Renders an SVG <pattern> element for a pixel texture
 * The pattern will tile seamlessly when used as a fill
 */
export function renderPattern(texture: PixelTexture, tileSize: number): ReactNode {
  const pixelSize = tileSize / texture.width;

  return (
    <pattern
      key={getPatternId(texture.id as TileType)}
      id={getPatternId(texture.id as TileType)}
      width={tileSize}
      height={tileSize}
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
  );
}

/**
 * Renders all tile texture patterns as SVG <defs> content
 */
export function renderAllPatterns(textures: TileTextures, tileSize: number): ReactNode {
  const tileTypes: TileType[] = ['grass', 'dirt', 'sand', 'water', 'deep_water', 'dock', 'mud', 'rock', 'shop'];

  return (
    <defs>
      {tileTypes.map((type) => renderPattern(textures[type], tileSize))}
    </defs>
  );
}

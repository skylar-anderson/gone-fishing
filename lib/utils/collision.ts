import { TileMap, Position, Direction } from '@/lib/types';

const DIRECTION_DELTA: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function canMoveTo(map: TileMap, position: Position): boolean {
  // Check bounds
  if (
    position.x < 0 ||
    position.x >= map.width ||
    position.y < 0 ||
    position.y >= map.height
  ) {
    return false;
  }

  // Check if tile is walkable
  const tile = map.tiles[position.y][position.x];
  return tile.walkable;
}

export function isAdjacentToFishable(
  map: TileMap,
  position: Position,
  direction: Direction
): boolean {
  const delta = DIRECTION_DELTA[direction];
  const targetPos: Position = {
    x: position.x + delta.x,
    y: position.y + delta.y,
  };

  // Check bounds
  if (
    targetPos.x < 0 ||
    targetPos.x >= map.width ||
    targetPos.y < 0 ||
    targetPos.y >= map.height
  ) {
    return false;
  }

  const tile = map.tiles[targetPos.y][targetPos.x];
  return tile.fishable;
}

export function canFishAt(
  map: TileMap,
  position: Position,
  direction: Direction
): boolean {
  // Check if standing on a fishable tile (like a dock)
  const currentTile = map.tiles[position.y]?.[position.x];
  if (currentTile?.fishable) {
    return true;
  }

  // Or if adjacent to water in the facing direction
  return isAdjacentToFishable(map, position, direction);
}

export function getNewPosition(position: Position, direction: Direction): Position {
  const delta = DIRECTION_DELTA[direction];
  return {
    x: position.x + delta.x,
    y: position.y + delta.y,
  };
}

export function isAdjacentToTileType(
  map: TileMap,
  position: Position,
  tileType: string
): boolean {
  // Check current tile
  const currentTile = map.tiles[position.y]?.[position.x];
  if (currentTile?.type === tileType) {
    return true;
  }

  // Check adjacent tiles in all directions
  const directions: Direction[] = ['up', 'down', 'left', 'right'];
  for (const direction of directions) {
    const delta = DIRECTION_DELTA[direction];
    const targetPos: Position = {
      x: position.x + delta.x,
      y: position.y + delta.y,
    };

    // Check bounds
    if (
      targetPos.x >= 0 &&
      targetPos.x < map.width &&
      targetPos.y >= 0 &&
      targetPos.y < map.height
    ) {
      const tile = map.tiles[targetPos.y][targetPos.x];
      if (tile.type === tileType) {
        return true;
      }
    }
  }

  return false;
}

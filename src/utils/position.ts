import type { Position } from "../types/game";
import { BOARD_HEIGHT, BOARD_WIDTH } from "./constants";

/**
 * Check if a position is within the game board bounds
 */
export function isPositionInBounds(position: Position): boolean {
  return (
    position.x >= 0 && position.x < BOARD_WIDTH && position.y >= 0 && position.y < BOARD_HEIGHT
  );
}

/**
 * Calculate the center X position for a tetromino shape
 */
export function getCenterXPosition(shapeWidth: number): number {
  return Math.floor(BOARD_WIDTH / 2) - Math.floor(shapeWidth / 2);
}

/**
 * Get the initial spawn position for a new tetromino
 */
export function getInitialPosition(shapeWidth: number): Position {
  return {
    x: getCenterXPosition(shapeWidth),
    y: 0,
  };
}

/**
 * Create a new position with offset
 */
export function createOffsetPosition(position: Position, dx: number, dy: number): Position {
  return {
    x: position.x + dx,
    y: position.y + dy,
  };
}

/**
 * Check if two positions are equal
 */
export function arePositionsEqual(pos1: Position, pos2: Position): boolean {
  return pos1.x === pos2.x && pos1.y === pos2.y;
}

/**
 * Find positions that match a given condition within a shape
 */
export function findPositionsInShape(
  shape: number[][],
  basePosition: Position,
  condition: (value: number) => boolean = (val) => val !== 0,
): Position[] {
  const positions: Position[] = [];

  shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (condition(cell)) {
        positions.push({
          x: basePosition.x + x,
          y: basePosition.y + y,
        });
      }
    });
  });

  return positions;
}

/**
 * Get all positions occupied by a tetromino
 */
export function getTetrominoPositions(shape: number[][], position: Position): Position[] {
  return findPositionsInShape(shape, position);
}

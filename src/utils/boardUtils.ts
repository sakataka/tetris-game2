import type { Position } from "../types/game";
import { GAME_CONSTANTS } from "./gameConstants";

/**
 * Clean Code utility functions for board-related operations
 * Following Uncle Bob's principles: single responsibility, meaningful names, pure functions
 */

// Position creation and manipulation
export const createPosition = (x: number, y: number): Position => ({ x, y });

// Coordinate-to-string key conversion (eliminating duplication)
export const createCellKey = ({ x, y }: Position): string => `${x},${y}`;

export const parseCellKey = (key: string): Position => {
  const [x, y] = key.split(",").map(Number);
  return createPosition(x, y);
};

// Board boundary validation (eliminating duplication)
export const isValidBoardPosition = ({ x, y }: Position): boolean =>
  x >= 0 && x < GAME_CONSTANTS.BOARD.WIDTH && y >= 0 && y < GAME_CONSTANTS.BOARD.HEIGHT;

// Generic position bounds checking
export const isPositionInBounds = ({ x, y }: Position, width: number, height: number): boolean =>
  x >= 0 && x < width && y >= 0 && y < height;

// Position operations
export const addPositions = (pos1: Position, pos2: Position): Position =>
  createPosition(pos1.x + pos2.x, pos1.y + pos2.y);

export const arePositionsEqual = (pos1: Position, pos2: Position): boolean =>
  pos1.x === pos2.x && pos1.y === pos2.y;

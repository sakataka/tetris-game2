import type { Position } from "@/types/game";
import { GAME_CONSTANTS } from "./gameConstants";

/**
 * Clean Code utility functions for board-related operations
 * Following Uncle Bob's principles: single responsibility, meaningful names, pure functions
 */

// Coordinate-to-string key conversion (eliminating duplication)
export const createCellKey = ({ x, y }: Position): string => `${x},${y}`;

// Board boundary validation (eliminating duplication)
export const isValidBoardPosition = ({ x, y }: Position): boolean =>
  x >= 0 && x < GAME_CONSTANTS.BOARD.WIDTH && y >= 0 && y < GAME_CONSTANTS.BOARD.HEIGHT;

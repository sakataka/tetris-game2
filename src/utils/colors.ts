import type { TetrominoType } from "../types/game";

/**
 * Tetris piece color mapping using Tailwind CSS classes
 * Maps tetromino types to their respective colors
 */
export const TETROMINO_COLORS: Record<TetrominoType, string> = {
  I: "bg-tetris-cyan",
  O: "bg-tetris-yellow",
  T: "bg-tetris-purple",
  S: "bg-tetris-green",
  Z: "bg-tetris-red",
  J: "bg-tetris-blue",
  L: "bg-tetris-orange",
} as const;

/**
 * Color mapping by index for backward compatibility
 * Index 0 represents empty cells
 */
export const COLOR_BY_INDEX: Record<number, string> = {
  0: "bg-slate-900", // Empty cell
  1: TETROMINO_COLORS.I, // I piece
  2: TETROMINO_COLORS.O, // O piece
  3: TETROMINO_COLORS.T, // T piece
  4: TETROMINO_COLORS.S, // S piece
  5: TETROMINO_COLORS.Z, // Z piece
  6: TETROMINO_COLORS.J, // J piece
  7: TETROMINO_COLORS.L, // L piece
} as const;

/**
 * Get Tailwind CSS class for a tetromino type
 */
export function getTetrominoColor(type: TetrominoType): string {
  return TETROMINO_COLORS[type];
}

/**
 * Get Tailwind CSS class for a cell by color index
 * Used by the game board to display colored cells
 */
export function getCellColor(colorIndex: number): string {
  return COLOR_BY_INDEX[colorIndex] ?? "bg-slate-900";
}

/**
 * Get color index for a tetromino type
 * Useful for converting tetromino type to board representation
 */
export function getTetrominoColorIndex(type: TetrominoType): number {
  const typeToIndex: Record<TetrominoType, number> = {
    I: 1,
    O: 2,
    T: 3,
    S: 4,
    Z: 5,
    J: 6,
    L: 7,
  };
  return typeToIndex[type];
}

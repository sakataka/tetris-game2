import type { TetrominoTypeName } from "@/types/game";

/**
 * Tetris piece color mapping using Tailwind CSS classes
 * Maps tetromino types to their respective colors
 */
export const TETROMINO_COLORS: Record<TetrominoTypeName, string> = {
  I: "bg-tetris-cyan",
  O: "bg-tetris-yellow",
  T: "bg-tetris-purple",
  S: "bg-tetris-green",
  Z: "bg-tetris-red",
  J: "bg-tetris-blue",
  L: "bg-tetris-orange",
} as const;

/**
 * Get Tailwind CSS class for a tetromino type
 */
export function getTetrominoColor(type: TetrominoTypeName): string {
  return TETROMINO_COLORS[type];
}

/**
 * Get Tailwind CSS class for a cell by color index
 * Used by the game board to display colored cells
 */
export function getCellColor(colorIndex: number): string {
  // Use switch expression for better performance and type safety
  switch (colorIndex) {
    case 0:
      return "bg-slate-900";
    case 1:
      return TETROMINO_COLORS.I;
    case 2:
      return TETROMINO_COLORS.O;
    case 3:
      return TETROMINO_COLORS.T;
    case 4:
      return TETROMINO_COLORS.S;
    case 5:
      return TETROMINO_COLORS.Z;
    case 6:
      return TETROMINO_COLORS.J;
    case 7:
      return TETROMINO_COLORS.L;
    default:
      return "bg-slate-900";
  }
}

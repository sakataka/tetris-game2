/**
 * Game Constants
 *
 * This file contains game logic constants, configuration values, and numeric constants.
 * For UI styling and Tailwind CSS class combinations, see styles.ts
 */

/**
 * Game board configuration constants
 */
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

/**
 * Game timing and speed constants
 */
export const INITIAL_DROP_SPEED_MS = 1000;
export const MIN_DROP_SPEED_MS = 100;
export const SPEED_DECREASE_PER_LEVEL = 100;

/**
 * UI layout constants
 */
export const BOARD_CELL_SIZE_PX = 30;
export const NEXT_PIECE_GRID_SIZE = 4;

/**
 * Scoring system constants
 */
export const LINES_PER_LEVEL = 10;
export const BASE_SCORES = [0, 100, 300, 500, 800] as const;

/**
 * Tetromino specific constants
 */
export const TETROMINO_TYPES = ["I", "O", "T", "S", "Z", "J", "L"] as const;

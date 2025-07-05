/**
 * Centralized Game Constants
 *
 * This file contains all game-related constants, magic numbers, and configuration values
 * to ensure consistency and maintainability across the entire codebase.
 */

/**
 * Board-related constants
 */
export const GAME_CONSTANTS = {
  BOARD: {
    WIDTH: 10,
    HEIGHT: 20,
    CELL_SIZE: 30,
    MIN_WIDTH_PX: 320,
    MIN_HEIGHT_PX: 620,
  },
  TIMING: {
    INITIAL_DROP_SPEED_MS: 1000,
    MIN_DROP_SPEED_MS: 100,
    SPEED_DECREASE_PER_LEVEL: 100,
    SOFT_DROP_INTERVAL: 50,
    HARD_DROP_DELAY: 100,
    LINE_CLEAR_DELAY: 300,
    TRANSITION_DURATION: 300,
  },
  TETROMINO: {
    GRID_SIZE: 4,
    NEXT_PIECE_GRID_SIZE: 4,
    ROTATION_STATES: [0, 90, 180, 270] as const,
    DROP_POSITION_LIMIT: 30,
    MAX_ROTATION_STATE: 3,
    GRID_ROWS: 3,
    GRID_CELL_SIZE: 16, // For display in UI (w-4 h-4 = 16px)
  },
  ANIMATION: {
    SCORE: {
      STIFFNESS: 300,
      DAMPING: 15,
    },
    LINES: {
      STIFFNESS: 400,
      DAMPING: 20,
    },
    LEVEL: {
      STIFFNESS: 250,
      DAMPING: 12,
    },
    DEFAULT: {
      STIFFNESS: 300,
      DAMPING: 15,
    },
    CELL: {
      STIFFNESS: 500,
      DAMPING: 30,
      DURATION: 0.25,
    },
    LINE_CLEAR_DURATION: 0.2,
    PIECE_PLACE_DURATION: 0.15,
    COMPLETION_DELAY: 10, // Minimal delay to ensure animation DOM updates complete
  },
  TOUCH: {
    MIN_SWIPE_DISTANCE: 30,
    MAX_SWIPE_TIME: 500,
    TAP_TIME: 200,
    DOUBLE_TAP_TIME: 300,
    LONG_SWIPE_MULTIPLIER: 2,
  },
  UI: {
    BUTTON_HEIGHT: 48, // h-12 = 3rem = 48px
    BUTTON_WIDTH_SMALL: 48, // w-12
    BUTTON_WIDTH_LARGE: 64, // w-16
    HIGH_SCORE_LIST_MAX: 10,
    DEFAULT_VOLUME: 0.5,
  },
  SCORING: {
    BASE_SCORES: [0, 100, 300, 500, 800] as const,
    LEVEL_MULTIPLIER: 1,
    LINES_PER_LEVEL: 10,
  },
  TYPES: {
    TETROMINO_TYPES: ["I", "O", "T", "S", "Z", "J", "L"] as const,
  },
  PIECE_BAG: {
    HISTORY_SIZE: 14, // 2bag分の履歴を保持
  },
} as const;

// All constants are now accessed through the centralized GAME_CONSTANTS object

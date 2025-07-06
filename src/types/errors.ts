/**
 * Game-specific error types for Result pattern
 * Provides type-safe error handling for game operations
 */
export type GameError =
  | { type: "INVALID_POSITION"; details: string }
  | { type: "INVALID_ROTATION"; details: string }
  | { type: "GAME_OVER"; details: string }
  | { type: "INVALID_STATE"; details: string }
  | { type: "INVALID_PIECE"; details: string }
  | { type: "HOLD_NOT_ALLOWED"; details: string }
  | { type: "BOARD_COLLISION"; details: string }
  | { type: "OUT_OF_BOUNDS"; details: string };

/**
 * Factory functions for creating game errors
 */
export const GameErrors = {
  invalidPosition: (details: string): GameError => ({
    type: "INVALID_POSITION",
    details,
  }),

  invalidRotation: (details: string): GameError => ({
    type: "INVALID_ROTATION",
    details,
  }),

  gameOver: (details: string): GameError => ({
    type: "GAME_OVER",
    details,
  }),

  invalidState: (details: string): GameError => ({
    type: "INVALID_STATE",
    details,
  }),

  invalidPiece: (details: string): GameError => ({
    type: "INVALID_PIECE",
    details,
  }),

  holdNotAllowed: (details: string): GameError => ({
    type: "HOLD_NOT_ALLOWED",
    details,
  }),

  boardCollision: (details: string): GameError => ({
    type: "BOARD_COLLISION",
    details,
  }),

  outOfBounds: (details: string): GameError => ({
    type: "OUT_OF_BOUNDS",
    details,
  }),
} as const;

/**
 * Utility functions for working with GameError
 */
export const GameErrorUtils = {
  /**
   * Converts a GameError to a human-readable string
   */
  toString: (error: GameError): string => {
    return `${error.type}: ${error.details}`;
  },

  /**
   * Checks if an error is of a specific type
   */
  isType: <T extends GameError["type"]>(
    error: GameError,
    type: T,
  ): error is Extract<GameError, { type: T }> => {
    return error.type === type;
  },

  /**
   * Creates a generic Error instance from GameError
   */
  toError: (gameError: GameError): Error => {
    return new Error(GameErrorUtils.toString(gameError));
  },
} as const;

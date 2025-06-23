// Simplified error system for Tetris game
export const ERROR_CODES = {
  INVALID_BOARD_DIMENSIONS: "BOARD_001",
  INVALID_BOARD_STATE: "BOARD_002",
  INVALID_TETROMINO_TYPE: "PIECE_001",
  PIECE_PLACEMENT_FAILED: "PIECE_002",
  INVALID_INPUT_PARAMETER: "VALIDATION_001",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// Simplified base error class
export class GameError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "GameError";
  }
}

// Specific error types for convenience
export class BoardError extends GameError {}
export class PieceError extends GameError {}
export class ValidationError extends GameError {}

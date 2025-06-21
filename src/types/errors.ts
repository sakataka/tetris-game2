/**
 * Base error interface for all game-related errors
 */
export interface BaseGameError {
  readonly code: string;
  readonly message: string;
  readonly context?: Record<string, unknown>;
  readonly timestamp: Date;
  readonly recoverable: boolean; // Whether error should crash the game or allow continuation
}

/**
 * Error codes for different types of game errors
 */
export const ERROR_CODES = {
  // Board-related errors
  INVALID_BOARD_DIMENSIONS: "BOARD_001",
  BOARD_POSITION_OUT_OF_BOUNDS: "BOARD_002",
  INVALID_BOARD_STATE: "BOARD_003",

  // Piece-related errors
  INVALID_TETROMINO_TYPE: "PIECE_001",
  INVALID_PIECE_POSITION: "PIECE_002",
  INVALID_PIECE_SHAPE: "PIECE_003",
  PIECE_PLACEMENT_FAILED: "PIECE_004",

  // Game state errors
  INVALID_GAME_STATE: "GAME_001",
  GAME_STATE_CORRUPTION: "GAME_002",
  GAME_INITIALIZATION_FAILED: "GAME_003",

  // Validation errors
  INVALID_INPUT_PARAMETER: "VALIDATION_001",
  TYPE_VALIDATION_FAILED: "VALIDATION_002",
  CONSTRAINT_VIOLATION: "VALIDATION_003",

  // Animation errors
  ANIMATION_STATE_ERROR: "ANIMATION_001",
  ANIMATION_TRIGGER_FAILED: "ANIMATION_002",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Board-specific errors
 */
export class BoardError extends Error implements BaseGameError {
  public readonly code: ErrorCode;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: Date;
  public readonly recoverable: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    context?: Record<string, unknown>,
    recoverable = false,
  ) {
    super(message);
    this.name = "BoardError";
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
    this.recoverable = recoverable;

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, BoardError.prototype);
  }
}

/**
 * Tetromino piece-specific errors
 */
export class PieceError extends Error implements BaseGameError {
  public readonly code: ErrorCode;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: Date;
  public readonly recoverable: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    context?: Record<string, unknown>,
    recoverable = true,
  ) {
    super(message);
    this.name = "PieceError";
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
    this.recoverable = recoverable;

    Object.setPrototypeOf(this, PieceError.prototype);
  }
}

/**
 * Game state-specific errors
 */
export class GameStateError extends Error implements BaseGameError {
  public readonly code: ErrorCode;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: Date;
  public readonly recoverable: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    context?: Record<string, unknown>,
    recoverable = true,
  ) {
    super(message);
    this.name = "GameStateError";
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
    this.recoverable = recoverable;

    Object.setPrototypeOf(this, GameStateError.prototype);
  }
}

/**
 * Validation-specific errors
 */
export class ValidationError extends Error implements BaseGameError {
  public readonly code: ErrorCode;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: Date;
  public readonly recoverable: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    context?: Record<string, unknown>,
    recoverable = false,
  ) {
    super(message);
    this.name = "ValidationError";
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
    this.recoverable = recoverable;

    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Animation-specific errors
 */
export class AnimationError extends Error implements BaseGameError {
  public readonly code: ErrorCode;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: Date;
  public readonly recoverable: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    context?: Record<string, unknown>,
    recoverable = true,
  ) {
    super(message);
    this.name = "AnimationError";
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
    this.recoverable = recoverable;

    Object.setPrototypeOf(this, AnimationError.prototype);
  }
}

/**
 * Union type for all game errors
 */
export type GameError = BoardError | PieceError | GameStateError | ValidationError | AnimationError;

/**
 * Type guard to check if an error is a game error
 */
export function isGameError(error: unknown): error is GameError {
  return (
    error instanceof Error &&
    (error instanceof BoardError ||
      error instanceof PieceError ||
      error instanceof GameStateError ||
      error instanceof ValidationError ||
      error instanceof AnimationError)
  );
}

/**
 * Type guard to check if an error is recoverable
 */
export function isRecoverableError(error: GameError): boolean {
  return error.recoverable;
}

/**
 * Helper function to extract error information for logging
 */
export function extractErrorInfo(error: GameError) {
  return {
    name: error.name,
    code: error.code,
    message: error.message,
    context: error.context,
    timestamp: error.timestamp,
    recoverable: error.recoverable,
    stack: error.stack,
  };
}

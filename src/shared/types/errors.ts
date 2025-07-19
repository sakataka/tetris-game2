/**
 * Base abstract class for all game errors
 * Provides a hierarchical error system with recovery strategies
 */
export abstract class GameError extends Error {
  abstract readonly code: string;
  abstract readonly recoverable: boolean;
  readonly timestamp: number;
  readonly context?: Record<string, unknown>;

  constructor(message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = Date.now();
    this.context = context;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Returns a serializable representation of the error
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      recoverable: this.recoverable,
      timestamp: this.timestamp,
      context: this.context,
      stack: this.stack,
    };
  }

  /**
   * Returns a user-friendly error message
   */
  abstract getUserMessage(): string;
}

/**
 * Validation errors - typically not recoverable
 */
export class ValidationError extends GameError {
  readonly code = "VALIDATION_ERROR";
  readonly recoverable = false;

  constructor(
    message: string,
    public readonly field?: string,
    context?: Record<string, unknown>,
  ) {
    super(message, { ...context, field });
  }

  getUserMessage(): string {
    return this.field
      ? `Invalid ${this.field}: ${this.message}`
      : `Validation error: ${this.message}`;
  }
}

/**
 * Game logic errors - usually recoverable
 */
export class GameLogicError extends GameError {
  readonly code = "GAME_LOGIC_ERROR";
  readonly recoverable = true;

  getUserMessage(): string {
    return `Game error: ${this.message}`;
  }
}

/**
 * Network/API errors - recoverable with retry
 */
export class NetworkError extends GameError {
  readonly code = "NETWORK_ERROR";
  readonly recoverable = true;

  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly endpoint?: string,
    context?: Record<string, unknown>,
  ) {
    super(message, { ...context, statusCode, endpoint });
  }

  getUserMessage(): string {
    return "Network connection error. Please try again.";
  }
}

/**
 * Storage/persistence errors - recoverable
 */
export class StorageError extends GameError {
  readonly code = "STORAGE_ERROR";
  readonly recoverable = true;

  constructor(
    message: string,
    public readonly operation?: "read" | "write" | "delete",
    context?: Record<string, unknown>,
  ) {
    super(message, { ...context, operation });
  }

  getUserMessage(): string {
    return "Unable to save or load data. Please try again.";
  }
}

/**
 * Configuration errors - typically not recoverable
 */
export class ConfigurationError extends GameError {
  readonly code = "CONFIGURATION_ERROR";
  readonly recoverable = false;

  getUserMessage(): string {
    return "Application configuration error. Please refresh the page.";
  }
}

/**
 * Performance/resource errors - may be recoverable
 */
export class PerformanceError extends GameError {
  readonly code = "PERFORMANCE_ERROR";
  readonly recoverable = true;

  constructor(
    message: string,
    public readonly metric?: string,
    public readonly threshold?: number,
    context?: Record<string, unknown>,
  ) {
    super(message, { ...context, metric, threshold });
  }

  getUserMessage(): string {
    return "Performance issue detected. The game may run slower.";
  }
}

/**
 * Specific game operation errors
 */
export class InvalidMoveError extends GameLogicError {
  constructor(move: string, reason: string, context?: Record<string, unknown>) {
    super(`Invalid move "${move}": ${reason}`, { ...context, move, reason });
  }
}

export class InvalidRotationError extends GameLogicError {
  constructor(rotation: string, reason: string, context?: Record<string, unknown>) {
    super(`Invalid rotation "${rotation}": ${reason}`, { ...context, rotation, reason });
  }
}

export class BoardCollisionError extends GameLogicError {
  constructor(position: { x: number; y: number }, context?: Record<string, unknown>) {
    super(`Board collision at position (${position.x}, ${position.y})`, { ...context, position });
  }
}

export class GameOverError extends GameLogicError {
  constructor(reason: string, finalScore?: number, context?: Record<string, unknown>) {
    super(`Game over: ${reason}`, { ...context, reason, finalScore });
  }
}

export class HoldNotAllowedError extends GameLogicError {
  constructor(reason: string, context?: Record<string, unknown>) {
    super(`Hold not allowed: ${reason}`, { ...context, reason });
  }
}

/**
 * Error factory functions for common game errors
 */
export const GameErrors = {
  // Validation errors
  invalidPosition: (x: number, y: number, reason?: string): ValidationError =>
    new ValidationError(`Invalid position (${x}, ${y})${reason ? `: ${reason}` : ""}`, "position", {
      x,
      y,
    }),

  invalidPiece: (pieceType: string, reason?: string): ValidationError =>
    new ValidationError(
      `Invalid piece type "${pieceType}"${reason ? `: ${reason}` : ""}`,
      "piece",
      { pieceType },
    ),

  invalidState: (state: string, expected?: string): ValidationError =>
    new ValidationError(
      `Invalid game state "${state}"${expected ? `, expected "${expected}"` : ""}`,
      "state",
      { state, expected },
    ),

  // Game logic errors
  invalidMove: (move: string, reason: string): InvalidMoveError =>
    new InvalidMoveError(move, reason),

  invalidRotation: (rotation: string, reason: string): InvalidRotationError =>
    new InvalidRotationError(rotation, reason),

  boardCollision: (x: number, y: number): BoardCollisionError => new BoardCollisionError({ x, y }),

  gameOver: (reason: string, finalScore?: number): GameOverError =>
    new GameOverError(reason, finalScore),

  holdNotAllowed: (reason: string): HoldNotAllowedError => new HoldNotAllowedError(reason),

  outOfBounds: (x: number, y: number): GameLogicError =>
    new GameLogicError(`Position out of bounds (${x}, ${y})`, { x, y }),

  // Network errors
  networkTimeout: (endpoint: string, timeout: number): NetworkError =>
    new NetworkError(`Request timeout after ${timeout}ms`, undefined, endpoint, { timeout }),

  networkUnavailable: (endpoint: string): NetworkError =>
    new NetworkError("Network unavailable", undefined, endpoint),

  apiError: (statusCode: number, endpoint: string, message?: string): NetworkError =>
    new NetworkError(message || `API error ${statusCode}`, statusCode, endpoint),

  // Storage errors
  storageQuotaExceeded: (): StorageError => new StorageError("Storage quota exceeded", "write"),

  storageUnavailable: (operation: "read" | "write" | "delete"): StorageError =>
    new StorageError(`Storage unavailable for ${operation} operation`, operation),

  // Performance errors
  frameDropDetected: (droppedFrames: number, threshold: number): PerformanceError =>
    new PerformanceError(`Frame drops detected: ${droppedFrames}`, "frameDrops", threshold, {
      droppedFrames,
    }),

  memoryPressure: (usedMemory: number, threshold: number): PerformanceError =>
    new PerformanceError(`Memory pressure: ${usedMemory}MB`, "memory", threshold, { usedMemory }),

  // Configuration errors
  missingConfiguration: (key: string): ConfigurationError =>
    new ConfigurationError(`Missing configuration: ${key}`, { key }),

  invalidConfiguration: (key: string, value: unknown, expected: string): ConfigurationError =>
    new ConfigurationError(
      `Invalid configuration for ${key}: expected ${expected}, got ${typeof value}`,
      { key, value, expected },
    ),
} as const;

/**
 * Utility functions for working with GameError instances
 */
export const GameErrorUtils = {
  /**
   * Checks if an error is a GameError instance
   */
  isGameError: (error: unknown): error is GameError => {
    return error instanceof GameError;
  },

  /**
   * Checks if an error is recoverable
   */
  isRecoverable: (error: unknown): boolean => {
    return GameErrorUtils.isGameError(error) && error.recoverable;
  },

  /**
   * Checks if an error is of a specific type
   */
  isType: <T extends GameError>(
    error: unknown,
    ErrorClass: new (...args: unknown[]) => T,
  ): error is T => {
    return error instanceof ErrorClass;
  },

  /**
   * Gets a user-friendly message from any error
   */
  getUserMessage: (error: unknown): string => {
    if (GameErrorUtils.isGameError(error)) {
      return error.getUserMessage();
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "An unexpected error occurred";
  },

  /**
   * Converts any error to a GameError
   */
  toGameError: (error: unknown): GameError => {
    if (GameErrorUtils.isGameError(error)) {
      return error;
    }
    if (error instanceof Error) {
      return new GameLogicError(error.message, { originalError: error.name });
    }
    return new GameLogicError(String(error));
  },

  /**
   * Creates a serializable error summary
   */
  serialize: (error: unknown): Record<string, unknown> => {
    if (GameErrorUtils.isGameError(error)) {
      return error.toJSON();
    }
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    return {
      error: String(error),
    };
  },

  /**
   * Filters errors by recoverability
   */
  filterRecoverable: (errors: unknown[]): GameError[] => {
    return errors.filter(GameErrorUtils.isGameError).filter((error) => error.recoverable);
  },

  /**
   * Groups errors by their error code
   */
  groupByCode: (errors: GameError[]): Record<string, GameError[]> => {
    return errors.reduce(
      (groups, error) => {
        const code = error.code;
        if (!groups[code]) {
          groups[code] = [];
        }
        groups[code].push(error);
        return groups;
      },
      {} as Record<string, GameError[]>,
    );
  },
} as const;

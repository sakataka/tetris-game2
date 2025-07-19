import type { GameEngine } from "@/game/GameEngine";
import { createLegacyGameEngine as createSimpleGameEngine } from "@/game/SimpleGameEngine";
import type { GameError } from "@/shared/types/errors";
import { GameErrorUtils } from "@/shared/types/errors";
import type { Result } from "@/shared/types/result";
import { ResultUtils } from "@/shared/types/result";
import type { GameState, Tetromino } from "@/types/game";

/**
 * Configuration for the game engine adapter
 */
export interface GameEngineAdapterConfig {
  enableErrorRecovery?: boolean;
  maxRetryAttempts?: number;
  logErrors?: boolean;
  useNewEngine?: boolean;
}

/**
 * Dependency injection interface for game engine
 */
export interface GameEngineDependencies {
  gameEngine?: GameEngine;
  errorHandler?: (error: GameError) => void;
  logger?: (message: string, data?: unknown) => void;
}

/**
 * Enhanced adapter for communicating with the core game engine
 * This isolates the game-play feature from direct engine dependencies
 * and provides Result-based error handling with dependency injection
 */
export function createGameEngineAdapter(
  config: GameEngineAdapterConfig = {},
  dependencies: GameEngineDependencies = {},
): GameEngineAdapter {
  const {
    enableErrorRecovery = true,
    maxRetryAttempts = 3,
    logErrors = true,
    useNewEngine = false,
  } = config;

  const {
    gameEngine = createSimpleGameEngine(),
    errorHandler = (error: GameError) =>
      console.error("Game Engine Error:", GameErrorUtils.serialize(error)),
    logger = logErrors
      ? (message: string, data?: unknown) => console.log(`[GameEngineAdapter] ${message}`, data)
      : () => {},
  } = dependencies;

  const eventListeners: Map<string, ((data: unknown) => void)[]> = new Map();
  let retryCount = 0;

  /**
   * Safe event emission with error handling
   */
  const emit = (event: string, data: unknown): Result<void, GameError> => {
    try {
      const listeners = eventListeners.get(event);
      if (listeners) {
        listeners.forEach((callback) => {
          try {
            callback(data);
          } catch (error) {
            const gameError = GameErrorUtils.toGameError(error);
            errorHandler(gameError);
            logger(`Error in event listener for ${event}`, { error: gameError });
          }
        });
      }
      return ResultUtils.ok(undefined);
    } catch (error) {
      const gameError = GameErrorUtils.toGameError(error);
      return ResultUtils.err(gameError);
    }
  };

  /**
   * Execute operation with retry logic and error recovery
   */
  const executeWithRetry = <T>(operation: () => T, operationName: string): Result<T, GameError> => {
    try {
      const result = operation();
      retryCount = 0; // Reset retry count on success
      return ResultUtils.ok(result);
    } catch (error) {
      const gameError = GameErrorUtils.toGameError(error);

      if (
        enableErrorRecovery &&
        GameErrorUtils.isRecoverable(gameError) &&
        retryCount < maxRetryAttempts
      ) {
        retryCount++;
        logger(`Retrying ${operationName} (attempt ${retryCount}/${maxRetryAttempts})`, {
          error: gameError,
        });

        // Simple retry after a short delay
        setTimeout(() => {
          executeWithRetry(operation, operationName);
        }, 100 * retryCount);
      } else {
        retryCount = 0;
        errorHandler(gameError);
        emit("game-error", { error: gameError });
      }

      return ResultUtils.err(gameError);
    }
  };

  /**
   * Safe wrapper for boolean operations
   */
  const executeBooleanOperation = (
    operation: () => boolean,
    operationName: string,
    successEvent?: string,
  ): boolean => {
    const result = executeWithRetry(operation, operationName);

    if (result.ok && result.value && successEvent) {
      emit(successEvent, { timestamp: Date.now() });
    }

    return ResultUtils.unwrapOr(result, false);
  };

  /**
   * Safe wrapper for void operations
   */
  const executeVoidOperation = (
    operation: () => void,
    operationName: string,
    successEvent?: string,
  ): void => {
    const result = executeWithRetry(operation, operationName);

    if (result.ok && successEvent) {
      emit(successEvent, { timestamp: Date.now() });
    }
  };

  /**
   * Setup event listeners for the game engine
   */
  const setupGameEventListeners = (): void => {
    if (!gameEngine.on) return;

    // Listen for game engine events and re-emit them safely
    const eventMappings = [
      { engineEvent: "line-cleared", adapterEvent: "line-cleared" },
      { engineEvent: "piece-placed", adapterEvent: "piece-placed" },
      { engineEvent: "game-over", adapterEvent: "game-over" },
      { engineEvent: "level-up", adapterEvent: "level-up" },
      { engineEvent: "game-started", adapterEvent: "game-started" },
      { engineEvent: "game-paused", adapterEvent: "game-paused" },
      { engineEvent: "game-reset", adapterEvent: "game-reset" },
      { engineEvent: "piece-moved", adapterEvent: "piece-moved" },
      { engineEvent: "piece-rotated", adapterEvent: "piece-rotated" },
      { engineEvent: "piece-held", adapterEvent: "piece-held" },
    ];

    eventMappings.forEach(({ engineEvent, adapterEvent }) => {
      gameEngine.on?.(engineEvent, (data: unknown) => {
        const result = emit(adapterEvent, data);
        if (!result.ok) {
          logger(`Failed to emit ${adapterEvent}`, { error: result.error });
        }
      });
    });
  };

  setupGameEventListeners();

  return {
    /**
     * Start a new game with error handling
     */
    startGame(): void {
      executeVoidOperation(() => gameEngine.startGame(), "startGame", "game-started");
    },

    /**
     * Pause/resume the game with error handling
     */
    pauseGame(): void {
      executeVoidOperation(() => gameEngine.pauseGame(), "pauseGame", "game-paused");
    },

    /**
     * Reset the game with error handling
     */
    resetGame(): void {
      executeVoidOperation(() => gameEngine.resetGame(), "resetGame", "game-reset");
    },

    /**
     * Execute player move with error handling and retry
     */
    moveLeft(): boolean {
      return executeBooleanOperation(() => gameEngine.moveLeft(), "moveLeft", "piece-moved");
    },

    /**
     * Execute player move with error handling and retry
     */
    moveRight(): boolean {
      return executeBooleanOperation(() => gameEngine.moveRight(), "moveRight", "piece-moved");
    },

    /**
     * Execute rotation with error handling and retry
     */
    rotateClockwise(): boolean {
      return executeBooleanOperation(
        () => gameEngine.rotateClockwise(),
        "rotateClockwise",
        "piece-rotated",
      );
    },

    /**
     * Execute counter-clockwise rotation with error handling and retry
     */
    rotateCounterClockwise(): boolean {
      return executeBooleanOperation(
        () => gameEngine.rotateCounterClockwise(),
        "rotateCounterClockwise",
        "piece-rotated",
      );
    },

    /**
     * Execute soft drop with error handling and retry
     */
    softDrop(): boolean {
      return executeBooleanOperation(() => gameEngine.softDrop(), "softDrop", "piece-soft-dropped");
    },

    /**
     * Execute hard drop with error handling and retry
     */
    hardDrop(): boolean {
      return executeBooleanOperation(() => gameEngine.hardDrop(), "hardDrop", "piece-hard-dropped");
    },

    /**
     * Execute hold piece with error handling and retry
     */
    holdPiece(): boolean {
      return executeBooleanOperation(() => gameEngine.holdPiece(), "holdPiece", "piece-held");
    },

    /**
     * Get current game state with error handling
     */
    getGameState(): GameState | null {
      const result = executeWithRetry(() => gameEngine.getState(), "getGameState");
      return ResultUtils.unwrapOr(result, null);
    },

    /**
     * Get current board with error handling
     */
    getBoard(): GameState["board"] | null {
      const result = executeWithRetry(() => gameEngine.getBoard(), "getBoard");
      return ResultUtils.unwrapOr(result, null);
    },

    /**
     * Get current piece with error handling
     */
    getCurrentPiece(): Tetromino | null {
      const result = executeWithRetry(() => gameEngine.getCurrentPiece(), "getCurrentPiece");
      return ResultUtils.unwrapOr(result, null);
    },

    /**
     * Get ghost piece position with error handling
     */
    getGhostPiece(): Tetromino | null {
      const result = executeWithRetry(() => gameEngine.getGhostPiece(), "getGhostPiece");
      return ResultUtils.unwrapOr(result, null);
    },

    /**
     * Add event listener with error handling
     */
    on(event: string, callback: (data: unknown) => void): void {
      try {
        if (!eventListeners.has(event)) {
          eventListeners.set(event, []);
        }
        eventListeners.get(event)?.push(callback);
        logger(`Added event listener for ${event}`);
      } catch (error) {
        const gameError = GameErrorUtils.toGameError(error);
        errorHandler(gameError);
      }
    },

    /**
     * Remove event listener with error handling
     */
    off(event: string, callback: (data: unknown) => void): void {
      try {
        const listeners = eventListeners.get(event);
        if (listeners) {
          const index = listeners.indexOf(callback);
          if (index !== -1) {
            listeners.splice(index, 1);
            logger(`Removed event listener for ${event}`);
          }
        }
      } catch (error) {
        const gameError = GameErrorUtils.toGameError(error);
        errorHandler(gameError);
      }
    },

    /**
     * Cleanup resources with error handling
     */
    destroy(): void {
      try {
        eventListeners.clear();
        logger("GameEngineAdapter destroyed");
      } catch (error) {
        const gameError = GameErrorUtils.toGameError(error);
        errorHandler(gameError);
      }
    },

    /**
     * Get adapter configuration (for debugging/monitoring)
     */
    getConfig(): GameEngineAdapterConfig {
      return {
        enableErrorRecovery,
        maxRetryAttempts,
        logErrors,
        useNewEngine,
      };
    },

    /**
     * Get current retry count (for monitoring)
     */
    getRetryCount(): number {
      return retryCount;
    },

    /**
     * Reset retry count (for recovery)
     */
    resetRetryCount(): void {
      retryCount = 0;
    },
  };
}

export interface GameEngineAdapter {
  // Core game operations
  startGame(): void;
  pauseGame(): void;
  resetGame(): void;

  // Movement operations
  moveLeft(): boolean;
  moveRight(): boolean;
  rotateClockwise(): boolean;
  rotateCounterClockwise(): boolean;
  softDrop(): boolean;
  hardDrop(): boolean;
  holdPiece(): boolean;

  // State access
  getGameState(): GameState | null;
  getBoard(): GameState["board"] | null;
  getCurrentPiece(): Tetromino | null;
  getGhostPiece(): Tetromino | null;

  // Event handling
  on(event: string, callback: (data: unknown) => void): void;
  off(event: string, callback: (data: unknown) => void): void;

  // Lifecycle
  destroy(): void;

  // Monitoring and debugging
  getConfig(): GameEngineAdapterConfig;
  getRetryCount(): number;
  resetRetryCount(): void;
}

// Singleton instance with default configuration
export const gameEngineAdapter = createGameEngineAdapter({
  enableErrorRecovery: true,
  maxRetryAttempts: 3,
  logErrors: process.env.NODE_ENV === "development",
  useNewEngine: false, // Keep backward compatibility
});

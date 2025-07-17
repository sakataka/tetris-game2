import type { GameEngine } from "@/game/GameEngine";
import { createSimpleGameEngine } from "@/game/SimpleGameEngine";
import type { GameState, Tetromino } from "@/types/game";

/**
 * Adapter for communicating with the core game engine
 * This isolates the game-play feature from direct engine dependencies
 */
export function createGameEngineAdapter(): GameEngineAdapter {
  const gameEngine: GameEngine = createSimpleGameEngine();
  const eventListeners: Map<string, ((data: unknown) => void)[]> = new Map();

  const emit = (event: string, data: unknown): void => {
    const listeners = eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[GameEngineAdapter] Error in event listener for ${event}:`, error);
        }
      });
    }
  };

  const setupGameEventListeners = (): void => {
    // Listen for game engine events and re-emit them
    gameEngine.on?.("line-cleared", (data) => {
      emit("line-cleared", data);
    });

    gameEngine.on?.("piece-placed", (data) => {
      emit("piece-placed", data);
    });

    gameEngine.on?.("game-over", (data) => {
      emit("game-over", data);
    });

    gameEngine.on?.("level-up", (data) => {
      emit("level-up", data);
    });
  };

  setupGameEventListeners();

  return {
    /**
     * Start a new game
     */
    startGame(): void {
      try {
        gameEngine.startGame();
        emit("game-started", { timestamp: Date.now() });
      } catch (error) {
        console.error("[GameEngineAdapter] Failed to start game:", error);
        emit("game-error", { error });
      }
    },

    /**
     * Pause/resume the game
     */
    pauseGame(): void {
      try {
        gameEngine.pauseGame();
        emit("game-paused", { timestamp: Date.now() });
      } catch (error) {
        console.error("[GameEngineAdapter] Failed to pause game:", error);
        emit("game-error", { error });
      }
    },

    /**
     * Reset the game
     */
    resetGame(): void {
      try {
        gameEngine.resetGame();
        emit("game-reset", { timestamp: Date.now() });
      } catch (error) {
        console.error("[GameEngineAdapter] Failed to reset game:", error);
        emit("game-error", { error });
      }
    },

    /**
     * Execute player move
     */
    moveLeft(): boolean {
      try {
        const result = gameEngine.moveLeft();
        if (result) {
          emit("piece-moved", { direction: "left", timestamp: Date.now() });
        }
        return result;
      } catch (error) {
        console.error("[GameEngineAdapter] Failed to move left:", error);
        return false;
      }
    },

    /**
     * Execute player move
     */
    moveRight(): boolean {
      try {
        const result = gameEngine.moveRight();
        if (result) {
          emit("piece-moved", { direction: "right", timestamp: Date.now() });
        }
        return result;
      } catch (error) {
        console.error("[GameEngineAdapter] Failed to move right:", error);
        return false;
      }
    },

    /**
     * Execute rotation
     */
    rotateClockwise(): boolean {
      try {
        const result = gameEngine.rotateClockwise();
        if (result) {
          emit("piece-rotated", { direction: "clockwise", timestamp: Date.now() });
        }
        return result;
      } catch (error) {
        console.error("[GameEngineAdapter] Failed to rotate:", error);
        return false;
      }
    },

    /**
     * Execute counter-clockwise rotation
     */
    rotateCounterClockwise(): boolean {
      try {
        const result = gameEngine.rotateCounterClockwise();
        if (result) {
          emit("piece-rotated", { direction: "counter-clockwise", timestamp: Date.now() });
        }
        return result;
      } catch (error) {
        console.error("[GameEngineAdapter] Failed to rotate counter-clockwise:", error);
        return false;
      }
    },

    /**
     * Execute soft drop
     */
    softDrop(): boolean {
      try {
        const result = gameEngine.softDrop();
        if (result) {
          emit("piece-soft-dropped", { timestamp: Date.now() });
        }
        return result;
      } catch (error) {
        console.error("[GameEngineAdapter] Failed to soft drop:", error);
        return false;
      }
    },

    /**
     * Execute hard drop
     */
    hardDrop(): boolean {
      try {
        const result = gameEngine.hardDrop();
        if (result) {
          emit("piece-hard-dropped", { timestamp: Date.now() });
        }
        return result;
      } catch (error) {
        console.error("[GameEngineAdapter] Failed to hard drop:", error);
        return false;
      }
    },

    /**
     * Execute hold piece
     */
    holdPiece(): boolean {
      try {
        const result = gameEngine.holdPiece();
        if (result) {
          emit("piece-held", { timestamp: Date.now() });
        }
        return result;
      } catch (error) {
        console.error("[GameEngineAdapter] Failed to hold piece:", error);
        return false;
      }
    },

    /**
     * Get current game state
     */
    getGameState(): GameState | null {
      try {
        return gameEngine.getState();
      } catch (error) {
        console.error("[GameEngineAdapter] Failed to get game state:", error);
        return null;
      }
    },

    /**
     * Get current board
     */
    getBoard(): GameState["board"] | null {
      try {
        return gameEngine.getBoard();
      } catch (error) {
        console.error("[GameEngineAdapter] Failed to get board:", error);
        return null;
      }
    },

    /**
     * Get current piece
     */
    getCurrentPiece(): Tetromino | null {
      try {
        return gameEngine.getCurrentPiece();
      } catch (error) {
        console.error("[GameEngineAdapter] Failed to get current piece:", error);
        return null;
      }
    },

    /**
     * Get ghost piece position
     */
    getGhostPiece(): Tetromino | null {
      try {
        return gameEngine.getGhostPiece();
      } catch (error) {
        console.error("[GameEngineAdapter] Failed to get ghost piece:", error);
        return null;
      }
    },

    /**
     * Add event listener
     */
    on(event: string, callback: (data: unknown) => void): void {
      if (!eventListeners.has(event)) {
        eventListeners.set(event, []);
      }
      eventListeners.get(event)?.push(callback);
    },

    /**
     * Remove event listener
     */
    off(event: string, callback: (data: unknown) => void): void {
      const listeners = eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      }
    },

    /**
     * Cleanup resources
     */
    destroy(): void {
      eventListeners.clear();
    },
  };
}

export interface GameEngineAdapter {
  startGame(): void;
  pauseGame(): void;
  resetGame(): void;
  moveLeft(): boolean;
  moveRight(): boolean;
  rotateClockwise(): boolean;
  rotateCounterClockwise(): boolean;
  softDrop(): boolean;
  hardDrop(): boolean;
  holdPiece(): boolean;
  getGameState(): GameState | null;
  getBoard(): GameState["board"] | null;
  getCurrentPiece(): Tetromino | null;
  getGhostPiece(): Tetromino | null;
  on(event: string, callback: (data: unknown) => void): void;
  off(event: string, callback: (data: unknown) => void): void;
  destroy(): void;
}

// Singleton instance
export const gameEngineAdapter = createGameEngineAdapter();

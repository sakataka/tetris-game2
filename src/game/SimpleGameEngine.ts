import type { GameState, Tetromino } from "@/types/game";
import type { GameEngine } from "./GameEngine";
import {
  createInitialGameState,
  hardDropTetromino,
  holdCurrentPieceLegacy,
  moveTetrominoByLegacy,
  rotateTetromino180Legacy,
  rotateTetrominoCWLegacy,
} from "./game";

/**
 * Simple GameEngine implementation using existing game functions
 * This bridges the new GameEngine interface with the legacy game functions
 */
export function createSimpleGameEngine(initialState?: GameState): GameEngine {
  let gameState: GameState = initialState || createInitialGameState();
  const eventListeners: Map<string, ((data: unknown) => void)[]> = new Map();

  const emit = (event: string, data: unknown): void => {
    const listeners = eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[SimpleGameEngine] Error in event listener for ${event}:`, error);
        }
      });
    }
  };

  return {
    startGame(): void {
      gameState = createInitialGameState();
      emit("game-started", { timestamp: Date.now() });
    },

    pauseGame(): void {
      // Note: Pause state should be handled at the store level
      emit("game-paused", { timestamp: Date.now() });
    },

    resetGame(): void {
      gameState = createInitialGameState();
      emit("game-reset", { timestamp: Date.now() });
    },

    moveLeft(): boolean {
      const newState = moveTetrominoByLegacy(gameState, -1, 0);
      if (newState !== gameState) {
        gameState = newState;
        emit("piece-moved", { direction: "left", timestamp: Date.now() });
        return true;
      }
      return false;
    },

    moveRight(): boolean {
      const newState = moveTetrominoByLegacy(gameState, 1, 0);
      if (newState !== gameState) {
        gameState = newState;
        emit("piece-moved", { direction: "right", timestamp: Date.now() });
        return true;
      }
      return false;
    },

    softDrop(): boolean {
      const newState = moveTetrominoByLegacy(gameState, 0, 1);
      if (newState !== gameState) {
        gameState = newState;
        emit("piece-soft-dropped", { timestamp: Date.now() });

        // Check for game over after move
        if (gameState.isGameOver) {
          emit("game-over", {
            finalScore: gameState.score,
            totalLines: gameState.lines,
            timestamp: Date.now(),
          });
        }

        return true;
      }
      return false;
    },

    hardDrop(): boolean {
      const newState = hardDropTetromino(gameState);
      if (newState !== gameState) {
        gameState = newState;
        emit("piece-hard-dropped", { timestamp: Date.now() });

        // Check for game over after move
        if (gameState.isGameOver) {
          emit("game-over", {
            finalScore: gameState.score,
            totalLines: gameState.lines,
            timestamp: Date.now(),
          });
        }

        return true;
      }
      return false;
    },

    rotateClockwise(): boolean {
      const newState = rotateTetrominoCWLegacy(gameState);
      if (newState !== gameState) {
        gameState = newState;
        emit("piece-rotated", { direction: "clockwise", timestamp: Date.now() });
        return true;
      }
      return false;
    },

    rotateCounterClockwise(): boolean {
      const newState = rotateTetromino180Legacy(gameState);
      if (newState !== gameState) {
        gameState = newState;
        emit("piece-rotated", { direction: "counter-clockwise", timestamp: Date.now() });
        return true;
      }
      return false;
    },

    holdPiece(): boolean {
      const newState = holdCurrentPieceLegacy(gameState);
      if (newState !== gameState) {
        gameState = newState;
        emit("piece-held", { timestamp: Date.now() });
        return true;
      }
      return false;
    },

    getState(): GameState {
      return gameState;
    },

    getBoard(): GameState["board"] {
      return gameState.board;
    },

    getCurrentPiece(): Tetromino | null {
      return gameState.currentPiece;
    },

    getGhostPiece(): Tetromino | null {
      return gameState.ghostPiece;
    },

    on(event: string, callback: (data: unknown) => void): void {
      if (!eventListeners.has(event)) {
        eventListeners.set(event, []);
      }
      eventListeners.get(event)?.push(callback);
    },

    off(event: string, callback: (data: unknown) => void): void {
      const listeners = eventListeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      }
    },
  };
}

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
export class SimpleGameEngine implements GameEngine {
  private gameState: GameState;
  private eventListeners: Map<string, ((data: unknown) => void)[]> = new Map();

  constructor(initialState?: GameState) {
    this.gameState = initialState || createInitialGameState();
  }

  startGame(): void {
    this.gameState = createInitialGameState();
    this.emit("game-started", { timestamp: Date.now() });
  }

  pauseGame(): void {
    // Note: Pause state should be handled at the store level
    this.emit("game-paused", { timestamp: Date.now() });
  }

  resetGame(): void {
    this.gameState = createInitialGameState();
    this.emit("game-reset", { timestamp: Date.now() });
  }

  moveLeft(): boolean {
    const newState = moveTetrominoByLegacy(this.gameState, -1, 0);
    if (newState !== this.gameState) {
      this.gameState = newState;
      this.emit("piece-moved", { direction: "left", timestamp: Date.now() });
      return true;
    }
    return false;
  }

  moveRight(): boolean {
    const newState = moveTetrominoByLegacy(this.gameState, 1, 0);
    if (newState !== this.gameState) {
      this.gameState = newState;
      this.emit("piece-moved", { direction: "right", timestamp: Date.now() });
      return true;
    }
    return false;
  }

  softDrop(): boolean {
    const newState = moveTetrominoByLegacy(this.gameState, 0, 1);
    if (newState !== this.gameState) {
      this.gameState = newState;
      this.emit("piece-soft-dropped", { timestamp: Date.now() });
      return true;
    }
    return false;
  }

  hardDrop(): boolean {
    const newState = hardDropTetromino(this.gameState);
    if (newState !== this.gameState) {
      this.gameState = newState;
      this.emit("piece-hard-dropped", { timestamp: Date.now() });
      return true;
    }
    return false;
  }

  rotateClockwise(): boolean {
    const newState = rotateTetrominoCWLegacy(this.gameState);
    if (newState !== this.gameState) {
      this.gameState = newState;
      this.emit("piece-rotated", { direction: "clockwise", timestamp: Date.now() });
      return true;
    }
    return false;
  }

  rotateCounterClockwise(): boolean {
    const newState = rotateTetromino180Legacy(this.gameState);
    if (newState !== this.gameState) {
      this.gameState = newState;
      this.emit("piece-rotated", { direction: "counter-clockwise", timestamp: Date.now() });
      return true;
    }
    return false;
  }

  holdPiece(): boolean {
    const newState = holdCurrentPieceLegacy(this.gameState);
    if (newState !== this.gameState) {
      this.gameState = newState;
      this.emit("piece-held", { timestamp: Date.now() });
      return true;
    }
    return false;
  }

  getState(): GameState {
    return this.gameState;
  }

  getBoard(): GameState["board"] {
    return this.gameState.board;
  }

  getCurrentPiece(): Tetromino | null {
    return this.gameState.currentPiece;
  }

  getGhostPiece(): Tetromino | null {
    return this.gameState.ghostPiece;
  }

  on(event: string, callback: (data: unknown) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  off(event: string, callback: (data: unknown) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[SimpleGameEngine] Error in event listener for ${event}:`, error);
        }
      });
    }
  }
}

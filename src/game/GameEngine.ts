import type { GameState, Tetromino } from "@/types/game";

/**
 * GameEngine interface for the Feature-Hooks Architecture
 * Provides a clean abstraction layer between UI features and core game logic
 */
export interface GameEngine {
  // Game control methods
  startGame(): void;
  pauseGame(): void;
  resetGame(): void;

  // Movement methods
  moveLeft(): boolean;
  moveRight(): boolean;
  softDrop(): boolean;
  hardDrop(): boolean;

  // Rotation methods
  rotateClockwise(): boolean;
  rotateCounterClockwise(): boolean;

  // Hold system
  holdPiece(): boolean;

  // State access methods
  getState(): GameState;
  getBoard(): GameState["board"];
  getCurrentPiece(): Tetromino | null;
  getGhostPiece(): Tetromino | null;

  // Event system (optional)
  on?(event: string, callback: (data: unknown) => void): void;
  off?(event: string, callback: (data: unknown) => void): void;
}

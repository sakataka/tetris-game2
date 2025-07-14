/**
 * Mock types and interfaces for @tetris/engine package
 * These will be replaced with actual imports when the engine package is available
 * TODO: Remove this file once Issue #139 (Core Game Engine Package) is completed
 */

import type { Position, Tetromino, TetrominoTypeName, CellValue } from "@/types/game";

export interface GameEngineState {
  board: CellValue[][];
  currentPiece: Tetromino | null;
  nextPieces: TetrominoTypeName[];
  heldPiece: TetrominoTypeName | null;
  canHold: boolean;
  isGameOver: boolean;
}

export interface GameEvent {
  type: string;
  payload: unknown;
}

export interface LineClearedEvent extends GameEvent {
  type: "LINE_CLEARED";
  payload: {
    lines: number;
    positions: number[];
    score: number;
  };
}

export interface PiecePlacedEvent extends GameEvent {
  type: "PIECE_PLACED";
  payload: {
    piece: Tetromino;
    position: Position;
  };
}

export interface GameOverEvent extends GameEvent {
  type: "GAME_OVER";
  payload: {
    finalScore: number;
    reason: string;
  };
}

export interface LevelUpEvent extends GameEvent {
  type: "LEVEL_UP";
  payload: {
    newLevel: number;
    oldLevel: number;
  };
}

export type GameEventType = LineClearedEvent | PiecePlacedEvent | GameOverEvent | LevelUpEvent;

/**
 * Mock GameEventBus for event handling
 * This mimics the real event bus that will be in the tetris-engine package
 */
export class GameEventBus {
  private listeners: Map<string, Set<(event: GameEvent) => void>> = new Map();

  subscribe(eventType: string, handler: (event: GameEvent) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.add(handler);
    }
  }

  unsubscribe(eventType: string, handler: (event: GameEvent) => void): void {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  emit(event: GameEvent): void {
    const handlers = this.listeners.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error);
        }
      });
    }
  }
}

export interface GameEngineConfig {
  randomSeed?: number;
  enableDebug?: boolean;
}

export interface HardDropResult {
  distance: number;
  score: number;
}

/**
 * Mock GameEngine implementation
 * This provides a temporary implementation until the real engine is available
 */
export class GameEngine {
  private state: GameEngineState;
  private eventBus: GameEventBus;

  constructor(_config: GameEngineConfig = {}) {
    this.eventBus = new GameEventBus();
    this.state = this.createInitialState();
  }

  private createInitialState(): GameEngineState {
    // Create a basic initial state - this will be replaced by the real engine
    return {
      board: Array(20)
        .fill(null)
        .map(() => Array(10).fill(0 as CellValue)),
      currentPiece: null, // Will be set by the real engine
      nextPieces: ["T", "I", "O", "S", "Z", "J", "L"] as TetrominoTypeName[],
      heldPiece: null,
      canHold: true,
      isGameOver: false,
    };
  }

  getState(): GameEngineState {
    return { ...this.state };
  }

  reset(): void {
    this.state = this.createInitialState();
    console.log("🔄 Mock engine reset");
  }

  moveLeft(): boolean {
    console.log("⬅️ Mock engine move left");
    return true; // Mock success
  }

  moveRight(): boolean {
    console.log("➡️ Mock engine move right");
    return true; // Mock success
  }

  rotateClockwise(): boolean {
    console.log("🔄 Mock engine rotate clockwise");
    return true; // Mock success
  }

  rotateCounterClockwise(): boolean {
    console.log("🔄 Mock engine rotate counter-clockwise");
    return true; // Mock success
  }

  softDrop(): boolean {
    console.log("⬇️ Mock engine soft drop");
    return true; // Mock success
  }

  hardDrop(): HardDropResult {
    console.log("⬇️⬇️ Mock engine hard drop");
    return { distance: 5, score: 10 }; // Mock result
  }

  holdPiece(): boolean {
    if (!this.state.canHold) return false;
    console.log("📦 Mock engine hold piece");
    this.state.canHold = false;
    return true;
  }

  tick(): boolean {
    console.log("⏱️ Mock engine tick");
    return true; // Mock success
  }

  getEventBus(): GameEventBus {
    return this.eventBus;
  }
}

import type { AIEngine } from "@/game/ai";
import type { GameEngine } from "@/game/game";
import type { GameState, Piece, Position } from "@/types/game";

/**
 * Adapter for communicating with the core game engine
 * This isolates the game-play feature from direct engine dependencies
 */
export class GameEngineAdapter {
  private gameEngine: GameEngine | null = null;
  private aiEngine: AIEngine | null = null;
  private eventListeners: Map<string, ((data: any) => void)[]> = new Map();

  /**
   * Initialize the game engine
   */
  async initialize(engine: GameEngine, aiEngine?: AIEngine): Promise<void> {
    this.gameEngine = engine;
    this.aiEngine = aiEngine;

    // Set up event listeners for game events
    this.setupGameEventListeners();
  }

  /**
   * Start a new game
   */
  startGame(): void {
    if (!this.gameEngine) {
      console.error("[GameEngineAdapter] Game engine not initialized");
      return;
    }

    try {
      this.gameEngine.startGame();
      this.emit("game-started", { timestamp: Date.now() });
    } catch (error) {
      console.error("[GameEngineAdapter] Failed to start game:", error);
      this.emit("game-error", { error });
    }
  }

  /**
   * Pause/resume the game
   */
  pauseGame(): void {
    if (!this.gameEngine) return;

    try {
      this.gameEngine.pause();
      this.emit("game-paused", { timestamp: Date.now() });
    } catch (error) {
      console.error("[GameEngineAdapter] Failed to pause game:", error);
      this.emit("game-error", { error });
    }
  }

  /**
   * Reset the game
   */
  resetGame(): void {
    if (!this.gameEngine) return;

    try {
      this.gameEngine.reset();
      this.emit("game-reset", { timestamp: Date.now() });
    } catch (error) {
      console.error("[GameEngineAdapter] Failed to reset game:", error);
      this.emit("game-error", { error });
    }
  }

  /**
   * Execute player move
   */
  moveLeft(): boolean {
    if (!this.gameEngine) return false;

    try {
      const result = this.gameEngine.moveLeft();
      if (result) {
        this.emit("piece-moved", { direction: "left", timestamp: Date.now() });
      }
      return result;
    } catch (error) {
      console.error("[GameEngineAdapter] Failed to move left:", error);
      return false;
    }
  }

  /**
   * Execute player move
   */
  moveRight(): boolean {
    if (!this.gameEngine) return false;

    try {
      const result = this.gameEngine.moveRight();
      if (result) {
        this.emit("piece-moved", { direction: "right", timestamp: Date.now() });
      }
      return result;
    } catch (error) {
      console.error("[GameEngineAdapter] Failed to move right:", error);
      return false;
    }
  }

  /**
   * Execute rotation
   */
  rotateClockwise(): boolean {
    if (!this.gameEngine) return false;

    try {
      const result = this.gameEngine.rotate();
      if (result) {
        this.emit("piece-rotated", { direction: "clockwise", timestamp: Date.now() });
      }
      return result;
    } catch (error) {
      console.error("[GameEngineAdapter] Failed to rotate:", error);
      return false;
    }
  }

  /**
   * Execute counter-clockwise rotation
   */
  rotateCounterClockwise(): boolean {
    if (!this.gameEngine) return false;

    try {
      const result = this.gameEngine.rotateCounterClockwise?.();
      if (result) {
        this.emit("piece-rotated", { direction: "counter-clockwise", timestamp: Date.now() });
      }
      return result ?? false;
    } catch (error) {
      console.error("[GameEngineAdapter] Failed to rotate counter-clockwise:", error);
      return false;
    }
  }

  /**
   * Execute soft drop
   */
  softDrop(): boolean {
    if (!this.gameEngine) return false;

    try {
      const result = this.gameEngine.softDrop();
      if (result) {
        this.emit("piece-soft-dropped", { timestamp: Date.now() });
      }
      return result;
    } catch (error) {
      console.error("[GameEngineAdapter] Failed to soft drop:", error);
      return false;
    }
  }

  /**
   * Execute hard drop
   */
  hardDrop(): boolean {
    if (!this.gameEngine) return false;

    try {
      const result = this.gameEngine.hardDrop();
      if (result) {
        this.emit("piece-hard-dropped", { timestamp: Date.now() });
      }
      return result;
    } catch (error) {
      console.error("[GameEngineAdapter] Failed to hard drop:", error);
      return false;
    }
  }

  /**
   * Execute hold piece
   */
  holdPiece(): boolean {
    if (!this.gameEngine) return false;

    try {
      const result = this.gameEngine.hold();
      if (result) {
        this.emit("piece-held", { timestamp: Date.now() });
      }
      return result;
    } catch (error) {
      console.error("[GameEngineAdapter] Failed to hold piece:", error);
      return false;
    }
  }

  /**
   * Get current game state
   */
  getGameState(): GameState | null {
    if (!this.gameEngine) return null;

    try {
      return this.gameEngine.getState();
    } catch (error) {
      console.error("[GameEngineAdapter] Failed to get game state:", error);
      return null;
    }
  }

  /**
   * Get current board
   */
  getBoard(): GameState["board"] | null {
    if (!this.gameEngine) return null;

    try {
      return this.gameEngine.getBoard();
    } catch (error) {
      console.error("[GameEngineAdapter] Failed to get board:", error);
      return null;
    }
  }

  /**
   * Get current piece
   */
  getCurrentPiece(): Piece | null {
    if (!this.gameEngine) return null;

    try {
      return this.gameEngine.getCurrentPiece();
    } catch (error) {
      console.error("[GameEngineAdapter] Failed to get current piece:", error);
      return null;
    }
  }

  /**
   * Get ghost piece position
   */
  getGhostPiece(): Piece | null {
    if (!this.gameEngine) return null;

    try {
      return this.gameEngine.getGhostPiece?.() ?? null;
    } catch (error) {
      console.error("[GameEngineAdapter] Failed to get ghost piece:", error);
      return null;
    }
  }

  /**
   * Set up event listeners for game engine events
   */
  private setupGameEventListeners(): void {
    if (!this.gameEngine) return;

    // Listen for game engine events and re-emit them
    this.gameEngine.on?.("line-cleared", (data) => {
      this.emit("line-cleared", data);
    });

    this.gameEngine.on?.("piece-placed", (data) => {
      this.emit("piece-placed", data);
    });

    this.gameEngine.on?.("game-over", (data) => {
      this.emit("game-over", data);
    });

    this.gameEngine.on?.("level-up", (data) => {
      this.emit("level-up", data);
    });
  }

  /**
   * Add event listener
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[GameEngineAdapter] Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.gameEngine = null;
    this.aiEngine = null;
    this.eventListeners.clear();
  }
}

// Singleton instance
export const gameEngineAdapter = new GameEngineAdapter();

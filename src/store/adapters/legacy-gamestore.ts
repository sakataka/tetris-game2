import { features } from "@/shared/config/features";
// TODO: Replace with actual imports when tetris-engine package is available (Issue #139)
import { GameEngine, type GameEventBus } from "@/shared/mocks/tetris-engine";
import type { GameState } from "@/types/game";

/**
 * Legacy GameStore Adapter
 * Bridges between the new tetris-engine and existing GameStore API
 * Maintains 100% API compatibility while using the new engine internally
 */
export class LegacyGameStoreAdapter {
  private engine: GameEngine;
  private eventBus: GameEventBus;
  private state: GameState;
  private listeners: Set<(state: GameState) => void> = new Set();

  constructor(initialState?: Partial<GameState>) {
    this.engine = new GameEngine({
      randomSeed: undefined, // Remove debugMode reference as it's not part of GameState
    });
    this.eventBus = this.engine.getEventBus();
    this.state = this.createInitialState(initialState);
    this.setupEventHandlers();
  }

  private createInitialState(partial?: Partial<GameState>): GameState {
    const engineState = this.engine.getState();

    return {
      // Game Core State
      board: engineState.board,
      currentPiece: engineState.currentPiece,
      nextPiece: engineState.nextPieces[0] || "T",
      pieceBag: engineState.nextPieces.slice(1),
      heldPiece: engineState.heldPiece,
      canHold: engineState.canHold,
      ghostPosition: null, // Will be calculated

      // Game Meta State
      score: 0,
      level: 1,
      lines: 0,

      // Game Control State
      isGameOver: engineState.isGameOver,
      isPaused: false,

      // Animation State (Legacy compatibility)
      placedPositions: [],
      clearingLines: [],
      boardBeforeClear: null,
      animationTriggerKey: 0,

      // Combo State
      comboState: {
        count: 0,
        isActive: false,
        lastClearType: null,
      },

      // Score Animation State
      scoreAnimationState: {
        previousScore: 0,
        scoreIncrease: 0,
        lineCount: 0,
        clearType: null,
        isTetris: false,
        animationTriggerTime: 0,
      },

      // Floating Score Events
      floatingScoreEvents: [],

      // T-Spin State
      tSpinState: {
        type: "none",
        show: false,
        linesCleared: 0,
        rotationResult: null,
      },

      // Level Celebration State
      levelCelebrationState: {
        isActive: false,
        level: null,
        startTime: null,
        phase: "completed",
        userCancelled: false,
      },

      // Override with provided partial state
      ...partial,
    };
  }

  private setupEventHandlers(): void {
    // Subscribe to engine events and update legacy state accordingly
    this.eventBus.subscribe("LINE_CLEARED", (event) => {
      const payload = event.payload as { lines: number; score: number };
      this.updateState({
        lines: this.state.lines + payload.lines,
        score: this.state.score + payload.score,
      });
    });

    this.eventBus.subscribe("PIECE_PLACED", () => {
      this.updateState({
        canHold: true, // Reset hold ability
      });
    });

    this.eventBus.subscribe("GAME_OVER", () => {
      this.updateState({
        isGameOver: true,
      });
    });

    this.eventBus.subscribe("LEVEL_UP", (event) => {
      const payload = event.payload as { newLevel: number };
      this.updateState({
        level: payload.newLevel,
      });
    });
  }

  // ========================================
  // Public API Methods (Legacy Compatibility)
  // ========================================

  /**
   * Start a new game
   */
  startGame(): void {
    this.engine.reset();
    this.syncEngineState();
    this.updateState({
      isGameOver: false,
      isPaused: false,
      score: 0,
      level: 1,
      lines: 0,
    });
  }

  /**
   * Pause/unpause the game
   */
  togglePause(): void {
    if (this.state.isGameOver) return;

    this.updateState({
      isPaused: !this.state.isPaused,
    });
  }

  /**
   * Move current piece left
   */
  moveLeft(): void {
    if (!this.canMove()) return;

    const success = this.engine.moveLeft();
    if (success) {
      this.syncEngineState();
    }
  }

  /**
   * Move current piece right
   */
  moveRight(): void {
    if (!this.canMove()) return;

    const success = this.engine.moveRight();
    if (success) {
      this.syncEngineState();
    }
  }

  /**
   * Rotate current piece clockwise
   */
  rotateClockwise(): void {
    if (!this.canMove()) return;

    const success = this.engine.rotateClockwise();
    if (success) {
      this.syncEngineState();
    }
  }

  /**
   * Rotate current piece counter-clockwise
   */
  rotateCounterClockwise(): void {
    if (!this.canMove()) return;

    const success = this.engine.rotateCounterClockwise();
    if (success) {
      this.syncEngineState();
    }
  }

  /**
   * Soft drop (faster fall)
   */
  softDrop(): void {
    if (!this.canMove()) return;

    const success = this.engine.softDrop();
    if (success) {
      this.syncEngineState();
    }
  }

  /**
   * Hard drop (instant placement)
   */
  hardDrop(): void {
    if (!this.canMove()) return;

    const result = this.engine.hardDrop();
    this.syncEngineState();

    // Add score for hard drop
    this.updateState({
      score: this.state.score + result.distance * 2,
    });
  }

  /**
   * Hold current piece
   */
  holdPiece(): void {
    if (!this.canMove() || !this.state.canHold) return;

    const success = this.engine.holdPiece();
    if (success) {
      this.syncEngineState();
      this.updateState({ canHold: false });
    }
  }

  /**
   * Game tick (automatic fall, etc.)
   */
  tick(): void {
    if (!this.canMove()) return;

    const success = this.engine.tick();
    if (success) {
      this.syncEngineState();
    }
  }

  // ========================================
  // State Management
  // ========================================

  private updateState(updates: Partial<GameState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  private syncEngineState(): void {
    const engineState = this.engine.getState();
    this.updateState({
      board: engineState.board,
      currentPiece: engineState.currentPiece,
      nextPiece: engineState.nextPieces[0] || "T",
      pieceBag: engineState.nextPieces.slice(1),
      heldPiece: engineState.heldPiece,
      canHold: engineState.canHold,
      isGameOver: engineState.isGameOver,
    });
  }

  private canMove(): boolean {
    return !this.state.isGameOver && !this.state.isPaused;
  }

  // ========================================
  // Legacy API Compatibility
  // ========================================

  /**
   * Get current state (read-only)
   */
  getState(): Readonly<GameState> {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (error) {
        console.error("Error in state listener:", error);
      }
    });
  }

  /**
   * Get event bus for advanced usage
   */
  getEventBus(): GameEventBus {
    return this.eventBus;
  }

  /**
   * Direct access to engine (for advanced features)
   */
  getEngine(): GameEngine {
    return this.engine;
  }
}

/**
 * Factory function to create the appropriate store based on feature flag
 */
export function createGameStore(initialState?: Partial<GameState>) {
  if (features.newEngine) {
    console.log("🆕 Using new tetris-engine with adapter");
    return new LegacyGameStoreAdapter(initialState);
  }
  console.log("📦 Using legacy GameStore implementation");
  // For now, throw an error as this is Phase 1
  // In Phase 2, this would import and return the original GameStore
  throw new Error("Legacy GameStore not available - enable FEATURE_NEW_ENGINE=true");
}

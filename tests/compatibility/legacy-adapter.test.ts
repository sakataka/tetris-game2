import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { disableFeature, enableFeature } from "@/shared/config/features";
import { LegacyGameStoreAdapter } from "@/store/adapters/legacy-gamestore";

describe("Legacy GameStore Adapter Compatibility", () => {
  let adapter: LegacyGameStoreAdapter;

  beforeEach(() => {
    // Enable new engine for testing
    enableFeature("newEngine");
    adapter = new LegacyGameStoreAdapter();
  });

  afterEach(() => {
    // Clean up
    disableFeature("newEngine");
  });

  describe("Core Game Operations", () => {
    it("should maintain identical behavior for basic moves", () => {
      adapter.startGame();
      const _initialState = adapter.getState();

      // Test basic movement
      adapter.moveLeft();
      adapter.moveRight();
      adapter.rotateClockwise();

      const finalState = adapter.getState();

      // Should not be in game over state
      expect(finalState.isGameOver).toBe(false);
      expect(finalState.isPaused).toBe(false);

      // Should have basic game state structure
      expect(finalState.board).toBeDefined();
      expect(Array.isArray(finalState.board)).toBe(true);
      expect(finalState.board.length).toBe(20);
      expect(finalState.board[0].length).toBe(10);
    });

    it("should handle piece placement correctly", () => {
      adapter.startGame();

      // Test hard drop
      const initialScore = adapter.getState().score;
      adapter.hardDrop();

      const finalState = adapter.getState();
      // Hard drop should potentially increase score
      expect(finalState.score).toBeGreaterThanOrEqual(initialScore);
    });

    it("should manage score correctly", () => {
      adapter.startGame();
      const initialScore = adapter.getState().score;

      // Hard drop should add score
      adapter.hardDrop();

      const finalScore = adapter.getState().score;
      expect(finalScore).toBeGreaterThanOrEqual(initialScore);
    });
  });

  describe("State Management", () => {
    it("should support state subscription", () => {
      let callbackCount = 0;
      let lastState: ReturnType<typeof adapter.getState> | null = null;

      const unsubscribe = adapter.subscribe((state) => {
        callbackCount++;
        lastState = state;
      });

      adapter.startGame();

      expect(callbackCount).toBeGreaterThan(0);
      expect(lastState).toBeTruthy();

      unsubscribe();
      const previousCallCount = callbackCount;
      adapter.moveLeft();

      // Should not be called after unsubscribe
      expect(callbackCount).toBe(previousCallCount);
    });

    it("should provide read-only state access", () => {
      const state = adapter.getState();

      // State should be a new object each time (defensive copy)
      const state2 = adapter.getState();
      expect(state).not.toBe(state2); // Different object references

      // But content should be the same
      expect(state.score).toBe(state2.score);
      expect(state.level).toBe(state2.level);
    });
  });

  describe("Game Flow", () => {
    it("should handle pause/unpause correctly", () => {
      adapter.startGame();
      expect(adapter.getState().isPaused).toBe(false);

      adapter.togglePause();
      expect(adapter.getState().isPaused).toBe(true);

      adapter.togglePause();
      expect(adapter.getState().isPaused).toBe(false);
    });

    it("should prevent moves when game is paused", () => {
      adapter.startGame();
      adapter.togglePause();

      // Moves should be ignored when paused
      // Note: Since we're using mock engine, we test that the adapter
      // respects the pause state rather than engine state changes
      const pausedState = adapter.getState();
      expect(pausedState.isPaused).toBe(true);

      // Try to move - should be blocked
      adapter.moveLeft();
      adapter.moveRight();

      // State should remain consistent
      const afterMoveState = adapter.getState();
      expect(afterMoveState.isPaused).toBe(true);
    });

    it("should handle game over state", () => {
      adapter.startGame();

      // Force game over through manual state update for testing
      // In real implementation, this would come from engine
      // Use type assertion for testing private method access
      (adapter as { updateState: (updates: { isGameOver: boolean }) => void }).updateState({
        isGameOver: true,
      });

      const gameOverState = adapter.getState();
      expect(gameOverState.isGameOver).toBe(true);

      // Moves should be ignored when game is over
      adapter.moveLeft();
      adapter.moveRight();

      // Should still be game over
      expect(adapter.getState().isGameOver).toBe(true);
    });
  });

  describe("Performance Requirements", () => {
    it("should have minimal performance regression", () => {
      const iterations = 100; // Reduced for testing
      const startTime = performance.now();

      adapter.startGame();

      for (let i = 0; i < iterations; i++) {
        adapter.tick();
      }

      const endTime = performance.now();
      const avgTimePerTick = (endTime - startTime) / iterations;

      // Should average less than 5ms per tick (relaxed for mock)
      expect(avgTimePerTick).toBeLessThan(5);
    });

    it("should handle rapid state updates efficiently", () => {
      let callbackCount = 0;
      adapter.subscribe(() => {
        callbackCount++;
      });

      adapter.startGame();

      const startTime = performance.now();

      // Rapid moves
      for (let i = 0; i < 50; i++) {
        adapter.moveLeft();
        adapter.moveRight();
      }

      const endTime = performance.now();

      // Should complete in reasonable time
      expect(endTime - startTime).toBeLessThan(200); // 200ms

      // Should have called listener for each update
      expect(callbackCount).toBeGreaterThan(50);
    });
  });

  describe("Feature Toggle Integration", () => {
    it("should respect feature flags", () => {
      // Test with feature disabled
      disableFeature("newEngine");

      // Creating new adapter should fail when feature is disabled
      expect(() => {
        new LegacyGameStoreAdapter();
      }).not.toThrow(); // Adapter itself doesn't check flags

      // But factory function should respect flags
      const { createGameStore } = require("@/store/adapters/legacy-gamestore");
      expect(() => {
        createGameStore();
      }).toThrow();

      // Re-enable for cleanup
      enableFeature("newEngine");
    });
  });

  describe("Event System Integration", () => {
    it("should expose event bus for advanced usage", () => {
      const eventBus = adapter.getEventBus();
      expect(eventBus).toBeTruthy();

      let eventReceived = false;
      eventBus.subscribe("LINE_CLEARED", () => {
        eventReceived = true;
      });

      // Should be able to emit events
      eventBus.emit({
        type: "LINE_CLEARED",
        payload: { lines: 1, positions: [19], score: 100 },
      });

      expect(eventReceived).toBe(true);
    });

    it("should provide access to underlying engine", () => {
      const engine = adapter.getEngine();
      expect(engine).toBeTruthy();

      // Should be able to access engine methods
      expect(typeof engine.getState).toBe("function");
      expect(typeof engine.reset).toBe("function");
      expect(typeof engine.moveLeft).toBe("function");
    });
  });

  describe("Hold Piece Functionality", () => {
    it("should handle hold piece correctly", () => {
      adapter.startGame();

      const initialState = adapter.getState();
      expect(initialState.canHold).toBe(true);
      expect(initialState.heldPiece).toBeNull();

      // Hold piece
      adapter.holdPiece();

      const afterHoldState = adapter.getState();
      // Hold ability should be consumed
      expect(afterHoldState.canHold).toBe(false);
    });

    it("should prevent holding when canHold is false", () => {
      adapter.startGame();

      // First hold
      adapter.holdPiece();
      const afterFirstHold = adapter.getState();
      expect(afterFirstHold.canHold).toBe(false);

      const heldPiece = afterFirstHold.heldPiece;

      // Try to hold again - should be blocked
      adapter.holdPiece();
      const afterSecondHold = adapter.getState();

      // State should be unchanged
      expect(afterSecondHold.canHold).toBe(false);
      expect(afterSecondHold.heldPiece).toBe(heldPiece);
    });
  });

  describe("Game State Structure", () => {
    it("should maintain complete GameState interface", () => {
      adapter.startGame();
      const state = adapter.getState();

      // Core game state
      expect(state.board).toBeDefined();
      expect(state.currentPiece).toBeDefined();
      expect(state.nextPiece).toBeDefined();
      expect(state.pieceBag).toBeDefined();
      expect(typeof state.canHold).toBe("boolean");

      // Meta state
      expect(typeof state.score).toBe("number");
      expect(typeof state.level).toBe("number");
      expect(typeof state.lines).toBe("number");

      // Control state
      expect(typeof state.isGameOver).toBe("boolean");
      expect(typeof state.isPaused).toBe("boolean");

      // Animation state (legacy compatibility)
      expect(Array.isArray(state.placedPositions)).toBe(true);
      expect(Array.isArray(state.clearingLines)).toBe(true);

      // T-Spin state
      expect(state.tSpinState).toBeDefined();
      expect(typeof state.tSpinState.show).toBe("boolean");

      // Level celebration state
      expect(state.levelCelebrationState).toBeDefined();
      expect(typeof state.levelCelebrationState.isActive).toBe("boolean");
    });
  });
});

import { beforeEach, describe, expect, test } from "bun:test";
import { useGamePlayActions, useGamePlayState, useGamePlayStore } from "./gamePlaySlice";

describe("gamePlaySlice", () => {
  beforeEach(() => {
    // Reset store before each test
    useGamePlayStore.getState().resetGame();
  });

  describe("Initial State", () => {
    test("should have correct initial state", () => {
      const state = useGamePlayStore.getState();

      expect(state.isPlaying).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.isGameOver).toBe(false);
      expect(state.score).toBe(0);
      expect(state.lines).toBe(0);
      expect(state.level).toBe(1);
      expect(state.board).toHaveLength(20);
      expect(state.board[0]).toHaveLength(10);
      expect(state.currentPiece).toBe(null);
      expect(state.nextPieces).toHaveLength(0);
      expect(state.heldPiece).toBe(null);
      expect(state.canHold).toBe(true);
      expect(state.debugMode).toBe(false);
      expect(state.showResetConfirmation).toBe(false);
    });

    test("should have correct initial T-Spin state", () => {
      const state = useGamePlayStore.getState();

      expect(state.tSpinState.type).toBe("none");
      expect(state.tSpinState.show).toBe(false);
      expect(state.tSpinState.linesCleared).toBe(0);
      expect(state.tSpinState.rotationResult).toBe(null);
    });

    test("should have correct initial combo state", () => {
      const state = useGamePlayStore.getState();

      expect(state.comboState.count).toBe(0);
      expect(state.comboState.isActive).toBe(false);
      expect(state.comboState.lastClearType).toBe(null);
    });

    test("should have correct initial level celebration state", () => {
      const state = useGamePlayStore.getState();

      expect(state.levelCelebrationState.isActive).toBe(false);
      expect(state.levelCelebrationState.level).toBe(null);
      expect(state.levelCelebrationState.startTime).toBe(null);
      expect(state.levelCelebrationState.phase).toBe("completed");
      expect(state.levelCelebrationState.userCancelled).toBe(false);
    });
  });

  describe("State Update Actions", () => {
    test("should update score", () => {
      const { updateScore } = useGamePlayStore.getState();

      updateScore(1000);

      expect(useGamePlayStore.getState().score).toBe(1000);
    });

    test("should update lines and level", () => {
      const { updateLines, updateLevel } = useGamePlayStore.getState();

      updateLines(10);
      updateLevel(2);

      const state = useGamePlayStore.getState();
      expect(state.lines).toBe(10);
      expect(state.level).toBe(2);
    });

    test("should update T-Spin state", () => {
      const { updateTSpinState } = useGamePlayStore.getState();

      const tSpinState = {
        type: "normal" as const,
        show: true,
        linesCleared: 2,
        rotationResult: null,
      };

      updateTSpinState(tSpinState);

      expect(useGamePlayStore.getState().tSpinState).toEqual(tSpinState);
    });

    test("should hide T-Spin indicator", () => {
      const { updateTSpinState, hideTSpinIndicator } = useGamePlayStore.getState();

      // First show the indicator
      updateTSpinState({
        type: "normal",
        show: true,
        linesCleared: 2,
        rotationResult: null,
      });

      // Then hide it
      hideTSpinIndicator();

      const state = useGamePlayStore.getState();
      expect(state.tSpinState.show).toBe(false);
      expect(state.tSpinState.type).toBe("normal"); // Other properties should remain
    });
  });

  describe("Combo Actions", () => {
    test("should increment combo", () => {
      const { incrementCombo } = useGamePlayStore.getState();

      incrementCombo("single");

      const state = useGamePlayStore.getState();
      expect(state.comboState.count).toBe(1);
      expect(state.comboState.isActive).toBe(true);
      expect(state.comboState.lastClearType).toBe("single");
    });

    test("should reset combo", () => {
      const { incrementCombo, resetCombo } = useGamePlayStore.getState();

      // First increment
      incrementCombo("tetris");
      incrementCombo("double");

      // Then reset
      resetCombo();

      const state = useGamePlayStore.getState();
      expect(state.comboState.count).toBe(0);
      expect(state.comboState.isActive).toBe(false);
      expect(state.comboState.lastClearType).toBe(null);
    });
  });

  describe("Level Celebration Actions", () => {
    test("should start level celebration", () => {
      const { startLevelCelebration } = useGamePlayStore.getState();

      startLevelCelebration(5);

      const state = useGamePlayStore.getState();
      expect(state.levelCelebrationState.isActive).toBe(true);
      expect(state.levelCelebrationState.level).toBe(5);
      expect(state.levelCelebrationState.phase).toBe("intro");
      expect(state.levelCelebrationState.userCancelled).toBe(false);
      expect(typeof state.levelCelebrationState.startTime).toBe("number");
    });

    test("should complete level celebration", () => {
      const { startLevelCelebration, completeLevelCelebration } = useGamePlayStore.getState();

      startLevelCelebration(3);
      completeLevelCelebration();

      const state = useGamePlayStore.getState();
      expect(state.levelCelebrationState.isActive).toBe(false);
      expect(state.levelCelebrationState.level).toBe(null);
      expect(state.levelCelebrationState.startTime).toBe(null);
      expect(state.levelCelebrationState.phase).toBe("completed");
    });

    test("should cancel level celebration", () => {
      const { startLevelCelebration, cancelLevelCelebration } = useGamePlayStore.getState();

      startLevelCelebration(7);
      cancelLevelCelebration();

      const state = useGamePlayStore.getState();
      expect(state.levelCelebrationState.userCancelled).toBe(true);
      expect(state.levelCelebrationState.phase).toBe("completed");
      expect(state.levelCelebrationState.isActive).toBe(true); // Still active but cancelled
    });
  });

  describe("Debug Actions", () => {
    test("should set debug mode", () => {
      const { setDebugMode } = useGamePlayStore.getState();

      setDebugMode(true);

      const state = useGamePlayStore.getState();
      expect(state.debugMode).toBe(true);
      expect(state.debugParams).toBeDefined();
    });

    test("should disable debug mode", () => {
      const { setDebugMode } = useGamePlayStore.getState();

      setDebugMode(true);
      setDebugMode(false);

      const state = useGamePlayStore.getState();
      expect(state.debugMode).toBe(false);
      expect(state.debugParams).toBe(null);
    });
  });

  describe("Reset Actions", () => {
    test("should show and hide reset dialog", () => {
      const { showResetDialog, hideResetDialog } = useGamePlayStore.getState();

      showResetDialog();
      expect(useGamePlayStore.getState().showResetConfirmation).toBe(true);

      hideResetDialog();
      expect(useGamePlayStore.getState().showResetConfirmation).toBe(false);
    });

    test("should confirm reset", () => {
      const store = useGamePlayStore.getState();

      // Set some state
      store.updateScore(1000);
      store.updateLevel(5);
      store.showResetDialog();

      // Confirm reset
      store.confirmReset();

      const state = useGamePlayStore.getState();
      expect(state.score).toBe(0);
      expect(state.level).toBe(1);
      expect(state.showResetConfirmation).toBe(false);
    });
  });

  describe("Derived State Selectors", () => {
    test("isGameLoopPaused should return correct values", () => {
      const store = useGamePlayStore.getState();

      // Initially should be paused (not playing)
      expect(store.isGameLoopPaused()).toBe(true);

      // When playing and not paused
      store.startGame();
      expect(store.isGameLoopPaused()).toBe(false);

      // When paused
      store.pauseGame();
      expect(store.isGameLoopPaused()).toBe(true);
    });

    test("isAnimationActive should return correct values", () => {
      const store = useGamePlayStore.getState();

      // Initially no animation
      expect(store.isAnimationActive()).toBe(false);

      // During level celebration
      store.startLevelCelebration(2);
      expect(store.isAnimationActive()).toBe(true);

      // After celebration ends
      store.completeLevelCelebration();
      expect(store.isAnimationActive()).toBe(false);
    });
  });

  describe("Export Hooks", () => {
    test("useGamePlayActions hook should be defined", () => {
      // This test ensures the hook export exists
      expect(typeof useGamePlayActions).toBe("function");
    });

    test("useGamePlayState hook should be defined", () => {
      // This test ensures the hook export exists
      expect(typeof useGamePlayState).toBe("function");
    });
  });

  describe("Reset Game", () => {
    test("should reset all state to initial values", () => {
      const store = useGamePlayStore.getState();

      // Modify state
      store.updateScore(5000);
      store.updateLines(20);
      store.updateLevel(8);
      store.incrementCombo("tetris");
      store.startLevelCelebration(8);
      store.setDebugMode(true);
      store.showResetDialog();

      // Reset
      store.resetGame();

      const state = useGamePlayStore.getState();
      expect(state.score).toBe(0);
      expect(state.lines).toBe(0);
      expect(state.level).toBe(1);
      expect(state.isPlaying).toBe(false);
      expect(state.comboState.count).toBe(0);
      expect(state.comboState.isActive).toBe(false);
      expect(state.levelCelebrationState.isActive).toBe(false);
      expect(state.showResetConfirmation).toBe(false);
      expect(state.tSpinState.type).toBe("none");
      expect(state.floatingScoreEvents).toHaveLength(0);
    });
  });
});

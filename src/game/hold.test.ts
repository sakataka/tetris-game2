import { describe, expect, test } from "bun:test";
import { calculateGhostPosition, createInitialGameState, holdCurrentPiece } from "./game";

describe("Hold Feature", () => {
  describe("holdCurrentPiece", () => {
    test("should initialize hold state correctly", () => {
      const state = createInitialGameState();
      expect(state.heldPiece).toBe(null);
      expect(state.canHold).toBe(true);
    });

    test("should perform initial hold correctly", () => {
      const state = createInitialGameState();
      const originalCurrentPieceType = state.currentPiece?.type;
      const originalNextPieceType = state.nextPiece;

      const newState = holdCurrentPiece(state);

      // Current piece should be saved as held piece
      expect(newState.heldPiece).toBe(originalCurrentPieceType);
      // Next piece should become current piece
      expect(newState.currentPiece?.type).toBe(originalNextPieceType);
      // New next piece should be generated
      expect(newState.nextPiece).toBeDefined();
      expect(newState.nextPiece).not.toBe(originalNextPieceType);
      // canHold should be false after hold
      expect(newState.canHold).toBe(false);
      // Ghost position should be updated
      expect(newState.ghostPosition).toEqual(calculateGhostPosition(newState));
    });

    test("should perform exchange hold correctly", () => {
      // First, do an initial hold
      let state = createInitialGameState();
      const firstPieceType = state.currentPiece?.type;
      state = holdCurrentPiece(state);

      // Reset canHold to simulate a new piece
      state = { ...state, canHold: true };

      // Remember the current piece type before exchange
      const secondPieceType = state.currentPiece?.type;

      // Perform exchange hold
      const newState = holdCurrentPiece(state);

      // Pieces should be swapped
      expect(newState.heldPiece).toBe(secondPieceType);
      expect(newState.currentPiece?.type).toBe(firstPieceType);
      // Next piece should remain unchanged in exchange hold
      expect(newState.nextPiece).toBe(state.nextPiece);
      // canHold should be false after hold
      expect(newState.canHold).toBe(false);
      // Ghost position should be updated
      expect(newState.ghostPosition).toEqual(calculateGhostPosition(newState));
    });

    test("should not allow hold when canHold is false", () => {
      const state = createInitialGameState();
      const stateWithCanHoldFalse = { ...state, canHold: false };

      const newState = holdCurrentPiece(stateWithCanHoldFalse);

      // State should remain unchanged
      expect(newState).toBe(stateWithCanHoldFalse);
    });

    test("should not allow hold when current piece is null", () => {
      const state = createInitialGameState();
      const stateWithNullPiece = { ...state, currentPiece: null };

      const newState = holdCurrentPiece(stateWithNullPiece);

      // State should remain unchanged
      expect(newState).toBe(stateWithNullPiece);
    });

    test("should not allow hold when game is over", () => {
      const state = createInitialGameState();
      const gameOverState = { ...state, isGameOver: true };

      const newState = holdCurrentPiece(gameOverState);

      // State should remain unchanged
      expect(newState).toBe(gameOverState);
    });

    test("should not allow hold when game is paused", () => {
      const state = createInitialGameState();
      const pausedState = { ...state, isPaused: true };

      const newState = holdCurrentPiece(pausedState);

      // State should remain unchanged
      expect(newState).toBe(pausedState);
    });

    test("should update ghost position after hold", () => {
      const state = createInitialGameState();
      const newState = holdCurrentPiece(state);

      // Ghost position should be calculated for the new current piece
      const expectedGhostPosition = calculateGhostPosition(newState);
      expect(newState.ghostPosition).toEqual(expectedGhostPosition);
    });

    test("should create new tetromino instance in correct position", () => {
      const state = createInitialGameState();
      const newState = holdCurrentPiece(state);

      // New current piece should be positioned at spawn location
      expect(newState.currentPiece?.position.x).toBeDefined();
      expect(newState.currentPiece?.position.y).toBeDefined();
      expect(newState.currentPiece?.rotation).toBe(0);
      expect(newState.currentPiece?.shape).toBeDefined();
    });

    test("should handle multiple holds correctly (one-lock rule)", () => {
      let state = createInitialGameState();
      const originalPieceType = state.currentPiece?.type;

      // First hold should work
      state = holdCurrentPiece(state);
      expect(state.canHold).toBe(false);
      expect(state.heldPiece).toBe(originalPieceType);

      // Second hold should not work (canHold is false)
      const attemptedSecondHold = holdCurrentPiece(state);
      expect(attemptedSecondHold).toBe(state); // State unchanged

      // After piece is locked (simulated by resetting canHold), hold should work again
      const stateAfterLock = { ...state, canHold: true };
      const thirdHold = holdCurrentPiece(stateAfterLock);
      expect(thirdHold.canHold).toBe(false);
      expect(thirdHold).not.toBe(stateAfterLock); // State should change
    });

    test("should preserve other game state properties", () => {
      const state = createInitialGameState();
      // Set some game state properties
      const modifiedState = {
        ...state,
        score: 1000,
        lines: 5,
        level: 2,
        placedPositions: [{ x: 0, y: 19 }],
        clearingLines: [19],
        animationTriggerKey: 5,
      };

      const newState = holdCurrentPiece(modifiedState);

      // These properties should be preserved
      expect(newState.score).toBe(1000);
      expect(newState.lines).toBe(5);
      expect(newState.level).toBe(2);
      expect(newState.placedPositions).toEqual([{ x: 0, y: 19 }]);
      expect(newState.clearingLines).toEqual([19]);
      expect(newState.animationTriggerKey).toBe(5);
      expect(newState.board).toBe(modifiedState.board);
      expect(newState.boardBeforeClear).toBe(modifiedState.boardBeforeClear);
      expect(newState.isGameOver).toBe(modifiedState.isGameOver);
      expect(newState.isPaused).toBe(modifiedState.isPaused);
    });
  });
});

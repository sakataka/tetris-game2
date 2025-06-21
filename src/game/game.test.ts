import { describe, expect, it } from "vitest";
import { BOARD_HEIGHT, BOARD_WIDTH } from "../types/game";
import { calculateScore, createInitialGameState, dropPiece, movePiece, rotatePiece } from "./game";

describe("Game Logic", () => {
  describe("createInitialGameState", () => {
    it("should create initial game state", () => {
      const state = createInitialGameState();
      expect(state.board.length).toBe(BOARD_HEIGHT);
      expect(state.board[0].length).toBe(BOARD_WIDTH);
      expect(state.score).toBe(0);
      expect(state.lines).toBe(0);
      expect(state.level).toBe(1);
      expect(state.isGameOver).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.currentPiece).toBeDefined();
      expect(state.nextPiece).toBeDefined();
    });
  });

  describe("movePiece", () => {
    it("should move piece left", () => {
      const state = createInitialGameState();
      const initialX = state.currentPiece?.position.x ?? 0;
      const newState = movePiece(state, -1, 0);
      expect(newState.currentPiece?.position.x).toBe(initialX - 1);
    });

    it("should move piece right", () => {
      const state = createInitialGameState();
      const initialX = state.currentPiece?.position.x ?? 0;
      const newState = movePiece(state, 1, 0);
      expect(newState.currentPiece?.position.x).toBe(initialX + 1);
    });

    it("should move piece down", () => {
      const state = createInitialGameState();
      const initialY = state.currentPiece?.position.y ?? 0;
      const newState = movePiece(state, 0, 1);
      expect(newState.currentPiece?.position.y).toBe(initialY + 1);
    });

    it("should not move piece if invalid position", () => {
      const state = createInitialGameState();
      // Move piece to left edge
      let newState = state;
      for (let i = 0; i < BOARD_WIDTH; i++) {
        newState = movePiece(newState, -1, 0);
      }
      // Try to move further left
      const finalState = movePiece(newState, -1, 0);
      expect(finalState.currentPiece?.position.x).toBe(newState.currentPiece?.position.x);
    });
  });

  describe("rotatePiece", () => {
    it("should rotate current piece", () => {
      const state = createInitialGameState();
      const initialRotation = state.currentPiece?.rotation ?? 0;
      const newState = rotatePiece(state);
      expect(newState.currentPiece?.rotation).toBe((initialRotation + 1) % 4);
    });
  });

  describe("dropPiece", () => {
    it("should drop piece to bottom", () => {
      const state = createInitialGameState();
      const newState = dropPiece(state);
      // The piece should be placed on the board
      expect(newState.currentPiece).not.toBe(state.currentPiece);
    });
  });

  describe("calculateScore", () => {
    it("should calculate score for 1 line", () => {
      expect(calculateScore(1, 1)).toBe(100);
    });

    it("should calculate score for 2 lines", () => {
      expect(calculateScore(2, 1)).toBe(300);
    });

    it("should calculate score for 3 lines", () => {
      expect(calculateScore(3, 1)).toBe(500);
    });

    it("should calculate score for 4 lines (tetris)", () => {
      expect(calculateScore(4, 1)).toBe(800);
    });

    it("should increase score with level", () => {
      expect(calculateScore(1, 2)).toBe(200);
      expect(calculateScore(4, 5)).toBe(4000);
    });
  });
});

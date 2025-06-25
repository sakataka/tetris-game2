import { describe, expect, test } from "bun:test";
import { BOARD_HEIGHT, BOARD_WIDTH } from "../utils/constants";
import {
  calculateScore,
  createInitialGameState,
  hardDropTetromino,
  moveTetrominoBy,
  rotateTetrominoCW,
} from "./game";

describe("Game Logic", () => {
  describe("createInitialGameState", () => {
    test("should create initial game state", () => {
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

  describe("moveTetrominoBy", () => {
    test("should move piece left", () => {
      const state = createInitialGameState();
      const initialX = state.currentPiece?.position.x ?? 0;
      const newState = moveTetrominoBy(state, -1, 0);
      expect(newState.currentPiece?.position.x).toBe(initialX - 1);
    });

    test("should move piece right", () => {
      const state = createInitialGameState();
      const initialX = state.currentPiece?.position.x ?? 0;
      const newState = moveTetrominoBy(state, 1, 0);
      expect(newState.currentPiece?.position.x).toBe(initialX + 1);
    });

    test("should move piece down", () => {
      const state = createInitialGameState();
      const initialY = state.currentPiece?.position.y ?? 0;
      const newState = moveTetrominoBy(state, 0, 1);
      expect(newState.currentPiece?.position.y).toBe(initialY + 1);
    });

    test("should not move piece if invalid position", () => {
      const state = createInitialGameState();
      // Move piece to left edge
      let newState = state;
      for (let i = 0; i < BOARD_WIDTH; i++) {
        newState = moveTetrominoBy(newState, -1, 0);
      }
      // Try to move further left
      const finalState = moveTetrominoBy(newState, -1, 0);
      expect(finalState.currentPiece?.position.x).toBe(newState.currentPiece?.position.x);
    });
  });

  describe("rotateTetrominoCW", () => {
    test("should rotate current piece", () => {
      const state = createInitialGameState();
      const initialRotation = state.currentPiece?.rotation ?? 0;
      const newState = rotateTetrominoCW(state);
      expect(newState.currentPiece?.rotation).toBe((initialRotation + 1) % 4);
    });

    test("should use wall kick when basic rotation fails", () => {
      const state = createInitialGameState();

      // Move piece to left edge where basic rotation might fail
      let edgeState = state;
      for (let i = 0; i < 3; i++) {
        edgeState = moveTetrominoBy(edgeState, -1, 0);
      }

      const initialRotation = edgeState.currentPiece?.rotation ?? 0;
      const newState = rotateTetrominoCW(edgeState);

      // Should successfully rotate with wall kick compensation
      expect(newState.currentPiece?.rotation).toBe((initialRotation + 1) % 4);
    });

    test("should maintain position when wall kick finds valid spot", () => {
      const state = createInitialGameState();
      const newState = rotateTetrominoCW(state);

      // Should have valid position after rotation
      expect(newState.currentPiece?.position.x).toBeGreaterThanOrEqual(0);
      expect(newState.currentPiece?.position.x).toBeLessThan(BOARD_WIDTH);
      expect(newState.currentPiece?.position.y).toBeGreaterThanOrEqual(0);
    });

    test("should not rotate when game is paused", () => {
      const state = { ...createInitialGameState(), isPaused: true };
      const newState = rotateTetrominoCW(state);
      expect(newState).toBe(state);
    });

    test("should not rotate when game is over", () => {
      const state = { ...createInitialGameState(), isGameOver: true };
      const newState = rotateTetrominoCW(state);
      expect(newState).toBe(state);
    });
  });

  describe("hardDropTetromino", () => {
    test("should drop piece to bottom", () => {
      const state = createInitialGameState();
      const newState = hardDropTetromino(state);
      // The piece should be placed on the board
      expect(newState.currentPiece).not.toBe(state.currentPiece);
    });
  });

  describe("calculateScore", () => {
    test("should calculate score for 1 line", () => {
      expect(calculateScore(1, 1)).toBe(100);
    });

    test("should calculate score for 2 lines", () => {
      expect(calculateScore(2, 1)).toBe(300);
    });

    test("should calculate score for 3 lines", () => {
      expect(calculateScore(3, 1)).toBe(500);
    });

    test("should calculate score for 4 lines (tetris)", () => {
      expect(calculateScore(4, 1)).toBe(800);
    });

    test("should increase score with level", () => {
      expect(calculateScore(1, 2)).toBe(200);
      expect(calculateScore(4, 5)).toBe(4000);
    });
  });
});

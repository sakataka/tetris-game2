import { describe, expect, test } from "bun:test";
import { GAME_CONSTANTS } from "../utils/gameConstants";
import { createEmptyBoard } from "./board";
import {
  calculateScore,
  checkGameOver,
  clearCompletedLines,
  createInitialGameState,
  hardDropTetromino,
  moveTetrominoBy,
  placePieceOnBoard,
  preserveBoardForAnimation,
  rotateTetrominoCW,
  spawnNextPiece,
} from "./game";
import { createTetromino } from "./tetrominos";

describe("Game Logic", () => {
  describe("createInitialGameState", () => {
    test("should create initial game state", () => {
      const state = createInitialGameState();
      expect(state.board.length).toBe(GAME_CONSTANTS.BOARD.HEIGHT);
      expect(state.board[0].length).toBe(GAME_CONSTANTS.BOARD.WIDTH);
      expect(state.score).toBe(0);
      expect(state.lines).toBe(0);
      expect(state.level).toBe(1);
      expect(state.isGameOver).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.currentPiece).toBeDefined();
      expect(state.nextPiece).toBeDefined();
      expect(state.pieceBag).toBeDefined();
      expect(Array.isArray(state.pieceBag)).toBe(true);
    });

    test("should use 7-bag system for piece generation", () => {
      const state = createInitialGameState();
      // Should have valid current and next pieces from 7-bag system
      expect(["I", "O", "T", "S", "Z", "J", "L"]).toContain(state.currentPiece?.type);
      expect(["I", "O", "T", "S", "Z", "J", "L"]).toContain(state.nextPiece);
      // Bag should contain the remaining pieces
      expect(state.pieceBag.length).toBeLessThanOrEqual(7);
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
      for (let i = 0; i < GAME_CONSTANTS.BOARD.WIDTH; i++) {
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
      expect(newState.currentPiece?.position.x).toBeLessThan(GAME_CONSTANTS.BOARD.WIDTH);
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

  describe("preserveBoardForAnimation", () => {
    test("should return board when clearing lines exist", () => {
      const board = createEmptyBoard();
      const clearingLines = [0, 1];
      const result = preserveBoardForAnimation(board, clearingLines);
      expect(result).toBe(board);
    });

    test("should return null when no clearing lines", () => {
      const board = createEmptyBoard();
      const clearingLines: number[] = [];
      const result = preserveBoardForAnimation(board, clearingLines);
      expect(result).toBeNull();
    });
  });

  describe("checkGameOver", () => {
    test("should return false when piece can be placed", () => {
      const board = createEmptyBoard();
      const piece = createTetromino("T");
      const result = checkGameOver(board, piece);
      expect(result).toBe(false);
    });

    test("should return true when piece cannot be placed", () => {
      const board = createEmptyBoard();
      // Fill the top row to create collision
      for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH; x++) {
        board[0][x] = 1;
      }
      const piece = createTetromino("T");
      const result = checkGameOver(board, piece);
      expect(result).toBe(true);
    });
  });

  describe("spawnNextPiece", () => {
    test("should create new piece and update bag", () => {
      const nextPieceType = "T";
      const pieceBag = ["I", "O", "S", "Z", "J", "L"];
      const result = spawnNextPiece(nextPieceType, pieceBag);

      expect(result.currentPiece.type).toBe("T");
      expect(result.nextPiece).toBeDefined();
      expect(["I", "O", "S", "Z", "J", "L"]).toContain(result.nextPiece);
      expect(result.pieceBag).toBeDefined();
      expect(Array.isArray(result.pieceBag)).toBe(true);
    });

    test("should handle empty bag correctly", () => {
      const nextPieceType = "I";
      const pieceBag: string[] = [];
      const result = spawnNextPiece(nextPieceType, pieceBag);

      expect(result.currentPiece.type).toBe("I");
      expect(result.nextPiece).toBeDefined();
      expect(result.pieceBag.length).toBeGreaterThan(0);
    });
  });

  describe("clearCompletedLines", () => {
    test("should not change score when no lines cleared", () => {
      const board = createEmptyBoard();
      const result = clearCompletedLines(board, 100, 5, 2);

      expect(result.score).toBe(100);
      expect(result.lines).toBe(5);
      expect(result.level).toBe(1); // Level is calculated as Math.floor(lines / LINES_PER_LEVEL) + 1
      expect(result.clearingLines).toEqual([]);
    });

    test("should update score and level when lines cleared", () => {
      const board = createEmptyBoard();
      // Fill bottom row to create a complete line
      for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH; x++) {
        board[GAME_CONSTANTS.BOARD.HEIGHT - 1][x] = 1;
      }

      const result = clearCompletedLines(board, 0, 0, 1);

      expect(result.score).toBe(100); // 1 line * level 1
      expect(result.lines).toBe(1);
      expect(result.level).toBe(1);
      expect(result.clearingLines).toEqual([GAME_CONSTANTS.BOARD.HEIGHT - 1]);
    });
  });

  describe("placePieceOnBoard", () => {
    test("should place piece on board", () => {
      const state = createInitialGameState();
      const result = placePieceOnBoard(state);

      expect(result.board).toBeDefined();
      expect(result.placedPositions).toBeDefined();
      expect(Array.isArray(result.placedPositions)).toBe(true);
      expect(result.placedPositions.length).toBeGreaterThan(0);
    });

    test("should return empty positions when no current piece", () => {
      const state = { ...createInitialGameState(), currentPiece: null };
      const result = placePieceOnBoard(state);

      expect(result.board).toBe(state.board);
      expect(result.placedPositions).toEqual([]);
    });
  });
});

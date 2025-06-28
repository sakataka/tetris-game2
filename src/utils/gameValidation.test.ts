import { describe, expect, test } from "bun:test";
import type { GameBoard, Tetromino } from "@/types/game";
import {
  canPerformHoldAction,
  canPlacePieceAt,
  isCellOccupied,
  isGameOverState,
  isGamePlayable,
} from "./gameValidation";

describe("gameValidation", () => {
  const mockCurrentPiece: Tetromino = {
    type: "I",
    shape: [[1, 1, 1, 1]],
    position: { x: 3, y: 0 },
    rotation: 0,
  };

  const emptyBoard: GameBoard = Array(20)
    .fill(null)
    .map(() => Array(10).fill(0)) as GameBoard;

  const occupiedBoard: GameBoard = Array(20)
    .fill(null)
    .map(() => Array(10).fill(0)) as GameBoard;
  occupiedBoard[0][0] = 1; // Occupy top-left cell

  describe("isGamePlayable", () => {
    test("should return true when game is playable", () => {
      const state = {
        currentPiece: mockCurrentPiece,
        isGameOver: false,
        isPaused: false,
      };
      expect(isGamePlayable(state)).toBe(true);
    });

    test("should return false when no current piece", () => {
      const state = {
        currentPiece: null,
        isGameOver: false,
        isPaused: false,
      };
      expect(isGamePlayable(state)).toBe(false);
    });

    test("should return false when game is over", () => {
      const state = {
        currentPiece: mockCurrentPiece,
        isGameOver: true,
        isPaused: false,
      };
      expect(isGamePlayable(state)).toBe(false);
    });

    test("should return false when game is paused", () => {
      const state = {
        currentPiece: mockCurrentPiece,
        isGameOver: false,
        isPaused: true,
      };
      expect(isGamePlayable(state)).toBe(false);
    });
  });

  describe("canPerformHoldAction", () => {
    test("should return true when hold action is allowed", () => {
      const state = {
        currentPiece: mockCurrentPiece,
        canHold: true,
        isGameOver: false,
        isPaused: false,
      };
      expect(canPerformHoldAction(state)).toBe(true);
    });

    test("should return false when cannot hold", () => {
      const state = {
        currentPiece: mockCurrentPiece,
        canHold: false,
        isGameOver: false,
        isPaused: false,
      };
      expect(canPerformHoldAction(state)).toBe(false);
    });

    test("should return false when no current piece", () => {
      const state = {
        currentPiece: null,
        canHold: true,
        isGameOver: false,
        isPaused: false,
      };
      expect(canPerformHoldAction(state)).toBe(false);
    });

    test("should return false when game is over", () => {
      const state = {
        currentPiece: mockCurrentPiece,
        canHold: true,
        isGameOver: true,
        isPaused: false,
      };
      expect(canPerformHoldAction(state)).toBe(false);
    });

    test("should return false when game is paused", () => {
      const state = {
        currentPiece: mockCurrentPiece,
        canHold: true,
        isGameOver: false,
        isPaused: true,
      };
      expect(canPerformHoldAction(state)).toBe(false);
    });
  });

  describe("isCellOccupied", () => {
    test("should return false for empty cell", () => {
      expect(isCellOccupied(emptyBoard, { x: 5, y: 10 })).toBe(false);
    });

    test("should return true for occupied cell", () => {
      expect(isCellOccupied(occupiedBoard, { x: 0, y: 0 })).toBe(true);
    });

    test("should return false for out-of-bounds position", () => {
      expect(isCellOccupied(emptyBoard, { x: -1, y: 0 })).toBe(false);
      expect(isCellOccupied(emptyBoard, { x: 0, y: -1 })).toBe(false);
      expect(isCellOccupied(emptyBoard, { x: 20, y: 0 })).toBe(false);
      expect(isCellOccupied(emptyBoard, { x: 0, y: 30 })).toBe(false);
    });
  });

  describe("canPlacePieceAt", () => {
    const smallShape = [
      [1, 1],
      [1, 1],
    ];

    test("should return true for valid placement", () => {
      expect(canPlacePieceAt(emptyBoard, smallShape, { x: 0, y: 0 })).toBe(true);
      expect(canPlacePieceAt(emptyBoard, smallShape, { x: 8, y: 18 })).toBe(true);
    });

    test("should return false when piece would go out of bounds", () => {
      expect(canPlacePieceAt(emptyBoard, smallShape, { x: -1, y: 0 })).toBe(false);
      expect(canPlacePieceAt(emptyBoard, smallShape, { x: 0, y: -1 })).toBe(false);
      expect(canPlacePieceAt(emptyBoard, smallShape, { x: 9, y: 0 })).toBe(false); // 2-wide piece at x=9 goes to x=10
      expect(canPlacePieceAt(emptyBoard, smallShape, { x: 0, y: 19 })).toBe(false); // 2-tall piece at y=19 goes to y=20
    });

    test("should return false when piece overlaps occupied cells", () => {
      expect(canPlacePieceAt(occupiedBoard, smallShape, { x: 0, y: 0 })).toBe(false);
    });

    test("should handle pieces with empty cells (0 values)", () => {
      const tShape = [
        [0, 1, 0],
        [1, 1, 1],
      ];
      expect(canPlacePieceAt(emptyBoard, tShape, { x: 0, y: 0 })).toBe(true);
      expect(canPlacePieceAt(occupiedBoard, tShape, { x: 1, y: 0 })).toBe(true); // T-piece center at (1,1), empty cell at (0,0)
    });
  });

  describe("isGameOverState", () => {
    test("should return false when piece can be placed", () => {
      expect(isGameOverState(emptyBoard, mockCurrentPiece)).toBe(false);
    });

    test("should return true when piece cannot be placed", () => {
      const blockedBoard: GameBoard = Array(20)
        .fill(null)
        .map(() => Array(10).fill(0)) as GameBoard;

      // Block the spawn area
      for (let x = 0; x < 10; x++) {
        blockedBoard[0][x] = 1;
      }

      expect(isGameOverState(blockedBoard, mockCurrentPiece)).toBe(true);
    });
  });
});

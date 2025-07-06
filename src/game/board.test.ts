import { describe, expect, test } from "bun:test";
import { GAME_CONSTANTS } from "@/utils/gameConstants";
import { clearLines, createEmptyBoard, isValidPosition, placeTetrominoLegacy } from "./board";

describe("Board", () => {
  describe("createEmptyBoard", () => {
    test("should create a board with correct dimensions", () => {
      const board = createEmptyBoard();
      expect(board.length).toBe(GAME_CONSTANTS.BOARD.HEIGHT);
      expect(board[0].length).toBe(GAME_CONSTANTS.BOARD.WIDTH);
    });

    test("should initialize all cells to 0", () => {
      const board = createEmptyBoard();
      board.forEach((row) => {
        row.forEach((cell) => {
          expect(cell).toBe(0);
        });
      });
    });
  });

  describe("isValidPosition", () => {
    test("should return true for valid position", () => {
      const board = createEmptyBoard();
      const shape = [[1]];
      expect(isValidPosition(board, shape, { x: 0, y: 0 })).toBe(true);
    });

    test("should return false for position outside board", () => {
      const board = createEmptyBoard();
      const shape = [[1]];
      expect(isValidPosition(board, shape, { x: -1, y: 0 })).toBe(false);
      expect(isValidPosition(board, shape, { x: GAME_CONSTANTS.BOARD.WIDTH, y: 0 })).toBe(false);
      expect(isValidPosition(board, shape, { x: 0, y: GAME_CONSTANTS.BOARD.HEIGHT })).toBe(false);
    });

    test("should return false for collision with existing piece", () => {
      const board = createEmptyBoard();
      board[0][0] = 1;
      const shape = [[1]];
      expect(isValidPosition(board, shape, { x: 0, y: 0 })).toBe(false);
    });
  });

  describe("placeTetromino", () => {
    test("should place tetromino on board", () => {
      const board = createEmptyBoard();
      const shape = [
        [1, 1],
        [1, 1],
      ];
      const newBoard = placeTetrominoLegacy(board, shape, { x: 0, y: 0 }, 1);
      expect(newBoard[0][0]).toBe(1);
      expect(newBoard[0][1]).toBe(1);
      expect(newBoard[1][0]).toBe(1);
      expect(newBoard[1][1]).toBe(1);
    });
  });

  describe("clearLines", () => {
    test("should clear full lines and return count", () => {
      const board = createEmptyBoard();
      // Fill bottom row
      for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH; x++) {
        board[GAME_CONSTANTS.BOARD.HEIGHT - 1][x] = 1;
      }
      const { board: newBoard, linesCleared } = clearLines(board);
      expect(linesCleared).toBe(1);
      // Check that bottom row is now empty
      expect(newBoard[GAME_CONSTANTS.BOARD.HEIGHT - 1].every((cell) => cell === 0)).toBe(true);
    });

    test("should clear multiple lines", () => {
      const board = createEmptyBoard();
      // Fill bottom two rows
      for (let y = GAME_CONSTANTS.BOARD.HEIGHT - 2; y < GAME_CONSTANTS.BOARD.HEIGHT; y++) {
        for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH; x++) {
          board[y][x] = 1;
        }
      }
      const { linesCleared } = clearLines(board);
      expect(linesCleared).toBe(2);
    });
  });
});

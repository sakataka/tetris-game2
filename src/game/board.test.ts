import { describe, expect, it } from "vitest";
import { BOARD_HEIGHT, BOARD_WIDTH } from "../utils/constants";
import { clearLines, createEmptyBoard, isValidPosition, placeTetromino } from "./board";

describe("Board", () => {
  describe("createEmptyBoard", () => {
    it("should create a board with correct dimensions", () => {
      const board = createEmptyBoard();
      expect(board.length).toBe(BOARD_HEIGHT);
      expect(board[0].length).toBe(BOARD_WIDTH);
    });

    it("should initialize all cells to 0", () => {
      const board = createEmptyBoard();
      board.forEach((row) => {
        row.forEach((cell) => {
          expect(cell).toBe(0);
        });
      });
    });
  });

  describe("isValidPosition", () => {
    it("should return true for valid position", () => {
      const board = createEmptyBoard();
      const shape = [[1]];
      expect(isValidPosition(board, shape, { x: 0, y: 0 })).toBe(true);
    });

    it("should return false for position outside board", () => {
      const board = createEmptyBoard();
      const shape = [[1]];
      expect(isValidPosition(board, shape, { x: -1, y: 0 })).toBe(false);
      expect(isValidPosition(board, shape, { x: BOARD_WIDTH, y: 0 })).toBe(false);
      expect(isValidPosition(board, shape, { x: 0, y: BOARD_HEIGHT })).toBe(false);
    });

    it("should return false for collision with existing piece", () => {
      const board = createEmptyBoard();
      board[0][0] = 1;
      const shape = [[1]];
      expect(isValidPosition(board, shape, { x: 0, y: 0 })).toBe(false);
    });
  });

  describe("placeTetromino", () => {
    it("should place tetromino on board", () => {
      const board = createEmptyBoard();
      const shape = [
        [1, 1],
        [1, 1],
      ];
      const newBoard = placeTetromino(board, shape, { x: 0, y: 0 }, 1);
      expect(newBoard[0][0]).toBe(1);
      expect(newBoard[0][1]).toBe(1);
      expect(newBoard[1][0]).toBe(1);
      expect(newBoard[1][1]).toBe(1);
    });
  });

  describe("clearLines", () => {
    it("should clear full lines and return count", () => {
      const board = createEmptyBoard();
      // Fill bottom row
      for (let x = 0; x < BOARD_WIDTH; x++) {
        board[BOARD_HEIGHT - 1][x] = 1;
      }
      const { board: newBoard, linesCleared } = clearLines(board);
      expect(linesCleared).toBe(1);
      // Check that bottom row is now empty
      expect(newBoard[BOARD_HEIGHT - 1].every((cell) => cell === 0)).toBe(true);
    });

    it("should clear multiple lines", () => {
      const board = createEmptyBoard();
      // Fill bottom two rows
      for (let y = BOARD_HEIGHT - 2; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          board[y][x] = 1;
        }
      }
      const { linesCleared } = clearLines(board);
      expect(linesCleared).toBe(2);
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  canPlacePiece,
  clearCell,
  clearLine,
  clearLines,
  copyMatrix,
  createMatrix,
  findFullRows,
  isOccupied,
  isRowEmpty,
  isRowFull,
  matrixToString,
  placePiece,
  setCell,
} from "../src/core/bitboard.js";
import { MAX_ROWS, VISIBLE_COLS } from "../src/types.js";

describe("BitBoard Operations", () => {
  describe("createMatrix", () => {
    it("should create empty matrix with default size", () => {
      const matrix = createMatrix();
      expect(matrix.length).toBe(MAX_ROWS);
      expect(matrix[0]).toBe(0);
      expect(matrix[MAX_ROWS - 1]).toBe(0);
    });

    it("should create empty matrix with custom size", () => {
      const matrix = createMatrix(10);
      expect(matrix.length).toBe(10);
      expect(matrix[0]).toBe(0);
      expect(matrix[9]).toBe(0);
    });
  });

  describe("setCell", () => {
    it("should set cell at valid position", () => {
      const matrix = createMatrix(5);
      const newMatrix = setCell(matrix, 2, 3);

      expect(isOccupied(newMatrix, 2, 3)).toBe(true);
      expect(isOccupied(matrix, 2, 3)).toBe(false); // Original unchanged
    });

    it("should throw error for invalid position", () => {
      const matrix = createMatrix(5);

      expect(() => setCell(matrix, -1, 3)).toThrow();
      expect(() => setCell(matrix, 5, 3)).toThrow();
      expect(() => setCell(matrix, 2, -1)).toThrow();
      expect(() => setCell(matrix, 2, VISIBLE_COLS)).toThrow();
    });
  });

  describe("clearCell", () => {
    it("should clear occupied cell", () => {
      const matrix = createMatrix(5);
      const matrixWithCell = setCell(matrix, 2, 3);
      const clearedMatrix = clearCell(matrixWithCell, 2, 3);

      expect(isOccupied(clearedMatrix, 2, 3)).toBe(false);
    });

    it("should handle clearing empty cell", () => {
      const matrix = createMatrix(5);
      const clearedMatrix = clearCell(matrix, 2, 3);

      expect(isOccupied(clearedMatrix, 2, 3)).toBe(false);
    });
  });

  describe("isOccupied", () => {
    it("should detect occupied cells", () => {
      const matrix = createMatrix(5);
      const newMatrix = setCell(matrix, 2, 3);

      expect(isOccupied(newMatrix, 2, 3)).toBe(true);
      expect(isOccupied(newMatrix, 2, 4)).toBe(false);
    });

    it("should return true for out of bounds", () => {
      const matrix = createMatrix(5);

      expect(isOccupied(matrix, -1, 3)).toBe(true);
      expect(isOccupied(matrix, 5, 3)).toBe(true);
      expect(isOccupied(matrix, 2, -1)).toBe(true);
      expect(isOccupied(matrix, 2, VISIBLE_COLS)).toBe(true);
    });
  });

  describe("isRowFull", () => {
    it("should detect full row", () => {
      let matrix = createMatrix(5);

      // Fill entire row
      for (let col = 0; col < VISIBLE_COLS; col++) {
        matrix = setCell(matrix, 2, col);
      }

      expect(isRowFull(matrix, 2)).toBe(true);
      expect(isRowFull(matrix, 1)).toBe(false);
    });

    it("should detect partial row as not full", () => {
      let matrix = createMatrix(5);

      // Fill partial row
      for (let col = 0; col < VISIBLE_COLS - 1; col++) {
        matrix = setCell(matrix, 2, col);
      }

      expect(isRowFull(matrix, 2)).toBe(false);
    });
  });

  describe("isRowEmpty", () => {
    it("should detect empty row", () => {
      const matrix = createMatrix(5);
      expect(isRowEmpty(matrix, 2)).toBe(true);
    });

    it("should detect non-empty row", () => {
      const matrix = createMatrix(5);
      const newMatrix = setCell(matrix, 2, 3);

      expect(isRowEmpty(newMatrix, 2)).toBe(false);
    });
  });

  describe("clearLine", () => {
    it("should clear line and shift rows down", () => {
      let matrix = createMatrix(5);

      // Set up test pattern
      matrix = setCell(matrix, 0, 0); // Top row
      matrix = setCell(matrix, 1, 1); // Row to be cleared
      matrix = setCell(matrix, 2, 2); // Bottom row

      const newMatrix = clearLine(matrix, 1);

      expect(isOccupied(newMatrix, 0, 0)).toBe(false); // Top row cleared
      expect(isOccupied(newMatrix, 1, 0)).toBe(true); // Original top row shifted down
      expect(isOccupied(newMatrix, 2, 2)).toBe(true); // Bottom row unchanged
    });
  });

  describe("clearLines", () => {
    it("should clear multiple lines", () => {
      let matrix = createMatrix(5);

      // Set up test pattern
      matrix = setCell(matrix, 0, 0);
      matrix = setCell(matrix, 1, 1);
      matrix = setCell(matrix, 2, 2);
      matrix = setCell(matrix, 3, 3);

      const newMatrix = clearLines(matrix, [1, 2]);

      expect(isOccupied(newMatrix, 0, 0)).toBe(false);
      expect(isOccupied(newMatrix, 1, 0)).toBe(false);
      expect(isOccupied(newMatrix, 2, 0)).toBe(true); // Original row 0 shifted down
      expect(isOccupied(newMatrix, 3, 3)).toBe(true); // Bottom row unchanged
    });
  });

  describe("findFullRows", () => {
    it("should find all full rows", () => {
      let matrix = createMatrix(5);

      // Fill row 1 completely
      for (let col = 0; col < VISIBLE_COLS; col++) {
        matrix = setCell(matrix, 1, col);
      }

      // Fill row 3 completely
      for (let col = 0; col < VISIBLE_COLS; col++) {
        matrix = setCell(matrix, 3, col);
      }

      const fullRows = findFullRows(matrix);
      expect(fullRows).toEqual([1, 3]);
    });

    it("should return empty array when no full rows", () => {
      const matrix = createMatrix(5);
      const fullRows = findFullRows(matrix);
      expect(fullRows).toEqual([]);
    });
  });

  describe("placePiece", () => {
    it("should place piece on matrix", () => {
      const matrix = createMatrix(5);
      const shape = [
        [true, false],
        [true, true],
      ];

      const newMatrix = placePiece(matrix, shape, 2, 1);

      expect(isOccupied(newMatrix, 1, 2)).toBe(true);
      expect(isOccupied(newMatrix, 1, 3)).toBe(false);
      expect(isOccupied(newMatrix, 2, 2)).toBe(true);
      expect(isOccupied(newMatrix, 2, 3)).toBe(true);
    });

    it("should handle piece placement at boundaries", () => {
      const matrix = createMatrix(5);
      const shape = [[true]];

      const newMatrix = placePiece(matrix, shape, 0, 0);
      expect(isOccupied(newMatrix, 0, 0)).toBe(true);
    });
  });

  describe("canPlacePiece", () => {
    it("should allow placement in empty area", () => {
      const matrix = createMatrix(5);
      const shape = [
        [true, false],
        [true, true],
      ];

      expect(canPlacePiece(matrix, shape, 2, 1)).toBe(true);
    });

    it("should prevent placement with collision", () => {
      let matrix = createMatrix(5);
      matrix = setCell(matrix, 2, 2);

      const shape = [
        [true, false],
        [true, true],
      ];

      expect(canPlacePiece(matrix, shape, 2, 1)).toBe(false);
    });

    it("should prevent placement out of bounds", () => {
      const matrix = createMatrix(5);
      const shape = [[true]];

      expect(canPlacePiece(matrix, shape, -1, 0)).toBe(false);
      expect(canPlacePiece(matrix, shape, VISIBLE_COLS, 0)).toBe(false);
      expect(canPlacePiece(matrix, shape, 0, -1)).toBe(false);
      expect(canPlacePiece(matrix, shape, 0, 5)).toBe(false);
    });
  });

  describe("matrixToString", () => {
    it("should convert matrix to string representation", () => {
      let matrix = createMatrix(3);
      matrix = setCell(matrix, 0, 0);
      matrix = setCell(matrix, 1, 1);

      const str = matrixToString(matrix);
      expect(str).toContain("■");
      expect(str).toContain("□");
      expect(str.split("\n")).toHaveLength(3);
    });
  });

  describe("copyMatrix", () => {
    it("should create deep copy of matrix", () => {
      let matrix = createMatrix(3);
      matrix = setCell(matrix, 1, 1);

      const copy = copyMatrix(matrix);

      expect(copy).not.toBe(matrix);
      expect(copy[1]).toBe(matrix[1]);
      expect(isOccupied(copy, 1, 1)).toBe(true);
    });
  });
});

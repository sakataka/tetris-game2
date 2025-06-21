import { describe, expect, it } from "vitest";
import { getTetrominoShape, rotateTetromino } from "./tetrominos";

describe("Tetrominos", () => {
  describe("getTetrominoShape", () => {
    it("should return correct shape for I piece", () => {
      const shape = getTetrominoShape("I");
      expect(shape).toEqual([
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
    });

    it("should return correct shape for O piece", () => {
      const shape = getTetrominoShape("O");
      expect(shape).toEqual([
        [1, 1],
        [1, 1],
      ]);
    });

    it("should return correct shape for T piece", () => {
      const shape = getTetrominoShape("T");
      expect(shape).toEqual([
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ]);
    });
  });

  describe("rotateTetromino", () => {
    it("should rotate I piece clockwise", () => {
      const shape = getTetrominoShape("I");
      const rotated = rotateTetromino(shape);
      expect(rotated).toEqual([
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
      ]);
    });

    it("should rotate T piece clockwise", () => {
      const shape = getTetrominoShape("T");
      const rotated = rotateTetromino(shape);
      expect(rotated).toEqual([
        [0, 1, 0],
        [0, 1, 1],
        [0, 1, 0],
      ]);
    });

    it("should return to original after 4 rotations", () => {
      const shape = getTetrominoShape("T");
      let rotated = shape;
      for (let i = 0; i < 4; i++) {
        rotated = rotateTetromino(rotated);
      }
      expect(rotated).toEqual(shape);
    });
  });
});

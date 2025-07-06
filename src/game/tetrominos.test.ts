import { describe, expect, test } from "bun:test";
import { getTetrominoShape, rotateTetromino, rotateTetromino180 } from "./tetrominos";

describe("Tetrominos", () => {
  describe("getTetrominoShape", () => {
    test("should return correct shape for I piece", () => {
      const shape = getTetrominoShape("I");
      expect(shape).toEqual([
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
    });

    test("should return correct shape for O piece", () => {
      const shape = getTetrominoShape("O");
      expect(shape).toEqual([
        [1, 1],
        [1, 1],
      ]);
    });

    test("should return correct shape for T piece", () => {
      const shape = getTetrominoShape("T");
      expect(shape).toEqual([
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ]);
    });
  });

  describe("rotateTetromino", () => {
    test("should rotate I piece clockwise", () => {
      const shape = getTetrominoShape("I");
      const rotated = rotateTetromino(shape);
      expect(rotated).toEqual([
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
      ]);
    });

    test("should rotate T piece clockwise", () => {
      const shape = getTetrominoShape("T");
      const rotated = rotateTetromino(shape);
      expect(rotated).toEqual([
        [0, 1, 0],
        [0, 1, 1],
        [0, 1, 0],
      ]);
    });

    test("should return to original after 4 rotations", () => {
      const shape = getTetrominoShape("T");
      let rotated = shape;
      for (let i = 0; i < 4; i++) {
        rotated = rotateTetromino(rotated);
      }
      expect(rotated).toEqual(shape);
    });
  });

  describe("rotateTetromino180", () => {
    test("should rotate I piece 180 degrees", () => {
      const shape = getTetrominoShape("I");
      const rotated180 = rotateTetromino180(shape);
      expect(rotated180).toEqual([
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
      ]);
    });

    test("should rotate T piece 180 degrees", () => {
      const shape = getTetrominoShape("T");
      const rotated180 = rotateTetromino180(shape);
      expect(rotated180).toEqual([
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0],
      ]);
    });

    test("should rotate L piece 180 degrees", () => {
      const shape = getTetrominoShape("L");
      const rotated180 = rotateTetromino180(shape);
      expect(rotated180).toEqual([
        [0, 0, 0],
        [1, 1, 1],
        [1, 0, 0],
      ]);
    });

    test("should rotate J piece 180 degrees", () => {
      const shape = getTetrominoShape("J");
      const rotated180 = rotateTetromino180(shape);
      expect(rotated180).toEqual([
        [0, 0, 0],
        [1, 1, 1],
        [0, 0, 1],
      ]);
    });

    test("should rotate S piece 180 degrees", () => {
      const shape = getTetrominoShape("S");
      const rotated180 = rotateTetromino180(shape);
      expect(rotated180).toEqual([
        [0, 0, 0],
        [0, 1, 1],
        [1, 1, 0],
      ]);
    });

    test("should rotate Z piece 180 degrees", () => {
      const shape = getTetrominoShape("Z");
      const rotated180 = rotateTetromino180(shape);
      expect(rotated180).toEqual([
        [0, 0, 0],
        [1, 1, 0],
        [0, 1, 1],
      ]);
    });

    test("should rotate O piece 180 degrees (no change)", () => {
      const shape = getTetrominoShape("O");
      const rotated180 = rotateTetromino180(shape);
      expect(rotated180).toEqual([
        [1, 1],
        [1, 1],
      ]);
    });

    test("should be equivalent to two 90-degree rotations", () => {
      const shape = getTetrominoShape("T");
      const rotated180 = rotateTetromino180(shape);
      const rotatedTwice = rotateTetromino(rotateTetromino(shape));
      expect(rotated180).toEqual(rotatedTwice);
    });

    test("should return to original after two 180-degree rotations", () => {
      const shape = getTetrominoShape("T");
      const rotated = rotateTetromino180(rotateTetromino180(shape));
      expect(rotated).toEqual(shape);
    });
  });
});

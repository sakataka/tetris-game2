import { describe, expect, test } from "bun:test";
import type { TetrominoTypeName } from "@/types/game";
import { getCellColor, getTetrominoColor, TETROMINO_COLORS } from "./colors";

describe("colors", () => {
  describe("TETROMINO_COLORS", () => {
    test("should have correct color mappings", () => {
      expect(TETROMINO_COLORS.I).toBe("bg-tetris-cyan");
      expect(TETROMINO_COLORS.O).toBe("bg-tetris-yellow");
      expect(TETROMINO_COLORS.T).toBe("bg-tetris-purple");
      expect(TETROMINO_COLORS.S).toBe("bg-tetris-green");
      expect(TETROMINO_COLORS.Z).toBe("bg-tetris-red");
      expect(TETROMINO_COLORS.J).toBe("bg-tetris-blue");
      expect(TETROMINO_COLORS.L).toBe("bg-tetris-orange");
    });

    test("should be a const object", () => {
      expect(typeof TETROMINO_COLORS).toBe("object");
      expect(Object.keys(TETROMINO_COLORS)).toHaveLength(7);
    });
  });

  describe("getTetrominoColor", () => {
    test("should return correct color for each tetromino type", () => {
      expect(getTetrominoColor("I")).toBe("bg-tetris-cyan");
      expect(getTetrominoColor("O")).toBe("bg-tetris-yellow");
      expect(getTetrominoColor("T")).toBe("bg-tetris-purple");
      expect(getTetrominoColor("S")).toBe("bg-tetris-green");
      expect(getTetrominoColor("Z")).toBe("bg-tetris-red");
      expect(getTetrominoColor("J")).toBe("bg-tetris-blue");
      expect(getTetrominoColor("L")).toBe("bg-tetris-orange");
    });

    test("should return consistent colors", () => {
      const types: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];

      for (const type of types) {
        const color1 = getTetrominoColor(type);
        const color2 = getTetrominoColor(type);
        expect(color1).toBe(color2);
      }
    });
  });

  describe("getCellColor", () => {
    test("should return correct color for each color index", () => {
      expect(getCellColor(0)).toBe("bg-slate-900");
      expect(getCellColor(1)).toBe("bg-tetris-cyan");
      expect(getCellColor(2)).toBe("bg-tetris-yellow");
      expect(getCellColor(3)).toBe("bg-tetris-purple");
      expect(getCellColor(4)).toBe("bg-tetris-green");
      expect(getCellColor(5)).toBe("bg-tetris-red");
      expect(getCellColor(6)).toBe("bg-tetris-blue");
      expect(getCellColor(7)).toBe("bg-tetris-orange");
    });

    test("should return default color for invalid indices", () => {
      expect(getCellColor(-1)).toBe("bg-slate-900");
      expect(getCellColor(8)).toBe("bg-slate-900");
      expect(getCellColor(999)).toBe("bg-slate-900");
    });

    test("should handle edge cases", () => {
      expect(getCellColor(0)).toBe("bg-slate-900");
      expect(getCellColor(Number.MAX_SAFE_INTEGER)).toBe("bg-slate-900");
      expect(getCellColor(Number.MIN_SAFE_INTEGER)).toBe("bg-slate-900");
    });

    test("should map color indices to tetromino colors correctly", () => {
      expect(getCellColor(1)).toBe(TETROMINO_COLORS.I);
      expect(getCellColor(2)).toBe(TETROMINO_COLORS.O);
      expect(getCellColor(3)).toBe(TETROMINO_COLORS.T);
      expect(getCellColor(4)).toBe(TETROMINO_COLORS.S);
      expect(getCellColor(5)).toBe(TETROMINO_COLORS.Z);
      expect(getCellColor(6)).toBe(TETROMINO_COLORS.J);
      expect(getCellColor(7)).toBe(TETROMINO_COLORS.L);
    });
  });
});

import { describe, expect, test } from "bun:test";
import { createCellKey, isValidBoardPosition } from "./boardUtils";

describe("boardUtils", () => {
  describe("createCellKey", () => {
    test("should create string key from position", () => {
      const key = createCellKey({ x: 3, y: 7 });
      expect(key).toBe("3,7");
    });

    test("should handle zero coordinates", () => {
      const key = createCellKey({ x: 0, y: 0 });
      expect(key).toBe("0,0");
    });

    test("should handle negative coordinates", () => {
      const key = createCellKey({ x: -2, y: -4 });
      expect(key).toBe("-2,-4");
    });
  });

  describe("isValidBoardPosition", () => {
    test("should return true for valid positions", () => {
      expect(isValidBoardPosition({ x: 0, y: 0 })).toBe(true);
      expect(isValidBoardPosition({ x: 5, y: 10 })).toBe(true);
      expect(isValidBoardPosition({ x: 9, y: 19 })).toBe(true); // Board is 10x20
    });

    test("should return false for negative coordinates", () => {
      expect(isValidBoardPosition({ x: -1, y: 0 })).toBe(false);
      expect(isValidBoardPosition({ x: 0, y: -1 })).toBe(false);
      expect(isValidBoardPosition({ x: -1, y: -1 })).toBe(false);
    });

    test("should return false for out-of-bounds coordinates", () => {
      expect(isValidBoardPosition({ x: 10, y: 0 })).toBe(false); // Width is 10 (0-9)
      expect(isValidBoardPosition({ x: 0, y: 20 })).toBe(false); // Height is 20 (0-19)
      expect(isValidBoardPosition({ x: 10, y: 20 })).toBe(false);
    });
  });
});

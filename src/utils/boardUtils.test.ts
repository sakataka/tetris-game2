import { describe, expect, test } from "bun:test";
import {
  addPositions,
  arePositionsEqual,
  createCellKey,
  createPosition,
  isPositionInBounds,
  isValidBoardPosition,
  parseCellKey,
} from "./boardUtils";

describe("boardUtils", () => {
  describe("createPosition", () => {
    test("should create position object", () => {
      const pos = createPosition(5, 10);
      expect(pos).toEqual({ x: 5, y: 10 });
    });

    test("should handle negative coordinates", () => {
      const pos = createPosition(-1, -5);
      expect(pos).toEqual({ x: -1, y: -5 });
    });
  });

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

  describe("parseCellKey", () => {
    test("should parse string key to position", () => {
      const pos = parseCellKey("5,8");
      expect(pos).toEqual({ x: 5, y: 8 });
    });

    test("should handle zero coordinates", () => {
      const pos = parseCellKey("0,0");
      expect(pos).toEqual({ x: 0, y: 0 });
    });

    test("should handle negative coordinates", () => {
      const pos = parseCellKey("-3,-6");
      expect(pos).toEqual({ x: -3, y: -6 });
    });
  });

  describe("createCellKey and parseCellKey integration", () => {
    test("should be reversible operations", () => {
      const original = { x: 4, y: 9 };
      const key = createCellKey(original);
      const parsed = parseCellKey(key);
      expect(parsed).toEqual(original);
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

  describe("isPositionInBounds", () => {
    test("should return true for valid positions within custom bounds", () => {
      expect(isPositionInBounds({ x: 0, y: 0 }, 5, 5)).toBe(true);
      expect(isPositionInBounds({ x: 2, y: 3 }, 5, 5)).toBe(true);
      expect(isPositionInBounds({ x: 4, y: 4 }, 5, 5)).toBe(true);
    });

    test("should return false for positions outside custom bounds", () => {
      expect(isPositionInBounds({ x: -1, y: 0 }, 5, 5)).toBe(false);
      expect(isPositionInBounds({ x: 0, y: -1 }, 5, 5)).toBe(false);
      expect(isPositionInBounds({ x: 5, y: 0 }, 5, 5)).toBe(false);
      expect(isPositionInBounds({ x: 0, y: 5 }, 5, 5)).toBe(false);
    });
  });

  describe("addPositions", () => {
    test("should add two positions", () => {
      const pos1 = { x: 3, y: 4 };
      const pos2 = { x: 2, y: 5 };
      const result = addPositions(pos1, pos2);
      expect(result).toEqual({ x: 5, y: 9 });
    });

    test("should handle negative values", () => {
      const pos1 = { x: 5, y: 8 };
      const pos2 = { x: -2, y: -3 };
      const result = addPositions(pos1, pos2);
      expect(result).toEqual({ x: 3, y: 5 });
    });
  });

  describe("arePositionsEqual", () => {
    test("should return true for equal positions", () => {
      const pos1 = { x: 3, y: 7 };
      const pos2 = { x: 3, y: 7 };
      expect(arePositionsEqual(pos1, pos2)).toBe(true);
    });

    test("should return false for different positions", () => {
      expect(arePositionsEqual({ x: 3, y: 7 }, { x: 3, y: 8 })).toBe(false);
      expect(arePositionsEqual({ x: 3, y: 7 }, { x: 4, y: 7 })).toBe(false);
      expect(arePositionsEqual({ x: 3, y: 7 }, { x: 4, y: 8 })).toBe(false);
    });
  });
});

import { describe, expect, test } from "bun:test";
import { normalizeRotationState } from "./typeGuards";

describe("typeGuards", () => {
  describe("normalizeRotationState", () => {
    test("should return 0 for multiples of 4", () => {
      expect(normalizeRotationState(0)).toBe(0);
      expect(normalizeRotationState(4)).toBe(0);
      expect(normalizeRotationState(8)).toBe(0);
      expect(normalizeRotationState(12)).toBe(0);
      expect(normalizeRotationState(16)).toBe(0);
      expect(normalizeRotationState(100)).toBe(0);
    });

    test("should return correct remainders for positive numbers", () => {
      expect(normalizeRotationState(1)).toBe(1);
      expect(normalizeRotationState(2)).toBe(2);
      expect(normalizeRotationState(3)).toBe(3);
      expect(normalizeRotationState(5)).toBe(1);
      expect(normalizeRotationState(6)).toBe(2);
      expect(normalizeRotationState(7)).toBe(3);
      expect(normalizeRotationState(9)).toBe(1);
      expect(normalizeRotationState(10)).toBe(2);
      expect(normalizeRotationState(11)).toBe(3);
    });

    test("should handle negative numbers correctly", () => {
      expect(normalizeRotationState(-1)).toBe(3);
      expect(normalizeRotationState(-2)).toBe(2);
      expect(normalizeRotationState(-3)).toBe(1);
      expect(normalizeRotationState(-4)).toBe(0);
      expect(normalizeRotationState(-5)).toBe(3);
      expect(normalizeRotationState(-6)).toBe(2);
      expect(normalizeRotationState(-7)).toBe(1);
      expect(normalizeRotationState(-8)).toBe(0);
    });

    test("should handle zero", () => {
      expect(normalizeRotationState(0)).toBe(0);
    });

    test("should handle large numbers", () => {
      expect(normalizeRotationState(1000)).toBe(0);
      expect(normalizeRotationState(1001)).toBe(1);
      expect(normalizeRotationState(1002)).toBe(2);
      expect(normalizeRotationState(1003)).toBe(3);
      expect(normalizeRotationState(-1000)).toBe(0);
      expect(normalizeRotationState(-1001)).toBe(3);
      expect(normalizeRotationState(-1002)).toBe(2);
      expect(normalizeRotationState(-1003)).toBe(1);
    });

    test("should return values that are valid RotationState", () => {
      const testValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, -1, -2, -3, -4, -5, -6, -7, -8];

      for (const value of testValues) {
        const result = normalizeRotationState(value);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(3);
        expect(Number.isInteger(result)).toBe(true);
      }
    });

    test("should be consistent with mathematical modulo behavior", () => {
      // Test the mathematical equivalence of the normalization
      const testValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 15, 16, 17, -1, -2, -3, -4, -5, -15, -16, -17];

      for (const value of testValues) {
        const result = normalizeRotationState(value);
        const expected = ((value % 4) + 4) % 4;
        expect(result).toBe(expected);
      }
    });

    test("should handle edge cases", () => {
      expect(normalizeRotationState(Number.MAX_SAFE_INTEGER)).toBe(3);
      expect(normalizeRotationState(Number.MIN_SAFE_INTEGER)).toBe(1);
    });
  });
});

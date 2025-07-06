import { describe, expect, test } from "bun:test";
import {
  calculateTSpinScore,
  getTSpinDisplayName,
  isValidTSpinCombination,
  type TSpinType,
} from "./scoring";

// ==============================
// T-Spin Scoring Tests
// ==============================

describe("T-Spin Scoring System", () => {
  describe("calculateTSpinScore", () => {
    test("should calculate correct scores for normal line clears", () => {
      expect(calculateTSpinScore(0, 1, "none")).toBe(0);
      expect(calculateTSpinScore(1, 1, "none")).toBe(100);
      expect(calculateTSpinScore(2, 1, "none")).toBe(300);
      expect(calculateTSpinScore(3, 1, "none")).toBe(500);
      expect(calculateTSpinScore(4, 1, "none")).toBe(800);
    });

    test("should calculate correct scores for T-Spin Mini", () => {
      expect(calculateTSpinScore(0, 1, "mini")).toBe(100);
      expect(calculateTSpinScore(1, 1, "mini")).toBe(200);
      expect(calculateTSpinScore(2, 1, "mini")).toBe(400);
    });

    test("should calculate correct scores for T-Spin Normal", () => {
      expect(calculateTSpinScore(0, 1, "normal")).toBe(400);
      expect(calculateTSpinScore(1, 1, "normal")).toBe(800);
      expect(calculateTSpinScore(2, 1, "normal")).toBe(1200);
      expect(calculateTSpinScore(3, 1, "normal")).toBe(1600);
    });

    test("should apply level multiplier correctly", () => {
      expect(calculateTSpinScore(1, 5, "none")).toBe(500); // 100 * 5
      expect(calculateTSpinScore(1, 5, "mini")).toBe(1000); // 200 * 5
      expect(calculateTSpinScore(1, 5, "normal")).toBe(4000); // 800 * 5
      expect(calculateTSpinScore(2, 10, "normal")).toBe(12000); // 1200 * 10
    });

    test("should handle edge cases", () => {
      // T-Spin Mini with 3+ lines should return 0 (invalid combination)
      expect(calculateTSpinScore(3, 1, "mini")).toBe(0);
      expect(calculateTSpinScore(4, 1, "mini")).toBe(0);

      // T-Spin Normal with 4 lines should return 0 (invalid combination)
      expect(calculateTSpinScore(4, 1, "normal")).toBe(0);
    });

    test("should throw error for invalid parameters", () => {
      expect(() => calculateTSpinScore(-1, 1, "none")).toThrow("Invalid linesCleared");
      expect(() => calculateTSpinScore(5, 1, "none")).toThrow("Invalid linesCleared");
      expect(() => calculateTSpinScore(1, 0, "none")).toThrow("Invalid level");
      expect(() => calculateTSpinScore(1, -1, "none")).toThrow("Invalid level");
    });
  });

  describe("getTSpinDisplayName", () => {
    test("should return correct names for normal line clears", () => {
      expect(getTSpinDisplayName("none", 0)).toBe("");
      expect(getTSpinDisplayName("none", 1)).toBe("SINGLE");
      expect(getTSpinDisplayName("none", 2)).toBe("DOUBLE");
      expect(getTSpinDisplayName("none", 3)).toBe("TRIPLE");
      expect(getTSpinDisplayName("none", 4)).toBe("TETRIS");
    });

    test("should return correct names for T-Spin Mini", () => {
      expect(getTSpinDisplayName("mini", 0)).toBe("T-SPIN MINI");
      expect(getTSpinDisplayName("mini", 1)).toBe("T-SPIN MINI SINGLE");
      expect(getTSpinDisplayName("mini", 2)).toBe("T-SPIN MINI DOUBLE");
      expect(getTSpinDisplayName("mini", 3)).toBe("T-SPIN MINI TRIPLE");
    });

    test("should return correct names for T-Spin Normal", () => {
      expect(getTSpinDisplayName("normal", 0)).toBe("T-SPIN");
      expect(getTSpinDisplayName("normal", 1)).toBe("T-SPIN SINGLE");
      expect(getTSpinDisplayName("normal", 2)).toBe("T-SPIN DOUBLE");
      expect(getTSpinDisplayName("normal", 3)).toBe("T-SPIN TRIPLE");
    });

    test("should handle invalid line counts gracefully", () => {
      expect(getTSpinDisplayName("mini", 5)).toBe("T-SPIN MINI");
      expect(getTSpinDisplayName("normal", 5)).toBe("T-SPIN");
      expect(getTSpinDisplayName("none", 5)).toBe("");
    });
  });

  describe("isValidTSpinCombination", () => {
    test("should validate normal line clear combinations", () => {
      expect(isValidTSpinCombination("none", 0)).toBe(true);
      expect(isValidTSpinCombination("none", 1)).toBe(true);
      expect(isValidTSpinCombination("none", 2)).toBe(true);
      expect(isValidTSpinCombination("none", 3)).toBe(true);
      expect(isValidTSpinCombination("none", 4)).toBe(true);
      expect(isValidTSpinCombination("none", 5)).toBe(false);
      expect(isValidTSpinCombination("none", -1)).toBe(false);
    });

    test("should validate T-Spin Mini combinations", () => {
      expect(isValidTSpinCombination("mini", 0)).toBe(true);
      expect(isValidTSpinCombination("mini", 1)).toBe(true);
      expect(isValidTSpinCombination("mini", 2)).toBe(true);
      expect(isValidTSpinCombination("mini", 3)).toBe(false);
      expect(isValidTSpinCombination("mini", 4)).toBe(false);
      expect(isValidTSpinCombination("mini", -1)).toBe(false);
    });

    test("should validate T-Spin Normal combinations", () => {
      expect(isValidTSpinCombination("normal", 0)).toBe(true);
      expect(isValidTSpinCombination("normal", 1)).toBe(true);
      expect(isValidTSpinCombination("normal", 2)).toBe(true);
      expect(isValidTSpinCombination("normal", 3)).toBe(true);
      expect(isValidTSpinCombination("normal", 4)).toBe(false);
      expect(isValidTSpinCombination("normal", -1)).toBe(false);
    });

    test("should handle invalid T-Spin types", () => {
      // @ts-expect-error Testing invalid type
      expect(isValidTSpinCombination("invalid", 1)).toBe(false);
    });
  });
});

// ==============================
// Scoring Integration Tests
// ==============================

describe("Scoring System Integration", () => {
  test("should handle realistic game scenarios", () => {
    // Scenario: Player performs various T-Spins at different levels
    const scenarios = [
      { lines: 1, level: 1, tSpin: "normal" as TSpinType, expected: 800 },
      { lines: 2, level: 3, tSpin: "normal" as TSpinType, expected: 3600 },
      { lines: 1, level: 5, tSpin: "mini" as TSpinType, expected: 1000 },
      { lines: 0, level: 2, tSpin: "normal" as TSpinType, expected: 800 },
      { lines: 4, level: 10, tSpin: "none" as TSpinType, expected: 8000 },
    ];

    for (const scenario of scenarios) {
      const result = calculateTSpinScore(scenario.lines, scenario.level, scenario.tSpin);
      expect(result).toBe(scenario.expected);
    }
  });

  test("should maintain score progression balance", () => {
    // T-Spin Normal should always be more valuable than regular line clears
    expect(calculateTSpinScore(1, 1, "normal")).toBeGreaterThan(calculateTSpinScore(1, 1, "none"));
    expect(calculateTSpinScore(2, 1, "normal")).toBeGreaterThan(calculateTSpinScore(2, 1, "none"));
    expect(calculateTSpinScore(3, 1, "normal")).toBeGreaterThan(calculateTSpinScore(3, 1, "none"));

    // T-Spin Normal should be more valuable than T-Spin Mini
    expect(calculateTSpinScore(1, 1, "normal")).toBeGreaterThan(calculateTSpinScore(1, 1, "mini"));
    expect(calculateTSpinScore(2, 1, "normal")).toBeGreaterThan(calculateTSpinScore(2, 1, "mini"));

    // T-Spin Mini should still be more valuable than regular line clears
    expect(calculateTSpinScore(1, 1, "mini")).toBeGreaterThan(calculateTSpinScore(1, 1, "none"));
    expect(calculateTSpinScore(2, 1, "mini")).toBeGreaterThan(calculateTSpinScore(2, 1, "none"));
  });

  test("should handle level scaling appropriately", () => {
    // Higher levels should proportionally increase all scores
    const baseLevel = 1;
    const highLevel = 10;
    const multiplier = highLevel / baseLevel;

    expect(calculateTSpinScore(1, highLevel, "none")).toBe(
      calculateTSpinScore(1, baseLevel, "none") * multiplier,
    );
    expect(calculateTSpinScore(1, highLevel, "mini")).toBe(
      calculateTSpinScore(1, baseLevel, "mini") * multiplier,
    );
    expect(calculateTSpinScore(1, highLevel, "normal")).toBe(
      calculateTSpinScore(1, baseLevel, "normal") * multiplier,
    );
  });
});

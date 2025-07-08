import { describe, expect, it } from "bun:test";
import { BitBoard } from "@/game/ai/core/bitboard";
import {
  applyDangerAdjustments,
  determineGamePhase,
  getPhaseWeights,
  PHASE_WEIGHTS,
} from "./new-weights";
import { DynamicWeights } from "./weights";

describe("new-weights", () => {
  describe("determineGamePhase", () => {
    it("should return 'early' for height <= 6", () => {
      expect(determineGamePhase(0)).toBe("early");
      expect(determineGamePhase(3)).toBe("early");
      expect(determineGamePhase(6)).toBe("early");
    });

    it("should return 'mid' for height 7-12", () => {
      expect(determineGamePhase(7)).toBe("mid");
      expect(determineGamePhase(10)).toBe("mid");
      expect(determineGamePhase(12)).toBe("mid");
    });

    it("should return 'late' for height > 12", () => {
      expect(determineGamePhase(13)).toBe("late");
      expect(determineGamePhase(15)).toBe("late");
      expect(determineGamePhase(18)).toBe("late");
    });
  });

  describe("getPhaseWeights", () => {
    it("should return correct weights for each phase", () => {
      const earlyWeights = getPhaseWeights("early");
      expect(earlyWeights.linesCleared).toBe(20.0);
      expect(earlyWeights.holes).toBe(-30.0);

      const midWeights = getPhaseWeights("mid");
      expect(midWeights.linesCleared).toBe(35.0);
      expect(midWeights.holes).toBe(-35.0);

      const lateWeights = getPhaseWeights("late");
      expect(lateWeights.linesCleared).toBe(50.0);
      expect(lateWeights.holes).toBe(-40.0);
    });

    it("should return independent weight copies", () => {
      const weights1 = getPhaseWeights("early");
      const weights2 = getPhaseWeights("early");

      weights1.linesCleared = 999;
      expect(weights2.linesCleared).toBe(20.0);
      expect(PHASE_WEIGHTS.early.linesCleared).toBe(20.0);
    });
  });

  describe("applyDangerAdjustments", () => {
    it("should not modify weights when height <= 15", () => {
      const baseWeights = getPhaseWeights("late");
      const adjusted = applyDangerAdjustments(baseWeights, 15);

      expect(adjusted).toEqual(baseWeights);
    });

    it("should increase line clearing priority in danger", () => {
      const baseWeights = getPhaseWeights("late");
      const adjusted = applyDangerAdjustments(baseWeights, 16);

      expect(adjusted.linesCleared).toBeGreaterThan(baseWeights.linesCleared);
      expect(adjusted.landingHeight).toBeLessThan(baseWeights.landingHeight);
    });

    it("should scale adjustments based on danger level", () => {
      const baseWeights = getPhaseWeights("late");
      const adjusted16 = applyDangerAdjustments(baseWeights, 16);
      const adjusted20 = applyDangerAdjustments(baseWeights, 20);

      // Higher danger = more extreme adjustments
      expect(adjusted20.linesCleared).toBeGreaterThan(adjusted16.linesCleared);
    });

    it("should reduce hole penalty in danger", () => {
      const baseWeights = getPhaseWeights("late");
      const adjusted = applyDangerAdjustments(baseWeights, 18);

      // Base holes is -40.0, adjusted should be -40.0 * (1 - 0.6 * 0.1) = -40.0 * 0.94 = -37.6
      expect(adjusted.holes).toBeCloseTo(-37.6, 1);
      // Since holes is negative, reducing penalty means making it less negative (closer to 0)
      expect(adjusted.holes).toBeGreaterThan(baseWeights.holes);
    });
  });

  describe("DynamicWeights integration", () => {
    it("should use new weight system by default", () => {
      const dynamicWeights = new DynamicWeights();
      expect(dynamicWeights.isUsingNewWeightSystem()).toBe(true);
    });

    it("should apply phase-based weights correctly", () => {
      const board = new BitBoard();
      const dynamicWeights = new DynamicWeights();

      // Simulate different board heights by setting the bottom 6 rows to be filled
      const fullRowMask = (1 << 10) - 1; // 10 bits set (full row)
      for (let y = 19; y >= 14; y--) {
        board.setRowBits(y, fullRowMask);
      }

      const situation = dynamicWeights.analyzeSituation(board);
      const weights = dynamicWeights.adjustWeights(situation);

      // Should be in early phase with height ~6
      expect(weights.linesCleared).toBe(20.0);
    });

    it("should switch between weight systems", () => {
      const dynamicWeights = new DynamicWeights();
      const board = new BitBoard();

      // New system
      dynamicWeights.setWeightSystem(true);
      const newWeights = dynamicWeights.adjustWeights(dynamicWeights.analyzeSituation(board));

      // Legacy system
      dynamicWeights.setWeightSystem(false);
      const legacyWeights = dynamicWeights.adjustWeights(dynamicWeights.analyzeSituation(board));

      // Legacy system multiplies DEFAULT_WEIGHTS (30.0) by phase multipliers (1.2-1.5x)
      // New system uses fixed values (20.0-50.0)
      expect(newWeights.linesCleared).toBeGreaterThan(15);
      expect(legacyWeights.linesCleared).toBeGreaterThan(30); // Legacy uses DEFAULT_WEIGHTS * multiplier
    });
  });

  describe("weight progression", () => {
    it("should progressively increase line clearing priority", () => {
      const early = PHASE_WEIGHTS.early.linesCleared;
      const mid = PHASE_WEIGHTS.mid.linesCleared;
      const late = PHASE_WEIGHTS.late.linesCleared;

      expect(early).toBeLessThan(mid);
      expect(mid).toBeLessThan(late);
      expect(early).toBe(20.0);
      expect(late).toBe(50.0);
    });

    it("should progressively increase hole penalties", () => {
      const early = PHASE_WEIGHTS.early.holes;
      const mid = PHASE_WEIGHTS.mid.holes;
      const late = PHASE_WEIGHTS.late.holes;

      // Penalties are negative, so more negative = stronger penalty
      expect(early).toBeGreaterThan(mid);
      expect(mid).toBeGreaterThan(late);
    });
  });
});

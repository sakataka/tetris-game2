import { beforeEach, describe, expect, it } from "bun:test";
import type { GamePhase } from "@/game/ai/evaluators/new-weights";
import type { WeightConfiguration } from "./weight-loader";
import {
  CURRENT_SCHEMA_VERSION,
  getWeightLoader,
  loadAllPhaseWeights,
  loadDellacherieWeights,
  loadPhaseWeights,
  WeightLoader,
} from "./weight-loader";

describe("WeightLoader", () => {
  let weightLoader: WeightLoader;

  beforeEach(() => {
    weightLoader = WeightLoader.getInstance();
    weightLoader.clearCache();
  });

  describe("singleton behavior", () => {
    it("should return the same instance", () => {
      const instance1 = WeightLoader.getInstance();
      const instance2 = WeightLoader.getInstance();
      expect(instance1).toBe(instance2);
    });

    it("should return the same instance via getWeightLoader", () => {
      const instance1 = getWeightLoader();
      const instance2 = getWeightLoader();
      expect(instance1).toBe(instance2);
    });
  });

  describe("loadConfiguration", () => {
    it("should load configuration successfully", async () => {
      const result = await weightLoader.loadConfiguration();
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
        expect(result.data.metadata).toBeDefined();
        expect(result.data.evaluators).toBeDefined();
        expect(result.data.adjustments).toBeDefined();
      }
    });

    it("should cache configuration after loading", async () => {
      expect(weightLoader.getCachedConfiguration()).toBeNull();

      const result = await weightLoader.loadConfiguration();
      expect(result.success).toBe(true);

      const cached = weightLoader.getCachedConfiguration();
      expect(cached).not.toBeNull();
      expect(cached?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    });
  });

  describe("getDellacherieWeights", () => {
    it("should load Dellacherie weights successfully", async () => {
      const result = await weightLoader.getDellacherieWeights();
      expect(result.success).toBe(true);

      if (result.success) {
        const weights = result.data;
        expect(weights).toBeDefined();
        expect(typeof weights.landingHeight).toBe("number");
        expect(typeof weights.linesCleared).toBe("number");
        expect(typeof weights.potentialLinesFilled).toBe("number");
        expect(typeof weights.rowTransitions).toBe("number");
        expect(typeof weights.columnTransitions).toBe("number");
        expect(typeof weights.holes).toBe("number");
        expect(typeof weights.wells).toBe("number");
        expect(typeof weights.blocksAboveHoles).toBe("number");
        expect(typeof weights.wellOpen).toBe("number");
        expect(typeof weights.escapeRoute).toBe("number");
        expect(typeof weights.bumpiness).toBe("number");
        expect(typeof weights.maxHeight).toBe("number");
        expect(typeof weights.rowFillRatio).toBe("number");
      }
    });

    it("should use convenience function", async () => {
      const result = await loadDellacherieWeights();
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.linesCleared).toBe(1000.0);
        expect(result.data.landingHeight).toBe(-1.5);
      }
    });
  });

  describe("getPhaseWeights", () => {
    const phases: GamePhase[] = ["early", "mid", "late"];

    it.each(phases)("should load %s phase weights successfully", async (phase) => {
      const result = await weightLoader.getPhaseWeights(phase);
      expect(result.success).toBe(true);

      if (result.success) {
        const weights = result.data;
        expect(weights).toBeDefined();
        expect(typeof weights.landingHeight).toBe("number");
        expect(typeof weights.linesCleared).toBe("number");
        expect(weights.linesCleared).toBe(1000.0); // All phases have same line clearing priority
      }
    });

    it("should use convenience function", async () => {
      const result = await loadPhaseWeights("early");
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data.landingHeight).toBe(-1.3);
        expect(result.data.linesCleared).toBe(1000.0);
      }
    });

    it("should return error for invalid phase", async () => {
      const result = await weightLoader.getPhaseWeights("invalid" as GamePhase);
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error).toContain("Phase weights not found");
      }
    });
  });

  describe("getAllPhaseWeights", () => {
    it("should load all phase weights successfully", async () => {
      const result = await weightLoader.getAllPhaseWeights();
      expect(result.success).toBe(true);

      if (result.success) {
        const phaseWeights = result.data;
        expect(phaseWeights).toBeDefined();
        expect(phaseWeights.early).toBeDefined();
        expect(phaseWeights.mid).toBeDefined();
        expect(phaseWeights.late).toBeDefined();

        // Verify all phases have the same line clearing priority
        expect(phaseWeights.early.linesCleared).toBe(1000.0);
        expect(phaseWeights.mid.linesCleared).toBe(1000.0);
        expect(phaseWeights.late.linesCleared).toBe(1000.0);

        // Verify different landing height values
        expect(phaseWeights.early.landingHeight).toBe(-1.3);
        expect(phaseWeights.mid.landingHeight).toBe(-1.4);
        expect(phaseWeights.late.landingHeight).toBe(-1.7);
      }
    });

    it("should use convenience function", async () => {
      const result = await loadAllPhaseWeights();
      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.early).toBeDefined();
        expect(result.data.mid).toBeDefined();
        expect(result.data.late).toBeDefined();
      }
    });
  });

  describe("getAdjustmentMultipliers", () => {
    it("should load danger zone adjustments", async () => {
      const result = await weightLoader.getAdjustmentMultipliers("dangerZone");
      expect(result.success).toBe(true);

      if (result.success) {
        const adjustments = result.data;
        expect(adjustments).toBeDefined();
        expect(typeof adjustments.maxMultiplier).toBe("number");
        expect(typeof adjustments.linesCleared).toBe("number");
        expect(adjustments.linesCleared).toBe(1.4);
      }
    });

    it("should load phase adjustments", async () => {
      const result = await weightLoader.getAdjustmentMultipliers("phaseAdjustments");
      expect(result.success).toBe(true);

      if (result.success) {
        const adjustments = result.data;
        expect(adjustments).toBeDefined();
        expect(adjustments.early).toBeDefined();
        expect(adjustments.mid).toBeDefined();
        expect(adjustments.late).toBeDefined();
      }
    });

    it("should load survival adjustments", async () => {
      const result = await weightLoader.getAdjustmentMultipliers("survival");
      expect(result.success).toBe(true);

      if (result.success) {
        const adjustments = result.data;
        expect(adjustments).toBeDefined();
        expect(adjustments.linesCleared).toBe(1.6);
        expect(adjustments.maxMultiplier).toBe(1.3);
      }
    });

    it("should load early game adjustments", async () => {
      const result = await weightLoader.getAdjustmentMultipliers("earlyGame");
      expect(result.success).toBe(true);

      if (result.success) {
        const adjustments = result.data;
        expect(adjustments).toBeDefined();
        expect(adjustments.landingHeight).toBe(0.85);
        expect(adjustments.linesCleared).toBe(1.4);
      }
    });

    it("should load cleanup adjustments", async () => {
      const result = await weightLoader.getAdjustmentMultipliers("cleanup");
      expect(result.success).toBe(true);

      if (result.success) {
        const adjustments = result.data;
        expect(adjustments).toBeDefined();
        expect(adjustments.linesCleared).toBe(1.2);
        expect(adjustments.holes).toBe(1.1);
      }
    });

    it("should return error for invalid adjustment category", async () => {
      const result = await weightLoader.getAdjustmentMultipliers(
        "invalid" as keyof WeightConfiguration["adjustments"],
      );
      expect(result.success).toBe(false);

      if (!result.success) {
        expect(result.error).toContain("Adjustment category not found");
      }
    });
  });

  describe("cache management", () => {
    it("should clear cache successfully", async () => {
      await weightLoader.loadConfiguration();
      expect(weightLoader.getCachedConfiguration()).not.toBeNull();

      weightLoader.clearCache();
      expect(weightLoader.getCachedConfiguration()).toBeNull();
    });

    it("should return cached configuration", async () => {
      const result1 = await weightLoader.loadConfiguration();
      const result2 = await weightLoader.loadConfiguration();

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // Should be the same cached instance
      const cached = weightLoader.getCachedConfiguration();
      expect(cached).not.toBeNull();
    });
  });

  describe("weight structure validation", () => {
    it("should validate required weight properties", async () => {
      const result = await weightLoader.getDellacherieWeights();
      expect(result.success).toBe(true);

      if (result.success) {
        const weights = result.data;
        const requiredProperties = [
          "landingHeight",
          "linesCleared",
          "potentialLinesFilled",
          "rowTransitions",
          "columnTransitions",
          "holes",
          "wells",
          "blocksAboveHoles",
          "wellOpen",
          "escapeRoute",
          "bumpiness",
          "maxHeight",
          "rowFillRatio",
        ];

        for (const prop of requiredProperties) {
          expect(weights).toHaveProperty(prop);
          expect(typeof weights[prop as keyof typeof weights]).toBe("number");
        }
      }
    });

    it("should validate phase weights structure", async () => {
      const result = await weightLoader.getAllPhaseWeights();
      expect(result.success).toBe(true);

      if (result.success) {
        const phaseWeights = result.data;
        const phases: GamePhase[] = ["early", "mid", "late"];

        for (const phase of phases) {
          const weights = phaseWeights[phase];
          expect(weights).toBeDefined();

          const requiredProperties = [
            "landingHeight",
            "linesCleared",
            "potentialLinesFilled",
            "rowTransitions",
            "columnTransitions",
            "holes",
            "wells",
            "blocksAboveHoles",
            "wellOpen",
            "escapeRoute",
            "bumpiness",
            "maxHeight",
            "rowFillRatio",
          ];

          for (const prop of requiredProperties) {
            expect(weights).toHaveProperty(prop);
            expect(typeof weights[prop as keyof typeof weights]).toBe("number");
          }
        }
      }
    });
  });
});

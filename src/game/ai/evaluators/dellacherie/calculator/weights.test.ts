import { beforeEach, describe, expect, it } from "bun:test";
import type { EvaluationWeights } from "@/game/ai/evaluators/dellacherie/types";
import {
  createWeightManager,
  DEFAULT_WEIGHTS,
  getWeights,
  isUsingExternalWeights,
  loadExternalWeights,
  resetWeights,
  setExternalWeightSystem,
  updateWeights,
  type WeightManagerState,
} from "./weights";

describe("WeightManager Functions", () => {
  let weightManagerState: WeightManagerState;

  beforeEach(() => {
    weightManagerState = createWeightManager();
  });

  describe("createWeightManager", () => {
    it("should create weight manager with default weights", () => {
      const state = createWeightManager();
      expect(state.weights).toEqual(DEFAULT_WEIGHTS);
      expect(state.useExternalWeights).toBe(false);
    });

    it("should create weight manager with custom weights", () => {
      const customWeights: EvaluationWeights = {
        ...DEFAULT_WEIGHTS,
        linesCleared: 2000.0,
        holes: -10.0,
      };

      const state = createWeightManager(customWeights, true);
      expect(state.weights).toEqual(customWeights);
      expect(state.useExternalWeights).toBe(true);
    });
  });

  describe("updateWeights", () => {
    it("should update weights dynamically", () => {
      const partialWeights = {
        linesCleared: 1500.0,
        holes: -7.5,
      };

      const updatedState = updateWeights(weightManagerState, partialWeights);

      expect(updatedState.weights.linesCleared).toBe(1500.0);
      expect(updatedState.weights.holes).toBe(-7.5);
      expect(updatedState.weights.landingHeight).toBe(DEFAULT_WEIGHTS.landingHeight);
      expect(updatedState.useExternalWeights).toBe(weightManagerState.useExternalWeights);
    });

    it("should create new state without mutating original", () => {
      const originalWeights = { ...weightManagerState.weights };
      const partialWeights = { linesCleared: 1500.0 };

      const updatedState = updateWeights(weightManagerState, partialWeights);

      expect(weightManagerState.weights).toEqual(originalWeights);
      expect(updatedState.weights.linesCleared).toBe(1500.0);
      expect(updatedState).not.toBe(weightManagerState);
    });
  });

  describe("getWeights", () => {
    it("should return current weights when not using external weights", () => {
      const weights = getWeights(weightManagerState);
      expect(weights).toEqual(DEFAULT_WEIGHTS);
      expect(weights).not.toBe(weightManagerState.weights); // Should be a copy
    });

    it("should return weights copy, not reference", () => {
      const weights = getWeights(weightManagerState);
      weights.linesCleared = 9999.0;

      const weightsAgain = getWeights(weightManagerState);
      expect(weightsAgain.linesCleared).toBe(DEFAULT_WEIGHTS.linesCleared);
    });
  });

  describe("resetWeights", () => {
    it("should reset weights to default values", () => {
      // First update weights
      const customState = updateWeights(weightManagerState, {
        linesCleared: 2000.0,
        holes: -15.0,
      });

      // Then reset
      const resetState = resetWeights(customState);

      expect(resetState.weights).toEqual(DEFAULT_WEIGHTS);
      expect(resetState.useExternalWeights).toBe(customState.useExternalWeights);
    });

    it("should create new state without mutating original", () => {
      const customState = updateWeights(weightManagerState, { linesCleared: 2000.0 });
      const resetState = resetWeights(customState);

      expect(customState.weights.linesCleared).toBe(2000.0);
      expect(resetState.weights.linesCleared).toBe(DEFAULT_WEIGHTS.linesCleared);
      expect(resetState).not.toBe(customState);
    });
  });

  describe("setExternalWeightSystem", () => {
    it("should enable external weight system", () => {
      const updatedState = setExternalWeightSystem(weightManagerState, true);

      expect(updatedState.useExternalWeights).toBe(true);
      expect(updatedState.weights).toEqual(weightManagerState.weights);
    });

    it("should disable external weight system", () => {
      const externalState = setExternalWeightSystem(weightManagerState, true);
      const disabledState = setExternalWeightSystem(externalState, false);

      expect(disabledState.useExternalWeights).toBe(false);
      expect(disabledState.weights).toEqual(externalState.weights);
    });

    it("should create new state without mutating original", () => {
      const updatedState = setExternalWeightSystem(weightManagerState, true);

      expect(weightManagerState.useExternalWeights).toBe(false);
      expect(updatedState.useExternalWeights).toBe(true);
      expect(updatedState).not.toBe(weightManagerState);
    });
  });

  describe("isUsingExternalWeights", () => {
    it("should return false for default state", () => {
      expect(isUsingExternalWeights(weightManagerState)).toBe(false);
    });

    it("should return true when external weights are enabled", () => {
      const externalState = setExternalWeightSystem(weightManagerState, true);
      expect(isUsingExternalWeights(externalState)).toBe(true);
    });
  });

  describe("loadExternalWeights", () => {
    it("should return current weights when external weights are disabled", async () => {
      const weights = await loadExternalWeights(weightManagerState);
      expect(weights).toEqual(DEFAULT_WEIGHTS);
    });

    it("should attempt to load external weights when enabled", async () => {
      const externalState = setExternalWeightSystem(weightManagerState, true);
      const weights = await loadExternalWeights(externalState);

      // Should fallback to internal weights since external loading isn't configured
      expect(weights).toBeDefined();
      expect(typeof weights.linesCleared).toBe("number");
    });
  });

  describe("weight structure", () => {
    it("should maintain all required weight properties", () => {
      const weights = getWeights(weightManagerState);

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
        expect(typeof weights[prop as keyof EvaluationWeights]).toBe("number");
      }
    });

    it("should have line clearing as highest priority", () => {
      const weights = getWeights(weightManagerState);
      expect(weights.linesCleared).toBe(1000.0);
      expect(weights.linesCleared).toBeGreaterThan(Math.abs(weights.holes));
      expect(weights.linesCleared).toBeGreaterThan(Math.abs(weights.maxHeight));
    });
  });
});

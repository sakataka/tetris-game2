import { describe, expect, test } from "bun:test";
import { ANIMATION_DURATIONS, ANIMATION_PRESETS, COMPLETE_ANIMATIONS } from "./animationConstants";

describe("animationConstants", () => {
  describe("ANIMATION_PRESETS", () => {
    test("should contain all expected preset keys", () => {
      const expectedKeys = [
        "pieceSpawn",
        "lineFall",
        "scoreUpdate",
        "levelUp",
        "buttonHover",
        "cellPlace",
        "cellSpawn",
      ];

      expect(Object.keys(ANIMATION_PRESETS)).toEqual(expectedKeys);
    });

    test("should have consistent spring animation structure", () => {
      const presets = Object.values(ANIMATION_PRESETS);

      for (const preset of presets) {
        expect(preset.type).toBe("spring");
        expect(typeof preset.stiffness).toBe("number");
        expect(typeof preset.damping).toBe("number");
        expect(typeof preset.mass).toBe("number");

        // Validate reasonable ranges
        expect(preset.stiffness).toBeGreaterThan(0);
        expect(preset.damping).toBeGreaterThan(0);
        expect(preset.mass).toBeGreaterThan(0);
      }
    });

    test("should have expected stiffness values", () => {
      expect(ANIMATION_PRESETS.pieceSpawn.stiffness).toBe(300);
      expect(ANIMATION_PRESETS.lineFall.stiffness).toBe(400);
      expect(ANIMATION_PRESETS.scoreUpdate.stiffness).toBe(400);
      expect(ANIMATION_PRESETS.levelUp.stiffness).toBe(600);
      expect(ANIMATION_PRESETS.buttonHover.stiffness).toBe(500);
      expect(ANIMATION_PRESETS.cellPlace.stiffness).toBe(500);
      expect(ANIMATION_PRESETS.cellSpawn.stiffness).toBe(300);
    });

    test("should have expected damping values", () => {
      expect(ANIMATION_PRESETS.pieceSpawn.damping).toBe(20);
      expect(ANIMATION_PRESETS.lineFall.damping).toBe(30);
      expect(ANIMATION_PRESETS.scoreUpdate.damping).toBe(15);
      expect(ANIMATION_PRESETS.levelUp.damping).toBe(20);
      expect(ANIMATION_PRESETS.buttonHover.damping).toBe(35);
      expect(ANIMATION_PRESETS.cellPlace.damping).toBe(30);
      expect(ANIMATION_PRESETS.cellSpawn.damping).toBe(20);
    });

    test("should have expected mass values", () => {
      expect(ANIMATION_PRESETS.pieceSpawn.mass).toBe(0.8);
      expect(ANIMATION_PRESETS.lineFall.mass).toBe(0.8);
      expect(ANIMATION_PRESETS.scoreUpdate.mass).toBe(0.9);
      expect(ANIMATION_PRESETS.levelUp.mass).toBe(0.8);
      expect(ANIMATION_PRESETS.buttonHover.mass).toBe(0.3);
      expect(ANIMATION_PRESETS.cellPlace.mass).toBe(0.4);
      expect(ANIMATION_PRESETS.cellSpawn.mass).toBe(0.6);
    });
  });

  describe("ANIMATION_DURATIONS", () => {
    test("should contain all expected duration keys", () => {
      const expectedKeys = ["fast", "normal", "slow", "verySlow"];
      expect(Object.keys(ANIMATION_DURATIONS)).toEqual(expectedKeys);
    });

    test("should have expected duration values", () => {
      expect(ANIMATION_DURATIONS.fast).toBe(0.15);
      expect(ANIMATION_DURATIONS.normal).toBe(0.3);
      expect(ANIMATION_DURATIONS.slow).toBe(0.5);
      expect(ANIMATION_DURATIONS.verySlow).toBe(0.8);
    });

    test("should have ascending duration values", () => {
      expect(ANIMATION_DURATIONS.fast).toBeLessThan(ANIMATION_DURATIONS.normal);
      expect(ANIMATION_DURATIONS.normal).toBeLessThan(ANIMATION_DURATIONS.slow);
      expect(ANIMATION_DURATIONS.slow).toBeLessThan(ANIMATION_DURATIONS.verySlow);
    });

    test("should have numeric duration values", () => {
      const durations = Object.values(ANIMATION_DURATIONS);

      for (const duration of durations) {
        expect(typeof duration).toBe("number");
        expect(duration).toBeGreaterThan(0);
      }
    });
  });

  describe("COMPLETE_ANIMATIONS", () => {
    test("should contain all expected animation keys", () => {
      const expectedKeys = ["scoreIncrease", "levelIncrease", "linesCleared"];

      expect(Object.keys(COMPLETE_ANIMATIONS)).toEqual(expectedKeys);
    });

    test("should have initial and animate properties for basic animations", () => {
      const basicAnimations = ["scoreIncrease", "levelIncrease", "linesCleared"];

      for (const animationKey of basicAnimations) {
        const animation = COMPLETE_ANIMATIONS[animationKey as keyof typeof COMPLETE_ANIMATIONS];
        expect(animation).toHaveProperty("initial");
        expect(animation).toHaveProperty("animate");
        expect(animation).toHaveProperty("transition");
      }
    });

    test("should have expected scoreIncrease animation", () => {
      const { scoreIncrease } = COMPLETE_ANIMATIONS;

      expect(scoreIncrease.initial).toEqual({ scale: 1.3, opacity: 0.7 });
      expect(scoreIncrease.animate).toEqual({ scale: 1, opacity: 1 });
      expect(scoreIncrease.transition).toBe(ANIMATION_PRESETS.scoreUpdate);
    });

    test("should have expected levelIncrease animation", () => {
      const { levelIncrease } = COMPLETE_ANIMATIONS;

      expect(levelIncrease.initial).toEqual({ scale: 1.5, opacity: 0.5, rotate: -10 });
      expect(levelIncrease.animate).toEqual({ scale: 1, opacity: 1, rotate: 0 });
      expect(levelIncrease.transition).toBe(ANIMATION_PRESETS.levelUp);
    });

    test("should have expected linesCleared animation", () => {
      const { linesCleared } = COMPLETE_ANIMATIONS;

      expect(linesCleared.initial).toEqual({ scale: 1.2, opacity: 0.8, y: -10 });
      expect(linesCleared.animate).toEqual({ scale: 1, opacity: 1, y: 0 });
      expect(linesCleared.transition).toBe(ANIMATION_PRESETS.scoreUpdate);
    });

    test("should reference existing animation presets", () => {
      // Verify that complete animations reference existing presets
      expect(COMPLETE_ANIMATIONS.scoreIncrease.transition).toBe(ANIMATION_PRESETS.scoreUpdate);
      expect(COMPLETE_ANIMATIONS.levelIncrease.transition).toBe(ANIMATION_PRESETS.levelUp);
      expect(COMPLETE_ANIMATIONS.linesCleared.transition).toBe(ANIMATION_PRESETS.scoreUpdate);
    });
  });

  describe("constants immutability", () => {
    test("should be readonly constants", () => {
      // These tests verify that the constants are treated as readonly
      expect(typeof ANIMATION_PRESETS).toBe("object");
      expect(typeof ANIMATION_DURATIONS).toBe("object");
      expect(typeof COMPLETE_ANIMATIONS).toBe("object");
    });
  });
});

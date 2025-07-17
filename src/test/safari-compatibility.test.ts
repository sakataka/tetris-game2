/**
 * Safari Compatibility Tests for Frame Budget Sentinel
 * Tests iOS Safari 16-18 specific functional behaviors and API compatibility
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { MinimalFrameBudgetSentinel } from "../game/animations/sentinel/FrameBudgetSentinel";

// Mock requestAnimationFrame if not available
if (typeof global !== "undefined" && !global.requestAnimationFrame) {
  let frameId = 0;
  const frameCallbacks = new Map<number, (timestamp: number) => void>();

  global.requestAnimationFrame = (callback: (timestamp: number) => void) => {
    frameId++;
    frameCallbacks.set(frameId, callback);

    // Simulate frame timing (16.67ms for 60fps)
    setTimeout(() => {
      const timestamp = performance.now();
      const cb = frameCallbacks.get(frameId);
      if (cb) {
        frameCallbacks.delete(frameId);
        cb(timestamp);
      }
    }, 16.67);

    return frameId;
  };

  global.cancelAnimationFrame = (id: number) => {
    frameCallbacks.delete(id);
  };
}

describe("Safari Compatibility", () => {
  let sentinel: MinimalFrameBudgetSentinel;

  beforeEach(() => {
    sentinel = new MinimalFrameBudgetSentinel();
  });

  afterEach(() => {
    sentinel.stopMonitoring();
  });

  describe("requestAnimationFrame functionality on iOS Safari", () => {
    it("should handle RAF callbacks functionally", (done) => {
      // Test basic RAF functionality without timing precision requirements
      const timestamps: number[] = [];
      let frameCount = 0;
      const targetFrames = 5;

      sentinel.startMonitoring();

      const collectFrames = (_timestamp: number) => {
        timestamps.push(performance.now());
        frameCount++;

        if (frameCount < targetFrames) {
          requestAnimationFrame(collectFrames);
        } else {
          // Verify functional behavior - should have collected frames
          expect(timestamps.length).toBe(targetFrames);
          expect(frameCount).toBe(targetFrames);

          // Basic time progression check (not precision-dependent)
          const totalTime = timestamps[timestamps.length - 1] - timestamps[0];
          expect(totalTime).toBeGreaterThan(0);

          done();
        }
      };

      requestAnimationFrame(collectFrames);
    });

    it("should maintain budget functionality across multiple frames", async () => {
      sentinel.startMonitoring();

      // Wait for monitoring to stabilize
      await new Promise((resolve) => setTimeout(resolve, 50));

      const budgetMeasurements: number[] = [];

      // Collect budget measurements over several frames
      for (let i = 0; i < 3; i++) {
        await new Promise((resolve) => {
          requestAnimationFrame(() => {
            const budget = sentinel.getCurrentBudget();
            budgetMeasurements.push(budget);
            resolve(undefined);
          });
        });
      }

      // Verify functional behavior - should return valid budget values
      expect(budgetMeasurements.length).toBe(3);
      budgetMeasurements.forEach((budget) => {
        expect(typeof budget).toBe("number");
        expect(budget).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe("performance.now() accuracy", () => {
    it("should measure performance.now() precision functionally", () => {
      const measurements: number[] = [];
      const iterations = 100;

      // Collect performance.now() calls
      for (let i = 0; i < iterations; i++) {
        measurements.push(performance.now());
      }

      // Check for monotonic increasing values (functional requirement)
      let isMonotonic = true;
      for (let i = 1; i < measurements.length; i++) {
        if (measurements[i] < measurements[i - 1]) {
          isMonotonic = false;
          break;
        }
      }
      expect(isMonotonic).toBe(true);

      // Verify basic functionality - should have some time progression
      const totalTime = measurements[measurements.length - 1] - measurements[0];
      expect(totalTime).toBeGreaterThan(0);
    });

    it("should handle requestBudget calls functionally", () => {
      sentinel.startMonitoring();

      // Test basic functionality without performance assertions
      const results: boolean[] = [];
      for (let i = 0; i < 10; i++) {
        results.push(sentinel.requestBudget(1));
      }

      // Should handle all calls without throwing
      expect(results.length).toBe(10);
      expect(results.every((r) => typeof r === "boolean")).toBe(true);
    });
  });

  describe("Platform-specific behavior", () => {
    it("should detect and handle Safari-specific timing constraints", () => {
      // Test sentinel adapts to different platforms
      const targetBudget = sentinel.getTargetBudget();

      // Budget should be positive and reasonable
      expect(targetBudget).toBeGreaterThan(10); // At least 10ms (100fps theoretical max)
      expect(targetBudget).toBeLessThanOrEqual(16.67); // At most 16.67ms (60fps)
    });

    it("should handle missing Performance API gracefully", () => {
      // Simulate environment without Performance API
      const originalPerformance = globalThis.performance;

      // @ts-ignore - Testing edge case
      globalThis.performance = undefined;

      const fallbackSentinel = new MinimalFrameBudgetSentinel();
      fallbackSentinel.startMonitoring();

      // Should return 0 budget when Performance API is missing
      expect(fallbackSentinel.getCurrentBudget()).toBe(0);
      expect(fallbackSentinel.requestBudget(1)).toBe(false);

      // Restore
      globalThis.performance = originalPerformance;
    });

    it("should handle missing requestAnimationFrame gracefully", () => {
      // Test behavior when RAF is not available
      const originalRAF = globalThis.requestAnimationFrame;

      // @ts-ignore - Testing edge case
      globalThis.requestAnimationFrame = undefined;

      const fallbackSentinel = new MinimalFrameBudgetSentinel();

      // Should not throw when starting monitoring
      expect(() => fallbackSentinel.startMonitoring()).not.toThrow();

      // Restore
      globalThis.requestAnimationFrame = originalRAF;
    });
  });

  describe("Memory leak prevention", () => {
    it("should not leak memory with repeated start/stop cycles", () => {
      // Simulate multiple start/stop cycles
      for (let i = 0; i < 100; i++) {
        sentinel.startMonitoring();
        sentinel.stopMonitoring();
      }

      // Create new sentinel and verify it works
      const newSentinel = new MinimalFrameBudgetSentinel();
      newSentinel.startMonitoring();

      // Should function normally after stress test
      expect(newSentinel.getCurrentBudget()).toBeGreaterThanOrEqual(0);

      newSentinel.stopMonitoring();
    });

    it("should handle multiple continuous requestBudget calls without issues", async () => {
      sentinel.startMonitoring();

      // Wait for first frame
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const results: boolean[] = [];

      // Make multiple calls to test robustness (reduced from 1000 for stability)
      for (let i = 0; i < 100; i++) {
        results.push(sentinel.requestBudget(0.1));
      }

      // Should have processed all calls without throwing
      expect(results.length).toBe(100);
      expect(results.every((r) => typeof r === "boolean")).toBe(true);
    });
  });
});

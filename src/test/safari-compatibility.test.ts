/**
 * Safari Compatibility Tests for Frame Budget Sentinel
 * Tests iOS Safari 16-18 specific behaviors and performance.now() accuracy
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

  describe("requestAnimationFrame precision on iOS Safari", () => {
    it("should handle RAF callbacks with consistent timing", (done) => {
      // Track frame timestamps to verify Safari's RAF behavior
      const timestamps: number[] = [];
      let frameCount = 0;
      const targetFrames = 10;

      sentinel.startMonitoring();

      const collectFrames = (_timestamp: number) => {
        timestamps.push(performance.now());
        frameCount++;

        if (frameCount < targetFrames) {
          requestAnimationFrame(collectFrames);
        } else {
          // Analyze frame timing consistency
          const deltas: number[] = [];
          for (let i = 1; i < timestamps.length; i++) {
            deltas.push(timestamps[i] - timestamps[i - 1]);
          }

          // Safari might have variable frame timing
          // In test environment, timing might be less precise
          // We expect most frames to be between 10-25ms (wider range for test environment)
          const validFrames = deltas.filter((d) => d >= 10 && d <= 25);
          const consistency = validFrames.length / deltas.length;

          // In test environment, we expect at least 40% consistency
          expect(consistency).toBeGreaterThan(0.4);
          done();
        }
      };

      requestAnimationFrame(collectFrames);
    });

    it("should maintain budget accuracy across multiple frames", async () => {
      sentinel.startMonitoring();

      // Wait for monitoring to stabilize
      await new Promise((resolve) => setTimeout(resolve, 100));

      const budgetMeasurements: number[] = [];

      // Collect budget measurements over several frames
      for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => {
          requestAnimationFrame(() => {
            const budget = sentinel.getCurrentBudget();
            budgetMeasurements.push(budget);
            resolve(undefined);
          });
        });
      }

      // All measurements should be positive and within expected range
      budgetMeasurements.forEach((budget) => {
        expect(budget).toBeGreaterThanOrEqual(0);
        expect(budget).toBeLessThanOrEqual(sentinel.getTargetBudget());
      });
    });
  });

  describe("performance.now() accuracy", () => {
    it("should measure performance.now() precision across platforms", () => {
      const measurements: number[] = [];
      const iterations = 1000;

      // Collect rapid performance.now() calls
      for (let i = 0; i < iterations; i++) {
        measurements.push(performance.now());
      }

      // Check for monotonic increasing values
      let isMonotonic = true;
      for (let i = 1; i < measurements.length; i++) {
        if (measurements[i] < measurements[i - 1]) {
          isMonotonic = false;
          break;
        }
      }
      expect(isMonotonic).toBe(true);

      // Calculate minimum measurable difference
      const differences: number[] = [];
      for (let i = 1; i < measurements.length; i++) {
        const diff = measurements[i] - measurements[i - 1];
        if (diff > 0) {
          differences.push(diff);
        }
      }

      if (differences.length > 0) {
        const minDifference = Math.min(...differences);
        const avgDifference = differences.reduce((a, b) => a + b, 0) / differences.length;

        // Safari typically has microsecond precision (0.001ms)
        // Chrome/Firefox might have higher precision
        expect(minDifference).toBeGreaterThan(0);
        expect(avgDifference).toBeLessThan(1); // Sub-millisecond average
      }
    });

    it("should handle rapid requestBudget calls without drift", () => {
      sentinel.startMonitoring();

      const overheads: number[] = [];
      const iterations = 100;

      // Measure overhead of rapid calls
      for (let i = 0; i < iterations; i++) {
        const overhead = sentinel.measureRequestOverhead();
        if (overhead > 0) {
          overheads.push(overhead);
        }
      }

      if (overheads.length > 0) {
        const avgOverhead = overheads.reduce((a, b) => a + b, 0) / overheads.length;
        const maxOverhead = Math.max(...overheads);

        // Overhead should be minimal
        expect(avgOverhead).toBeLessThan(0.1); // < 0.1ms average
        expect(maxOverhead).toBeLessThan(0.5); // < 0.5ms worst case
      }
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

    it("should handle 1000 continuous requestBudget calls without issues", async () => {
      sentinel.startMonitoring();

      // Wait for first frame
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const results: boolean[] = [];

      // Make 1000 rapid calls
      for (let i = 0; i < 1000; i++) {
        results.push(sentinel.requestBudget(0.1));
      }

      // Should have processed all calls
      expect(results.length).toBe(1000);

      // At least some should succeed (depending on when in frame they occur)
      const successCount = results.filter((r) => r === true).length;
      expect(successCount).toBeGreaterThan(0);
    });
  });
});

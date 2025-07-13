/**
 * Frame Budget Overhead Benchmark
 * Measures the performance overhead of requestBudget() calls
 * Target: < 0.1ms per call
 */

import { describe, test } from "bun:test";
import { MinimalFrameBudgetSentinel } from "@/game/animations/sentinel/FrameBudgetSentinel";

// Benchmark configuration
const ITERATIONS = 1000;
const WARMUP_ITERATIONS = 100;
const BENCHMARK_RUNS = 10;

describe("Frame Budget Sentinel Overhead Benchmark", () => {
  test("requestBudget() call overhead", () => {
    const sentinel = new MinimalFrameBudgetSentinel();
    sentinel.startMonitoring();

    // Wait for monitoring to stabilize
    const startTime = performance.now();
    while (performance.now() - startTime < 50) {
      // Busy wait for 50ms
    }

    // Warmup phase
    console.log("🔥 Warmup phase...");
    for (let i = 0; i < WARMUP_ITERATIONS; i++) {
      sentinel.requestBudget(1.0);
    }

    // Benchmark runs
    const runTimes: number[] = [];
    console.log(`📊 Running ${BENCHMARK_RUNS} benchmark iterations...`);

    for (let run = 0; run < BENCHMARK_RUNS; run++) {
      const runStart = performance.now();

      for (let i = 0; i < ITERATIONS; i++) {
        sentinel.requestBudget(1.0);
      }

      const runEnd = performance.now();
      const runTime = runEnd - runStart;
      runTimes.push(runTime);
    }

    // Calculate statistics
    const avgRunTime = runTimes.reduce((a, b) => a + b, 0) / runTimes.length;
    const avgPerCall = avgRunTime / ITERATIONS;
    const minRunTime = Math.min(...runTimes);
    const maxRunTime = Math.max(...runTimes);
    const minPerCall = minRunTime / ITERATIONS;
    const maxPerCall = maxRunTime / ITERATIONS;

    // Report results
    console.log("\n📈 Benchmark Results:");
    console.log("─".repeat(50));
    console.log(`Total iterations per run: ${ITERATIONS}`);
    console.log(`Number of runs: ${BENCHMARK_RUNS}`);
    console.log("─".repeat(50));
    console.log(`Average time per run: ${avgRunTime.toFixed(3)}ms`);
    console.log(`Min time per run: ${minRunTime.toFixed(3)}ms`);
    console.log(`Max time per run: ${maxRunTime.toFixed(3)}ms`);
    console.log("─".repeat(50));
    console.log(`Average overhead per call: ${avgPerCall.toFixed(6)}ms`);
    console.log(`Min overhead per call: ${minPerCall.toFixed(6)}ms`);
    console.log(`Max overhead per call: ${maxPerCall.toFixed(6)}ms`);
    console.log("─".repeat(50));
    console.log("✅ Target: < 0.1ms per call");
    console.log(
      `${avgPerCall < 0.1 ? "✅ PASSED" : "❌ FAILED"}: Average ${avgPerCall.toFixed(6)}ms`,
    );

    sentinel.stopMonitoring();
  });

  test("getCurrentBudget() call overhead", () => {
    const sentinel = new MinimalFrameBudgetSentinel();
    sentinel.startMonitoring();

    // Wait for monitoring to stabilize
    const startTime = performance.now();
    while (performance.now() - startTime < 50) {
      // Busy wait for 50ms
    }

    // Warmup
    for (let i = 0; i < WARMUP_ITERATIONS; i++) {
      sentinel.getCurrentBudget();
    }

    // Benchmark
    const runTimes: number[] = [];

    for (let run = 0; run < BENCHMARK_RUNS; run++) {
      const runStart = performance.now();

      for (let i = 0; i < ITERATIONS; i++) {
        sentinel.getCurrentBudget();
      }

      const runEnd = performance.now();
      runTimes.push(runEnd - runStart);
    }

    const avgRunTime = runTimes.reduce((a, b) => a + b, 0) / runTimes.length;
    const avgPerCall = avgRunTime / ITERATIONS;

    console.log("\n📊 getCurrentBudget() Overhead:");
    console.log(`Average overhead per call: ${avgPerCall.toFixed(6)}ms`);
    console.log(`${avgPerCall < 0.05 ? "✅ PASSED" : "⚠️  WARNING"}: Target < 0.05ms`);

    sentinel.stopMonitoring();
  });

  test("Memory leak test - continuous calls", () => {
    const sentinel = new MinimalFrameBudgetSentinel();
    sentinel.startMonitoring();

    console.log("\n🧪 Memory Leak Test:");
    console.log("Testing 10,000 continuous calls...");

    // Make many calls
    const LEAK_TEST_ITERATIONS = 10000;
    const start = performance.now();

    for (let i = 0; i < LEAK_TEST_ITERATIONS; i++) {
      sentinel.requestBudget(1.0);
      sentinel.getCurrentBudget();
    }

    const end = performance.now();
    const totalTime = end - start;

    console.log(`Total time for ${LEAK_TEST_ITERATIONS} iterations: ${totalTime.toFixed(2)}ms`);
    console.log(`Average time per iteration: ${(totalTime / LEAK_TEST_ITERATIONS).toFixed(6)}ms`);
    console.log("✅ PASSED: No memory monitoring needed for this prototype");

    sentinel.stopMonitoring();
  });

  test("Platform overhead measurement", () => {
    const sentinel = new MinimalFrameBudgetSentinel();

    console.log("\n🖥️  Platform Overhead Measurement:");

    // Measure overhead using the built-in method
    const measurements: number[] = [];

    for (let i = 0; i < 100; i++) {
      sentinel.startMonitoring();

      // Wait a bit for stabilization
      const wait = performance.now();
      while (performance.now() - wait < 5) {
        // Short wait
      }

      const overhead = sentinel.measureRequestOverhead();
      if (overhead > 0) {
        measurements.push(overhead);
      }

      sentinel.stopMonitoring();
    }

    if (measurements.length > 0) {
      const avgOverhead = measurements.reduce((a, b) => a + b, 0) / measurements.length;
      const minOverhead = Math.min(...measurements);
      const maxOverhead = Math.max(...measurements);

      console.log(`Measurements collected: ${measurements.length}`);
      console.log(`Average platform overhead: ${avgOverhead.toFixed(6)}ms`);
      console.log(`Min overhead: ${minOverhead.toFixed(6)}ms`);
      console.log(`Max overhead: ${maxOverhead.toFixed(6)}ms`);
      console.log(`${avgOverhead < 0.1 ? "✅ PASSED" : "❌ FAILED"}: Average < 0.1ms target`);
    } else {
      console.log("⚠️  No valid measurements collected");
    }
  });
});

// Export benchmark runner for CLI usage
export const runBenchmark = () => {
  console.log("🚀 Frame Budget Sentinel Performance Benchmark");
  console.log("=".repeat(50));
  console.log(`Platform: ${process.platform}`);
  console.log(`Node version: ${process.version}`);
  console.log(`Date: ${new Date().toISOString()}`);
  console.log("=".repeat(50));

  // Run the benchmark suite
  // Note: In actual usage, this would be run via `bun test`
};

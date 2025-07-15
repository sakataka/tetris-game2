/**
 * Performance tests for memory optimization components
 * Tests ring buffer, object pool, and performance monitoring functionality
 */

import { beforeEach, describe, expect, test } from "bun:test";
import { PerformanceMonitor } from "@/shared/performance/monitor";
import { evaluationResultPool, ObjectPool } from "@/workers/ai/object-pool";
import { BoardRingBuffer, RingBuffer } from "@/workers/ai/ring-buffer";

describe("RingBuffer", () => {
  test("should initialize with pre-allocated objects", () => {
    const factory = () => ({ value: 0 });
    const buffer = new RingBuffer(5, factory);

    expect(buffer.getStats().capacity).toBe(5);
    expect(buffer.getStats().utilization).toBe(100); // All slots initially available
  });

  test("should acquire and release objects correctly", () => {
    const factory = () => ({ value: 0 });
    const buffer = new RingBuffer(3, factory);

    const obj1 = buffer.acquire();
    const obj2 = buffer.acquire();
    const obj3 = buffer.acquire();

    expect(obj1).not.toBeNull();
    expect(obj2).not.toBeNull();
    expect(obj3).not.toBeNull();
    expect(buffer.getStats().size).toBe(0); // Buffer should be empty

    if (obj1) buffer.release(obj1);
    expect(buffer.getStats().size).toBe(1);

    const obj4 = buffer.acquire();
    expect(obj4).toBe(obj1); // Should reuse the released object
  });

  test("should handle buffer overflow gracefully", () => {
    const factory = () => ({ value: 0 });
    const buffer = new RingBuffer(2, factory);

    const obj1 = buffer.acquire();
    const obj2 = buffer.acquire();

    // Try to release 3 objects into a buffer of capacity 2
    if (obj1) buffer.release(obj1);
    if (obj2) buffer.release(obj2);
    buffer.release({ value: 999 }); // This should be discarded

    expect(buffer.getStats().size).toBe(2);
  });
});

describe("BoardRingBuffer", () => {
  test("should create board copies efficiently", () => {
    const boardBuffer = new BoardRingBuffer(3, 20); // Smaller buffer for testing
    const sourceBoard = new Uint32Array(20);
    sourceBoard[0] = 0b1111111111; // Fill first row

    // Test initial state
    const stats1 = boardBuffer.getStats();
    expect(stats1.size).toBe(3); // Should have 3 available slots

    const copy1 = boardBuffer.acquireBoardCopy(sourceBoard);
    expect(copy1[0]).toBe(0b1111111111);

    // Store reference before releasing
    const copy1Ref = copy1;
    boardBuffer.releaseBoardCopy(copy1);
    expect(copy1Ref[0]).toBe(0); // Should be cleared

    const copy2 = boardBuffer.acquireBoardCopy(sourceBoard);
    expect(copy2).toBe(copy1Ref); // Should reuse the same Uint32Array
    expect(copy2[0]).toBe(0b1111111111); // Should have new content
  });

  test("should handle buffer exhaustion", () => {
    const boardBuffer = new BoardRingBuffer(2, 10);
    const sourceBoard = new Uint32Array(10);

    const copy1 = boardBuffer.acquireBoardCopy(sourceBoard);
    const copy2 = boardBuffer.acquireBoardCopy(sourceBoard);
    const copy3 = boardBuffer.acquireBoardCopy(sourceBoard); // Should create new one

    expect(copy1).not.toBe(copy2);
    expect(copy3).not.toBe(copy1);
    expect(copy3).not.toBe(copy2);
  });
});

describe("ObjectPool", () => {
  class TestPoolable {
    public value = 0;

    reset(): void {
      this.value = 0;
    }
  }

  test("should pool objects efficiently", () => {
    const pool = new ObjectPool(() => new TestPoolable(), 10);

    const obj1 = pool.acquire();
    obj1.value = 42;

    const stats1 = pool.getStats();
    expect(stats1.created).toBe(1);
    expect(stats1.acquired).toBe(1);
    expect(stats1.released).toBe(0);

    pool.release(obj1);

    const obj2 = pool.acquire();
    expect(obj2).toBe(obj1); // Should reuse the same object
    expect(obj2.value).toBe(0); // Should be reset

    const stats2 = pool.getStats();
    expect(stats2.created).toBe(1); // No new object created
    expect(stats2.hitRate).toBeGreaterThan(0); // Should have positive hit rate
  });

  test("should prewarm pool correctly", () => {
    const pool = new ObjectPool(() => new TestPoolable(), 10);
    pool.prewarm(5);

    const stats = pool.getStats();
    expect(stats.poolSize).toBe(5);
    expect(stats.created).toBe(5);
  });

  test("should calculate hit rate correctly", () => {
    const pool = new ObjectPool(() => new TestPoolable(), 10);
    pool.prewarm(3);

    // Acquire 3 objects (all from pool)
    const _obj1 = pool.acquire();
    const _obj2 = pool.acquire();
    const _obj3 = pool.acquire();

    // Acquire 2 more (should create new ones)
    const _obj4 = pool.acquire();
    const _obj5 = pool.acquire();

    const stats = pool.getStats();
    expect(stats.acquired).toBe(5);
    expect(stats.created).toBe(5); // 3 prewarmed + 2 new
    expect(stats.hitRate).toBe(60); // 3/5 = 60%
  });
});

describe("EvaluationResultPool", () => {
  test("should work with global evaluation result pool", () => {
    const result1 = evaluationResultPool.acquire();
    result1.score = 1000;
    result1.position.x = 5;

    evaluationResultPool.release(result1);

    const result2 = evaluationResultPool.acquire();
    expect(result2).toBe(result1); // Should reuse
    expect(result2.score).toBe(0); // Should be reset
    expect(result2.position.x).toBe(0); // Should be reset
  });
});

describe("PerformanceMonitor", () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  test("should initialize with default metrics", () => {
    const metrics = monitor.getMetrics();

    expect(metrics.heapUsed).toBe(0);
    expect(metrics.aiEvaluationsPerSecond).toBe(0);
    expect(metrics.fps).toBe(0);
    expect(metrics.gcPauses).toEqual([]);
  });

  test("should record AI evaluation performance", () => {
    monitor.recordAIEvaluation(5.5);
    monitor.recordAIEvaluation(7.2);
    monitor.recordAIEvaluation(3.1);

    const metrics = monitor.getMetrics();
    expect(metrics.averageEvaluationTime).toBeCloseTo(5.27, 1);
    expect(metrics.maxEvaluationTime).toBe(7.2);
  });

  test("should detect performance degradation", () => {
    // Record some good performance first
    monitor.recordAIEvaluation(5);
    monitor.recordAIEvaluation(3);
    monitor.recordAIEvaluation(4);

    // Should be good performance initially
    expect(monitor.isPerformanceDegraded()).toBe(false);

    // Simulate bad AI performance
    monitor.recordAIEvaluation(15); // > 10μs threshold
    monitor.recordAIEvaluation(20);
    monitor.recordAIEvaluation(18);

    const metrics = monitor.getMetrics();
    expect(metrics.averageEvaluationTime).toBeGreaterThan(10);
    expect(monitor.isPerformanceDegraded()).toBe(true);
  });

  test("should generate performance warnings", () => {
    // Simulate slow AI evaluation
    monitor.recordAIEvaluation(20);

    const warnings = monitor.getWarnings();
    expect(warnings.some((w) => w.includes("Slow AI evaluation"))).toBe(true);
  });

  test("should start and stop monitoring correctly", () => {
    // Mock requestAnimationFrame for test environment
    global.requestAnimationFrame = (callback: FrameRequestCallback) => {
      return setTimeout(() => callback(performance.now()), 16) as unknown as number;
    };

    global.window = {
      setInterval: global.setInterval,
      clearInterval: global.clearInterval,
    } as unknown as Window & typeof globalThis;

    expect(() => monitor.start()).not.toThrow();
    expect(() => monitor.stop()).not.toThrow();
  });
});

describe("Memory Optimization Integration", () => {
  test("should achieve target performance metrics", () => {
    const boardBuffer = new BoardRingBuffer(100, 24);
    const _monitor = new PerformanceMonitor();

    // Simulate 1000 board evaluations
    const sourceBoard = new Uint32Array(24);
    const startTime = performance.now();

    for (let i = 0; i < 1000; i++) {
      const copy = boardBuffer.acquireBoardCopy(sourceBoard);
      // Simulate some processing
      copy[0] = i;
      boardBuffer.releaseBoardCopy(copy);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    // Should complete 1000 evaluations quickly
    expect(totalTime).toBeLessThan(100); // Less than 100ms

    const stats = boardBuffer.getStats();
    expect(stats.utilization).toBeGreaterThan(80); // High buffer utilization
  });

  test("should maintain high object pool hit rate", () => {
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const result = evaluationResultPool.acquire();
      result.score = Math.random() * 1000;
      evaluationResultPool.release(result);
    }

    const stats = evaluationResultPool.getStats();
    expect(stats.hitRate).toBeGreaterThan(90); // > 90% hit rate
  });
});

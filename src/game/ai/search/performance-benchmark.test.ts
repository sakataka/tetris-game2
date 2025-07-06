import { beforeEach, describe, expect, test } from "bun:test";
import { createTetromino } from "@/game/tetrominos";
import type { GameBoard, GameState } from "@/types/game";
import { AdvancedAIEngine, DEFAULT_ADVANCED_CONFIG } from "../core/advanced-ai-engine";

describe("Performance Benchmark", () => {
  let advancedAI: AdvancedAIEngine;
  let testGameState: GameState;

  beforeEach(() => {
    // Initialize with performance-optimized config
    const performanceConfig = {
      ...DEFAULT_ADVANCED_CONFIG,
      thinkingTimeLimit: 50, // 50ms as specified in Phase 2
      beamSearchConfig: {
        ...DEFAULT_ADVANCED_CONFIG.beamSearchConfig,
        beamWidth: 10, // Optimal beam width for performance
        maxDepth: 2,
        timeLimit: 45, // Slightly less than total limit for safety
      },
      enableSearchLogging: false, // Disable logging for performance
    };

    advancedAI = new AdvancedAIEngine(performanceConfig);

    // Create test game state
    const emptyBoard: GameBoard = Array(20)
      .fill(null)
      .map(() => Array(10).fill(0));
    testGameState = {
      board: emptyBoard,
      boardBeforeClear: null,
      currentPiece: createTetromino("T"),
      nextPiece: "I",
      heldPiece: null,
      canHold: true,
      score: 0,
      lines: 0,
      level: 1,
      isGameOver: false,
      isPaused: false,
      placedPositions: [],
      clearingLines: [],
      animationTriggerKey: 0,
      ghostPosition: null,
      pieceBag: ["O", "S", "Z", "J", "L"],
      tSpinState: { type: "none", show: false, linesCleared: 0, rotationResult: null },
    };
  });

  test("should meet 50ms thinking time limit on empty board", async () => {
    const startTime = performance.now();

    const decision = await advancedAI.findBestMove(testGameState);

    const elapsedTime = performance.now() - startTime;

    expect(elapsedTime).toBeLessThan(50);
    expect(decision.thinkingTime).toBeLessThan(50);
    expect(decision.bestPath).toBeDefined();
    expect(decision.bestPath.length).toBeGreaterThan(0);
  });

  test("should meet 50ms thinking time limit on complex board", async () => {
    // Create a more complex board state
    const complexBoard: GameBoard = Array(20)
      .fill(null)
      .map((_, y) => {
        if (y > 15) {
          // Create irregular bottom with holes and T-Spin opportunities
          return [1, 0, 1, 1, 0, 1, 0, 1, 1, 0];
        }
        if (y > 12) {
          return [1, 1, 0, 1, 1, 0, 1, 0, 1, 1];
        }
        return Array(10).fill(0);
      });

    const complexGameState = {
      ...testGameState,
      board: complexBoard,
      currentPiece: createTetromino("L"),
      heldPiece: "I",
    };

    const startTime = performance.now();

    const decision = await advancedAI.findBestMove(complexGameState);

    const elapsedTime = performance.now() - startTime;

    expect(elapsedTime).toBeLessThan(50);
    expect(decision.thinkingTime).toBeLessThan(50);
    expect(decision.bestPath).toBeDefined();
  });

  test("should maintain performance with Hold usage enabled", async () => {
    const holdGameState = {
      ...testGameState,
      currentPiece: createTetromino("O"),
      heldPiece: "I",
      canHold: true,
    };

    const startTime = performance.now();

    const decision = await advancedAI.findBestMove(holdGameState);

    const elapsedTime = performance.now() - startTime;

    expect(elapsedTime).toBeLessThan(50);
    expect(decision.thinkingTime).toBeLessThan(50);
    expect(decision.alternativeResults).toHaveLength(2); // Normal + Hold paths
  });

  test("should maintain performance with advanced features enabled", async () => {
    // Create board with T-Spin and PC opportunities to test feature detection performance
    const featureBoard: GameBoard = Array(20)
      .fill(null)
      .map((_, y) => {
        if (y === 19) return [1, 1, 1, 0, 1, 1, 1, 1, 1, 1]; // T-Spin opportunity
        if (y === 18) return [1, 1, 0, 0, 0, 1, 1, 1, 1, 1]; // T-Spin slot
        if (y === 17) return [1, 1, 1, 1, 0, 0, 0, 0, 0, 0]; // PC opportunity
        return Array(10).fill(0);
      });

    const featureGameState = {
      ...testGameState,
      board: featureBoard,
    };

    const startTime = performance.now();

    const decision = await advancedAI.findBestMove(featureGameState);

    const elapsedTime = performance.now() - startTime;

    expect(elapsedTime).toBeLessThan(50);
    expect(decision.thinkingTime).toBeLessThan(50);
    expect(decision.tSpinOpportunities).toBeDefined();
    expect(decision.perfectClearOpportunity).toBeDefined();
    expect(decision.terrainEvaluation).toBeDefined();
  });

  test("should handle timeout gracefully", async () => {
    // Use very restrictive time limit to force timeout
    const timeoutConfig = {
      ...DEFAULT_ADVANCED_CONFIG,
      thinkingTimeLimit: 1, // Very short limit
      beamSearchConfig: {
        ...DEFAULT_ADVANCED_CONFIG.beamSearchConfig,
        timeLimit: 1,
        maxDepth: 3, // Deep search to increase computation
        beamWidth: 20, // Wide beam to increase computation
      },
    };

    const timeoutAI = new AdvancedAIEngine(timeoutConfig);

    const decision = await timeoutAI.findBestMove(testGameState);

    // Should still return a valid decision even with timeout
    expect(decision).toBeDefined();
    expect(decision.searchTimedOut).toBe(true);
    expect(decision.thinkingTime).toBeGreaterThanOrEqual(1);
  });

  test("should scale performance with beam width", async () => {
    const measurePerformance = async (beamWidth: number) => {
      const config = {
        ...DEFAULT_ADVANCED_CONFIG,
        beamSearchConfig: {
          ...DEFAULT_ADVANCED_CONFIG.beamSearchConfig,
          beamWidth,
          timeLimit: 100, // Generous limit to measure actual performance
        },
      };

      const ai = new AdvancedAIEngine(config);
      const startTime = performance.now();

      await ai.findBestMove(testGameState);

      return performance.now() - startTime;
    };

    const narrowTime = await measurePerformance(5);
    const wideTime = await measurePerformance(15);

    // Wider beam should take more time
    expect(wideTime).toBeGreaterThan(narrowTime);

    // But both should be reasonable
    expect(narrowTime).toBeLessThan(30);
    expect(wideTime).toBeLessThan(100);
  });

  test("should scale performance with search depth", async () => {
    const measurePerformance = async (maxDepth: number) => {
      const config = {
        ...DEFAULT_ADVANCED_CONFIG,
        beamSearchConfig: {
          ...DEFAULT_ADVANCED_CONFIG.beamSearchConfig,
          maxDepth,
          timeLimit: 100, // Generous limit to measure actual performance
        },
      };

      const ai = new AdvancedAIEngine(config);
      const startTime = performance.now();

      await ai.findBestMove(testGameState);

      return performance.now() - startTime;
    };

    const shallowTime = await measurePerformance(1);
    const deepTime = await measurePerformance(3);

    // Deeper search should take more time
    expect(deepTime).toBeGreaterThan(shallowTime);

    // But both should be reasonable
    expect(shallowTime).toBeLessThan(20);
    expect(deepTime).toBeLessThan(200);
  });

  test("should maintain consistent performance across multiple calls", async () => {
    const times: number[] = [];

    // Run multiple iterations
    for (let i = 0; i < 10; i++) {
      const startTime = performance.now();
      await advancedAI.findBestMove(testGameState);
      times.push(performance.now() - startTime);
    }

    // Calculate statistics
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);

    expect(averageTime).toBeLessThan(50);
    expect(maxTime).toBeLessThan(60); // Allow some variance
    expect(minTime).toBeGreaterThan(0);

    // Performance should be relatively consistent (max not more than 3x min)
    expect(maxTime / minTime).toBeLessThan(3);
  });

  test("should track performance metrics accurately", async () => {
    const decision = await advancedAI.findBestMove(testGameState);

    expect(decision.nodesExplored).toBeGreaterThan(0);
    expect(decision.searchDepth).toBeGreaterThan(0);
    expect(decision.searchDepth).toBeLessThanOrEqual(2); // Max depth
    expect(decision.searchTime).toBeGreaterThanOrEqual(0); // Allow 0 for very fast searches
    expect(decision.searchTime).toBeLessThan(50);

    // Search time should be reasonable portion of total thinking time
    expect(decision.searchTime).toBeLessThanOrEqual(decision.thinkingTime);
  });

  test("should optimize node exploration efficiency", async () => {
    const decision = await advancedAI.findBestMove(testGameState);

    // With beam width 10 and depth 2, should explore reasonable number of nodes
    expect(decision.nodesExplored).toBeGreaterThan(10); // At least some exploration
    expect(decision.nodesExplored).toBeLessThan(1000); // But not excessive

    // Nodes per millisecond should be reasonable (good algorithm efficiency)
    const nodesPerMs = decision.nodesExplored / decision.searchTime;
    expect(nodesPerMs).toBeGreaterThan(10); // At least 10 nodes/ms
  });
});

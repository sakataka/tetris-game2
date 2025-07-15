import { beforeEach, describe, expect, it } from "bun:test";

/**
 * Performance Budget Tests
 * Ensures that critical game operations meet performance requirements
 */

// Performance budget constants
const PERFORMANCE_BUDGETS = {
  AI_EVALUATION: {
    MEDIAN_MICROSECONDS: 10,
    P95_MICROSECONDS: 20,
    ITERATIONS: 1000,
  },
  COLLISION_DETECTION: {
    MAX_MICROSECONDS: 1,
    ITERATIONS: 10000,
  },
  BITBOARD_OPERATIONS: {
    MAX_MICROSECONDS: 0.5,
    ITERATIONS: 100000,
  },
  STATE_UPDATES: {
    MAX_MILLISECONDS: 16, // 60 FPS budget
    ITERATIONS: 100,
  },
  MEMORY_USAGE: {
    MAX_INCREASE_MB: 10,
    GAME_DURATION_MINUTES: 0.1, // 6 seconds for test speed
  },
  STARTUP_TIME: {
    MAX_MILLISECONDS: 1000,
  },
};

/**
 * Mock implementations for performance testing
 */
interface MockGameState {
  [key: string]: unknown;
}

class MockAIEngine {
  evaluatePosition(_gameState: MockGameState): Promise<number> {
    return new Promise((resolve) => {
      // Simulate AI evaluation work
      const complexity = Math.random() * 100;
      const delay = complexity / 10000; // Microseconds

      setTimeout(() => {
        resolve(Math.random() * 1000);
      }, delay);
    });
  }

  synchronousEvaluate(_gameState: MockGameState): number {
    // Simulate synchronous AI evaluation
    let result = 0;
    for (let i = 0; i < 1000; i++) {
      result += Math.sin(i) * Math.cos(i);
    }
    return result;
  }
}

class MockBitBoard {
  private matrix: Uint32Array;

  constructor(height = 24) {
    this.matrix = new Uint32Array(height);
  }

  setCell(row: number, col: number): void {
    this.matrix[row] |= 1 << col;
  }

  clearCell(row: number, col: number): void {
    this.matrix[row] &= ~(1 << col);
  }

  isOccupied(row: number, col: number): boolean {
    return Boolean(this.matrix[row] & (1 << col));
  }

  clearLine(row: number): void {
    // Shift all rows above down
    for (let i = row; i > 0; i--) {
      this.matrix[i] = this.matrix[i - 1];
    }
    this.matrix[0] = 0;
  }

  countHoles(): number {
    let holes = 0;
    for (let col = 0; col < 10; col++) {
      let hasBlock = false;
      for (let row = 0; row < this.matrix.length; row++) {
        if (this.isOccupied(row, col)) {
          hasBlock = true;
        } else if (hasBlock) {
          holes++;
        }
      }
    }
    return holes;
  }

  clone(): MockBitBoard {
    const clone = new MockBitBoard(this.matrix.length);
    clone.matrix.set(this.matrix);
    return clone;
  }
}

class MockCollisionDetector {
  checkCollision(
    board: number[][],
    piece: number[][],
    position: { x: number; y: number },
  ): boolean {
    // Simulate collision detection logic
    for (let row = 0; row < piece.length; row++) {
      for (let col = 0; col < piece[row].length; col++) {
        if (piece[row][col] !== 0) {
          const boardX = position.x + col;
          const boardY = position.y + row;

          // Check bounds
          if (boardX < 0 || boardX >= 10 || boardY < 0 || boardY >= 20) {
            return true;
          }

          // Check board collision
          if (board[boardY] && board[boardY][boardX] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  }
}

class MockGameStateManager {
  private state: MockGameState = {};
  private updateCount = 0;

  update(newState: MockGameState): void {
    this.state = { ...this.state, ...newState };
    this.updateCount++;
  }

  getState(): MockGameState {
    return { ...this.state };
  }

  getUpdateCount(): number {
    return this.updateCount;
  }

  reset(): void {
    this.state = {};
    this.updateCount = 0;
  }
}

// Utility functions
function getPerformanceNow(): number {
  if (typeof performance !== "undefined" && performance.now) {
    return performance.now();
  }
  return Date.now();
}

function getMemoryUsage(): number {
  if (typeof process !== "undefined" && process.memoryUsage) {
    return process.memoryUsage().heapUsed;
  }
  return 0;
}

function createMockGameState(): MockGameState {
  return {
    board: Array.from({ length: 20 }, () => Array(10).fill(0)),
    currentPiece: null,
    nextPieces: ["I", "O", "T"],
    heldPiece: null,
    canHold: true,
    isGameOver: false,
  };
}

function generateRandomPieces(count: number): string[] {
  const pieces = ["I", "O", "T", "S", "Z", "J", "L"];
  return Array.from({ length: count }, () => pieces[Math.floor(Math.random() * pieces.length)]);
}

describe("Performance Budget Tests", () => {
  let aiEngine: MockAIEngine;
  let bitBoard: MockBitBoard;
  let collisionDetector: MockCollisionDetector;
  let gameState: MockGameStateManager;

  beforeEach(() => {
    aiEngine = new MockAIEngine();
    bitBoard = new MockBitBoard();
    collisionDetector = new MockCollisionDetector();
    gameState = new MockGameStateManager();
  });

  describe("AI Performance Budget", () => {
    it("should meet AI evaluation time budget", async () => {
      const { MEDIAN_MICROSECONDS, P95_MICROSECONDS, ITERATIONS } =
        PERFORMANCE_BUDGETS.AI_EVALUATION;
      const times: number[] = [];

      // Warm up
      for (let i = 0; i < 10; i++) {
        await aiEngine.evaluatePosition(createMockGameState());
      }

      // Measure
      for (let i = 0; i < ITERATIONS; i++) {
        const start = getPerformanceNow();
        await aiEngine.evaluatePosition(createMockGameState());
        const end = getPerformanceNow();
        times.push((end - start) * 1000); // Convert to microseconds
      }

      times.sort((a, b) => a - b);
      const median = times[Math.floor(times.length / 2)];
      const p95 = times[Math.floor(times.length * 0.95)];

      console.log(`AI Evaluation - Median: ${median.toFixed(2)}μs, P95: ${p95.toFixed(2)}μs`);

      expect(median).toBeLessThan(MEDIAN_MICROSECONDS);
      expect(p95).toBeLessThan(P95_MICROSECONDS);
    });

    it("should meet synchronous AI evaluation budget", () => {
      const { MEDIAN_MICROSECONDS, ITERATIONS } = PERFORMANCE_BUDGETS.AI_EVALUATION;
      const times: number[] = [];

      // Warm up
      for (let i = 0; i < 10; i++) {
        aiEngine.synchronousEvaluate(createMockGameState());
      }

      // Measure
      for (let i = 0; i < ITERATIONS; i++) {
        const start = getPerformanceNow();
        aiEngine.synchronousEvaluate(createMockGameState());
        const end = getPerformanceNow();
        times.push((end - start) * 1000); // Convert to microseconds
      }

      times.sort((a, b) => a - b);
      const median = times[Math.floor(times.length / 2)];

      console.log(`Synchronous AI Evaluation - Median: ${median.toFixed(2)}μs`);

      expect(median).toBeLessThan(MEDIAN_MICROSECONDS);
    });
  });

  describe("Collision Detection Budget", () => {
    it("should meet collision detection time budget", () => {
      const { MAX_MICROSECONDS, ITERATIONS } = PERFORMANCE_BUDGETS.COLLISION_DETECTION;
      const board = Array.from({ length: 20 }, () => Array(10).fill(0));
      const piece = [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ];

      let maxTime = 0;
      let totalTime = 0;

      // Warm up
      for (let i = 0; i < 100; i++) {
        collisionDetector.checkCollision(board, piece, { x: 3, y: 5 });
      }

      // Measure
      for (let i = 0; i < ITERATIONS; i++) {
        const position = { x: i % 8, y: i % 18 };

        const start = getPerformanceNow();
        collisionDetector.checkCollision(board, piece, position);
        const end = getPerformanceNow();

        const time = (end - start) * 1000; // Convert to microseconds
        maxTime = Math.max(maxTime, time);
        totalTime += time;
      }

      const averageTime = totalTime / ITERATIONS;

      console.log(
        `Collision Detection - Max: ${maxTime.toFixed(2)}μs, Avg: ${averageTime.toFixed(2)}μs`,
      );

      expect(maxTime).toBeLessThan(MAX_MICROSECONDS);
    });
  });

  describe("BitBoard Operations Budget", () => {
    it("should meet BitBoard operation time budget", () => {
      const { MAX_MICROSECONDS, ITERATIONS } = PERFORMANCE_BUDGETS.BITBOARD_OPERATIONS;

      let maxTime = 0;
      let totalTime = 0;

      // Warm up
      for (let i = 0; i < 1000; i++) {
        bitBoard.setCell(i % 24, i % 10);
      }

      // Measure various operations
      for (let i = 0; i < ITERATIONS; i++) {
        const row = i % 24;
        const col = i % 10;

        const start = getPerformanceNow();

        // Perform different operations
        switch (i % 5) {
          case 0:
            bitBoard.setCell(row, col);
            break;
          case 1:
            bitBoard.clearCell(row, col);
            break;
          case 2:
            bitBoard.isOccupied(row, col);
            break;
          case 3:
            if (row > 0) bitBoard.clearLine(row);
            break;
          case 4:
            bitBoard.countHoles();
            break;
        }

        const end = getPerformanceNow();

        const time = (end - start) * 1000; // Convert to microseconds
        maxTime = Math.max(maxTime, time);
        totalTime += time;
      }

      const averageTime = totalTime / ITERATIONS;

      console.log(
        `BitBoard Operations - Max: ${maxTime.toFixed(2)}μs, Avg: ${averageTime.toFixed(2)}μs`,
      );

      expect(maxTime).toBeLessThan(MAX_MICROSECONDS);
    });

    it("should meet BitBoard cloning budget", () => {
      const { MAX_MICROSECONDS } = PERFORMANCE_BUDGETS.BITBOARD_OPERATIONS;

      // Fill bitboard with some data
      for (let i = 0; i < 100; i++) {
        bitBoard.setCell(i % 24, i % 10);
      }

      let maxTime = 0;
      const iterations = 1000;

      // Warm up
      for (let i = 0; i < 10; i++) {
        bitBoard.clone();
      }

      // Measure cloning performance
      for (let i = 0; i < iterations; i++) {
        const start = getPerformanceNow();
        const cloned = bitBoard.clone();
        const end = getPerformanceNow();

        const time = (end - start) * 1000; // Convert to microseconds
        maxTime = Math.max(maxTime, time);

        // Verify clone correctness
        expect(cloned.countHoles()).toBe(bitBoard.countHoles());
      }

      console.log(`BitBoard Cloning - Max: ${maxTime.toFixed(2)}μs`);

      expect(maxTime).toBeLessThan(MAX_MICROSECONDS * 10); // Cloning can be 10x slower
    });
  });

  describe("State Update Budget", () => {
    it("should meet state update time budget", () => {
      const { MAX_MILLISECONDS, ITERATIONS } = PERFORMANCE_BUDGETS.STATE_UPDATES;

      let maxTime = 0;
      let totalTime = 0;

      // Measure state update performance
      for (let i = 0; i < ITERATIONS; i++) {
        const start = getPerformanceNow();

        gameState.update({
          score: i * 100,
          level: Math.floor(i / 10) + 1,
          lines: i,
          timestamp: Date.now(),
          frame: i,
        });

        const end = getPerformanceNow();

        const time = end - start; // Already in milliseconds
        maxTime = Math.max(maxTime, time);
        totalTime += time;
      }

      const averageTime = totalTime / ITERATIONS;

      console.log(`State Updates - Max: ${maxTime.toFixed(2)}ms, Avg: ${averageTime.toFixed(2)}ms`);

      expect(maxTime).toBeLessThan(MAX_MILLISECONDS);
      expect(gameState.getUpdateCount()).toBe(ITERATIONS);
    });
  });

  describe("Memory Usage Budget", () => {
    it("should meet memory usage budget", async () => {
      const { MAX_INCREASE_MB, GAME_DURATION_MINUTES } = PERFORMANCE_BUDGETS.MEMORY_USAGE;

      const initialMemory = getMemoryUsage();

      // Simulate game operations that allocate memory
      const gameMinutes = GAME_DURATION_MINUTES;
      const gameLoops = gameMinutes * 60 * 60; // 60 FPS

      for (let i = 0; i < gameLoops; i++) {
        // Simulate game operations that allocate memory
        const board = new MockBitBoard();
        const pieces = generateRandomPieces(5);

        // Simulate some game logic
        for (let j = 0; j < 10; j++) {
          board.setCell(j % 24, j % 10);
        }

        // Update game state
        gameState.update({
          frame: i,
          pieces,
          board: board.clone(),
        });

        // Force occasional GC if available
        if (i % 1000 === 0 && typeof Bun !== "undefined" && Bun.gc) {
          Bun.gc(true);
        }
      }

      // Force final GC if available
      if (typeof Bun !== "undefined" && Bun.gc) {
        Bun.gc(true);
      }

      const finalMemory = getMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;

      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);

      // Memory should not increase by more than the budget
      expect(memoryIncrease).toBeLessThan(MAX_INCREASE_MB * 1024 * 1024);
    });

    it("should not leak memory during repeated operations", () => {
      const iterations = 1000;
      let initialMemory = getMemoryUsage();

      // Warm up to stabilize memory usage
      for (let i = 0; i < 100; i++) {
        const board = new MockBitBoard();
        board.setCell(i % 24, i % 10);
      }

      if (typeof Bun !== "undefined" && Bun.gc) {
        Bun.gc(true);
      }

      initialMemory = getMemoryUsage();

      // Perform operations that should not leak memory
      for (let i = 0; i < iterations; i++) {
        const board = new MockBitBoard();

        // Fill and clear the board
        for (let j = 0; j < 240; j++) {
          board.setCell(j % 24, Math.floor(j / 24) % 10);
        }

        for (let j = 0; j < 24; j++) {
          board.clearLine(j);
        }

        // Force GC every 100 iterations
        if (i % 100 === 0 && typeof Bun !== "undefined" && Bun.gc) {
          Bun.gc(true);
        }
      }

      if (typeof Bun !== "undefined" && Bun.gc) {
        Bun.gc(true);
      }

      const finalMemory = getMemoryUsage();
      const memoryIncrease = finalMemory - initialMemory;

      console.log(`Memory leak test - Increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);

      // Should not increase by more than 1MB
      expect(memoryIncrease).toBeLessThan(1024 * 1024);
    });
  });

  describe("Startup Performance Budget", () => {
    it("should meet application startup time budget", async () => {
      const { MAX_MILLISECONDS } = PERFORMANCE_BUDGETS.STARTUP_TIME;

      const start = getPerformanceNow();

      // Simulate application startup operations
      await simulateAppStartup();

      const end = getPerformanceNow();
      const startupTime = end - start;

      console.log(`Application startup time: ${startupTime.toFixed(2)}ms`);

      expect(startupTime).toBeLessThan(MAX_MILLISECONDS);
    });
  });

  describe("Frame Rate Budget", () => {
    it("should maintain 60 FPS during gameplay", async () => {
      const targetFPS = 60;
      const frameBudget = 1000 / targetFPS; // 16.67ms per frame
      const testDuration = 100; // 100 frames

      const frameTimes: number[] = [];

      for (let frame = 0; frame < testDuration; frame++) {
        const frameStart = getPerformanceNow();

        // Simulate game frame operations
        await simulateGameFrame();

        const frameEnd = getPerformanceNow();
        const frameTime = frameEnd - frameStart;
        frameTimes.push(frameTime);
      }

      const averageFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const maxFrameTime = Math.max(...frameTimes);
      const missedFrames = frameTimes.filter((time) => time > frameBudget).length;

      console.log(
        `Frame Performance - Avg: ${averageFrameTime.toFixed(2)}ms, Max: ${maxFrameTime.toFixed(2)}ms, Missed: ${missedFrames}/${testDuration}`,
      );

      expect(averageFrameTime).toBeLessThan(frameBudget);
      expect(missedFrames).toBeLessThan(testDuration * 0.05); // Allow 5% missed frames
    });
  });
});

// Helper functions for simulation
async function simulateAppStartup(): Promise<void> {
  // Simulate loading game assets
  const mockAssets = Array.from({ length: 10 }, (_, i) => `asset-${i}`);

  for (const _asset of mockAssets) {
    // Simulate asset loading time
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
  }

  // Simulate initializing game systems
  const _gameEngine = new MockAIEngine();
  const _bitBoard = new MockBitBoard();
  const gameState = new MockGameStateManager();

  // Simulate initial game setup
  gameState.update({ initialized: true });

  return Promise.resolve();
}

async function simulateGameFrame(): Promise<void> {
  // Simulate typical game frame operations
  const aiEngine = new MockAIEngine();
  const bitBoard = new MockBitBoard();
  const collisionDetector = new MockCollisionDetector();

  // Simulate input processing
  await new Promise((resolve) => setTimeout(resolve, 0.1));

  // Simulate AI evaluation (lightweight)
  aiEngine.synchronousEvaluate(createMockGameState());

  // Simulate collision detection
  const board = Array.from({ length: 20 }, () => Array(10).fill(0));
  const piece = [
    [1, 1],
    [1, 1],
  ];
  collisionDetector.checkCollision(board, piece, { x: 4, y: 10 });

  // Simulate BitBoard operations
  bitBoard.setCell(19, 5);
  bitBoard.isOccupied(19, 5);

  // Simulate rendering preparation
  await new Promise((resolve) => setTimeout(resolve, 0.5));

  return Promise.resolve();
}

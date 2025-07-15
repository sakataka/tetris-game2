import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";
import {
  canPlacePiece,
  clearLine,
  clearLines,
  createMatrix,
  findFullRows,
  isOccupied,
  isRowFull,
  placePiece,
  setCell,
} from "../../src/core/bitboard.js";
import {
  checkCollision,
  findWallKick,
  isGrounded,
  validateRotation,
} from "../../src/core/collision.js";
import {
  calculateScore,
  clearLines as clearLinesOp,
  createPiece,
  dropPiece,
  hardDropPiece,
  movePiece,
  placePieceOnBoard,
  rotatePiece,
} from "../../src/core/operations.js";
import { getTetrominoShape } from "../../src/core/tetrominos.js";
import { GameEventBus } from "../../src/events/bus.js";

/**
 * Performance measurement utilities
 */
const measureExecutionTime = (fn, iterations = 10000) => {
  const times = [];
  // Warm up
  for (let i = 0; i < Math.min(100, iterations); i++) {
    fn();
  }
  // Measure
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    const end = performance.now();
    times.push((end - start) * 1000); // Convert to microseconds
  }
  times.sort((a, b) => a - b);
  return {
    median: times[Math.floor(times.length / 2)],
    mean: times.reduce((a, b) => a + b, 0) / times.length,
    min: times[0],
    max: times[times.length - 1],
    p95: times[Math.floor(times.length * 0.95)],
  };
};
/**
 * Create a test matrix with random filled cells
 */
const createTestMatrix = (fillRatio = 0.3) => {
  let matrix = createMatrix();
  for (let row = 0; row < 20; row++) {
    for (let col = 0; col < 10; col++) {
      if (Math.random() < fillRatio) {
        matrix = setCell(matrix, row, col);
      }
    }
  }
  return matrix;
};
/**
 * Create a test piece
 */
const createTestPiece = (type = "T") => {
  return createPiece(type);
};
describe("Performance Benchmarks", () => {
  describe("BitBoard Operations", () => {
    it("setCell should complete in < 1μs median", () => {
      const matrix = createMatrix();
      const stats = measureExecutionTime(() => {
        setCell(matrix, 10, 5);
      });
      console.log("setCell performance:", stats);
      expect(stats.median).toBeLessThan(1);
    });
    it("isOccupied should complete in < 0.1μs median", () => {
      const matrix = createTestMatrix(0.5);
      const stats = measureExecutionTime(() => {
        isOccupied(matrix, 10, 5);
      });
      console.log("isOccupied performance:", stats);
      expect(stats.median).toBeLessThan(0.1);
    });
    it("isRowFull should complete in < 0.1μs median", () => {
      const matrix = createTestMatrix(0.5);
      const stats = measureExecutionTime(() => {
        isRowFull(matrix, 10);
      });
      console.log("isRowFull performance:", stats);
      expect(stats.median).toBeLessThan(0.1);
    });
    it("clearLine should complete in < 5μs median", () => {
      const matrix = createTestMatrix(0.5);
      const stats = measureExecutionTime(() => {
        clearLine(matrix, 10);
      });
      console.log("clearLine performance:", stats);
      expect(stats.median).toBeLessThan(5);
    });
    it("clearLines (4 lines) should complete in < 50μs median", () => {
      const matrix = createTestMatrix(0.5);
      const stats = measureExecutionTime(() => {
        clearLines(matrix, [16, 17, 18, 19]);
      });
      console.log("clearLines (4 lines) performance:", stats);
      expect(stats.median).toBeLessThan(50);
    });
    it("findFullRows should complete in < 5μs median", () => {
      const matrix = createTestMatrix(0.5);
      const stats = measureExecutionTime(() => {
        findFullRows(matrix);
      });
      console.log("findFullRows performance:", stats);
      expect(stats.median).toBeLessThan(5);
    });
    it("placePiece should complete in < 5μs median", () => {
      const matrix = createTestMatrix(0.3);
      const shape = getTetrominoShape("T", 0);
      const stats = measureExecutionTime(() => {
        placePiece(matrix, shape, 5, 10);
      });
      console.log("placePiece performance:", stats);
      expect(stats.median).toBeLessThan(5);
    });
    it("canPlacePiece should complete in < 2μs median", () => {
      const matrix = createTestMatrix(0.3);
      const shape = getTetrominoShape("T", 0);
      const stats = measureExecutionTime(() => {
        canPlacePiece(matrix, shape, 5, 10);
      });
      console.log("canPlacePiece performance:", stats);
      expect(stats.median).toBeLessThan(2);
    });
  });
  describe("Game Operations", () => {
    it("dropPiece should complete in < 10μs median", () => {
      const matrix = createTestMatrix(0.3);
      const piece = createTestPiece("T");
      const stats = measureExecutionTime(() => {
        dropPiece(matrix, piece);
      });
      console.log("dropPiece performance:", stats);
      expect(stats.median).toBeLessThan(10);
    });
    it("hardDropPiece should complete in < 20μs median", () => {
      const matrix = createTestMatrix(0.3);
      const piece = createTestPiece("I");
      const stats = measureExecutionTime(() => {
        hardDropPiece(matrix, piece);
      });
      console.log("hardDropPiece performance:", stats);
      expect(stats.median).toBeLessThan(20);
    });
    it("movePiece should complete in < 10μs median", () => {
      const matrix = createTestMatrix(0.3);
      const piece = createTestPiece("L");
      const stats = measureExecutionTime(() => {
        movePiece(matrix, piece, 1);
      });
      console.log("movePiece performance:", stats);
      expect(stats.median).toBeLessThan(10);
    });
    it("rotatePiece should complete in < 10μs median", () => {
      const matrix = createTestMatrix(0.3);
      const piece = createTestPiece("J");
      const stats = measureExecutionTime(() => {
        rotatePiece(matrix, piece, true);
      });
      console.log("rotatePiece performance:", stats);
      expect(stats.median).toBeLessThan(10);
    });
    it("placePieceOnBoard should complete in < 10μs median", () => {
      const matrix = createTestMatrix(0.3);
      const piece = createTestPiece("S");
      const stats = measureExecutionTime(() => {
        placePieceOnBoard(matrix, piece);
      });
      console.log("placePieceOnBoard performance:", stats);
      expect(stats.median).toBeLessThan(10);
    });
    it("clearLines operation should complete in < 60μs median", () => {
      const matrix = createTestMatrix(0.8); // Higher fill ratio for more full lines
      const stats = measureExecutionTime(() => {
        clearLinesOp(matrix);
      });
      console.log("clearLines operation performance:", stats);
      expect(stats.median).toBeLessThan(60);
    });
  });
  describe("Collision Detection", () => {
    it("checkCollision should complete in < 5μs median", () => {
      const matrix = createTestMatrix(0.4);
      const piece = createTestPiece("Z");
      const stats = measureExecutionTime(() => {
        checkCollision(matrix, piece);
      });
      console.log("checkCollision performance:", stats);
      expect(stats.median).toBeLessThan(5);
    });
    it("validateRotation should complete in < 20μs median", () => {
      const matrix = createTestMatrix(0.4);
      const piece = createTestPiece("I");
      const stats = measureExecutionTime(() => {
        validateRotation(matrix, piece, true);
      });
      console.log("validateRotation performance:", stats);
      expect(stats.median).toBeLessThan(20);
    });
    it("findWallKick should complete in < 15μs median", () => {
      const matrix = createTestMatrix(0.4);
      const piece = createTestPiece("T");
      const stats = measureExecutionTime(() => {
        findWallKick(matrix, piece, 1);
      });
      console.log("findWallKick performance:", stats);
      expect(stats.median).toBeLessThan(15);
    });
    it("isGrounded should complete in < 5μs median", () => {
      const matrix = createTestMatrix(0.4);
      const piece = createTestPiece("O");
      const stats = measureExecutionTime(() => {
        isGrounded(matrix, piece);
      });
      console.log("isGrounded performance:", stats);
      expect(stats.median).toBeLessThan(5);
    });
  });
  describe("Event System", () => {
    it("event subscription should complete in < 1μs median", () => {
      const eventBus = new GameEventBus();
      const handler = () => {};
      const stats = measureExecutionTime(() => {
        const unsub = eventBus.subscribe("LINE_CLEARED", handler);
        unsub();
      });
      console.log("event subscription performance:", stats);
      expect(stats.median).toBeLessThan(1);
    });
    it("event emission should complete in < 5μs median", () => {
      const eventBus = new GameEventBus();
      const handler = () => {};
      eventBus.subscribe("PIECE_PLACED", handler);
      const stats = measureExecutionTime(() => {
        eventBus.emit({
          type: "PIECE_PLACED",
          payload: { piece: "T", position: { x: 5, y: 10 }, rotation: 0 },
        });
      });
      console.log("event emission performance:", stats);
      expect(stats.median).toBeLessThan(5);
    });
    it("event emission with multiple subscribers should complete in < 10μs median", () => {
      const eventBus = new GameEventBus();
      const handler1 = () => {};
      const handler2 = () => {};
      const handler3 = () => {};
      eventBus.subscribe("HARD_DROP", handler1);
      eventBus.subscribe("HARD_DROP", handler2);
      eventBus.subscribe("HARD_DROP", handler3);
      const stats = measureExecutionTime(() => {
        eventBus.emit({
          type: "HARD_DROP",
          payload: { distance: 5, score: 10 },
        });
      });
      console.log("event emission (multiple subscribers) performance:", stats);
      expect(stats.median).toBeLessThan(10);
    });
  });
  describe("Memory Usage", () => {
    it("should not exceed memory budget for core operations", () => {
      const initialMemory = process.memoryUsage().heapUsed;
      // Create multiple matrices and perform operations
      const matrices = [];
      for (let i = 0; i < 100; i++) {
        const matrix = createTestMatrix(0.3);
        matrices.push(matrix);
        // Perform various operations
        const piece = createTestPiece("T");
        dropPiece(matrix, piece);
        checkCollision(matrix, piece);
        clearLinesOp(matrix);
      }
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryDelta = finalMemory - initialMemory;
      const memoryMB = memoryDelta / (1024 * 1024);
      console.log(`Memory usage: ${memoryMB.toFixed(2)} MB`);
      // Should not exceed 1MB for core engine operations
      expect(memoryMB).toBeLessThan(1);
    });
  });
  describe("Composite Operations", () => {
    it("complete game tick should complete in < 100μs median", () => {
      const matrix = createTestMatrix(0.3);
      const piece = createTestPiece("T");
      const stats = measureExecutionTime(() => {
        // Simulate a complete game tick
        const droppedPiece = dropPiece(matrix, piece);
        if (droppedPiece) {
          checkCollision(matrix, droppedPiece);
          isGrounded(matrix, droppedPiece);
        } else {
          // Piece landed
          const newMatrix = placePieceOnBoard(matrix, piece);
          const lineClearResult = clearLinesOp(newMatrix);
          calculateScore(lineClearResult.clearedLines.length);
        }
      });
      console.log("complete game tick performance:", stats);
      expect(stats.median).toBeLessThan(100);
    });
  });
});
// Benchmark tests (will not run in regular test suite)
describe.skip("Vitest Benchmarks", () => {
  // These tests are skipped in regular test runs
  // Run with: bun run benchmark
  it("BitBoard setCell benchmark", () => {
    const matrix = createMatrix();
    setCell(matrix, 10, 5);
  });
  it("BitBoard isOccupied benchmark", () => {
    const matrix = createTestMatrix(0.5);
    isOccupied(matrix, 10, 5);
  });
  it("Collision detection benchmark", () => {
    const matrix = createTestMatrix(0.4);
    const piece = createTestPiece("T");
    checkCollision(matrix, piece);
  });
  it("Piece drop benchmark", () => {
    const matrix = createTestMatrix(0.3);
    const piece = createTestPiece("I");
    dropPiece(matrix, piece);
  });
  it("Line clear benchmark", () => {
    const matrix = createTestMatrix(0.8);
    clearLinesOp(matrix);
  });
  it("Event emission benchmark", () => {
    const eventBus = new GameEventBus();
    const handler = () => {};
    eventBus.subscribe("LINE_CLEARED", handler);
    eventBus.emit({
      type: "LINE_CLEARED",
      payload: { lines: 1, positions: [0], score: 100 },
    });
  });
});
//# sourceMappingURL=benchmarks.test.js.map

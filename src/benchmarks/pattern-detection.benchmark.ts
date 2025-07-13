import { describe } from "bun:test";

// Benchmark function placeholder since bun:test doesn't export bench
const bench = (name: string, fn: () => Promise<void> | void) => {
  console.log(`Benchmark: ${name}`);
  const start = performance.now();
  const result = fn();

  if (result instanceof Promise) {
    return result.then(() => {
      const end = performance.now();
      console.log(`  Time: ${(end - start).toFixed(3)}ms`);
      return end - start;
    });
  }
  const end = performance.now();
  console.log(`  Time: ${(end - start).toFixed(3)}ms`);
  return end - start;
};

import { type AdvancedAIConfig, AdvancedAIEngine } from "@/game/ai/core/advanced-ai-engine";
import { DEFAULT_AI_CONFIG } from "@/game/ai/core/ai-engine";
import { DEFAULT_BEAM_CONFIG } from "@/game/ai/search/beam-search";
import { DEFAULT_HOLD_OPTIONS } from "@/game/ai/search/hold-search";
import { createTetromino } from "@/game/tetrominos";
import type { CellValue, GameBoard, GameState, TetrominoTypeName } from "@/types/game";

/**
 * Pattern Detection Performance Benchmark
 *
 * Target: Pattern detection overhead should be < 20% of base evaluation time
 * This benchmark compares AI performance with and without pattern detection
 */

// Helper function to create test game state
function createTestGameState(board?: GameBoard, pieceType: TetrominoTypeName = "I"): GameState {
  const emptyBoard: GameBoard =
    board ||
    Array(20)
      .fill(null)
      .map(() => Array(10).fill(0 as CellValue));

  return {
    board: emptyBoard,
    boardBeforeClear: null,
    currentPiece: createTetromino(pieceType),
    nextPiece: "T",
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
    pieceBag: ["O", "T", "S", "Z", "J", "L"],
    tSpinState: {
      type: "none",
      show: false,
      linesCleared: 0,
      rotationResult: null,
    },
    comboState: {
      count: 0,
      isActive: false,
      lastClearType: null,
    },
    scoreAnimationState: {
      previousScore: 0,
      scoreIncrease: 0,
      lineCount: 0,
      clearType: null,
      isTetris: false,
      animationTriggerTime: 0,
    },
    floatingScoreEvents: [],
    levelCelebrationState: {
      isActive: false,
      level: null,
      startTime: null,
      phase: "completed",
      userCancelled: false,
    },
  };
}

// Create test boards
function createEmptyBoard(): GameBoard {
  return Array(20)
    .fill(null)
    .map(() => Array(10).fill(0 as CellValue));
}

function createPCOSetupBoard(): GameBoard {
  const board = createEmptyBoard();
  // Create board state that could trigger PCO pattern detection
  board[19][0] = 1; // L
  board[19][1] = 1; // L
  board[19][2] = 1; // J
  board[19][3] = 1; // J
  board[19][4] = 1; // S
  board[19][5] = 1; // Z
  board[18][0] = 1; // L
  board[18][2] = 1; // J
  board[18][3] = 1; // J
  board[18][4] = 1; // T
  board[18][5] = 1; // T
  board[17][0] = 1; // O
  board[17][1] = 1; // O
  return board;
}

function createMidGameBoard(): GameBoard {
  const board = createEmptyBoard();
  // Create realistic mid-game scenario for ST-Stack detection
  for (let y = 15; y < 20; y++) {
    for (let x = 0; x < 10; x++) {
      if (y === 17 && x >= 3 && x <= 5) continue; // Leave notch for ST-Stack
      board[y][x] = Math.random() < 0.8 ? ((Math.floor(Math.random() * 7) + 1) as CellValue) : 0;
    }
  }
  return board;
}

describe("Pattern Detection Performance Impact", () => {
  const pieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];

  // Base configuration without pattern detection
  const baseConfig: AdvancedAIConfig = {
    ...DEFAULT_AI_CONFIG,
    beamSearchConfig: DEFAULT_BEAM_CONFIG,
    holdSearchOptions: DEFAULT_HOLD_OPTIONS,
    enableAdvancedFeatures: true,
    enableSearchLogging: false,
    enablePatternDetection: false, // DISABLED
    thinkingTimeLimit: 200,
  };

  // Configuration with pattern detection enabled
  const patternConfig: AdvancedAIConfig = {
    ...baseConfig,
    enablePatternDetection: true, // ENABLED
  };

  const baseAI = new AdvancedAIEngine(baseConfig);
  const patternAI = new AdvancedAIEngine(patternConfig);

  // Test boards
  const emptyBoard = createEmptyBoard();
  const pcoBoard = createPCOSetupBoard();
  const midGameBoard = createMidGameBoard();

  describe("Single Decision Overhead", () => {
    bench("Empty board - Base AI (no patterns)", async () => {
      for (const piece of pieces) {
        const gameState = createTestGameState(emptyBoard, piece);
        await baseAI.findBestMove(gameState);
      }
    });

    bench("Empty board - Pattern AI", async () => {
      for (const piece of pieces) {
        const gameState = createTestGameState(emptyBoard, piece);
        await patternAI.findBestMove(gameState);
      }
    });

    bench("PCO setup board - Base AI (no patterns)", async () => {
      for (const piece of pieces) {
        const gameState = createTestGameState(pcoBoard, piece);
        await baseAI.findBestMove(gameState);
      }
    });

    bench("PCO setup board - Pattern AI", async () => {
      for (const piece of pieces) {
        const gameState = createTestGameState(pcoBoard, piece);
        await patternAI.findBestMove(gameState);
      }
    });

    bench("Mid-game board - Base AI (no patterns)", async () => {
      for (const piece of pieces) {
        const gameState = createTestGameState(midGameBoard, piece);
        await baseAI.findBestMove(gameState);
      }
    });

    bench("Mid-game board - Pattern AI", async () => {
      for (const piece of pieces) {
        const gameState = createTestGameState(midGameBoard, piece);
        await patternAI.findBestMove(gameState);
      }
    });
  });

  describe("Continuous Performance Comparison", () => {
    bench("50 decisions - Base AI (no patterns)", async () => {
      for (let i = 0; i < 50; i++) {
        const piece = pieces[i % pieces.length];
        const board = i % 3 === 0 ? pcoBoard : i % 3 === 1 ? midGameBoard : emptyBoard;
        const gameState = createTestGameState(board, piece);
        await baseAI.findBestMove(gameState);
      }
    });

    bench("50 decisions - Pattern AI", async () => {
      for (let i = 0; i < 50; i++) {
        const piece = pieces[i % pieces.length];
        const board = i % 3 === 0 ? pcoBoard : i % 3 === 1 ? midGameBoard : emptyBoard;
        const gameState = createTestGameState(board, piece);
        await patternAI.findBestMove(gameState);
      }
    });
  });

  describe("Performance Overhead Analysis", () => {
    bench("Overhead calculation - 20 decisions per board type", async () => {
      const boardTypes = [
        { name: "Empty", board: emptyBoard },
        { name: "PCO Setup", board: pcoBoard },
        { name: "Mid-game", board: midGameBoard },
      ];

      const results: Record<string, { base: number; pattern: number; overhead: number }> = {};

      for (const { name, board } of boardTypes) {
        console.log(`\n  Testing ${name} board:`);

        // Measure base AI
        const baseStart = performance.now();
        for (let i = 0; i < 20; i++) {
          const piece = pieces[i % pieces.length];
          const gameState = createTestGameState(board, piece);
          await baseAI.findBestMove(gameState);
        }
        const baseTime = performance.now() - baseStart;

        // Measure pattern AI
        const patternStart = performance.now();
        for (let i = 0; i < 20; i++) {
          const piece = pieces[i % pieces.length];
          const gameState = createTestGameState(board, piece);
          await patternAI.findBestMove(gameState);
        }
        const patternTime = performance.now() - patternStart;

        const overhead = ((patternTime - baseTime) / baseTime) * 100;
        results[name] = { base: baseTime, pattern: patternTime, overhead };

        console.log(`    Base AI time: ${baseTime.toFixed(1)}ms`);
        console.log(`    Pattern AI time: ${patternTime.toFixed(1)}ms`);
        console.log(`    Overhead: ${overhead.toFixed(1)}%`);

        if (overhead < 20) {
          console.log("    ✅ PASS: Under 20% overhead threshold");
        } else {
          console.log("    ❌ FAIL: Exceeds 20% overhead threshold");
        }
      }

      // Calculate overall average overhead
      const overheads = Object.values(results).map((r) => r.overhead);
      const avgOverhead = overheads.reduce((a, b) => a + b, 0) / overheads.length;

      console.log("\n  📊 Overall Results:");
      console.log(`    Average overhead: ${avgOverhead.toFixed(1)}%`);
      console.log(`    Max overhead: ${Math.max(...overheads).toFixed(1)}%`);
      console.log(`    Min overhead: ${Math.min(...overheads).toFixed(1)}%`);

      if (avgOverhead < 20) {
        console.log("    ✅ OVERALL PASS: Pattern detection overhead is within acceptable limits");
      } else {
        console.log("    ❌ OVERALL FAIL: Pattern detection overhead exceeds 20% threshold");
      }
    });
  });

  describe("Memory Impact", () => {
    bench("Memory usage comparison - 100 decisions", async () => {
      if (typeof global !== "undefined" && global.gc) {
        global.gc();
      }

      // Test base AI memory usage
      const baseBefore = process.memoryUsage().heapUsed;
      for (let i = 0; i < 100; i++) {
        const piece = pieces[i % pieces.length];
        const board = i % 3 === 0 ? pcoBoard : i % 3 === 1 ? midGameBoard : emptyBoard;
        const gameState = createTestGameState(board, piece);
        await baseAI.findBestMove(gameState);
      }
      if (typeof global !== "undefined" && global.gc) {
        global.gc();
      }
      const baseAfter = process.memoryUsage().heapUsed;
      const baseMemoryGrowth = baseAfter - baseBefore;

      // Test pattern AI memory usage
      const patternBefore = process.memoryUsage().heapUsed;
      for (let i = 0; i < 100; i++) {
        const piece = pieces[i % pieces.length];
        const board = i % 3 === 0 ? pcoBoard : i % 3 === 1 ? midGameBoard : emptyBoard;
        const gameState = createTestGameState(board, piece);
        await patternAI.findBestMove(gameState);
      }
      if (typeof global !== "undefined" && global.gc) {
        global.gc();
      }
      const patternAfter = process.memoryUsage().heapUsed;
      const patternMemoryGrowth = patternAfter - patternBefore;

      const memoryOverhead =
        patternMemoryGrowth > 0
          ? ((patternMemoryGrowth - baseMemoryGrowth) / Math.max(baseMemoryGrowth, 1)) * 100
          : 0;

      console.log(`  Base AI memory growth: ${(baseMemoryGrowth / 1024 / 1024).toFixed(2)}MB`);
      console.log(
        `  Pattern AI memory growth: ${(patternMemoryGrowth / 1024 / 1024).toFixed(2)}MB`,
      );
      console.log(`  Memory overhead: ${memoryOverhead.toFixed(1)}%`);
    });
  });
});

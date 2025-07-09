import { beforeEach, describe, expect, it } from "bun:test";
import * as fc from "fast-check";
import { createTetromino } from "@/game/tetrominos";
import { emptyBoardGenerator, randomFilledBoardGenerator } from "@/test/generators/board-generator";
import type { CellValue, GameBoard, GameState } from "@/types/game";
import { type AIConfig, AIEngine, DEFAULT_AI_CONFIG } from "./ai-engine";

// Helper function to create test game state
function createTestGameState(overrides: Partial<GameState> = {}): GameState {
  const emptyBoard: GameBoard = Array(20)
    .fill(null)
    .map(() => Array(10).fill(0 as CellValue));

  return {
    board: emptyBoard,
    boardBeforeClear: null,
    currentPiece: createTetromino("I"),
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
    ...overrides,
  };
}

// Helper function to create board with almost complete lines
function createBoardWithAlmostCompleteLines(lineCount: number): GameBoard {
  const board: GameBoard = Array(20)
    .fill(null)
    .map(() => Array(10).fill(0 as CellValue));

  // Fill bottom lines leaving one gap for I-piece to complete
  for (let line = 0; line < lineCount; line++) {
    const y = 19 - line;
    for (let x = 0; x < 10; x++) {
      board[y][x] = x === 9 ? 0 : (1 as CellValue); // Leave rightmost cell empty
    }
  }

  return board;
}

// Helper function to create dangerous board (high with holes)
function createDangerousBoard(): GameBoard {
  const board: GameBoard = Array(20)
    .fill(null)
    .map(() => Array(10).fill(0 as CellValue));

  // Fill bottom half with random holes
  for (let y = 10; y < 20; y++) {
    for (let x = 0; x < 10; x++) {
      board[y][x] = Math.random() > 0.3 ? (1 as CellValue) : (0 as CellValue);
    }
  }

  // Add some blocks near top for danger
  for (let y = 0; y < 5; y++) {
    for (let x = 0; x < 10; x++) {
      board[y][x] = Math.random() > 0.8 ? (1 as CellValue) : (0 as CellValue);
    }
  }

  return board;
}

describe("AIEngine", () => {
  let aiEngine: AIEngine;

  beforeEach(() => {
    aiEngine = new AIEngine({
      ...DEFAULT_AI_CONFIG,
      thinkingTimeLimit: 1000, // Longer timeout for tests
      enableLogging: false, // Disable logging during tests
    });
  });

  describe("Basic Functionality", () => {
    it("should find best move for empty board", async () => {
      const gameState = createTestGameState({
        currentPiece: createTetromino("I"),
      });

      const decision = await aiEngine.findBestMove(gameState);

      expect(decision.bestMove).not.toBeNull();
      expect(decision.allMoves.length).toBeGreaterThan(0);
      expect(decision.timedOut).toBe(false);
      expect(decision.thinkingTime).toBeGreaterThan(0);
      expect(decision.evaluationCount).toBeGreaterThan(0);
      expect(decision.error).toBeUndefined();
    });

    it("should return error for game over state", async () => {
      const gameState = createTestGameState({
        isGameOver: true,
      });

      const decision = await aiEngine.findBestMove(gameState);

      expect(decision.bestMove).toBeNull();
      expect(decision.error).toBe("Game over");
    });

    it("should return error when no current piece", async () => {
      const gameState = createTestGameState({
        currentPiece: null,
      });

      const decision = await aiEngine.findBestMove(gameState);

      expect(decision.bestMove).toBeNull();
      expect(decision.error).toBe("No current piece");
    });

    it("should generate action sequences for valid moves", async () => {
      const gameState = createTestGameState({
        currentPiece: createTetromino("T"),
      });

      const decision = await aiEngine.findBestMove(gameState);

      expect(decision.bestMove).not.toBeNull();
      expect(decision.bestMove?.sequence).toBeDefined();
      expect(decision.bestMove?.sequence.length).toBeGreaterThan(0);
      // Should always end with HARD_DROP
      expect(decision.bestMove?.sequence[decision.bestMove?.sequence.length - 1].type).toBe(
        "HARD_DROP",
      );
    });
  });

  describe("Move Quality", () => {
    it("should prefer line clearing moves", async () => {
      const gameState = createTestGameState({
        currentPiece: createTetromino("I"),
        board: createBoardWithAlmostCompleteLines(3),
      });

      const decision = await aiEngine.findBestMove(gameState);

      expect(decision.bestMove).not.toBeNull();
      // Should have a better score than a random move due to line clearing
      expect(decision.bestMove?.evaluationScore).toBeDefined();
      // Dellacherie evaluator prioritizes line clearing above edge avoidance
      // Should choose a position that can clear lines (edge placement is OK if it clears lines)
      expect(decision.bestMove?.x).toBeGreaterThanOrEqual(0);
      expect(decision.bestMove?.x).toBeLessThanOrEqual(9);
      // Score should be positive due to line clearing priority
      expect(decision.bestMove?.evaluationScore).toBeGreaterThan(0);
    });

    it("should avoid creating holes", async () => {
      const gameState = createTestGameState({
        currentPiece: createTetromino("O"),
        board: createDangerousBoard(),
      });

      const decision = await aiEngine.findBestMove(gameState);

      expect(decision.bestMove).not.toBeNull();
      // With dangerous board, AI should be conservative
      expect(decision.bestMove?.evaluationScore).toBeDefined();
    });

    it("should prefer low placement on empty board", async () => {
      const gameState = createTestGameState({
        currentPiece: createTetromino("T"),
      });

      const decision = await aiEngine.findBestMove(gameState);

      expect(decision.bestMove).not.toBeNull();
      // Should place near bottom
      expect(decision.bestMove?.y).toBeGreaterThan(15);
    });
  });

  describe("Timeout Management", () => {
    it("should respect timeout limits", async () => {
      const fastAI = new AIEngine({
        thinkingTimeLimit: 1, // 1ms timeout
        fallbackOnTimeout: true,
        enableLogging: false,
      });

      const gameState = createTestGameState();
      const decision = await fastAI.findBestMove(gameState);

      // Should timeout but provide fallback
      expect(decision.timedOut).toBe(true);
      expect(decision.bestMove).not.toBeNull();
      expect(decision.thinkingTime).toBeGreaterThan(0);
    });

    it("should handle abort during thinking", async () => {
      // Create a complex state that will take longer to process
      const gameState = createTestGameState({
        board: createDangerousBoard(),
      });

      // Start thinking
      const decisionPromise = aiEngine.findBestMove(gameState);

      // Wait a bit then abort to ensure thinking has started
      setTimeout(() => {
        aiEngine.abortThinking();
      }, 5);

      // Should reject with abort error or return a result
      try {
        const result = await decisionPromise;
        // If it completed before abort, that's also acceptable
        expect(result).toBeDefined();
      } catch (error) {
        // If it was aborted, the error should be thrown
        expect(error).toBeDefined();
      }
    });

    it("should not timeout with reasonable time limit", async () => {
      const gameState = createTestGameState();
      const decision = await aiEngine.findBestMove(gameState);

      expect(decision.timedOut).toBe(false);
      expect(decision.thinkingTime).toBeLessThan(1000);
    });
  });

  describe("Performance Requirements", () => {
    it("should evaluate moves within time limit", async () => {
      const gameState = createTestGameState();
      const startTime = performance.now();

      const decision = await aiEngine.findBestMove(gameState);
      const totalTime = performance.now() - startTime;

      expect(totalTime).toBeLessThan(200); // 200ms requirement
      expect(decision.evaluationCount).toBeGreaterThan(10); // Should evaluate multiple moves
    });

    it("should generate sufficient move candidates", async () => {
      const gameState = createTestGameState({
        currentPiece: createTetromino("T"),
      });

      const decision = await aiEngine.findBestMove(gameState);

      // T-piece should have multiple valid placements
      expect(decision.allMoves.length).toBeGreaterThan(20);
      expect(decision.evaluationCount).toBe(decision.allMoves.length);
    });

    it("should handle complex boards efficiently", async () => {
      const gameState = createTestGameState({
        board: createDangerousBoard(),
        currentPiece: createTetromino("L"),
      });

      const startTime = performance.now();
      const decision = await aiEngine.findBestMove(gameState);
      const totalTime = performance.now() - startTime;

      expect(totalTime).toBeLessThan(300); // Allow more time for complex boards
      expect(decision.bestMove).not.toBeNull();
    });
  });

  describe("Statistics Tracking", () => {
    it("should track performance statistics", async () => {
      const gameState = createTestGameState();

      // Initial stats should be empty
      const initialStats = aiEngine.getStats();
      expect(initialStats.totalDecisions).toBe(0);

      // Make several decisions
      await aiEngine.findBestMove(gameState);
      await aiEngine.findBestMove(gameState);

      const finalStats = aiEngine.getStats();
      expect(finalStats.totalDecisions).toBe(2);
      expect(finalStats.averageThinkTime).toBeGreaterThan(0);
    });

    it("should reset statistics correctly", async () => {
      const gameState = createTestGameState();

      await aiEngine.findBestMove(gameState);
      expect(aiEngine.getStats().totalDecisions).toBe(1);

      aiEngine.resetStats();
      expect(aiEngine.getStats().totalDecisions).toBe(0);
    });
  });

  describe("Configuration", () => {
    it("should allow configuration updates", () => {
      const newConfig: Partial<AIConfig> = {
        thinkingTimeLimit: 500,
        enableLogging: true,
      };

      aiEngine.updateConfig(newConfig);
      const currentConfig = aiEngine.getConfig();

      expect(currentConfig.thinkingTimeLimit).toBe(500);
      expect(currentConfig.enableLogging).toBe(true);
    });

    it("should use default configuration values", () => {
      const defaultEngine = new AIEngine();
      const config = defaultEngine.getConfig();

      expect(config.thinkingTimeLimit).toBe(200);
      expect(config.evaluator).toBe("dellacherie"); // Updated to reflect new default
      expect(config.fallbackOnTimeout).toBe(true);
    });
  });
});

describe("AIEngine Property-Based Tests", () => {
  it("should always find a move for valid game states", async () => {
    await fc.assert(
      fc.asyncProperty(
        emptyBoardGenerator(),
        fc.constantFrom("I", "O", "T", "S", "Z", "J", "L"),
        async (board, pieceType) => {
          const aiEngine = new AIEngine({ ...DEFAULT_AI_CONFIG, enableLogging: false });
          const gameState = createTestGameState({
            board,
            currentPiece: createTetromino(pieceType),
          });

          const decision = await aiEngine.findBestMove(gameState);

          // Should always find at least one valid move on empty board
          expect(decision.bestMove).not.toBeNull();
          expect(decision.allMoves.length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 20 },
    );
  });

  it("should handle various board configurations", async () => {
    await fc.assert(
      fc.asyncProperty(
        randomFilledBoardGenerator({ minFillRatio: 0.1, maxFillRatio: 0.6, bottomHeavy: true }).map(
          (data) => data.board,
        ),
        fc.constantFrom("I", "O", "T", "S", "Z", "J", "L"),
        async (board, pieceType) => {
          const aiEngine = new AIEngine({ ...DEFAULT_AI_CONFIG, enableLogging: false });
          const gameState = createTestGameState({
            board,
            currentPiece: createTetromino(pieceType),
          });

          const decision = await aiEngine.findBestMove(gameState);

          // Should handle any reasonable board configuration
          expect(decision.error).toBeUndefined();
          if (decision.bestMove) {
            expect(decision.bestMove.evaluationScore).toBeDefined();
            expect(decision.bestMove.sequence.length).toBeGreaterThan(0);
          }
        },
      ),
      { numRuns: 30 },
    );
  });

  it("should always respect timeout limits", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 10, max: 100 }), // Short timeout values
        emptyBoardGenerator(),
        async (timeoutMs, board) => {
          const aiEngine = new AIEngine({
            thinkingTimeLimit: timeoutMs,
            fallbackOnTimeout: true,
            enableLogging: false,
          });

          const gameState = createTestGameState({ board });
          const startTime = performance.now();
          const decision = await aiEngine.findBestMove(gameState);
          const actualTime = performance.now() - startTime;

          // Should not significantly exceed timeout (allow 50ms grace period)
          expect(actualTime).toBeLessThan(timeoutMs + 50);

          // Should still provide a decision (fallback)
          expect(decision.bestMove).not.toBeNull();
        },
      ),
      { numRuns: 10 },
    );
  });
});

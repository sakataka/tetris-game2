import { beforeEach, describe, expect, it } from "bun:test";
import { BitBoard } from "@/game/ai/core/bitboard";
import type { GameBoard } from "@/types/game";
import { createMove, DEFAULT_WEIGHTS, DellacherieEvaluator, findDropPosition } from "./dellacherie";

describe("DellacherieEvaluator", () => {
  let evaluator: DellacherieEvaluator;
  let board: BitBoard;

  beforeEach(() => {
    evaluator = new DellacherieEvaluator();
    board = new BitBoard();
  });

  describe("Feature Extraction", () => {
    it("should calculate landing height correctly", () => {
      // Empty board - I-piece placed horizontally at bottom
      const move = createMove("I", 0, 3, 19);
      const features = evaluator.extractFeatures(board, move);

      // I-piece horizontal has center at Y=19, so height from bottom = 20-19 = 1
      expect(features.landingHeight).toBe(1);
    });

    it("should detect line clears correctly", () => {
      // Create board with almost complete bottom line (missing one cell)
      const testBoard: GameBoard = Array(20)
        .fill(null)
        .map(() => Array(10).fill(0));
      testBoard[19] = [1, 1, 1, 1, 1, 1, 1, 1, 1, 0]; // Missing rightmost cell

      board.fromBoardState(testBoard);

      // Place I-piece vertically to complete the line
      const move = createMove("I", 1, 9, 16); // Vertical I-piece in rightmost column
      const features = evaluator.extractFeatures(board, move);

      expect(features.linesCleared).toBe(1);
    });

    it("should calculate row transitions correctly", () => {
      // Create board with specific pattern for testing transitions
      const testBoard: GameBoard = Array(20)
        .fill(null)
        .map(() => Array(10).fill(0));
      testBoard[19] = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0]; // Alternating pattern (10 transitions + 2 walls = 12)

      board.fromBoardState(testBoard);

      // Place piece that doesn't affect this row
      const move = createMove("O", 0, 4, 17);
      const features = evaluator.extractFeatures(board, move);

      // Pattern after O-piece placement: bottom row + O-piece rows
      // Bottom row: wall + 1-0-1-0-1-0-1-0-1-0 + wall = 10 transitions
      // O-piece adds 2 more rows with transitions
      expect(features.rowTransitions).toBeGreaterThan(10);
    });

    it("should calculate column transitions correctly", () => {
      // Create board with vertical pattern
      const testBoard: GameBoard = Array(20)
        .fill(null)
        .map(() => Array(10).fill(0));
      testBoard[19][0] = 1;
      testBoard[18][0] = 0;
      testBoard[17][0] = 1;

      board.fromBoardState(testBoard);

      const move = createMove("O", 0, 4, 17);
      const features = evaluator.extractFeatures(board, move);

      // Column 0: floor(1)-19(1)-18(0)-17(1)-...-(0)top = multiple transitions
      expect(features.columnTransitions).toBeGreaterThan(0);
    });

    it("should detect holes correctly", () => {
      // Create board with holes
      const testBoard: GameBoard = Array(20)
        .fill(null)
        .map(() => Array(10).fill(0));
      testBoard[18][3] = 1; // Block above
      testBoard[19][3] = 0; // Hole below

      board.fromBoardState(testBoard);

      const move = createMove("O", 0, 0, 17);
      const features = evaluator.extractFeatures(board, move);

      expect(features.holes).toBeGreaterThanOrEqual(1);
    });

    it("should calculate wells with depth weighting", () => {
      // Create board with a well (empty column surrounded by blocks)
      const testBoard: GameBoard = Array(20)
        .fill(null)
        .map(() => Array(10).fill(0));
      testBoard[19][3] = 1; // Left wall of well
      testBoard[19][5] = 1; // Right wall of well
      testBoard[19][4] = 0; // Well bottom
      testBoard[18][3] = 1;
      testBoard[18][5] = 1;
      testBoard[18][4] = 0; // Well depth 2

      board.fromBoardState(testBoard);

      const move = createMove("O", 0, 0, 16);
      const features = evaluator.extractFeatures(board, move);

      // Well depth 2: 2 * (2 + 1) / 2 = 3
      expect(features.wells).toBe(3);
    });
  });

  describe("Evaluation Scoring", () => {
    it("should prefer moves that clear lines", () => {
      // Setup board for line clearing test
      const testBoard: GameBoard = Array(20)
        .fill(null)
        .map(() => Array(10).fill(0));
      testBoard[19] = [1, 1, 1, 1, 1, 1, 1, 1, 1, 0];

      board.fromBoardState(testBoard);

      const lineClearMove = createMove("I", 1, 9, 16); // Clears line
      const noLineClearMove = createMove("O", 0, 0, 17); // No line clear

      const score1 = evaluator.evaluate(board, lineClearMove);
      const score2 = evaluator.evaluate(board, noLineClearMove);

      expect(score1).toBeGreaterThan(score2);
    });

    it("should strongly prioritize line clearing over hole avoidance", () => {
      // Setup board where clearing lines creates minor holes
      const testBoard: GameBoard = Array(20)
        .fill(null)
        .map(() => Array(10).fill(0));
      testBoard[19] = [1, 1, 1, 1, 1, 1, 1, 1, 1, 0];
      testBoard[18] = [1, 1, 1, 1, 1, 1, 1, 1, 0, 0];

      board.fromBoardState(testBoard);

      const lineClearMove = createMove("I", 1, 9, 16); // Clears line but creates hole
      const safeMove = createMove("O", 0, 0, 17); // Safe placement, no clear

      const score1 = evaluator.evaluate(board, lineClearMove);
      const score2 = evaluator.evaluate(board, safeMove);

      // With new weights, line clearing should be heavily prioritized
      expect(score1).toBeGreaterThan(score2);
    });

    it("should avoid creating holes", () => {
      const board1 = new BitBoard();
      const board2 = new BitBoard();

      // Setup board2 to create a hole when piece is placed
      const testBoard: GameBoard = Array(20)
        .fill(null)
        .map(() => Array(10).fill(0));
      testBoard[18][3] = 1; // This will create hole when O piece placed below

      board2.fromBoardState(testBoard);

      const move1 = createMove("O", 0, 3, 18); // On empty board
      const move2 = createMove("O", 0, 3, 17); // Creates hole under block

      const score1 = evaluator.evaluate(board1, move1);
      const score2 = evaluator.evaluate(board2, move2);

      expect(score1).toBeGreaterThan(score2);
    });

    it("should prefer lower placement (landing height)", () => {
      const move1 = createMove("O", 0, 4, 18); // Lower placement
      const move2 = createMove("O", 0, 4, 15); // Higher placement

      const score1 = evaluator.evaluate(board, move1);
      const score2 = evaluator.evaluate(board, move2);

      expect(score1).toBeGreaterThan(score2);
    });
  });

  describe("Weight Management", () => {
    it("should update weights correctly", () => {
      const newWeights = { landingHeight: -10.0 };
      evaluator.updateWeights(newWeights);

      const weights = evaluator.getWeights();
      expect(weights.landingHeight).toBe(-10.0);
      expect(weights.linesCleared).toBe(DEFAULT_WEIGHTS.linesCleared); // Should remain unchanged
    });

    it("should reset weights to default", () => {
      evaluator.updateWeights({ landingHeight: -10.0 });
      evaluator.resetWeights();

      const weights = evaluator.getWeights();
      expect(weights.landingHeight).toBe(DEFAULT_WEIGHTS.landingHeight);
    });
  });

  describe("Utility Functions", () => {
    it("should create move with cached bit patterns", () => {
      const move = createMove("T", 1, 4, 10);

      expect(move.piece).toBe("T");
      expect(move.rotation).toBe(1);
      expect(move.x).toBe(4);
      expect(move.y).toBe(10);
      expect(move.pieceBitRows).toBeDefined();
      expect(Array.isArray(move.pieceBitRows)).toBe(true);
    });

    it("should find correct drop position", () => {
      // Empty board - piece should drop to bottom
      const dropY = findDropPosition(board, "O", 0, 4);
      expect(dropY).toBe(18); // O-piece is 2x2, so bottom at Y=18

      // Board with obstacle
      const testBoard: GameBoard = Array(20)
        .fill(null)
        .map(() => Array(10).fill(0));
      testBoard[18][4] = 1; // Block at position
      testBoard[18][5] = 1;

      board.fromBoardState(testBoard);

      const dropY2 = findDropPosition(board, "O", 0, 4);
      expect(dropY2).toBe(16); // Should land on top of obstacle
    });

    it("should return -1 for invalid drop positions", () => {
      const dropY = findDropPosition(board, "I", 0, 8); // I-horizontal would extend beyond board
      expect(dropY).toBe(-1);
    });
  });

  describe("Performance Requirements", () => {
    it("should handle rapid evaluations", () => {
      const moves = [
        createMove("I", 0, 0, 18),
        createMove("I", 1, 4, 16),
        createMove("O", 0, 3, 17),
        createMove("T", 0, 2, 17),
        createMove("T", 1, 1, 17),
      ];

      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        for (const move of moves) {
          evaluator.evaluate(board, move);
        }
      }

      const endTime = performance.now();
      const avgTimePerEvaluation = (endTime - startTime) / (100 * moves.length);

      // Should complete each evaluation in under 1ms
      expect(avgTimePerEvaluation).toBeLessThan(1.0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty board evaluation", () => {
      const move = createMove("O", 0, 4, 18);
      const features = evaluator.extractFeatures(board, move);

      expect(features.linesCleared).toBe(0);
      expect(features.holes).toBe(0);
      expect(features.wells).toBe(0);
    });

    it("should handle full board evaluation", () => {
      // Create nearly full board
      const testBoard: GameBoard = Array(20)
        .fill(null)
        .map(() => Array(10).fill(1));

      // Leave space for one piece
      testBoard[0][4] = 0;
      testBoard[0][5] = 0;
      testBoard[1][4] = 0;
      testBoard[1][5] = 0;

      board.fromBoardState(testBoard);

      const move = createMove("O", 0, 4, 0);
      const score = evaluator.evaluate(board, move);

      expect(typeof score).toBe("number");
      expect(Number.isFinite(score)).toBe(true);
    });

    it("should handle moves that clear multiple lines", () => {
      // Setup for Tetris (4-line clear)
      const testBoard: GameBoard = Array(20)
        .fill(null)
        .map(() => Array(10).fill(0));

      // Create 4 rows with single gap for I-piece
      for (let y = 16; y < 20; y++) {
        testBoard[y] = [1, 1, 1, 1, 1, 1, 1, 1, 1, 0];
      }

      board.fromBoardState(testBoard);

      const tetrisMove = createMove("I", 1, 9, 16); // Vertical I-piece for Tetris
      const features = evaluator.extractFeatures(board, tetrisMove);

      expect(features.linesCleared).toBe(4);
    });
  });
});

/**
 * Helper function to create test boards with specific patterns
 * Used for setting up controlled test scenarios
 */
function createTestBoard(pattern: string[]): GameBoard {
  const board: GameBoard = Array(20)
    .fill(null)
    .map(() => Array(10).fill(0));

  for (let y = 0; y < Math.min(pattern.length, 20); y++) {
    const row = pattern[y];
    for (let x = 0; x < Math.min(row.length, 10); x++) {
      board[19 - y][x] = row[x] === "1" ? 1 : 0; // Start from bottom
    }
  }

  return board;
}

describe("Real Game Scenarios", () => {
  let evaluator: DellacherieEvaluator;

  beforeEach(() => {
    evaluator = new DellacherieEvaluator();
  });

  it("should handle T-Spin setup scenario", () => {
    // Create T-Spin setup pattern
    const pattern = [
      "1111111101", // Bottom row with gap
      "1111110111", // Row with T-slot
      "0000000000", // Empty rows above
    ];

    const testBoard = createTestBoard(pattern);
    const board = new BitBoard();
    board.fromBoardState(testBoard);

    const tSpinMove = createMove("T", 1, 7, 17); // T-piece in slot
    const score = evaluator.evaluate(board, tSpinMove);

    expect(typeof score).toBe("number");
    expect(Number.isFinite(score)).toBe(true);
  });

  it("should prefer safe placements over risky ones", () => {
    // Create board with dangerous high tower
    const pattern = [
      "1100000000", // High tower on left
      "1100000000",
      "1100000000",
      "1100000000",
      "1100000000",
      "1100000000",
      "1100000000",
      "1100000000",
    ];

    const testBoard = createTestBoard(pattern);
    const board = new BitBoard();
    board.fromBoardState(testBoard);

    const riskyMove = createMove("O", 0, 0, 12); // On top of tower
    const safeMove = createMove("O", 0, 6, 18); // On flat area

    const riskyScore = evaluator.evaluate(board, riskyMove);
    const safeScore = evaluator.evaluate(board, safeMove);

    expect(safeScore).toBeGreaterThan(riskyScore);
  });
});

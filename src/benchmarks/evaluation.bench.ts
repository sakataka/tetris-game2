import { test as bench, describe } from "bun:test";
import { BitBoard } from "@/game/ai/core/bitboard";
import { getPieceBitsAtPosition } from "@/game/ai/core/piece-bits";
import {
  createMove,
  DellacherieEvaluator,
  findDropPosition,
} from "@/game/ai/evaluators/dellacherie";
import { DynamicWeights, WEIGHT_PRESETS } from "@/game/ai/evaluators/weights";
import type { GameBoard, TetrominoTypeName } from "@/types/game";

/**
 * Performance benchmarks for Dellacherie evaluation system
 *
 * Target performance:
 * - Single evaluation: < 1ms
 * - 1000 evaluations: < 100ms
 * - Full move generation: < 10ms
 * - Memory usage: Stable (no leaks)
 */

describe("Dellacherie Evaluation Performance", () => {
  // Setup test data
  const evaluator = new DellacherieEvaluator();
  const dynamicWeights = new DynamicWeights();
  const emptyBoard = new BitBoard();
  const complexBoard = createComplexTestBoard();

  const testPieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];
  const testMoves = generateTestMoves();

  bench("single evaluation - empty board", () => {
    const move = createMove("I", 0, 3, 19);
    evaluator.evaluate(emptyBoard, move);
  });

  bench("single evaluation - complex board", () => {
    const move = createMove("T", 1, 4, 15);
    evaluator.evaluate(complexBoard, move);
  });

  bench("1000 evaluations - mixed scenarios", () => {
    for (let i = 0; i < 1000; i++) {
      const move = testMoves[i % testMoves.length];
      const board = i % 2 === 0 ? emptyBoard : complexBoard;
      evaluator.evaluate(board, move);
    }
  });

  bench("feature extraction only", () => {
    const move = createMove("T", 1, 4, 15);
    evaluator.extractFeatures(complexBoard, move);
  });

  bench("find drop position - all pieces", () => {
    for (const piece of testPieces) {
      for (let x = 0; x < 8; x++) {
        findDropPosition(emptyBoard, piece, 0, x);
      }
    }
  });

  bench("dynamic weight adjustment", () => {
    const situation = dynamicWeights.analyzeSituation(complexBoard, 50, 5);
    dynamicWeights.adjustWeights(situation);
  });

  bench("full move generation (simplified)", () => {
    generateAllPossibleMoves(complexBoard, "T");
  });

  bench("board cloning", () => {
    for (let i = 0; i < 100; i++) {
      complexBoard.clone();
    }
  });

  bench("bit pattern lookup", () => {
    for (const piece of testPieces) {
      for (let rotation = 0; rotation < 4; rotation++) {
        for (let x = 0; x < 10; x++) {
          getPieceBitsAtPosition(piece, rotation as any, x);
        }
      }
    }
  });
});

describe("Memory Efficiency Benchmarks", () => {
  const evaluator = new DellacherieEvaluator();
  const emptyBoard = new BitBoard();

  bench("rapid evaluator creation/destruction", () => {
    for (let i = 0; i < 100; i++) {
      const tempEvaluator = new DellacherieEvaluator();
      const move = createMove("I", 0, i % 8, 19);
      tempEvaluator.evaluate(emptyBoard, move);
    }
  });

  bench("weight updates", () => {
    for (const preset of Object.keys(WEIGHT_PRESETS)) {
      evaluator.updateWeights(WEIGHT_PRESETS[preset as keyof typeof WEIGHT_PRESETS]);
    }
  });
});

describe("Real Game Scenario Benchmarks", () => {
  const evaluator = new DellacherieEvaluator();

  bench("tetris setup evaluation", () => {
    const tetrisBoard = createTetrisSetupBoard();
    const move = createMove("I", 1, 9, 16); // Vertical I-piece for Tetris
    evaluator.evaluate(tetrisBoard, move);
  });

  bench("t-spin setup evaluation", () => {
    const tSpinBoard = createTSpinSetupBoard();
    const move = createMove("T", 1, 7, 17); // T-piece in T-spin position
    evaluator.evaluate(tSpinBoard, move);
  });

  bench("dangerous situation evaluation", () => {
    const dangerBoard = createDangerousBoard();
    const moves = [createMove("I", 0, 0, 10), createMove("O", 0, 8, 10), createMove("T", 2, 4, 10)];

    for (const move of moves) {
      evaluator.evaluate(dangerBoard, move);
    }
  });
});

describe("Stress Testing", () => {
  const evaluator = new DellacherieEvaluator();
  const emptyBoard = new BitBoard();
  const complexBoard = createComplexTestBoard();

  bench("10,000 evaluations", () => {
    const boards = [emptyBoard, complexBoard, createTetrisSetupBoard()];
    const moves = generateTestMoves();

    for (let i = 0; i < 10000; i++) {
      const board = boards[i % boards.length];
      const move = moves[i % moves.length];
      evaluator.evaluate(board, move);
    }
  });

  bench("rapid board state changes", () => {
    let board = new BitBoard();

    for (let i = 0; i < 1000; i++) {
      // Simulate game progression
      const move = createMove("I", 0, i % 8, 19);
      evaluator.evaluate(board, move);

      // Occasionally clear the board and start over
      if (i % 100 === 0) {
        board = new BitBoard();
      }
    }
  });
});

// Helper functions for benchmark setup

function createComplexTestBoard(): BitBoard {
  const board = new BitBoard();

  // Create a complex board pattern with holes, wells, and varied heights
  const pattern: GameBoard = Array(20)
    .fill(null)
    .map(() => Array(10).fill(0));

  // Bottom rows with holes
  pattern[19] = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0];
  pattern[18] = [1, 0, 1, 1, 1, 0, 1, 1, 0, 1];
  pattern[17] = [1, 1, 1, 1, 0, 1, 1, 0, 1, 1];

  // Middle section with varied heights
  for (let y = 14; y < 17; y++) {
    for (let x = 0; x < 10; x++) {
      pattern[y][x] = Math.random() > 0.3 ? 1 : 0;
    }
  }

  // Create some tall towers
  for (let y = 10; y < 14; y++) {
    pattern[y][0] = 1;
    pattern[y][1] = 1;
    pattern[y][8] = 1;
    pattern[y][9] = 1;
  }

  board.fromBoardState(pattern);
  return board;
}

function createTetrisSetupBoard(): BitBoard {
  const board = new BitBoard();
  const pattern: GameBoard = Array(20)
    .fill(null)
    .map(() => Array(10).fill(0));

  // Setup for Tetris (4-line clear)
  for (let y = 16; y < 20; y++) {
    pattern[y] = [1, 1, 1, 1, 1, 1, 1, 1, 1, 0]; // Gap for I-piece
  }

  board.fromBoardState(pattern);
  return board;
}

function createTSpinSetupBoard(): BitBoard {
  const board = new BitBoard();
  const pattern: GameBoard = Array(20)
    .fill(null)
    .map(() => Array(10).fill(0));

  // T-Spin setup pattern
  pattern[19] = [1, 1, 1, 1, 1, 1, 1, 0, 1, 1];
  pattern[18] = [1, 1, 1, 1, 1, 1, 0, 1, 1, 1];
  pattern[17] = [1, 1, 1, 1, 1, 1, 1, 0, 1, 1];

  board.fromBoardState(pattern);
  return board;
}

function createDangerousBoard(): BitBoard {
  const board = new BitBoard();
  const pattern: GameBoard = Array(20)
    .fill(null)
    .map(() => Array(10).fill(0));

  // High stack reaching near the top
  for (let y = 8; y < 20; y++) {
    for (let x = 0; x < 10; x++) {
      if (y > 15 || x < 3 || x > 6) {
        pattern[y][x] = 1;
      }
    }
  }

  board.fromBoardState(pattern);
  return board;
}

function generateTestMoves() {
  const moves = [];
  const pieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];

  for (const piece of pieces) {
    for (let rotation = 0; rotation < 4; rotation++) {
      for (let x = 0; x < 8; x++) {
        moves.push(createMove(piece, rotation as any, x, 15));
      }
    }
  }

  return moves;
}

function generateAllPossibleMoves(board: BitBoard, piece: TetrominoTypeName) {
  const moves = [];

  for (let rotation = 0; rotation < 4; rotation++) {
    for (let x = 0; x < 8; x++) {
      const dropY = findDropPosition(board, piece, rotation as any, x);
      if (dropY >= 0) {
        moves.push(createMove(piece, rotation as any, x, dropY));
      }
    }
  }

  return moves;
}

/**
 * Benchmark result expectations:
 *
 * - Single evaluation: 0.1-0.5ms (target: <1ms)
 * - 1000 evaluations: 10-50ms (target: <100ms)
 * - Memory usage: Stable, no significant growth over time
 * - Feature extraction: 0.05-0.2ms per call
 * - Dynamic weight adjustment: 0.1-0.3ms per call
 *
 * These benchmarks help ensure the AI can evaluate moves fast enough
 * for real-time gameplay without impacting user experience.
 */

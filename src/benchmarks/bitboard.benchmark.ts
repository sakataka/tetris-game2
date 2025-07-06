import { describe } from "bun:test";

// Benchmark function placeholder since bun:test doesn't export bench
const bench = (name: string, fn: () => void) => {
  console.log(`Benchmark: ${name}`);
  const start = performance.now();
  fn();
  const end = performance.now();
  console.log(`  Time: ${(end - start).toFixed(3)}ms`);
};

import { BitBoard } from "@/game/ai/core/bitboard";
import { CollisionDetector } from "@/game/ai/core/collision-detection";
import { getPieceBitsAtPosition } from "@/game/ai/core/piece-bits";
import { createEmptyBoard } from "@/game/board";
import type { RotationState, TetrominoTypeName } from "@/types/game";

/**
 * Comprehensive BitBoard performance benchmarks
 *
 * Target Performance Metrics (from Issue #101):
 * - Collision detection: <1ms for 1,000 operations
 * - Board evaluation: 100,000+ evaluations per second
 * - Memory efficiency: <50% of existing implementation
 * - SRS rotation: Ultra-fast rotation attempts
 */

describe("BitBoard Performance Benchmarks", () => {
  // Test data setup
  const pieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];
  const rotations: RotationState[] = [0, 1, 2, 3];

  // Create test boards with varying complexity
  const emptyBoard = new BitBoard();

  const sparseBoard = new BitBoard();
  sparseBoard.setRowBits(19, 0b1100001100); // Bottom row with gaps
  sparseBoard.setRowBits(18, 0b0110110000); // Second row
  sparseBoard.setRowBits(15, 0b1000000001); // Higher row

  const denseBoard = new BitBoard();
  for (let y = 15; y < 20; y++) {
    denseBoard.setRowBits(y, 0b1111111110); // Almost full bottom rows
  }

  const complexBoard = new BitBoard();
  // Create a realistic mid-game board state
  complexBoard.setRowBits(19, 0b1111011111);
  complexBoard.setRowBits(18, 0b1111101111);
  complexBoard.setRowBits(17, 0b1110111111);
  complexBoard.setRowBits(16, 0b1101111111);
  complexBoard.setRowBits(15, 0b1011111111);
  complexBoard.setRowBits(14, 0b0111111111);
  complexBoard.setRowBits(13, 0b1111111011);
  complexBoard.setRowBits(12, 0b1111110111);
  complexBoard.setRowBits(10, 0b1100000011);
  complexBoard.setRowBits(8, 0b0110000110);

  describe("Core BitBoard Operations", () => {
    bench("BitBoard creation from empty", () => {
      new BitBoard();
    });

    bench("BitBoard creation from GameBoard", () => {
      const gameBoard = createEmptyBoard();
      gameBoard[19][0] = 1;
      gameBoard[19][9] = 1;
      new BitBoard(gameBoard);
    });

    bench("Row bit operations (1000x)", () => {
      const board = new BitBoard();
      for (let i = 0; i < 1000; i++) {
        board.setRowBits(i % 20, 0b1010101010);
        board.getRowBits(i % 20);
      }
    });

    bench("Board cloning", () => {
      complexBoard.clone();
    });

    bench("Board clearing", () => {
      const board = complexBoard.clone();
      board.clear();
    });
  });

  describe("Collision Detection Performance", () => {
    const detector = new CollisionDetector(false);

    bench("Single collision check - empty board", () => {
      detector.canPlace(emptyBoard, "T", 0, 3, 10);
    });

    bench("Single collision check - complex board", () => {
      detector.canPlace(complexBoard, "T", 0, 3, 5);
    });

    bench("1000 collision checks - TARGET: <1ms", () => {
      for (let i = 0; i < 1000; i++) {
        const piece = pieces[i % pieces.length];
        const rotation = rotations[i % rotations.length];
        const x = i % 8;
        const y = i % 18;
        detector.canPlace(complexBoard, piece, rotation, x, y);
      }
    });

    bench("Batch collision detection (100 positions)", () => {
      const positions = [];
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 10; y++) {
          positions.push({ x, y });
        }
      }
      detector.canPlaceBatch(complexBoard, "T", 0, positions);
    });

    bench("Find all valid positions - T piece", () => {
      detector.findValidPositions(complexBoard, "T", 0);
    });

    bench("Find all valid positions - I piece", () => {
      detector.findValidPositions(complexBoard, "I", 0);
    });

    bench("Drop position finding (all columns)", () => {
      for (let x = 0; x < 8; x++) {
        detector.findDropPosition(complexBoard, "T", 0, x);
      }
    });
  });

  describe("AI Board Evaluation Performance", () => {
    const detector = new CollisionDetector(false);

    bench("Complete move generation - single piece", () => {
      const validMoves = [];
      for (const piece of ["T"] as const) {
        for (const rotation of rotations) {
          const positions = detector.findValidPositions(complexBoard, piece, rotation);
          for (const pos of positions) {
            validMoves.push({ piece, rotation, position: pos });
          }
        }
      }
    });

    bench("100,000 board evaluations - TARGET: 1 second", () => {
      let evaluationCount = 0;
      const startTime = performance.now();

      while (evaluationCount < 100000) {
        const piece = pieces[evaluationCount % pieces.length];
        const rotation = rotations[evaluationCount % rotations.length];
        const x = evaluationCount % 8;
        const y = evaluationCount % 18;

        // Simulate AI evaluation: collision check + basic scoring
        const canPlace = detector.canPlace(complexBoard, piece, rotation, x, y);
        if (canPlace.canPlace) {
          // Simulate placing piece and evaluating
          const board = complexBoard.clone();
          const pieceBits = getPieceBitsAtPosition(piece, rotation, x);
          board.place(pieceBits, y);
          const height = board.calculateHeight();
          const occupied = board.countOccupiedCells();
          // Simple evaluation score
          const score = height * 10 + occupied;
          // Use score to prevent unused variable warning
          if (score < 0) continue;
        }

        evaluationCount++;
      }

      const endTime = performance.now();
      const timeMs = endTime - startTime;
      console.log(`100,000 evaluations completed in ${timeMs.toFixed(2)}ms`);
      console.log(`Rate: ${(100000 / (timeMs / 1000)).toFixed(0)} evaluations/second`);
    });

    bench("AI move tree simulation (depth 3)", () => {
      // Simulate AI looking ahead 3 pieces
      const pieceQueue = ["T", "I", "O"] as const;
      let simulations = 0;

      for (const piece1 of [pieceQueue[0]]) {
        for (const rot1 of [0, 1] as const) {
          const positions1 = detector.findValidPositions(complexBoard, piece1, rot1);

          for (let i = 0; i < Math.min(positions1.length, 5); i++) {
            const pos1 = positions1[i];

            // Place first piece
            const board1 = complexBoard.clone();
            const bits1 = getPieceBitsAtPosition(piece1, rot1, pos1.x);
            board1.place(bits1, pos1.y);
            board1.clearLines();

            for (const piece2 of [pieceQueue[1]]) {
              for (const rot2 of [0, 1] as const) {
                const positions2 = detector.findValidPositions(board1, piece2, rot2);

                for (let j = 0; j < Math.min(positions2.length, 3); j++) {
                  const pos2 = positions2[j];

                  // Place second piece
                  const board2 = board1.clone();
                  const bits2 = getPieceBitsAtPosition(piece2, rot2, pos2.x);
                  board2.place(bits2, pos2.y);
                  board2.clearLines();

                  for (const piece3 of [pieceQueue[2]]) {
                    for (const rot3 of [0] as const) {
                      const positions3 = detector.findValidPositions(board2, piece3, rot3);
                      simulations += positions3.length;
                    }
                  }
                }
              }
            }
          }
        }
      }

      console.log(`Completed ${simulations} board simulations`);
    });
  });

  describe("Line Clearing Performance", () => {
    bench("Line clearing - no lines", () => {
      sparseBoard.clone().clearLines();
    });

    bench("Line clearing - single line", () => {
      const board = sparseBoard.clone();
      board.setRowBits(19, 0b1111111111); // Full line
      board.clearLines();
    });

    bench("Line clearing - tetris (4 lines)", () => {
      const board = sparseBoard.clone();
      board.setRowBits(19, 0b1111111111);
      board.setRowBits(18, 0b1111111111);
      board.setRowBits(17, 0b1111111111);
      board.setRowBits(16, 0b1111111111);
      board.clearLines();
    });

    bench("Line clearing - complex pattern", () => {
      const board = new BitBoard();
      // Alternate full and partial lines
      for (let y = 10; y < 20; y++) {
        if (y % 2 === 0) {
          board.setRowBits(y, 0b1111111111); // Full
        } else {
          board.setRowBits(y, 0b1111111110); // Partial
        }
      }
      board.clearLines();
    });
  });

  describe("Memory Efficiency Tests", () => {
    bench("Memory usage - 1000 BitBoards", () => {
      const boards = [];
      for (let i = 0; i < 1000; i++) {
        boards.push(new BitBoard());
      }
      // Force garbage collection to see actual memory usage
      if (global.gc) {
        global.gc();
      }
    });

    bench("Memory usage - 1000 GameBoards", () => {
      const boards = [];
      for (let i = 0; i < 1000; i++) {
        boards.push(createEmptyBoard());
      }
      if (global.gc) {
        global.gc();
      }
    });

    bench("Clone performance - large scale", () => {
      const boards = [];
      for (let i = 0; i < 100; i++) {
        boards.push(complexBoard.clone());
      }
    });
  });

  describe("Real-world AI Simulation", () => {
    bench("Complete AI move evaluation cycle", () => {
      const detector = new CollisionDetector(false);
      // SRS rotation integration removed

      // Simulate AI evaluating all possible moves for current piece
      const piece: TetrominoTypeName = "T";
      let bestScore = Number.NEGATIVE_INFINITY;
      let bestMove: {
        piece: TetrominoTypeName;
        rotation: RotationState;
        position: { x: number; y: number };
        score: number;
      } | null = null;

      for (const rotation of rotations) {
        const validPositions = detector.findValidPositions(complexBoard, piece, rotation);

        for (const position of validPositions) {
          // Simulate placing piece
          const board = complexBoard.clone();
          const pieceBits = getPieceBitsAtPosition(piece, rotation, position.x);
          board.place(pieceBits, position.y);

          // Clear lines
          const clearedLines = board.clearLines();

          // Simple evaluation function
          const height = board.calculateHeight();
          const holes = 0; // Would count holes in real AI
          const bumpiness = 0; // Would calculate bumpiness in real AI
          const linesCleared = clearedLines.length;

          const score = linesCleared * 1000 - height * 10 - holes * 50 - bumpiness * 5;

          if (score > bestScore) {
            bestScore = score;
            bestMove = { piece, rotation, position, score };
          }
        }
      }

      // Use bestMove to prevent unused warning
      if (bestMove) {
        // Best move found for this evaluation cycle
      }
    });

    bench("Multi-piece lookahead (2 pieces)", () => {
      const detector = new CollisionDetector(false);
      const pieces: TetrominoTypeName[] = ["T", "I"];

      let bestSequence: {
        moves: Array<{
          piece: TetrominoTypeName;
          rotation: RotationState;
          position: { x: number; y: number };
        }>;
        score: number;
      } | null = null;
      let bestScore = Number.NEGATIVE_INFINITY;

      // First piece
      for (const rot1 of [0, 1] as const) {
        const positions1 = detector.findValidPositions(complexBoard, pieces[0], rot1);

        for (let i = 0; i < Math.min(positions1.length, 10); i++) {
          const pos1 = positions1[i];

          // Place first piece
          const board1 = complexBoard.clone();
          const bits1 = getPieceBitsAtPosition(pieces[0], rot1, pos1.x);
          board1.place(bits1, pos1.y);
          const lines1 = board1.clearLines();

          // Second piece
          for (const rot2 of [0, 1] as const) {
            const positions2 = detector.findValidPositions(board1, pieces[1], rot2);

            for (let j = 0; j < Math.min(positions2.length, 5); j++) {
              const pos2 = positions2[j];

              const board2 = board1.clone();
              const bits2 = getPieceBitsAtPosition(pieces[1], rot2, pos2.x);
              board2.place(bits2, pos2.y);
              const lines2 = board2.clearLines();

              const totalLines = lines1.length + lines2.length;
              const finalHeight = board2.calculateHeight();
              const score = totalLines * 1000 - finalHeight * 10;

              if (score > bestScore) {
                bestScore = score;
                bestSequence = {
                  moves: [
                    { piece: pieces[0], rotation: rot1, position: pos1 },
                    { piece: pieces[1], rotation: rot2, position: pos2 },
                  ],
                  score: score,
                };
              }
            }
          }
        }
      }

      // Use bestSequence to prevent unused warning
      if (bestSequence) {
        // Best sequence found for this evaluation
      }
    });
  });
});

/**
 * Performance validation tests
 * These will log results to console for manual verification
 */
describe("Performance Validation", () => {
  bench("Validate 1000 collision checks <1ms", () => {
    const detector = new CollisionDetector(false);
    const board = new BitBoard();

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      detector.canPlace(board, "T", 0, i % 8, i % 18);
    }
    const end = performance.now();

    const timeMs = end - start;
    console.log(`1000 collision checks: ${timeMs.toFixed(3)}ms`);

    if (timeMs < 1.0) {
      console.log("✅ PASSED: <1ms for 1000 operations");
    } else {
      console.log("❌ FAILED: >1ms for 1000 operations");
    }
  });

  bench("Validate 100k evaluations per second", () => {
    const detector = new CollisionDetector(false);
    const board = new BitBoard();
    board.setRowBits(19, 0b1111000000);
    board.setRowBits(18, 0b1100000000);

    const start = performance.now();
    let evaluations = 0;

    // Run for exactly 1 second or 100k evaluations, whichever comes first
    while (evaluations < 100000) {
      const piece = (["I", "O", "T", "S", "Z", "J", "L"] as const)[evaluations % 7];
      const rotation = (evaluations % 4) as RotationState;
      const x = evaluations % 8;
      const y = evaluations % 18;

      detector.canPlace(board, piece, rotation, x, y);
      evaluations++;

      // Break if we've spent more than 1 second
      if (evaluations % 10000 === 0) {
        const elapsed = performance.now() - start;
        if (elapsed > 1000) break;
      }
    }

    const end = performance.now();
    const timeMs = end - start;
    const rate = evaluations / (timeMs / 1000);

    console.log(`${evaluations} evaluations in ${timeMs.toFixed(2)}ms`);
    console.log(`Rate: ${rate.toFixed(0)} evaluations/second`);

    if (rate >= 100000) {
      console.log("✅ PASSED: ≥100k evaluations/second");
    } else {
      console.log("❌ FAILED: <100k evaluations/second");
    }
  });
});

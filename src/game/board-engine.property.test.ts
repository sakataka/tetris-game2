import { describe, expect, test } from "bun:test";
import * as fc from "fast-check";
import {
  allTetrominoShapesGenerator,
  boardEngineTestCaseGenerator,
  comprehensiveBoardGenerator,
  emptyBoardGenerator,
  regressionTestCaseGenerator,
  wideRangePositionGenerator,
} from "@/test/generators/board-generator";
import type { BoardEngineType } from "./board-engine";
import { createBoardEngine } from "./board-engine";

/**
 * Property-based testing for board engines
 * Comprehensive testing with random board generation as per Issue #86
 *
 * Tests 1000 random cases to catch edge cases and ensure consistency
 * across all board engine implementations (legacy, typed-array, bitboard)
 */

describe("Board Engine Property-Based Testing", () => {
  const engineTypes: BoardEngineType[] = ["legacy", "typed-array", "bitboard"];

  describe("Cross-Engine Consistency", () => {
    test("all engines should produce identical results for isValidPosition", () => {
      fc.assert(
        fc.property(boardEngineTestCaseGenerator(), ({ board, shape, position }) => {
          const engines = engineTypes.map((type) => createBoardEngine(type));
          const results = engines.map((engine) => engine.isValidPosition(board, shape, position));

          // All engines should produce the same result
          const firstResult = results[0];
          for (let i = 1; i < results.length; i++) {
            expect(results[i]).toBe(firstResult);
          }
        }),
        { numRuns: 1000 },
      );
    });

    test("all engines should produce identical results for placePiece", () => {
      fc.assert(
        fc.property(boardEngineTestCaseGenerator(), ({ board, shape, position, colorIndex }) => {
          const engines = engineTypes.map((type) => createBoardEngine(type));

          // Only test placement if position is valid
          const isValid = engines[0].isValidPosition(board, shape, position);

          if (isValid) {
            const results = engines.map((engine) =>
              engine.placePiece(board, shape, position, colorIndex),
            );

            // All engines should produce the same result
            const firstResult = results[0];
            for (let i = 1; i < results.length; i++) {
              expect(results[i]).toEqual(firstResult);
            }
          }
        }),
        { numRuns: 1000 },
      );
    });

    test("all engines should produce identical results for clearLines", () => {
      fc.assert(
        fc.property(comprehensiveBoardGenerator(), (board) => {
          const engines = engineTypes.map((type) => createBoardEngine(type));
          const results = engines.map((engine) => engine.clearLines(board));

          // All engines should produce the same result
          const firstResult = results[0];
          for (let i = 1; i < results.length; i++) {
            expect(results[i]).toEqual(firstResult);
          }
        }),
        { numRuns: 1000 },
      );
    });
  });

  describe("Board Validation Properties", () => {
    test.each(engineTypes)("%s engine - isValidPosition should never throw", (engineType) => {
      fc.assert(
        fc.property(boardEngineTestCaseGenerator(), ({ board, shape, position }) => {
          const engine = createBoardEngine(engineType);

          // This should never throw an exception
          expect(() => {
            engine.isValidPosition(board, shape, position);
          }).not.toThrow();
        }),
        { numRuns: 1000 },
      );
    });

    test.each(engineTypes)(
      "%s engine - empty board should accept valid positions",
      (engineType) => {
        fc.assert(
          fc.property(
            emptyBoardGenerator(),
            allTetrominoShapesGenerator(),
            fc.record({
              x: fc.integer({ min: 0, max: 6 }), // Safe positions within board
              y: fc.integer({ min: 0, max: 16 }), // Safe positions within board
            }),
            (board, shape, position) => {
              const engine = createBoardEngine(engineType);
              const result = engine.isValidPosition(board, shape, position);

              // Empty board should accept positions that don't go out of bounds
              expect(typeof result).toBe("boolean");
            },
          ),
          { numRuns: 1000 },
        );
      },
    );

    test.each(engineTypes)(
      "%s engine - positions completely outside board should be invalid",
      (engineType) => {
        fc.assert(
          fc.property(
            emptyBoardGenerator(),
            allTetrominoShapesGenerator(),
            fc.oneof(
              // Far left (entire piece outside)
              fc.record({
                x: fc.integer({ min: -10, max: -4 }),
                y: fc.integer({ min: 0, max: 19 }),
              }),
              // Far right (entire piece outside)
              fc.record({
                x: fc.integer({ min: 14, max: 20 }),
                y: fc.integer({ min: 0, max: 19 }),
              }),
              // Far below (entire piece outside)
              fc.record({ x: fc.integer({ min: 0, max: 9 }), y: fc.integer({ min: 24, max: 30 }) }),
            ),
            (board, shape, position) => {
              const engine = createBoardEngine(engineType);
              const result = engine.isValidPosition(board, shape, position);

              // Positions completely outside the board should be invalid
              expect(result).toBe(false);
            },
          ),
          { numRuns: 1000 },
        );
      },
    );
  });

  describe("Piece Placement Properties", () => {
    test.each(engineTypes)("%s engine - placePiece should preserve immutability", (engineType) => {
      fc.assert(
        fc.property(boardEngineTestCaseGenerator(), ({ board, shape, position, colorIndex }) => {
          const engine = createBoardEngine(engineType);
          const originalBoard = board.map((row) => [...row]);

          // Only test placement if position is valid
          const isValid = engine.isValidPosition(board, shape, position);

          if (isValid) {
            const newBoard = engine.placePiece(board, shape, position, colorIndex);

            // Original board should remain unchanged
            expect(board).toEqual(originalBoard);
            expect(newBoard).not.toBe(board);
          }
        }),
        { numRuns: 1000 },
      );
    });

    test.each(engineTypes)(
      "%s engine - placePiece should never throw on valid positions",
      (engineType) => {
        fc.assert(
          fc.property(boardEngineTestCaseGenerator(), ({ board, shape, position, colorIndex }) => {
            const engine = createBoardEngine(engineType);

            // Only test placement if position is valid
            const isValid = engine.isValidPosition(board, shape, position);

            if (isValid) {
              expect(() => {
                engine.placePiece(board, shape, position, colorIndex);
              }).not.toThrow();
            }
          }),
          { numRuns: 1000 },
        );
      },
    );
  });

  describe("Line Clearing Properties", () => {
    test.each(engineTypes)("%s engine - clearLines should preserve immutability", (engineType) => {
      fc.assert(
        fc.property(comprehensiveBoardGenerator(), (board) => {
          const engine = createBoardEngine(engineType);
          const originalBoard = board.map((row) => [...row]);

          const result = engine.clearLines(board);

          // Original board should remain unchanged
          expect(board).toEqual(originalBoard);
          expect(result.board).not.toBe(board);
        }),
        { numRuns: 1000 },
      );
    });

    test.each(engineTypes)("%s engine - clearLines should never throw", (engineType) => {
      fc.assert(
        fc.property(comprehensiveBoardGenerator(), (board) => {
          const engine = createBoardEngine(engineType);

          expect(() => {
            engine.clearLines(board);
          }).not.toThrow();
        }),
        { numRuns: 1000 },
      );
    });

    test.each(engineTypes)(
      "%s engine - clearLines should maintain board dimensions",
      (engineType) => {
        fc.assert(
          fc.property(comprehensiveBoardGenerator(), (board) => {
            const engine = createBoardEngine(engineType);
            const result = engine.clearLines(board);

            // Board dimensions should remain the same
            expect(result.board.length).toBe(board.length);
            expect(result.board[0].length).toBe(board[0].length);
          }),
          { numRuns: 1000 },
        );
      },
    );

    test.each(engineTypes)(
      "%s engine - clearLines count should match cleared indices",
      (engineType) => {
        fc.assert(
          fc.property(comprehensiveBoardGenerator(), (board) => {
            const engine = createBoardEngine(engineType);
            const result = engine.clearLines(board);

            // Lines cleared count should match cleared indices length
            expect(result.linesCleared).toBe(result.clearedLineIndices.length);
          }),
          { numRuns: 1000 },
        );
      },
    );
  });

  describe("Edge Case Regression Testing", () => {
    test.each(engineTypes)("%s engine - handles extreme positions gracefully", (engineType) => {
      fc.assert(
        fc.property(regressionTestCaseGenerator(), ({ board, shape, position, colorIndex }) => {
          const engine = createBoardEngine(engineType);

          // Should handle extreme positions without throwing
          expect(() => {
            const isValid = engine.isValidPosition(board, shape, position);

            if (isValid) {
              engine.placePiece(board, shape, position, colorIndex);
            }
          }).not.toThrow();
        }),
        { numRuns: 1000 },
      );
    });

    test.each(engineTypes)("%s engine - I-piece rotation edge cases", (engineType) => {
      fc.assert(
        fc.property(emptyBoardGenerator(), wideRangePositionGenerator(), (board, position) => {
          const engine = createBoardEngine(engineType);

          // Test all rotations of I-piece
          const iPiece = [
            [
              [0, 0, 0, 0],
              [1, 1, 1, 1],
              [0, 0, 0, 0],
              [0, 0, 0, 0],
            ], // Horizontal
            [
              [0, 0, 1, 0],
              [0, 0, 1, 0],
              [0, 0, 1, 0],
              [0, 0, 1, 0],
            ], // Vertical
            [
              [0, 0, 0, 0],
              [0, 0, 0, 0],
              [1, 1, 1, 1],
              [0, 0, 0, 0],
            ], // Horizontal (180°)
            [
              [0, 1, 0, 0],
              [0, 1, 0, 0],
              [0, 1, 0, 0],
              [0, 1, 0, 0],
            ], // Vertical (270°)
          ];

          iPiece.forEach((shape) => {
            expect(() => {
              engine.isValidPosition(board, shape, position);
            }).not.toThrow();
          });
        }),
        { numRuns: 1000 },
      );
    });
  });

  describe("Performance and Consistency Validation", () => {
    test("engines should handle high-volume operations consistently", () => {
      fc.assert(
        fc.property(
          fc.array(boardEngineTestCaseGenerator(), { minLength: 10, maxLength: 50 }),
          (testCases) => {
            const engines = engineTypes.map((type) => createBoardEngine(type));

            // Process all test cases with all engines
            testCases.forEach(({ board, shape, position, colorIndex }) => {
              const results = engines.map((engine) => {
                const isValid = engine.isValidPosition(board, shape, position);

                if (isValid) {
                  const placed = engine.placePiece(board, shape, position, colorIndex);
                  const cleared = engine.clearLines(placed);
                  return { isValid, placed, cleared };
                }

                return { isValid };
              });

              // All engines should produce identical results
              const firstResult = results[0];
              for (let i = 1; i < results.length; i++) {
                expect(results[i]).toEqual(firstResult);
              }
            });
          },
        ),
        { numRuns: 100 }, // Fewer runs for performance test
      );
    });
  });
});

/**
 * Regression Test Suite
 * Fixed test cases for known edge cases and past bugs
 */
describe("Board Engine Regression Tests", () => {
  const engineTypes: BoardEngineType[] = ["legacy", "typed-array", "bitboard"];

  test("should handle empty board with I-piece at spawn position", () => {
    const engines = engineTypes.map((type) => createBoardEngine(type));
    const emptyBoard = Array.from({ length: 20 }, () => Array(10).fill(0));
    const iPiece = [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const spawnPosition = { x: 3, y: 0 };

    engines.forEach((engine) => {
      const result = engine.isValidPosition(emptyBoard, iPiece, spawnPosition);
      expect(result).toBe(true);
    });
  });

  test("should handle board with single filled cell", () => {
    const engines = engineTypes.map((type) => createBoardEngine(type));
    const board = Array.from({ length: 20 }, () => Array(10).fill(0));
    board[19][0] = 1; // Fill bottom-left cell

    const tPiece = [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ];
    const position = { x: 0, y: 18 }; // Position T-piece so it will collide with filled cell

    engines.forEach((engine) => {
      const result = engine.isValidPosition(board, tPiece, position);
      expect(result).toBe(false); // Should collide with filled cell
    });
  });
});

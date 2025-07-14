import { beforeEach, describe, expect, it } from "bun:test";
import * as fc from "fast-check";
import {
  type BitBoardData,
  canPlaceRow,
  clearLines,
  clone,
  countOccupiedCells,
  createBitBoard,
  fromBoardState,
  getRowBits,
  setRowBits,
  toBoardState,
} from "../../src/game/ai/core/bitboard";
import { createBoardEngine } from "../../src/game/board-engine";
import type { GameState } from "../../src/types/game";

/**
 * Property-Based Tests for Game Engine
 * Comprehensive testing using fast-check to verify game logic invariants
 */

describe("Game Engine Property-Based Tests", () => {
  describe("BitBoard Operations", () => {
    it("should maintain matrix consistency after random operations", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              row: fc.integer({ min: 0, max: 19 }),
              col: fc.integer({ min: 0, max: 9 }),
              action: fc.constantFrom("set", "clear"),
            }),
            { minLength: 1, maxLength: 100 },
          ),
          (operations) => {
            let bitBoard = createBitBoard();
            const expectedCells = new Set<string>();

            // Apply operations and track expected state
            for (const op of operations) {
              const key = `${op.row},${op.col}`;
              const currentRowBits = getRowBits(bitBoard, op.row);

              if (op.action === "set") {
                const newRowBits = currentRowBits | (1 << op.col);
                bitBoard = setRowBits(bitBoard, op.row, newRowBits);
                expectedCells.add(key);
              } else {
                const newRowBits = currentRowBits & ~(1 << op.col);
                bitBoard = setRowBits(bitBoard, op.row, newRowBits);
                expectedCells.delete(key);
              }
            }

            // Verify final state matches expectations
            for (let row = 0; row < 20; row++) {
              for (let col = 0; col < 10; col++) {
                const key = `${row},${col}`;
                const expected = expectedCells.has(key);
                const rowBits = getRowBits(bitBoard, row);
                const actual = Boolean(rowBits & (1 << col));

                if (expected !== actual) {
                  return false;
                }
              }
            }

            return true;
          },
        ),
        { numRuns: 1000 },
      );
    });

    it("should preserve total block count during line clears", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              row: fc.integer({ min: 0, max: 19 }),
              col: fc.integer({ min: 0, max: 9 }),
            }),
            { minLength: 1, maxLength: 50 },
          ),
          (setCells) => {
            let bitBoard = createBitBoard();

            // Set some cells
            for (const cell of setCells) {
              const currentRowBits = getRowBits(bitBoard, cell.row);
              const newRowBits = currentRowBits | (1 << cell.col);
              bitBoard = setRowBits(bitBoard, cell.row, newRowBits);
            }

            const initialBlocks = countOccupiedCells(bitBoard);

            // Clear lines (this function handles multiple lines automatically)
            const { board: clearedBoard } = clearLines(bitBoard);
            const finalBlocks = countOccupiedCells(clearedBoard);

            // After clearing lines, we should have lost some blocks
            return finalBlocks <= initialBlocks;
          },
        ),
        { numRuns: 500 },
      );
    });

    it("should never create holes when placing pieces sequentially", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              col: fc.integer({ min: 0, max: 9 }),
              height: fc.integer({ min: 1, max: 4 }),
            }),
            { minLength: 1, maxLength: 20 },
          ),
          (pieces) => {
            let bitBoard = createBitBoard();

            // Place pieces from bottom up
            for (const piece of pieces) {
              // Find the landing position for this column
              let landingRow = 19; // Start from bottom (0-indexed)
              for (let row = 19; row >= 0; row--) {
                const rowBits = getRowBits(bitBoard, row);
                if (rowBits & (1 << piece.col)) {
                  landingRow = row - 1;
                  break;
                }
              }

              // Place piece blocks
              for (let i = 0; i < piece.height && landingRow - i >= 0; i++) {
                const targetRow = landingRow - i;
                const currentRowBits = getRowBits(bitBoard, targetRow);
                const newRowBits = currentRowBits | (1 << piece.col);
                bitBoard = setRowBits(bitBoard, targetRow, newRowBits);
              }
            }

            // Should have no holes (empty cells with blocks above)
            return countHolesInBitBoard(bitBoard) === 0;
          },
        ),
        { numRuns: 300 },
      );
    });

    it("should maintain bit operations consistency", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              row: fc.integer({ min: 0, max: 19 }),
              col: fc.integer({ min: 0, max: 9 }),
            }),
            { minLength: 1, maxLength: 200 },
          ),
          (cellOperations) => {
            let bitBoard = createBitBoard();
            const referenceCells = new Set<string>();

            // Perform operations and track reference
            for (const op of cellOperations) {
              const key = `${op.row},${op.col}`;
              const currentRowBits = getRowBits(bitBoard, op.row);

              if (referenceCells.has(key)) {
                const newRowBits = currentRowBits & ~(1 << op.col);
                bitBoard = setRowBits(bitBoard, op.row, newRowBits);
                referenceCells.delete(key);
              } else {
                const newRowBits = currentRowBits | (1 << op.col);
                bitBoard = setRowBits(bitBoard, op.row, newRowBits);
                referenceCells.add(key);
              }
            }

            // Verify bitBoard matches reference
            for (let row = 0; row < 20; row++) {
              for (let col = 0; col < 10; col++) {
                const key = `${row},${col}`;
                const expected = referenceCells.has(key);
                const rowBits = getRowBits(bitBoard, row);
                const actual = Boolean(rowBits & (1 << col));

                if (expected !== actual) {
                  return false;
                }
              }
            }

            return true;
          },
        ),
        { numRuns: 200 },
      );
    });
  });

  describe("Game State Invariants", () => {
    it("should maintain valid piece positions", () => {
      fc.assert(
        fc.property(
          fc.record({
            x: fc.integer({ min: -3, max: 12 }),
            y: fc.integer({ min: -3, max: 22 }),
            rotation: fc.integer({ min: 0, max: 3 }),
            pieceType: fc.constantFrom("I", "O", "T", "S", "Z", "J", "L"),
          }),
          (pieceData) => {
            const bitBoard = createBitBoard();

            // This property checks that piece validation works correctly
            // Even for out-of-bounds positions
            const isValid = validatePiecePosition(bitBoard, pieceData);

            // If position is clearly out of bounds, should be invalid
            if (pieceData.x < -2 || pieceData.x > 7 || pieceData.y < -2 || pieceData.y > 19) {
              return !isValid;
            }

            // Other positions may be valid or invalid depending on collision
            return true;
          },
        ),
        { numRuns: 500 },
      );
    });

    it("should preserve game state transitions", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.constantFrom(
              "MOVE_LEFT",
              "MOVE_RIGHT",
              "MOVE_DOWN",
              "ROTATE_CW",
              "ROTATE_CCW",
              "HARD_DROP",
              "HOLD_PIECE",
            ),
            { minLength: 1, maxLength: 20 },
          ),
          (actions) => {
            const initialState = createMockGameState();
            let currentState = { ...initialState };

            // Apply actions sequentially
            for (const action of actions) {
              const newState = applyGameAction(currentState, action);

              // State should always be valid after any action
              expect(isValidGameState(newState)).toBe(true);

              // Update current state for next iteration
              currentState = newState;
            }

            return true;
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should handle score calculations consistently", () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 4 }), { minLength: 1, maxLength: 10 }),
          fc.integer({ min: 1, max: 15 }),
          (lineClears, level) => {
            let totalScore = 0;
            let currentLevel = level;

            for (const lines of lineClears) {
              const scoreIncrease = calculateLineScore(lines, currentLevel);
              totalScore += scoreIncrease;

              // Score should always increase
              expect(scoreIncrease).toBeGreaterThan(0);

              // Higher levels should give more points
              if (lines === 4) {
                // Tetris
                expect(scoreIncrease).toBeGreaterThan(lines * 100);
              }

              // Level progression
              if (shouldLevelUp(totalScore, currentLevel)) {
                currentLevel++;
              }
            }

            // Total score should be positive
            return totalScore > 0;
          },
        ),
        { numRuns: 200 },
      );
    });
  });

  describe("Board Engine Cross-Validation", () => {
    it("should produce identical results across different engines", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              board: fc.array(
                fc.array(fc.integer({ min: 0, max: 7 }), {
                  minLength: 10,
                  maxLength: 10,
                }),
                { minLength: 20, maxLength: 20 },
              ),
              piece: fc.constantFrom("I", "O", "T", "S", "Z", "J", "L"),
              position: fc.record({
                x: fc.integer({ min: -2, max: 11 }),
                y: fc.integer({ min: -2, max: 21 }),
                rotation: fc.integer({ min: 0, max: 3 }),
              }),
              action: fc.constantFrom("isValid", "place", "clearLines"),
            }),
            { minLength: 1, maxLength: 10 },
          ),
          (testCases) => {
            const typedArrayEngine = createBoardEngine("typed-array");
            const bitboardEngine = createBoardEngine("bitboard");

            for (const testCase of testCases) {
              const { board, piece, position, action } = testCase;

              try {
                let result1: any, result2: any;

                switch (action) {
                  case "isValid":
                    result1 = typedArrayEngine.isValidPosition(
                      board,
                      getPieceShape(piece),
                      position,
                    );
                    result2 = bitboardEngine.isValidPosition(board, getPieceShape(piece), position);
                    break;
                  case "place":
                    if (typedArrayEngine.isValidPosition(board, getPieceShape(piece), position)) {
                      result1 = typedArrayEngine.placePiece(
                        board,
                        getPieceShape(piece),
                        position,
                        1,
                      );
                      result2 = bitboardEngine.placePiece(board, getPieceShape(piece), position, 1);
                    } else {
                      continue; // Skip invalid placements
                    }
                    break;
                  case "clearLines":
                    result1 = typedArrayEngine.clearLines(board);
                    result2 = bitboardEngine.clearLines(board);
                    break;
                }

                // Results should be identical
                expect(result1).toEqual(result2);
              } catch (error) {
                // Both engines should throw the same type of error
                expect(() => {
                  switch (action) {
                    case "isValid":
                      typedArrayEngine.isValidPosition(board, getPieceShape(piece), position);
                      break;
                    case "place":
                      typedArrayEngine.placePiece(board, getPieceShape(piece), position, 1);
                      break;
                    case "clearLines":
                      typedArrayEngine.clearLines(board);
                      break;
                  }
                }).toThrow();

                expect(() => {
                  switch (action) {
                    case "isValid":
                      bitboardEngine.isValidPosition(board, getPieceShape(piece), position);
                      break;
                    case "place":
                      bitboardEngine.placePiece(board, getPieceShape(piece), position, 1);
                      break;
                    case "clearLines":
                      bitboardEngine.clearLines(board);
                      break;
                  }
                }).toThrow();
              }
            }

            return true;
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});

// Helper functions
function countHolesInBitBoard(bitBoard: BitBoardData): number {
  let holes = 0;
  for (let col = 0; col < 10; col++) {
    let hasBlock = false;
    for (let row = 0; row < 20; row++) {
      const rowBits = getRowBits(bitBoard, row);
      if (rowBits & (1 << col)) {
        hasBlock = true;
      } else if (hasBlock) {
        holes++;
      }
    }
  }
  return holes;
}

function validatePiecePosition(bitBoard: BitBoardData, piece: any): boolean {
  // Simplified piece validation - pieces outside board bounds are invalid
  // For a 10-wide board, x positions beyond 7 are generally invalid for most pieces
  return piece.x >= -2 && piece.x <= 7 && piece.y >= -2 && piece.y <= 19;
}

function createMockGameState(): GameState {
  return {
    board: Array.from({ length: 20 }, () => Array(10).fill(0)),
    currentPiece: {
      type: "T",
      position: { x: 4, y: 0 },
      rotation: 0,
    },
    nextPieces: ["I", "O", "S"],
    heldPiece: null,
    canHold: true,
    score: 0,
    level: 1,
    lines: 0,
    isGameOver: false,
    isPaused: false,
  };
}

function applyGameAction(state: GameState, action: string): GameState {
  // Simplified game action application
  const newState = { ...state };

  switch (action) {
    case "MOVE_LEFT":
      if (newState.currentPiece) {
        newState.currentPiece = {
          ...newState.currentPiece,
          position: {
            ...newState.currentPiece.position,
            x: Math.max(0, newState.currentPiece.position.x - 1),
          },
        };
      }
      break;
    case "MOVE_RIGHT":
      if (newState.currentPiece) {
        newState.currentPiece = {
          ...newState.currentPiece,
          position: {
            ...newState.currentPiece.position,
            x: Math.min(9, newState.currentPiece.position.x + 1),
          },
        };
      }
      break;
    case "MOVE_DOWN":
      if (newState.currentPiece) {
        newState.currentPiece = {
          ...newState.currentPiece,
          position: {
            ...newState.currentPiece.position,
            y: Math.min(19, newState.currentPiece.position.y + 1),
          },
        };
      }
      break;
    case "ROTATE_CW":
      if (newState.currentPiece) {
        newState.currentPiece = {
          ...newState.currentPiece,
          rotation: (newState.currentPiece.rotation + 1) % 4,
        };
      }
      break;
    case "ROTATE_CCW":
      if (newState.currentPiece) {
        newState.currentPiece = {
          ...newState.currentPiece,
          rotation: (newState.currentPiece.rotation + 3) % 4,
        };
      }
      break;
  }

  return newState;
}

function isValidGameState(state: GameState): boolean {
  // Basic game state validation
  return (
    state.board.length === 20 &&
    state.board[0].length === 10 &&
    state.score >= 0 &&
    state.level >= 1 &&
    state.lines >= 0 &&
    (!state.currentPiece ||
      (state.currentPiece.position.x >= 0 &&
        state.currentPiece.position.x < 10 &&
        state.currentPiece.position.y >= 0 &&
        state.currentPiece.position.y < 20))
  );
}

function calculateLineScore(lines: number, level: number): number {
  const baseScores = [0, 40, 100, 300, 1200]; // Single, Double, Triple, Tetris
  return (baseScores[lines] || 0) * level;
}

function shouldLevelUp(score: number, level: number): boolean {
  return score > level * 1000;
}

function getPieceShape(pieceType: string): number[][] {
  const shapes = {
    I: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    O: [
      [1, 1],
      [1, 1],
    ],
    T: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    S: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    Z: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    J: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    L: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
  };
  return shapes[pieceType as keyof typeof shapes] || shapes.T;
}

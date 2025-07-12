import { beforeEach, describe, expect, it } from "bun:test";
import fc from "fast-check";
import { createEmptyBoard } from "@/game/board";
import type { GameBoard } from "@/types/game";
import type { BitBoardData } from "./bitboard";
import {
  calculateHeight,
  canPlace,
  canPlaceRow,
  clear,
  clearLines,
  clone,
  countOccupiedCells,
  createBitBoard,
  fromBoardState,
  getDimensions,
  getRowBits,
  isGameOver,
  place,
  setRowBits,
  toBoardState,
} from "./bitboard";

describe("BitBoard", () => {
  let bitBoard: BitBoardData;

  beforeEach(() => {
    bitBoard = createBitBoard();
  });

  describe("Basic Construction and Properties", () => {
    it("should create empty BitBoard by default", () => {
      expect(calculateHeight(bitBoard)).toBe(0);
      expect(countOccupiedCells(bitBoard)).toBe(0);
      expect(isGameOver(bitBoard)).toBe(false);
    });

    it("should initialize from existing GameBoard", () => {
      const gameBoard: GameBoard = createEmptyBoard();
      gameBoard[19][0] = 1; // Place piece at bottom
      gameBoard[19][9] = 1; // Place piece at bottom right

      const bitBoardFromGame = createBitBoard(gameBoard);
      expect(countOccupiedCells(bitBoardFromGame)).toBe(2);
      expect(calculateHeight(bitBoardFromGame)).toBe(1);
    });

    it("should return correct dimensions", () => {
      const dimensions = getDimensions(bitBoard);
      expect(dimensions.width).toBe(10);
      expect(dimensions.height).toBe(20);
    });
  });

  describe("Row-level Operations", () => {
    it("should set and get row bits correctly", () => {
      const testBits = 0b1010101010; // Alternating pattern
      bitBoard = setRowBits(bitBoard, 10, testBits);
      expect(getRowBits(bitBoard, 10)).toBe(testBits);
    });

    it("should mask invalid bits when setting row", () => {
      const invalidBits = 0b11111111111111111; // More than 10 bits
      bitBoard = setRowBits(bitBoard, 5, invalidBits);
      const maskedBits = getRowBits(bitBoard, 5);
      expect(maskedBits).toBe(0b1111111111); // Only 10 bits should remain
    });

    it("should throw error for invalid row indices", () => {
      expect(() => getRowBits(bitBoard, -1)).toThrow();
      expect(() => getRowBits(bitBoard, 20)).toThrow();
      expect(() => setRowBits(bitBoard, -1, 0)).toThrow();
      expect(() => setRowBits(bitBoard, 20, 0)).toThrow();
    });
  });

  describe("Collision Detection", () => {
    beforeEach(() => {
      // Set up a test board with some occupied cells
      bitBoard = setRowBits(bitBoard, 19, 0b1111000000); // Bottom row, left 4 cells occupied
      bitBoard = setRowBits(bitBoard, 18, 0b1100000000); // Second row, left 2 cells occupied
    });

    it("should detect collision with single row", () => {
      const pieceBits = 0b1000000000; // Single bit at leftmost position
      expect(canPlaceRow(bitBoard, pieceBits, 19)).toBe(false); // Collision
      expect(canPlaceRow(bitBoard, pieceBits, 17)).toBe(true); // No collision
    });

    it("should handle out-of-bounds placement", () => {
      const pieceBits = 0b1000000000;
      expect(canPlaceRow(bitBoard, pieceBits, -1)).toBe(false);
      expect(canPlaceRow(bitBoard, pieceBits, 20)).toBe(false);
    });

    it("should detect multi-row collision", () => {
      const pieceBitRows = [0b1000000000, 0b1000000000]; // Two rows, same pattern
      expect(canPlace(bitBoard, pieceBitRows, 18)).toBe(false); // Would collide
      expect(canPlace(bitBoard, pieceBitRows, 16)).toBe(true); // No collision
    });

    it("should handle empty piece rows", () => {
      const pieceBitRows = [0b0000000000, 0b1111111111, 0b0000000000]; // Empty, full, empty
      expect(canPlace(bitBoard, pieceBitRows, 0)).toBe(true); // Should work at top
    });

    it("should handle bounds checking for multi-row pieces", () => {
      const pieceBitRows = [0b1111111111, 0b1111111111]; // 2-row piece
      expect(canPlace(bitBoard, pieceBitRows, 19)).toBe(false); // Would exceed bottom
      expect(canPlace(bitBoard, pieceBitRows, 18)).toBe(false); // Would collide
      expect(canPlace(bitBoard, pieceBitRows, -1)).toBe(false); // Would exceed top
    });
  });

  describe("Piece Placement", () => {
    it("should place single-row pieces correctly", () => {
      const pieceBitRows = [0b0001111000]; // 4 bits in middle
      bitBoard = place(bitBoard, pieceBitRows, 10);

      expect(getRowBits(bitBoard, 10)).toBe(0b0001111000);
      expect(countOccupiedCells(bitBoard)).toBe(4);
    });

    it("should place multi-row pieces correctly", () => {
      const pieceBitRows = [
        0b0011000000, // Top row
        0b0011000000, // Bottom row
      ];
      bitBoard = place(bitBoard, pieceBitRows, 15);

      expect(getRowBits(bitBoard, 15)).toBe(0b0011000000);
      expect(getRowBits(bitBoard, 16)).toBe(0b0011000000);
      expect(countOccupiedCells(bitBoard)).toBe(4);
    });

    it("should combine with existing pieces using OR operation", () => {
      bitBoard = setRowBits(bitBoard, 10, 0b1100000000); // Existing pieces
      const pieceBitRows = [0b0011000000]; // New piece
      bitBoard = place(bitBoard, pieceBitRows, 10);

      expect(getRowBits(bitBoard, 10)).toBe(0b1111000000); // Combined
    });

    it("should skip empty rows during placement", () => {
      const pieceBitRows = [0b0000000000, 0b1111000000, 0b0000000000];
      bitBoard = place(bitBoard, pieceBitRows, 5);

      expect(getRowBits(bitBoard, 5)).toBe(0);
      expect(getRowBits(bitBoard, 6)).toBe(0b1111000000);
      expect(getRowBits(bitBoard, 7)).toBe(0);
      expect(countOccupiedCells(bitBoard)).toBe(4);
    });

    it("should throw error for invalid placement in debug mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const pieceBitRows = [0b1111111111];
      expect(() => place(bitBoard, pieceBitRows, 20)).toThrow(); // Out of bounds

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("Line Clearing", () => {
    it("should detect and clear single full line", () => {
      bitBoard = setRowBits(bitBoard, 19, 0b1111111111); // Full bottom row
      bitBoard = setRowBits(bitBoard, 18, 0b1100000000); // Partial row above

      const result = clearLines(bitBoard);
      expect(result.clearedLines).toEqual([19]);
      bitBoard = result.board;
      expect(getRowBits(bitBoard, 19)).toBe(0b1100000000); // Partial row moved down
      expect(getRowBits(bitBoard, 18)).toBe(0); // Empty after moving
    });

    it("should clear multiple full lines", () => {
      bitBoard = setRowBits(bitBoard, 19, 0b1111111111); // Full
      bitBoard = setRowBits(bitBoard, 18, 0b1111111111); // Full
      bitBoard = setRowBits(bitBoard, 17, 0b1100000000); // Partial
      bitBoard = setRowBits(bitBoard, 16, 0b1111111111); // Full

      const result = clearLines(bitBoard);
      expect(result.clearedLines.sort()).toEqual([16, 18, 19]);
      bitBoard = result.board;
      expect(getRowBits(bitBoard, 19)).toBe(0b1100000000); // Partial row at bottom
      expect(getRowBits(bitBoard, 18)).toBe(0); // Empty
      expect(getRowBits(bitBoard, 17)).toBe(0); // Empty
    });

    it("should handle no full lines", () => {
      bitBoard = setRowBits(bitBoard, 19, 0b1111111110); // Missing one bit
      bitBoard = setRowBits(bitBoard, 18, 0b1100000000); // Partial

      const result = clearLines(bitBoard);
      expect(result.clearedLines).toEqual([]);
      expect(getRowBits(bitBoard, 19)).toBe(0b1111111110); // Unchanged
      expect(getRowBits(bitBoard, 18)).toBe(0b1100000000); // Unchanged
    });

    it("should clear all lines if board is full", () => {
      // Fill entire board
      for (let y = 0; y < 20; y++) {
        bitBoard = setRowBits(bitBoard, y, 0b1111111111);
      }

      const result = clearLines(bitBoard);
      expect(result.clearedLines.length).toBe(20);
      bitBoard = result.board;
      expect(countOccupiedCells(bitBoard)).toBe(0);
      expect(calculateHeight(bitBoard)).toBe(0);
    });
  });

  describe("Board State Conversion", () => {
    it("should convert to GameBoard format correctly", () => {
      bitBoard = setRowBits(bitBoard, 19, 0b1010000000); // Bits at positions 7 and 9
      bitBoard = setRowBits(bitBoard, 18, 0b0101000000); // Bits at positions 6 and 8

      const gameBoard = toBoardState(bitBoard);
      expect(gameBoard[19][7]).toBe(1); // Bit 7 is set
      expect(gameBoard[19][8]).toBe(0); // Bit 8 is not set
      expect(gameBoard[19][9]).toBe(1); // Bit 9 is set
      expect(gameBoard[18][6]).toBe(1); // Bit 6 is set
      expect(gameBoard[18][7]).toBe(0); // Bit 7 is not set
      expect(gameBoard[18][8]).toBe(1); // Bit 8 is set
    });

    it("should initialize from GameBoard correctly", () => {
      const gameBoard: GameBoard = createEmptyBoard();
      gameBoard[10][3] = 5; // Any non-zero value
      gameBoard[10][7] = 2; // Different non-zero value
      gameBoard[5][0] = 1;

      bitBoard = fromBoardState(bitBoard, gameBoard);
      expect(getRowBits(bitBoard, 10)).toBe(0b0010001000); // Bits at positions 3 and 7
      expect(getRowBits(bitBoard, 5)).toBe(0b0000000001); // Bit at position 0
      expect(countOccupiedCells(bitBoard)).toBe(3);
    });

    it("should handle invalid board dimensions", () => {
      const invalidBoard = [[1, 2, 3]]; // Wrong dimensions
      expect(() => fromBoardState(bitBoard, invalidBoard as unknown as GameBoard)).toThrow();
    });

    it("should preserve occupancy but lose color information", () => {
      const gameBoard: GameBoard = createEmptyBoard();
      gameBoard[15][5] = 7; // Color 7

      bitBoard = fromBoardState(bitBoard, gameBoard);
      const converted = toBoardState(bitBoard);

      expect(converted[15][5]).toBe(1); // Converted to standard occupancy
    });
  });

  describe("Utility Methods", () => {
    beforeEach(() => {
      // Create a test board with known pattern
      bitBoard = setRowBits(bitBoard, 19, 0b1111111111); // Full bottom row
      bitBoard = setRowBits(bitBoard, 18, 0b1100000000); // 2 pieces in second row
      bitBoard = setRowBits(bitBoard, 15, 0b0000001000); // 1 piece higher up
    });

    it("should calculate board height correctly", () => {
      expect(calculateHeight(bitBoard)).toBe(5); // From row 15 to 19 = 5 rows
    });

    it("should count occupied cells correctly", () => {
      expect(countOccupiedCells(bitBoard)).toBe(13); // 10 + 2 + 1
    });

    it("should detect game over state", () => {
      expect(isGameOver(bitBoard)).toBe(false);

      bitBoard = setRowBits(bitBoard, 0, 0b0000001000); // Place piece in top row
      expect(isGameOver(bitBoard)).toBe(true);
    });

    it("should clone board correctly", () => {
      const cloned = clone(bitBoard);
      expect(calculateHeight(cloned)).toBe(calculateHeight(bitBoard));
      expect(countOccupiedCells(cloned)).toBe(countOccupiedCells(bitBoard));

      // Verify independence
      const modified = setRowBits(cloned, 10, 0b1111111111);
      expect(getRowBits(bitBoard, 10)).toBe(0); // Original unchanged
      expect(getRowBits(modified, 10)).toBe(0b1111111111); // Clone modified
    });

    it("should clear board completely", () => {
      bitBoard = clear(bitBoard);
      expect(calculateHeight(bitBoard)).toBe(0);
      expect(countOccupiedCells(bitBoard)).toBe(0);
      expect(isGameOver(bitBoard)).toBe(false);
    });
  });

  describe("Property-Based Tests", () => {
    it("should maintain bit count invariant during placement", () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 0b1111111111 }), { minLength: 1, maxLength: 4 }),
          fc.integer({ min: 0, max: 16 }),
          (pieceBitRows, startY) => {
            let board = createBitBoard();
            const expectedBits = pieceBitRows.reduce((sum, rowBits) => {
              let count = 0;
              let bits = rowBits;
              while (bits) {
                count++;
                bits &= bits - 1; // Clear lowest bit
              }
              return sum + count;
            }, 0);

            if (startY + pieceBitRows.length <= 20) {
              board = place(board, pieceBitRows, startY);
              expect(countOccupiedCells(board)).toBe(expectedBits);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should preserve collision detection consistency", () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 1, max: 0b1111111111 }), { minLength: 1, maxLength: 4 }),
          fc.integer({ min: 0, max: 16 }),
          (pieceBitRows, startY) => {
            let board = createBitBoard();

            if (startY + pieceBitRows.length <= 20) {
              const canPlaceBefore = canPlace(board, pieceBitRows, startY);
              if (canPlaceBefore) {
                board = place(board, pieceBitRows, startY);
                // After placing, the same piece should not be placeable
                const canPlaceAfter = canPlace(board, pieceBitRows, startY);
                expect(canPlaceAfter).toBe(false);
              }
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should maintain line clearing invariants", () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 0b1111111111 }), { minLength: 20, maxLength: 20 }),
          (rowBits) => {
            let board = createBitBoard();

            // Set up board
            let fullLines = 0;
            for (let y = 0; y < 20; y++) {
              board = setRowBits(board, y, rowBits[y]);
              if (rowBits[y] === 0b1111111111) {
                fullLines++;
              }
            }

            const result = clearLines(board);
            expect(result.clearedLines.length).toBe(fullLines);
            board = result.board;

            // After clearing, no row should be full
            for (let y = 0; y < 20; y++) {
              expect(getRowBits(board, y)).not.toBe(0b1111111111);
            }
          },
        ),
        { numRuns: 50 },
      );
    });

    it("should maintain conversion roundtrip consistency", () => {
      fc.assert(
        fc.property(
          fc.array(fc.array(fc.integer({ min: 0, max: 7 }), { minLength: 10, maxLength: 10 }), {
            minLength: 20,
            maxLength: 20,
          }),
          (gameBoard) => {
            const bitBoardData = createBitBoard(gameBoard as GameBoard);
            const converted = toBoardState(bitBoardData);

            // Count occupancy should match
            let originalOccupied = 0;
            let convertedOccupied = 0;

            for (let y = 0; y < 20; y++) {
              for (let x = 0; x < 10; x++) {
                if (gameBoard[y][x] !== 0) originalOccupied++;
                if (converted[y][x] !== 0) convertedOccupied++;
              }
            }

            expect(convertedOccupied).toBe(originalOccupied);
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty board operations", () => {
      expect(clearLines(bitBoard).clearedLines).toEqual([]);
      expect(canPlace(bitBoard, [], 0)).toBe(true);
      expect(calculateHeight(bitBoard)).toBe(0);
    });

    it("should handle maximum bit patterns", () => {
      const maxBits = 0b1111111111; // All 10 bits set
      bitBoard = setRowBits(bitBoard, 10, maxBits);
      expect(getRowBits(bitBoard, 10)).toBe(maxBits);
      expect(countOccupiedCells(bitBoard)).toBe(10);
    });

    it("should handle large piece placements", () => {
      const largePiece = Array(20).fill(0b1111111111); // 20 rows, all full
      expect(canPlace(bitBoard, largePiece, 0)).toBe(true);

      bitBoard = place(bitBoard, largePiece, 0);
      expect(countOccupiedCells(bitBoard)).toBe(200); // 20 * 10
    });
  });

  describe("Performance Characteristics", () => {
    it("should complete operations within reasonable time", () => {
      const start = performance.now();

      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        const testBits = [0b1111000000];
        canPlace(bitBoard, testBits, i % 19);
      }

      const end = performance.now();
      const timeMs = end - start;

      // Should complete 1000 operations in less than 10ms on modern hardware
      expect(timeMs).toBeLessThan(10);
    });

    it("should handle memory efficiently with many clones", () => {
      const clones: BitBoardData[] = [];

      // Create many clones
      for (let i = 0; i < 100; i++) {
        clones.push(clone(bitBoard));
      }

      // All clones should be independent
      const modifiedClone = setRowBits(clones[0], 0, 0b1111111111);
      expect(getRowBits(bitBoard, 0)).toBe(0);
      expect(getRowBits(clones[1], 0)).toBe(0);
      expect(getRowBits(modifiedClone, 0)).toBe(0b1111111111);
    });
  });
});

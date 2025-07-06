import { beforeEach, describe, expect, it } from "bun:test";
import fc from "fast-check";
import { createEmptyBoard } from "@/game/board";
import type { GameBoard } from "@/types/game";
import { BitBoard } from "./bitboard";

describe("BitBoard", () => {
  let bitBoard: BitBoard;

  beforeEach(() => {
    bitBoard = new BitBoard();
  });

  describe("Basic Construction and Properties", () => {
    it("should create empty BitBoard by default", () => {
      expect(bitBoard.calculateHeight()).toBe(0);
      expect(bitBoard.countOccupiedCells()).toBe(0);
      expect(bitBoard.isGameOver()).toBe(false);
    });

    it("should initialize from existing GameBoard", () => {
      const gameBoard: GameBoard = createEmptyBoard();
      gameBoard[19][0] = 1; // Place piece at bottom
      gameBoard[19][9] = 1; // Place piece at bottom right

      const bitBoardFromGame = new BitBoard(gameBoard);
      expect(bitBoardFromGame.countOccupiedCells()).toBe(2);
      expect(bitBoardFromGame.calculateHeight()).toBe(1);
    });

    it("should return correct dimensions", () => {
      const dimensions = bitBoard.getDimensions();
      expect(dimensions.width).toBe(10);
      expect(dimensions.height).toBe(20);
    });
  });

  describe("Row-level Operations", () => {
    it("should set and get row bits correctly", () => {
      const testBits = 0b1010101010; // Alternating pattern
      bitBoard.setRowBits(10, testBits);
      expect(bitBoard.getRowBits(10)).toBe(testBits);
    });

    it("should mask invalid bits when setting row", () => {
      const invalidBits = 0b11111111111111111; // More than 10 bits
      bitBoard.setRowBits(5, invalidBits);
      const maskedBits = bitBoard.getRowBits(5);
      expect(maskedBits).toBe(0b1111111111); // Only 10 bits should remain
    });

    it("should throw error for invalid row indices", () => {
      expect(() => bitBoard.getRowBits(-1)).toThrow();
      expect(() => bitBoard.getRowBits(20)).toThrow();
      expect(() => bitBoard.setRowBits(-1, 0)).toThrow();
      expect(() => bitBoard.setRowBits(20, 0)).toThrow();
    });
  });

  describe("Collision Detection", () => {
    beforeEach(() => {
      // Set up a test board with some occupied cells
      bitBoard.setRowBits(19, 0b1111000000); // Bottom row, left 4 cells occupied
      bitBoard.setRowBits(18, 0b1100000000); // Second row, left 2 cells occupied
    });

    it("should detect collision with single row", () => {
      const pieceBits = 0b1000000000; // Single bit at leftmost position
      expect(bitBoard.canPlaceRow(pieceBits, 19)).toBe(false); // Collision
      expect(bitBoard.canPlaceRow(pieceBits, 17)).toBe(true); // No collision
    });

    it("should handle out-of-bounds placement", () => {
      const pieceBits = 0b1000000000;
      expect(bitBoard.canPlaceRow(pieceBits, -1)).toBe(false);
      expect(bitBoard.canPlaceRow(pieceBits, 20)).toBe(false);
    });

    it("should detect multi-row collision", () => {
      const pieceBitRows = [0b1000000000, 0b1000000000]; // Two rows, same pattern
      expect(bitBoard.canPlace(pieceBitRows, 18)).toBe(false); // Would collide
      expect(bitBoard.canPlace(pieceBitRows, 16)).toBe(true); // No collision
    });

    it("should handle empty piece rows", () => {
      const pieceBitRows = [0b0000000000, 0b1111111111, 0b0000000000]; // Empty, full, empty
      expect(bitBoard.canPlace(pieceBitRows, 0)).toBe(true); // Should work at top
    });

    it("should handle bounds checking for multi-row pieces", () => {
      const pieceBitRows = [0b1111111111, 0b1111111111]; // 2-row piece
      expect(bitBoard.canPlace(pieceBitRows, 19)).toBe(false); // Would exceed bottom
      expect(bitBoard.canPlace(pieceBitRows, 18)).toBe(false); // Would collide
      expect(bitBoard.canPlace(pieceBitRows, -1)).toBe(false); // Would exceed top
    });
  });

  describe("Piece Placement", () => {
    it("should place single-row pieces correctly", () => {
      const pieceBitRows = [0b0001111000]; // 4 bits in middle
      bitBoard.place(pieceBitRows, 10);

      expect(bitBoard.getRowBits(10)).toBe(0b0001111000);
      expect(bitBoard.countOccupiedCells()).toBe(4);
    });

    it("should place multi-row pieces correctly", () => {
      const pieceBitRows = [
        0b0011000000, // Top row
        0b0011000000, // Bottom row
      ];
      bitBoard.place(pieceBitRows, 15);

      expect(bitBoard.getRowBits(15)).toBe(0b0011000000);
      expect(bitBoard.getRowBits(16)).toBe(0b0011000000);
      expect(bitBoard.countOccupiedCells()).toBe(4);
    });

    it("should combine with existing pieces using OR operation", () => {
      bitBoard.setRowBits(10, 0b1100000000); // Existing pieces
      const pieceBitRows = [0b0011000000]; // New piece
      bitBoard.place(pieceBitRows, 10);

      expect(bitBoard.getRowBits(10)).toBe(0b1111000000); // Combined
    });

    it("should skip empty rows during placement", () => {
      const pieceBitRows = [0b0000000000, 0b1111000000, 0b0000000000];
      bitBoard.place(pieceBitRows, 5);

      expect(bitBoard.getRowBits(5)).toBe(0);
      expect(bitBoard.getRowBits(6)).toBe(0b1111000000);
      expect(bitBoard.getRowBits(7)).toBe(0);
      expect(bitBoard.countOccupiedCells()).toBe(4);
    });

    it("should throw error for invalid placement in debug mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const pieceBitRows = [0b1111111111];
      expect(() => bitBoard.place(pieceBitRows, 20)).toThrow(); // Out of bounds

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("Line Clearing", () => {
    it("should detect and clear single full line", () => {
      bitBoard.setRowBits(19, 0b1111111111); // Full bottom row
      bitBoard.setRowBits(18, 0b1100000000); // Partial row above

      const clearedLines = bitBoard.clearLines();
      expect(clearedLines).toEqual([19]);
      expect(bitBoard.getRowBits(19)).toBe(0b1100000000); // Partial row moved down
      expect(bitBoard.getRowBits(18)).toBe(0); // Empty after moving
    });

    it("should clear multiple full lines", () => {
      bitBoard.setRowBits(19, 0b1111111111); // Full
      bitBoard.setRowBits(18, 0b1111111111); // Full
      bitBoard.setRowBits(17, 0b1100000000); // Partial
      bitBoard.setRowBits(16, 0b1111111111); // Full

      const clearedLines = bitBoard.clearLines();
      expect(clearedLines.sort()).toEqual([16, 18, 19]);
      expect(bitBoard.getRowBits(19)).toBe(0b1100000000); // Partial row at bottom
      expect(bitBoard.getRowBits(18)).toBe(0); // Empty
      expect(bitBoard.getRowBits(17)).toBe(0); // Empty
    });

    it("should handle no full lines", () => {
      bitBoard.setRowBits(19, 0b1111111110); // Missing one bit
      bitBoard.setRowBits(18, 0b1100000000); // Partial

      const clearedLines = bitBoard.clearLines();
      expect(clearedLines).toEqual([]);
      expect(bitBoard.getRowBits(19)).toBe(0b1111111110); // Unchanged
      expect(bitBoard.getRowBits(18)).toBe(0b1100000000); // Unchanged
    });

    it("should clear all lines if board is full", () => {
      // Fill entire board
      for (let y = 0; y < 20; y++) {
        bitBoard.setRowBits(y, 0b1111111111);
      }

      const clearedLines = bitBoard.clearLines();
      expect(clearedLines.length).toBe(20);
      expect(bitBoard.countOccupiedCells()).toBe(0);
      expect(bitBoard.calculateHeight()).toBe(0);
    });
  });

  describe("Board State Conversion", () => {
    it("should convert to GameBoard format correctly", () => {
      bitBoard.setRowBits(19, 0b1010000000); // Bits at positions 7 and 9
      bitBoard.setRowBits(18, 0b0101000000); // Bits at positions 6 and 8

      const gameBoard = bitBoard.toBoardState();
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

      bitBoard.fromBoardState(gameBoard);
      expect(bitBoard.getRowBits(10)).toBe(0b0010001000); // Bits at positions 3 and 7
      expect(bitBoard.getRowBits(5)).toBe(0b0000000001); // Bit at position 0
      expect(bitBoard.countOccupiedCells()).toBe(3);
    });

    it("should handle invalid board dimensions", () => {
      const invalidBoard = [[1, 2, 3]]; // Wrong dimensions
      expect(() => bitBoard.fromBoardState(invalidBoard as unknown as GameBoard)).toThrow();
    });

    it("should preserve occupancy but lose color information", () => {
      const gameBoard: GameBoard = createEmptyBoard();
      gameBoard[15][5] = 7; // Color 7

      bitBoard.fromBoardState(gameBoard);
      const converted = bitBoard.toBoardState();

      expect(converted[15][5]).toBe(1); // Converted to standard occupancy
    });
  });

  describe("Utility Methods", () => {
    beforeEach(() => {
      // Create a test board with known pattern
      bitBoard.setRowBits(19, 0b1111111111); // Full bottom row
      bitBoard.setRowBits(18, 0b1100000000); // 2 pieces in second row
      bitBoard.setRowBits(15, 0b0000001000); // 1 piece higher up
    });

    it("should calculate board height correctly", () => {
      expect(bitBoard.calculateHeight()).toBe(5); // From row 15 to 19 = 5 rows
    });

    it("should count occupied cells correctly", () => {
      expect(bitBoard.countOccupiedCells()).toBe(13); // 10 + 2 + 1
    });

    it("should detect game over state", () => {
      expect(bitBoard.isGameOver()).toBe(false);

      bitBoard.setRowBits(0, 0b0000001000); // Place piece in top row
      expect(bitBoard.isGameOver()).toBe(true);
    });

    it("should clone board correctly", () => {
      const cloned = bitBoard.clone();
      expect(cloned.calculateHeight()).toBe(bitBoard.calculateHeight());
      expect(cloned.countOccupiedCells()).toBe(bitBoard.countOccupiedCells());

      // Verify independence
      cloned.setRowBits(10, 0b1111111111);
      expect(bitBoard.getRowBits(10)).toBe(0); // Original unchanged
    });

    it("should clear board completely", () => {
      bitBoard.clear();
      expect(bitBoard.calculateHeight()).toBe(0);
      expect(bitBoard.countOccupiedCells()).toBe(0);
      expect(bitBoard.isGameOver()).toBe(false);
    });
  });

  describe("Property-Based Tests", () => {
    it("should maintain bit count invariant during placement", () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 0, max: 0b1111111111 }), { minLength: 1, maxLength: 4 }),
          fc.integer({ min: 0, max: 16 }),
          (pieceBitRows, startY) => {
            const board = new BitBoard();
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
              board.place(pieceBitRows, startY);
              expect(board.countOccupiedCells()).toBe(expectedBits);
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
            const board = new BitBoard();

            if (startY + pieceBitRows.length <= 20) {
              const canPlaceBefore = board.canPlace(pieceBitRows, startY);
              if (canPlaceBefore) {
                board.place(pieceBitRows, startY);
                // After placing, the same piece should not be placeable
                const canPlaceAfter = board.canPlace(pieceBitRows, startY);
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
            const board = new BitBoard();

            // Set up board
            let fullLines = 0;
            for (let y = 0; y < 20; y++) {
              board.setRowBits(y, rowBits[y]);
              if (rowBits[y] === 0b1111111111) {
                fullLines++;
              }
            }

            const clearedLines = board.clearLines();
            expect(clearedLines.length).toBe(fullLines);

            // After clearing, no row should be full
            for (let y = 0; y < 20; y++) {
              expect(board.getRowBits(y)).not.toBe(0b1111111111);
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
            const bitBoard = new BitBoard(gameBoard as GameBoard);
            const converted = bitBoard.toBoardState();

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
      expect(bitBoard.clearLines()).toEqual([]);
      expect(bitBoard.canPlace([], 0)).toBe(true);
      expect(bitBoard.calculateHeight()).toBe(0);
    });

    it("should handle maximum bit patterns", () => {
      const maxBits = 0b1111111111; // All 10 bits set
      bitBoard.setRowBits(10, maxBits);
      expect(bitBoard.getRowBits(10)).toBe(maxBits);
      expect(bitBoard.countOccupiedCells()).toBe(10);
    });

    it("should handle large piece placements", () => {
      const largePiece = Array(20).fill(0b1111111111); // 20 rows, all full
      expect(bitBoard.canPlace(largePiece, 0)).toBe(true);

      bitBoard.place(largePiece, 0);
      expect(bitBoard.countOccupiedCells()).toBe(200); // 20 * 10
    });
  });

  describe("Performance Characteristics", () => {
    it("should complete operations within reasonable time", () => {
      const start = performance.now();

      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        const testBits = [0b1111000000];
        bitBoard.canPlace(testBits, i % 19);
      }

      const end = performance.now();
      const timeMs = end - start;

      // Should complete 1000 operations in less than 10ms on modern hardware
      expect(timeMs).toBeLessThan(10);
    });

    it("should handle memory efficiently with many clones", () => {
      const clones: BitBoard[] = [];

      // Create many clones
      for (let i = 0; i < 100; i++) {
        clones.push(bitBoard.clone());
      }

      // All clones should be independent
      clones[0].setRowBits(0, 0b1111111111);
      expect(bitBoard.getRowBits(0)).toBe(0);
      expect(clones[1].getRowBits(0)).toBe(0);
    });
  });
});

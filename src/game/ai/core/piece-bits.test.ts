import { describe, expect, it } from "bun:test";
import fc from "fast-check";
import { TETROMINOS } from "@/game/tetrominos";
import type { RotationState, TetrominoTypeName } from "@/types/game";
import {
  COMMON_PATTERNS,
  debugBitPattern,
  getActualPosition,
  getPieceBitPattern,
  getPieceBitsAtPosition,
  getPieceMetadata,
  isValidBounds,
  PIECE_BIT_PATTERNS,
} from "./piece-bits";

describe("Piece Bits", () => {
  const allPieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];
  const allRotations: RotationState[] = [0, 1, 2, 3];

  describe("Bit Pattern Generation", () => {
    it("should have patterns for all pieces and rotations", () => {
      for (const piece of allPieces) {
        expect(PIECE_BIT_PATTERNS[piece]).toBeDefined();
        expect(PIECE_BIT_PATTERNS[piece]).toHaveLength(4);

        for (const rotation of allRotations) {
          const pattern = PIECE_BIT_PATTERNS[piece][rotation];
          expect(pattern).toBeDefined();
          expect(pattern.rows).toBeDefined();
          expect(pattern.width).toBeGreaterThan(0);
          expect(pattern.height).toBeGreaterThan(0);
          expect(pattern.minX).toBeGreaterThanOrEqual(0);
          expect(pattern.minY).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it("should generate consistent patterns with original tetromino shapes", () => {
      for (const piece of allPieces) {
        const originalShape = TETROMINOS[piece];
        const pattern = getPieceBitPattern(piece, 0);

        // Count occupied cells in original shape
        let originalCells = 0;
        for (const row of originalShape) {
          for (const cell of row) {
            if (cell !== 0) originalCells++;
          }
        }

        // Count bits in pattern
        let patternCells = 0;
        for (const rowBits of pattern.rows) {
          let bits = rowBits;
          while (bits) {
            patternCells++;
            bits &= bits - 1; // Clear lowest bit
          }
        }

        expect(patternCells).toBe(originalCells);
      }
    });

    it("should have correct dimensions for known pieces", () => {
      // I-piece horizontal should be 4x1
      expect(getPieceBitPattern("I", 0).width).toBe(4);
      expect(getPieceBitPattern("I", 0).height).toBe(1);

      // I-piece vertical should be 1x4
      expect(getPieceBitPattern("I", 1).width).toBe(1);
      expect(getPieceBitPattern("I", 1).height).toBe(4);

      // O-piece should be 2x2 for all rotations
      for (const rotation of allRotations) {
        const pattern = getPieceBitPattern("O", rotation);
        expect(pattern.width).toBe(2);
        expect(pattern.height).toBe(2);
      }

      // T-piece should fit in 3x3 (but optimized dimensions may vary)
      for (const rotation of allRotations) {
        const pattern = getPieceBitPattern("T", rotation);
        expect(pattern.width).toBeLessThanOrEqual(3);
        expect(pattern.height).toBeLessThanOrEqual(3);
      }
    });

    it("should optimize away empty leading/trailing rows and columns", () => {
      // I-piece horizontal should not have leading empty rows
      const iHorizontal = getPieceBitPattern("I", 0);
      expect(iHorizontal.minY).toBe(1); // Original I-piece has empty row at top

      // All patterns should have at least one occupied cell in first/last row and column
      for (const piece of allPieces) {
        for (const rotation of allRotations) {
          const pattern = getPieceBitPattern(piece, rotation);

          // First row should have at least one bit set
          expect(pattern.rows[0]).toBeGreaterThan(0);

          // Last row should have at least one bit set
          expect(pattern.rows[pattern.rows.length - 1]).toBeGreaterThan(0);

          // First column should have at least one bit set across all rows
          let firstColumnOccupied = false;
          for (const rowBits of pattern.rows) {
            if (rowBits & 1) {
              firstColumnOccupied = true;
              break;
            }
          }
          expect(firstColumnOccupied).toBe(true);
        }
      }
    });
  });

  describe("Position-based Operations", () => {
    it("should shift piece bits correctly for different X positions", () => {
      const pattern = getPieceBitPattern("T", 0); // T-piece upward

      // At X=0, should return original pattern
      const bitsAtX0 = getPieceBitsAtPosition("T", 0, 0);
      expect(bitsAtX0).toEqual(pattern.rows);

      // At X=1, should shift all bits left by 1
      const bitsAtX1 = getPieceBitsAtPosition("T", 0, 1);
      expect(bitsAtX1).toEqual(pattern.rows.map((bits) => bits << 1));

      // At X=5, should shift all bits left by 5
      const bitsAtX5 = getPieceBitsAtPosition("T", 0, 5);
      expect(bitsAtX5).toEqual(pattern.rows.map((bits) => bits << 5));
    });

    it("should return empty array for out-of-bounds positions", () => {
      const bitsOutOfBounds = getPieceBitsAtPosition("I", 0, 7); // I-piece (width 4) at X=7 would exceed board
      expect(bitsOutOfBounds).toEqual([]);

      const bitsNegativeX = getPieceBitsAtPosition("O", 0, -1);
      expect(bitsNegativeX).toEqual([]);
    });

    it("should calculate actual positions correctly", () => {
      // Test with I-piece which has offset due to empty space in original shape
      const actualPos = getActualPosition("I", 0, 3, 5);
      const pattern = getPieceBitPattern("I", 0);

      expect(actualPos.x).toBe(3 + pattern.minX);
      expect(actualPos.y).toBe(5 + pattern.minY);
    });

    it("should validate bounds correctly", () => {
      // I-piece horizontal (4x1) at various positions
      expect(isValidBounds("I", 0, 0, 0)).toBe(true); // Top-left
      expect(isValidBounds("I", 0, 6, 0)).toBe(true); // Top-right (10-4=6)
      expect(isValidBounds("I", 0, 7, 0)).toBe(false); // Too far right
      expect(isValidBounds("I", 0, 0, 19)).toBe(true); // Bottom-left
      expect(isValidBounds("I", 0, 0, 20)).toBe(false); // Below board

      // I-piece vertical (1x4) at various positions
      expect(isValidBounds("I", 1, 9, 0)).toBe(true); // Top-right corner
      expect(isValidBounds("I", 1, 10, 0)).toBe(false); // Too far right
      expect(isValidBounds("I", 1, 0, 16)).toBe(true); // Bottom (20-4=16)
      expect(isValidBounds("I", 1, 0, 17)).toBe(false); // Too far down
    });
  });

  describe("Piece Metadata", () => {
    it("should provide correct metadata for all pieces", () => {
      for (const piece of allPieces) {
        for (const rotation of allRotations) {
          const metadata = getPieceMetadata(piece, rotation);

          expect(metadata.width).toBeGreaterThan(0);
          expect(metadata.height).toBeGreaterThan(0);
          expect(metadata.cellCount).toBe(4); // All tetrominos have exactly 4 cells
          expect(metadata.minX).toBeGreaterThanOrEqual(0);
          expect(metadata.minY).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it("should maintain cell count of 4 for all pieces and rotations", () => {
      for (const piece of allPieces) {
        for (const rotation of allRotations) {
          const metadata = getPieceMetadata(piece, rotation);
          expect(metadata.cellCount).toBe(4);
        }
      }
    });

    it("should have consistent dimensions with bit patterns", () => {
      for (const piece of allPieces) {
        for (const rotation of allRotations) {
          const pattern = getPieceBitPattern(piece, rotation);
          const metadata = getPieceMetadata(piece, rotation);

          expect(metadata.width).toBe(pattern.width);
          expect(metadata.height).toBe(pattern.height);
          expect(metadata.minX).toBe(pattern.minX);
          expect(metadata.minY).toBe(pattern.minY);
        }
      }
    });
  });

  describe("Debug Functionality", () => {
    it("should generate valid debug strings for all pieces", () => {
      for (const piece of allPieces) {
        for (const rotation of allRotations) {
          const debugStr = debugBitPattern(piece, rotation);

          expect(debugStr).toContain(piece);
          expect(debugStr).toContain(rotation.toString());
          expect(debugStr).toContain("Size:");
          expect(debugStr).toContain("Offset:");

          // Should contain visual representation
          expect(debugStr).toMatch(/[█·]/); // Should contain either filled or empty blocks
        }
      }
    });

    it("should show correct bit patterns in debug output", () => {
      const debugStr = debugBitPattern("O", 0);

      // O-piece should show 2x2 square
      expect(debugStr).toContain("██"); // Two filled blocks

      // Should appear twice (two rows)
      const filledRows = debugStr.split("\n").filter((line) => line.includes("██"));
      expect(filledRows.length).toBe(2);
    });
  });

  describe("Common Patterns", () => {
    it("should have all expected common patterns", () => {
      expect(COMMON_PATTERNS.I_HORIZONTAL).toBeDefined();
      expect(COMMON_PATTERNS.I_VERTICAL).toBeDefined();
      expect(COMMON_PATTERNS.T_UP).toBeDefined();
      expect(COMMON_PATTERNS.T_RIGHT).toBeDefined();
      expect(COMMON_PATTERNS.T_DOWN).toBeDefined();
      expect(COMMON_PATTERNS.T_LEFT).toBeDefined();
      expect(COMMON_PATTERNS.O_SQUARE).toBeDefined();
    });

    it("should match corresponding patterns from PIECE_BIT_PATTERNS", () => {
      expect(COMMON_PATTERNS.I_HORIZONTAL).toBe(PIECE_BIT_PATTERNS.I[0]);
      expect(COMMON_PATTERNS.I_VERTICAL).toBe(PIECE_BIT_PATTERNS.I[1]);
      expect(COMMON_PATTERNS.T_UP).toBe(PIECE_BIT_PATTERNS.T[0]);
      expect(COMMON_PATTERNS.T_RIGHT).toBe(PIECE_BIT_PATTERNS.T[1]);
      expect(COMMON_PATTERNS.T_DOWN).toBe(PIECE_BIT_PATTERNS.T[2]);
      expect(COMMON_PATTERNS.T_LEFT).toBe(PIECE_BIT_PATTERNS.T[3]);
      expect(COMMON_PATTERNS.O_SQUARE).toBe(PIECE_BIT_PATTERNS.O[0]);
    });
  });

  describe("Property-Based Tests", () => {
    it("should maintain rotational consistency", () => {
      fc.assert(
        fc.property(fc.constantFrom(...allPieces), (piece) => {
          // O-piece should have identical patterns for all rotations
          if (piece === "O") {
            const pattern0 = getPieceBitPattern(piece, 0);
            for (const rotation of allRotations) {
              const pattern = getPieceBitPattern(piece, rotation);
              expect(pattern.rows).toEqual(pattern0.rows);
            }
          }

          // S and Z pieces should have identical patterns for rotations 0/2 and 1/3
          if (piece === "S" || piece === "Z") {
            const pattern0 = getPieceBitPattern(piece, 0);
            const pattern2 = getPieceBitPattern(piece, 2);
            expect(pattern0.rows).toEqual(pattern2.rows);

            const pattern1 = getPieceBitPattern(piece, 1);
            const pattern3 = getPieceBitPattern(piece, 3);
            expect(pattern1.rows).toEqual(pattern3.rows);
          }
        }),
        { numRuns: 20 },
      );
    });

    it("should maintain bit count invariant across all operations", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...allPieces),
          fc.constantFrom(...allRotations),
          fc.integer({ min: 0, max: 9 }),
          (piece, rotation, x) => {
            const pattern = getPieceBitPattern(piece, rotation);
            const originalBitCount = pattern.rows.reduce((sum, rowBits) => {
              let count = 0;
              let bits = rowBits;
              while (bits) {
                count++;
                bits &= bits - 1;
              }
              return sum + count;
            }, 0);

            const bitsAtPosition = getPieceBitsAtPosition(piece, rotation, x);
            if (bitsAtPosition.length > 0) {
              const shiftedBitCount = bitsAtPosition.reduce((sum, rowBits) => {
                let count = 0;
                let bits = rowBits;
                while (bits) {
                  count++;
                  bits &= bits - 1;
                }
                return sum + count;
              }, 0);

              expect(shiftedBitCount).toBe(originalBitCount);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should maintain bounds consistency", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...allPieces),
          fc.constantFrom(...allRotations),
          fc.integer({ min: -2, max: 12 }),
          fc.integer({ min: -2, max: 22 }),
          (piece, rotation, x, y) => {
            const isValid = isValidBounds(piece, rotation, x, y);
            const pattern = getPieceBitPattern(piece, rotation);

            const expectedValid =
              x >= 0 && y >= 0 && x + pattern.width <= 10 && y + pattern.height <= 20;

            expect(isValid).toBe(expectedValid);
          },
        ),
        { numRuns: 200 },
      );
    });

    it("should have consistent actual position calculations", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...allPieces),
          fc.constantFrom(...allRotations),
          fc.integer({ min: 0, max: 9 }),
          fc.integer({ min: 0, max: 19 }),
          (piece, rotation, x, y) => {
            const actualPos = getActualPosition(piece, rotation, x, y);
            const pattern = getPieceBitPattern(piece, rotation);

            expect(actualPos.x).toBe(x + pattern.minX);
            expect(actualPos.y).toBe(y + pattern.minY);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero-width scenarios gracefully", () => {
      // This shouldn't happen with valid tetrominos, but test robustness
      for (const piece of allPieces) {
        for (const rotation of allRotations) {
          const pattern = getPieceBitPattern(piece, rotation);
          expect(pattern.width).toBeGreaterThan(0);
          expect(pattern.height).toBeGreaterThan(0);
        }
      }
    });

    it("should handle maximum board positions", () => {
      // Test pieces at the edge of the board
      expect(isValidBounds("I", 0, 6, 19)).toBe(true); // I-horizontal at bottom-right
      expect(isValidBounds("I", 0, 7, 19)).toBe(false); // Just over the edge
      expect(isValidBounds("I", 1, 9, 16)).toBe(true); // I-vertical at bottom-right
      expect(isValidBounds("I", 1, 9, 17)).toBe(false); // Just over the edge
    });

    it("should handle all piece types consistently", () => {
      for (const piece of allPieces) {
        // Test that all rotations produce valid patterns
        for (const rotation of allRotations) {
          const pattern = getPieceBitPattern(piece, rotation);
          expect(pattern.rows.length).toBe(pattern.height);
          expect(pattern.rows.every((row) => row >= 0)).toBe(true);
          expect(pattern.rows.every((row) => row < 1 << pattern.width)).toBe(true);
        }
      }
    });
  });

  describe("Performance Tests", () => {
    it("should access patterns efficiently", () => {
      const start = performance.now();

      // Access all patterns many times
      for (let i = 0; i < 1000; i++) {
        for (const piece of allPieces) {
          for (const rotation of allRotations) {
            getPieceBitPattern(piece, rotation);
          }
        }
      }

      const end = performance.now();
      const timeMs = end - start;

      // Should be very fast (pre-computed lookup)
      expect(timeMs).toBeLessThan(50);
    });

    it("should generate position bits efficiently", () => {
      const start = performance.now();

      // Generate bits at many positions
      for (let i = 0; i < 1000; i++) {
        getPieceBitsAtPosition("T", 0, i % 8);
      }

      const end = performance.now();
      const timeMs = end - start;

      // Should complete 1000 operations quickly
      expect(timeMs).toBeLessThan(20);
    });
  });
});

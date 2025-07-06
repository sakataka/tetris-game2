import { beforeEach, describe, expect, it } from "bun:test";
import fc from "fast-check";
import { createEmptyBoard } from "@/game/board";
import type { Position, RotationState, TetrominoTypeName } from "@/types/game";
import { BitBoard } from "./bitboard";
import {
  CollisionDetector,
  canPlacePiece,
  findPieceDropPosition,
  getAllValidPositions,
  getCollisionDetector,
  resetCollisionDetector,
} from "./collision-detection";

describe("Collision Detection", () => {
  let detector: CollisionDetector;
  let bitBoard: BitBoard;

  beforeEach(() => {
    detector = new CollisionDetector(false); // Disable metrics for faster tests
    bitBoard = new BitBoard();
    resetCollisionDetector(); // Ensure clean state
  });

  describe("Basic Collision Detection", () => {
    it("should detect valid placement on empty board", () => {
      const result = detector.canPlace(bitBoard, "T", 0, 3, 0);
      expect(result.canPlace).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should detect collision with existing pieces", () => {
      // Place some pieces on the board
      bitBoard.setRowBits(19, 0b0000001111); // Bottom row, left 4 cells occupied (bits 0-3)

      const result = detector.canPlace(bitBoard, "I", 0, 0, 19); // I-piece horizontal at bottom-left
      expect(result.canPlace).toBe(false);
      expect(result.reason).toBe("collision");
    });

    it("should detect bounds violations", () => {
      // Test X bounds
      expect(detector.canPlace(bitBoard, "I", 0, 7, 0).canPlace).toBe(false); // I-piece (width 4) at X=7
      expect(detector.canPlace(bitBoard, "I", 0, -1, 0).canPlace).toBe(false); // Negative X

      // Test Y bounds
      expect(detector.canPlace(bitBoard, "I", 1, 0, 17).canPlace).toBe(false); // I-piece vertical (height 4) at Y=17
      expect(detector.canPlace(bitBoard, "I", 1, 0, -1).canPlace).toBe(false); // Negative Y
    });

    it("should handle different piece types correctly", () => {
      const pieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];

      for (const piece of pieces) {
        const result = detector.canPlace(bitBoard, piece, 0, 3, 0);
        expect(result.canPlace).toBe(true);
      }
    });

    it("should handle all rotation states", () => {
      const rotations: RotationState[] = [0, 1, 2, 3];

      for (const rotation of rotations) {
        const result = detector.canPlace(bitBoard, "T", rotation, 3, 0);
        expect(result.canPlace).toBe(true);
      }
    });
  });

  describe("Batch Collision Detection", () => {
    it("should process multiple positions efficiently", () => {
      const positions: Position[] = [
        { x: 0, y: 0 },
        { x: 3, y: 0 },
        { x: 6, y: 0 },
        { x: 0, y: 10 },
      ];

      const results = detector.canPlaceBatch(bitBoard, "T", 0, positions);
      expect(results).toHaveLength(4);
      expect(results.every((r) => r.canPlace)).toBe(true);
    });

    it("should handle mixed valid/invalid positions", () => {
      // Add obstacles
      bitBoard.setRowBits(0, 0b0000000111); // Top row, left 3 cells occupied (bits 0-2)

      const positions: Position[] = [
        { x: 0, y: 0 }, // Should collide
        { x: 3, y: 0 }, // Should be valid
        { x: 8, y: 0 }, // Should be out of bounds for T-piece
      ];

      const results = detector.canPlaceBatch(bitBoard, "T", 0, positions);
      expect(results[0].canPlace).toBe(false);
      expect(results[1].canPlace).toBe(true);
      expect(results[2].canPlace).toBe(false);
    });
  });

  describe("Valid Position Finding", () => {
    it("should find all valid positions on empty board", () => {
      const validPositions = detector.findValidPositions(bitBoard, "T", 0);

      // T-piece in rotation 0 should fit in many positions
      expect(validPositions.length).toBeGreaterThan(0);

      // All returned positions should be valid
      for (const pos of validPositions) {
        const result = detector.canPlace(bitBoard, "T", 0, pos.x, pos.y);
        expect(result.canPlace).toBe(true);
      }
    });

    it("should find fewer positions with obstacles", () => {
      const emptyPositions = detector.findValidPositions(bitBoard, "T", 0);

      // Add obstacles
      for (let y = 15; y < 20; y++) {
        bitBoard.setRowBits(y, 0b1111111110); // Almost full bottom rows
      }

      const blockedPositions = detector.findValidPositions(bitBoard, "T", 0);
      expect(blockedPositions.length).toBeLessThan(emptyPositions.length);
    });

    it("should return empty array when no valid positions exist", () => {
      // Fill the entire board
      for (let y = 0; y < 20; y++) {
        bitBoard.setRowBits(y, 0b1111111111);
      }

      const validPositions = detector.findValidPositions(bitBoard, "T", 0);
      expect(validPositions).toEqual([]);
    });
  });

  describe("Drop Position Finding", () => {
    it("should find bottom position on empty board", () => {
      const dropY = detector.findDropPosition(bitBoard, "T", 0, 3);
      expect(dropY).not.toBeNull();
      expect(dropY).toBeGreaterThan(15); // Should be near bottom

      // Verify the position is actually valid
      if (dropY !== null) {
        const result = detector.canPlace(bitBoard, "T", 0, 3, dropY);
        expect(result.canPlace).toBe(true);

        // Verify the position below would not be valid (at the bottom or collision)
        if (dropY < 19) {
          const resultBelow = detector.canPlace(bitBoard, "T", 0, 3, dropY + 1);
          expect(resultBelow.canPlace).toBe(false);
        }
      }
    });

    it("should find correct position with obstacles", () => {
      // Place obstacle at bottom
      bitBoard.setRowBits(19, 0b0001111000); // Obstacle in middle
      bitBoard.setRowBits(18, 0b0001111000); // Two rows high

      const dropY = detector.findDropPosition(bitBoard, "T", 0, 3);
      expect(dropY).not.toBeNull();
      expect(dropY).toBeLessThan(18); // Should be above the obstacle
    });

    it("should return null for invalid X positions", () => {
      expect(detector.findDropPosition(bitBoard, "I", 0, 7)).toBeNull(); // I-piece too wide
      expect(detector.findDropPosition(bitBoard, "T", 0, -1)).toBeNull(); // Negative X
      expect(detector.findDropPosition(bitBoard, "T", 0, 10)).toBeNull(); // Beyond board
    });

    it("should return null when column is completely blocked", () => {
      // Fill column 3 completely (where I-piece vertical would be placed)
      for (let y = 0; y < 20; y++) {
        bitBoard.setRowBits(y, 0b0000001000); // Column 3 occupied (bit 3)
      }

      const dropY = detector.findDropPosition(bitBoard, "I", 1, 3); // I-piece vertical in blocked column
      expect(dropY).toBeNull();
    });
  });

  describe("Ghost Position Calculation", () => {
    it("should calculate ghost position correctly", () => {
      const currentPos = { x: 3, y: 5 };
      const ghostPos = detector.calculateGhostPosition(bitBoard, "T", 0, currentPos);

      expect(ghostPos).not.toBeNull();
      expect(ghostPos?.x).toBe(currentPos.x);
      expect(ghostPos?.y).toBeGreaterThanOrEqual(currentPos.y);
    });

    it("should handle current position at bottom", () => {
      const dropY = detector.findDropPosition(bitBoard, "T", 0, 3);
      if (dropY !== null) {
        const currentPos = { x: 3, y: dropY };
        const ghostPos = detector.calculateGhostPosition(bitBoard, "T", 0, currentPos);

        expect(ghostPos).not.toBeNull();
        expect(ghostPos?.x).toBe(currentPos.x);
        expect(ghostPos?.y).toBe(currentPos.y); // Should be same as current
      } else {
        expect(dropY).not.toBeNull(); // This test requires a valid drop position
      }
    });

    it("should return null when no drop position exists", () => {
      // Block the column
      for (let y = 0; y < 20; y++) {
        bitBoard.setRowBits(y, 0b0001111000); // Block where T-piece would go
      }

      const currentPos = { x: 3, y: 0 };
      const ghostPos = detector.calculateGhostPosition(bitBoard, "T", 0, currentPos);
      expect(ghostPos).toBeNull();
    });
  });

  describe("Convenience Functions", () => {
    it("should work with GameBoard input", () => {
      const gameBoard = createEmptyBoard();
      gameBoard[19][3] = 1; // Place obstacle

      const canPlace = canPlacePiece(gameBoard, "T", 0, 3, 19);
      expect(canPlace).toBe(false); // Should detect collision

      const canPlaceAbove = canPlacePiece(gameBoard, "T", 0, 3, 17);
      expect(canPlaceAbove).toBe(true); // Should be valid above obstacle
    });

    it("should work with BitBoard input", () => {
      bitBoard.setRowBits(19, 0b0001000000);

      const canPlace = canPlacePiece(bitBoard, "T", 0, 3, 19);
      expect(canPlace).toBe(false);
    });

    it("should find drop positions correctly", () => {
      const gameBoard = createEmptyBoard();
      gameBoard[18][3] = 1; // Obstacle at position 3
      gameBoard[18][4] = 1; // Obstacle at position 4 (T-piece spans multiple cells)

      const dropY = findPieceDropPosition(gameBoard, "T", 0, 3);
      expect(dropY).not.toBeNull();
      expect(dropY).toBeLessThanOrEqual(17); // Should be above the obstacle
    });

    it("should get all valid positions", () => {
      const gameBoard = createEmptyBoard();
      const positions = getAllValidPositions(gameBoard, "T", 0);

      expect(positions.length).toBeGreaterThan(0);
      expect(positions.every((pos) => canPlacePiece(gameBoard, "T", 0, pos.x, pos.y))).toBe(true);
    });
  });

  describe("Metrics Mode", () => {
    it("should provide metrics when enabled", () => {
      const metricsDetector = new CollisionDetector(true);
      const result = metricsDetector.canPlace(bitBoard, "T", 0, 3, 0);

      expect(result.metrics).toBeDefined();
      expect(result.metrics?.timeUs).toBeGreaterThanOrEqual(0);
      expect(result.metrics?.bitwiseOps).toBeGreaterThan(0);
    });

    it("should not provide metrics when disabled", () => {
      const result = detector.canPlace(bitBoard, "T", 0, 3, 0);
      expect(result.metrics).toBeUndefined();
    });
  });

  describe("Property-Based Tests", () => {
    it("should maintain collision consistency", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("I", "O", "T", "S", "Z", "J", "L" as const),
          fc.constantFrom(0, 1, 2, 3 as const),
          fc.integer({ min: 0, max: 9 }),
          fc.integer({ min: 0, max: 19 }),
          (piece, rotation, x, y) => {
            const board = new BitBoard();
            const result = detector.canPlace(board, piece, rotation, x, y);

            if (result.canPlace) {
              // If placement is valid, placing the piece should make the same position invalid
              // This requires generating the actual piece bits and placing them
              const validPositions = detector.findValidPositions(board, piece, rotation);
              const hasPosition = validPositions.some((pos) => pos.x === x && pos.y === y);
              expect(hasPosition).toBe(true);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should maintain drop position consistency", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("I", "O", "T", "S", "Z", "J", "L" as const),
          fc.constantFrom(0, 1, 2, 3 as const),
          fc.integer({ min: 0, max: 9 }),
          (piece, rotation, x) => {
            const board = new BitBoard();
            const dropY = detector.findDropPosition(board, piece, rotation, x);

            if (dropY !== null) {
              // Drop position should be valid
              const result = detector.canPlace(board, piece, rotation, x, dropY);
              expect(result.canPlace).toBe(true);

              // Position below should be invalid (if not at bottom)
              if (dropY < 19) {
                const resultBelow = detector.canPlace(board, piece, rotation, x, dropY + 1);
                expect(resultBelow.canPlace).toBe(false);
              }
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should maintain bounds checking consistency", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("I", "O", "T", "S", "Z", "J", "L" as const),
          fc.constantFrom(0, 1, 2, 3 as const),
          fc.integer({ min: -5, max: 15 }),
          fc.integer({ min: -5, max: 25 }),
          (piece, rotation, x, y) => {
            const board = new BitBoard();
            const result = detector.canPlace(board, piece, rotation, x, y);

            // If position is clearly out of bounds, should return bounds error
            if (x < 0 || y < 0 || x >= 10 || y >= 20) {
              if (!result.canPlace) {
                expect(result.reason).toBe("bounds");
              }
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("Performance Tests", () => {
    it("should perform collision detection quickly", () => {
      const start = performance.now();

      // Perform many collision checks
      for (let i = 0; i < 1000; i++) {
        detector.canPlace(bitBoard, "T", 0, i % 8, i % 18);
      }

      const end = performance.now();
      const timeMs = end - start;

      // Should complete 1000 operations in less than 5ms
      expect(timeMs).toBeLessThan(5);
    });

    it("should handle batch operations efficiently", () => {
      const positions: Position[] = [];
      for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 18; y++) {
          positions.push({ x, y });
        }
      }

      const start = performance.now();
      const results = detector.canPlaceBatch(bitBoard, "T", 0, positions);
      const end = performance.now();

      expect(results).toHaveLength(positions.length);
      expect(end - start).toBeLessThan(10); // Should be fast
    });

    it("should find valid positions quickly", () => {
      const start = performance.now();

      for (let i = 0; i < 100; i++) {
        detector.findValidPositions(bitBoard, "T", 0);
      }

      const end = performance.now();
      const timeMs = end - start;

      // Should complete 100 searches quickly
      expect(timeMs).toBeLessThan(50);
    });
  });

  describe("Edge Cases", () => {
    it("should handle completely filled board", () => {
      // Fill entire board
      for (let y = 0; y < 20; y++) {
        bitBoard.setRowBits(y, 0b1111111111);
      }

      for (const piece of ["I", "O", "T", "S", "Z", "J", "L"] as const) {
        const result = detector.canPlace(bitBoard, piece, 0, 0, 0);
        expect(result.canPlace).toBe(false);
        expect(result.reason).toBe("collision");
      }
    });

    it("should handle minimal space scenarios", () => {
      // Leave only small gaps - rightmost bit (position 0) is clear
      for (let y = 10; y < 20; y++) {
        bitBoard.setRowBits(y, 0b1111111110); // Missing rightmost bit (bit 0)
      }

      // I-piece vertical should fit in the gap at position 0
      const result = detector.canPlace(bitBoard, "I", 1, 0, 16);
      expect(result.canPlace).toBe(true);

      // But not horizontally (would need 4 consecutive cells)
      const resultHorizontal = detector.canPlace(bitBoard, "I", 0, 0, 19);
      expect(resultHorizontal.canPlace).toBe(false);
    });

    it("should handle single-cell gaps", () => {
      // Create single cell gaps
      bitBoard.setRowBits(19, 0b1111111101); // Gap at position 1

      // No standard tetromino should fit in a single cell
      for (const piece of ["I", "O", "T", "S", "Z", "J", "L"] as const) {
        for (const rotation of [0, 1, 2, 3] as const) {
          const result = detector.canPlace(bitBoard, piece, rotation, 1, 19);
          expect(result.canPlace).toBe(false);
        }
      }
    });
  });

  describe("Singleton Management", () => {
    it("should return same instance from getCollisionDetector", () => {
      const detector1 = getCollisionDetector();
      const detector2 = getCollisionDetector();
      expect(detector1).toBe(detector2);
    });

    it("should create new instance when metrics setting changes", () => {
      const detector1 = getCollisionDetector(false);
      const detector2 = getCollisionDetector(true);
      expect(detector1).not.toBe(detector2);
    });

    it("should reset properly", () => {
      const detector1 = getCollisionDetector();
      resetCollisionDetector();
      const detector2 = getCollisionDetector();
      expect(detector1).not.toBe(detector2);
    });
  });
});

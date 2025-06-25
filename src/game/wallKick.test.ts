import { beforeEach, describe, expect, test } from "bun:test";
import type { TetrominoTypeName } from "../types/game";
import { createEmptyBoard, isValidPosition } from "./board";
import { TETROMINOS } from "./tetrominos";
import { applyWallKickOffset, getWallKickOffsets, tryRotateWithWallKick } from "./wallKick";

describe("Wall Kick System", () => {
  describe("getWallKickOffsets", () => {
    test("should return correct offsets for JLSTZ pieces 0->1 rotation", () => {
      const offsets = getWallKickOffsets("T", 0, 1);
      expect(offsets).toEqual([
        { x: 0, y: 0 }, // No offset
        { x: -1, y: 0 }, // 1 left
        { x: -1, y: 1 }, // 1 left, 1 up
        { x: 0, y: -2 }, // 2 down
        { x: -1, y: -2 }, // 1 left, 2 down
      ]);
    });

    test("should return correct offsets for I piece 0->1 rotation", () => {
      const offsets = getWallKickOffsets("I", 0, 1);
      expect(offsets).toEqual([
        { x: 0, y: 0 }, // No offset
        { x: -2, y: 0 }, // 2 left
        { x: 1, y: 0 }, // 1 right
        { x: -2, y: -1 }, // 2 left, 1 down
        { x: 1, y: 2 }, // 1 right, 2 up
      ]);
    });

    test("should return only no-offset for O piece", () => {
      const offsets = getWallKickOffsets("O", 0, 1);
      expect(offsets).toEqual([{ x: 0, y: 0 }]);
    });

    test("should return consistent offsets for all JLSTZ pieces", () => {
      const jlstzPieces: TetrominoTypeName[] = ["J", "L", "S", "T", "Z"];
      const baseOffsets = getWallKickOffsets("T", 0, 1);

      for (const piece of jlstzPieces) {
        const offsets = getWallKickOffsets(piece, 0, 1);
        expect(offsets).toEqual(baseOffsets);
      }
    });

    test("should handle counter-clockwise rotations", () => {
      const cwOffsets = getWallKickOffsets("T", 0, 1);
      const ccwOffsets = getWallKickOffsets("T", 1, 0);
      expect(cwOffsets).not.toEqual(ccwOffsets);
      expect(ccwOffsets.length).toBe(5);
    });
  });

  describe("applyWallKickOffset", () => {
    test("should correctly apply positive offsets", () => {
      const position = { x: 5, y: 3 };
      const offset = { x: 2, y: -1 };
      const result = applyWallKickOffset(position, offset);
      expect(result).toEqual({ x: 7, y: 2 });
    });

    test("should correctly apply negative offsets", () => {
      const position = { x: 5, y: 3 };
      const offset = { x: -2, y: 1 };
      const result = applyWallKickOffset(position, offset);
      expect(result).toEqual({ x: 3, y: 4 });
    });

    test("should handle zero offsets", () => {
      const position = { x: 5, y: 3 };
      const offset = { x: 0, y: 0 };
      const result = applyWallKickOffset(position, offset);
      expect(result).toEqual(position);
    });
  });

  describe("tryRotateWithWallKick", () => {
    let board: number[][];

    beforeEach(() => {
      board = createEmptyBoard();
    });

    test("should succeed with no wall kick needed", () => {
      const tShape = TETROMINOS.T;
      const rotatedShape = [
        [0, 1, 0],
        [0, 1, 1],
        [0, 1, 0],
      ];
      const position = { x: 5, y: 5 };

      const result = tryRotateWithWallKick(
        board,
        tShape,
        rotatedShape,
        position,
        "T",
        0,
        1,
        isValidPosition,
      );

      expect(result).toEqual({ x: 5, y: 5 });
    });

    test("should use wall kick when basic rotation fails", () => {
      const tShape = TETROMINOS.T;
      const rotatedShape = [
        [0, 1, 0],
        [0, 1, 1],
        [0, 1, 0],
      ];

      // Place piece at left edge where basic rotation would fail
      const position = { x: 0, y: 5 };

      // Block the basic rotation position by filling the board
      board[5][1] = 1; // This should block the x:0 position

      const result = tryRotateWithWallKick(
        board,
        tShape,
        rotatedShape,
        position,
        "T",
        0,
        1,
        isValidPosition,
      );

      // Should try the second wall kick offset: 1 left (x: -1)
      // Final position should be { x: -1, y: 5 }
      expect(result).toEqual({ x: -1, y: 5 });
    });

    test("should return null when all wall kicks fail", () => {
      const tShape = TETROMINOS.T;
      const rotatedShape = [
        [0, 1, 0],
        [0, 1, 1],
        [0, 1, 0],
      ];

      // Place piece at edge and fill surrounding area to block all wall kicks
      const position = { x: 0, y: 1 };

      // Fill areas that would block all wall kick attempts
      for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 5; y++) {
          board[y][x] = 1;
        }
      }

      const result = tryRotateWithWallKick(
        board,
        tShape,
        rotatedShape,
        position,
        "T",
        0,
        1,
        isValidPosition,
      );

      expect(result).toBeNull();
    });

    test("should handle I piece wall kicks correctly", () => {
      const iShape = TETROMINOS.I;
      const rotatedShape = [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
      ];

      // Place I piece at left edge
      const position = { x: 1, y: 5 };

      const result = tryRotateWithWallKick(
        board,
        iShape,
        rotatedShape,
        position,
        "I",
        0,
        1,
        isValidPosition,
      );

      // Should succeed with some wall kick offset
      expect(result).not.toBeNull();
      expect(typeof result?.x).toBe("number");
      expect(typeof result?.y).toBe("number");
    });

    test("should handle O piece (no wall kicks needed)", () => {
      const oShape = TETROMINOS.O;
      const rotatedShape = TETROMINOS.O; // O piece doesn't change when rotated
      const position = { x: 5, y: 5 };

      const result = tryRotateWithWallKick(
        board,
        oShape,
        rotatedShape,
        position,
        "O",
        0,
        1,
        isValidPosition,
      );

      expect(result).toEqual({ x: 5, y: 5 });
    });
  });

  describe("Integration with different rotation states", () => {
    test("should handle all rotation transitions for T piece", () => {
      const board = createEmptyBoard();
      const tShape = TETROMINOS.T;
      const position = { x: 5, y: 5 };

      // Test all possible rotation transitions
      const transitions = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0], // Clockwise
        [1, 0],
        [2, 1],
        [3, 2],
        [0, 3], // Counter-clockwise
      ];

      for (const [from, to] of transitions) {
        const result = tryRotateWithWallKick(
          board,
          tShape,
          tShape, // Using same shape for simplicity
          position,
          "T",
          from,
          to,
          isValidPosition,
        );

        expect(result).not.toBeNull();
        expect(result).toEqual({ x: 5, y: 5 }); // Should succeed with no offset
      }
    });

    test("should provide different wall kick data for different transitions", () => {
      const offsets01 = getWallKickOffsets("T", 0, 1);
      const offsets12 = getWallKickOffsets("T", 1, 2);
      const offsets23 = getWallKickOffsets("T", 2, 3);
      const offsets30 = getWallKickOffsets("T", 3, 0);

      // Each transition should have different wall kick patterns
      expect(offsets01).not.toEqual(offsets12);
      expect(offsets12).not.toEqual(offsets23);
      expect(offsets23).not.toEqual(offsets30);
      expect(offsets30).not.toEqual(offsets01);
    });
  });
});

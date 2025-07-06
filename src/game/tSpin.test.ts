import { describe, expect, test } from "bun:test";
import type { GameBoard, Position, Tetromino } from "@/types/game";
import type { RotationResult, WallKickAttempt } from "@/types/rotation";
import { createEmptyBoard } from "./board";
import { detectTSpin, isPositionValid } from "./tSpin";

// ==============================
// Test Helper Functions
// ==============================

/**
 * Create a T-piece at specified position and rotation
 */
function createTestTPiece(position: Position, rotation: 0 | 1 | 2 | 3): Tetromino {
  // T-piece shape for each rotation state
  const shapes = {
    0: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    1: [
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 0],
    ],
    2: [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    3: [
      [0, 1, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  };

  return {
    type: "T",
    position,
    rotation,
    shape: shapes[rotation],
  };
}

/**
 * Create a rotation result with specified parameters
 */
function createRotationResult(
  success: boolean,
  piece?: Tetromino,
  kicksAttempted: WallKickAttempt[] = [],
): RotationResult {
  return {
    success,
    piece,
    kicksAttempted,
    failureReason: success ? undefined : "collision",
  };
}

/**
 * Create wall kick attempt with specified offset
 */
function createWallKickAttempt(
  offset: Position,
  position: Position,
  tested = true,
): WallKickAttempt {
  return { offset, position, tested };
}

/**
 * Create board with specific occupied positions for testing
 */
function createTestBoard(occupiedPositions: Position[]): GameBoard {
  const board = createEmptyBoard();
  for (const pos of occupiedPositions) {
    if (pos.y >= 0 && pos.y < board.length && pos.x >= 0 && pos.x < board[0].length) {
      board[pos.y][pos.x] = 1; // Mark as occupied
    }
  }
  return board;
}

// ==============================
// T-Spin Detection Tests
// ==============================

describe("T-Spin Detection", () => {
  describe("Basic T-Spin Detection Rules", () => {
    test("should detect no T-Spin for non-T pieces", () => {
      const board = createEmptyBoard();
      const iPiece: Tetromino = {
        type: "I",
        position: { x: 4, y: 10 },
        rotation: 0,
        shape: [
          [0, 0, 0, 0],
          [1, 1, 1, 1],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
      };
      const rotationResult = createRotationResult(true, iPiece);

      const result = detectTSpin(board, iPiece, rotationResult);

      expect(result.type).toBe("none");
      expect(result.lastMoveWasRotation).toBe(false);
    });

    test("should detect no T-Spin for failed rotation", () => {
      const board = createEmptyBoard();
      const tPiece = createTestTPiece({ x: 4, y: 10 }, 0);
      const rotationResult = createRotationResult(false);

      const result = detectTSpin(board, tPiece, rotationResult);

      expect(result.type).toBe("none");
      expect(result.lastMoveWasRotation).toBe(false);
    });

    test("should detect no T-Spin when less than 3 corners are filled", () => {
      // T-piece at { x: 4, y: 10 } has center at { x: 5, y: 11 }
      // Corners are at: { x: 4, y: 10 }, { x: 6, y: 10 }, { x: 4, y: 12 }, { x: 6, y: 12 }
      // Create board with only 2 corners filled
      const occupiedPositions: Position[] = [
        { x: 4, y: 10 }, // Top-left corner
        { x: 6, y: 10 }, // Top-right corner
      ];
      const board = createTestBoard(occupiedPositions);
      const tPiece = createTestTPiece({ x: 4, y: 10 }, 0);
      const rotationResult = createRotationResult(true, tPiece);

      const result = detectTSpin(board, tPiece, rotationResult);

      expect(result.type).toBe("none");
      expect(result.cornersFilled).toBe(2);
      expect(result.lastMoveWasRotation).toBe(true);
    });
  });

  describe("3-Corner Rule Implementation", () => {
    test("should detect T-Spin when exactly 3 corners are filled", () => {
      // T-piece at { x: 4, y: 10 } has center at { x: 5, y: 11 }
      // Corners are at: { x: 4, y: 10 }, { x: 6, y: 10 }, { x: 4, y: 12 }, { x: 6, y: 12 }
      // Create board with 3 corners filled
      const occupiedPositions: Position[] = [
        { x: 4, y: 10 }, // Top-left corner
        { x: 6, y: 10 }, // Top-right corner
        { x: 4, y: 12 }, // Bottom-left corner
      ];
      const board = createTestBoard(occupiedPositions);
      const tPiece = createTestTPiece({ x: 4, y: 10 }, 0);
      const kickAttempts = [createWallKickAttempt({ x: 0, y: 0 }, { x: 4, y: 10 })];
      const rotationResult = createRotationResult(true, tPiece, kickAttempts);

      const result = detectTSpin(board, tPiece, rotationResult);

      expect(result.type).toBe("mini"); // No wall kick used, so it's mini
      expect(result.cornersFilled).toBe(3);
      expect(result.usedWallKick).toBe(false);
      expect(result.lastMoveWasRotation).toBe(true);
    });

    test("should detect T-Spin when all 4 corners are filled", () => {
      // T-piece at { x: 4, y: 10 } has center at { x: 5, y: 11 }
      // Corners are at: { x: 4, y: 10 }, { x: 6, y: 10 }, { x: 4, y: 12 }, { x: 6, y: 12 }
      // Create board with all 4 corners filled
      const occupiedPositions: Position[] = [
        { x: 4, y: 10 }, // Top-left corner
        { x: 6, y: 10 }, // Top-right corner
        { x: 4, y: 12 }, // Bottom-left corner
        { x: 6, y: 12 }, // Bottom-right corner
      ];
      const board = createTestBoard(occupiedPositions);
      const tPiece = createTestTPiece({ x: 4, y: 10 }, 0);
      const kickAttempts = [
        createWallKickAttempt({ x: -1, y: 0 }, { x: 3, y: 10 }), // Wall kick used
      ];
      const rotationResult = createRotationResult(true, tPiece, kickAttempts);

      const result = detectTSpin(board, tPiece, rotationResult);

      expect(result.type).toBe("normal"); // Wall kick used and 2 front corners filled
      expect(result.cornersFilled).toBe(4);
      expect(result.usedWallKick).toBe(true);
      expect(result.lastMoveWasRotation).toBe(true);
    });
  });

  describe("T-Spin Mini vs Normal Detection", () => {
    test("should detect T-Spin Mini when only 1 front corner is filled", () => {
      // T-piece pointing up (rotation 0), only left front corner filled
      const occupiedPositions: Position[] = [
        { x: 3, y: 9 }, // Top-left corner (front)
        { x: 3, y: 11 }, // Bottom-left corner (back)
        { x: 5, y: 11 }, // Bottom-right corner (back)
      ];
      const board = createTestBoard(occupiedPositions);
      const tPiece = createTestTPiece({ x: 4, y: 10 }, 0);
      const kickAttempts = [
        createWallKickAttempt({ x: -1, y: 0 }, { x: 3, y: 10 }), // Wall kick used
      ];
      const rotationResult = createRotationResult(true, tPiece, kickAttempts);

      const result = detectTSpin(board, tPiece, rotationResult);

      expect(result.type).toBe("mini"); // Only 1 front corner filled
      expect(result.cornersFilled).toBe(3);
      expect(result.usedWallKick).toBe(true);
    });

    test("should detect T-Spin Normal when 2 front corners are filled and wall kick used", () => {
      // T-piece pointing up (rotation 0), both front corners filled
      const occupiedPositions: Position[] = [
        { x: 3, y: 9 }, // Top-left corner (front)
        { x: 5, y: 9 }, // Top-right corner (front)
        { x: 3, y: 11 }, // Bottom-left corner (back)
      ];
      const board = createTestBoard(occupiedPositions);
      const tPiece = createTestTPiece({ x: 4, y: 10 }, 0);
      const kickAttempts = [
        createWallKickAttempt({ x: -1, y: 0 }, { x: 3, y: 10 }), // Wall kick used
      ];
      const rotationResult = createRotationResult(true, tPiece, kickAttempts);

      const result = detectTSpin(board, tPiece, rotationResult);

      expect(result.type).toBe("normal"); // 2 front corners filled and wall kick used
      expect(result.cornersFilled).toBe(3);
      expect(result.usedWallKick).toBe(true);
    });

    test("should detect T-Spin Mini when no wall kick is used (point-blank T-Spin)", () => {
      // Point-blank T-Spin: rotation without wall kick
      const occupiedPositions: Position[] = [
        { x: 3, y: 9 }, // Top-left corner
        { x: 5, y: 9 }, // Top-right corner
        { x: 3, y: 11 }, // Bottom-left corner
      ];
      const board = createTestBoard(occupiedPositions);
      const tPiece = createTestTPiece({ x: 4, y: 10 }, 0);
      const kickAttempts = [
        createWallKickAttempt({ x: 0, y: 0 }, { x: 4, y: 10 }), // No wall kick
      ];
      const rotationResult = createRotationResult(true, tPiece, kickAttempts);

      const result = detectTSpin(board, tPiece, rotationResult);

      expect(result.type).toBe("mini"); // No wall kick used
      expect(result.usedWallKick).toBe(false);
    });
  });

  describe("Different T-Piece Orientations", () => {
    test("should correctly detect front corners for T-piece pointing right (rotation 1)", () => {
      // T-piece pointing right, right front corners filled
      const occupiedPositions: Position[] = [
        { x: 5, y: 9 }, // Top-right corner (front)
        { x: 5, y: 11 }, // Bottom-right corner (front)
        { x: 3, y: 9 }, // Top-left corner (back)
      ];
      const board = createTestBoard(occupiedPositions);
      const tPiece = createTestTPiece({ x: 4, y: 10 }, 1);
      const kickAttempts = [
        createWallKickAttempt({ x: 1, y: 0 }, { x: 5, y: 10 }), // Wall kick used
      ];
      const rotationResult = createRotationResult(true, tPiece, kickAttempts);

      const result = detectTSpin(board, tPiece, rotationResult);

      expect(result.type).toBe("normal"); // 2 front corners filled and wall kick used
      expect(result.cornersFilled).toBe(3);
      expect(result.usedWallKick).toBe(true);
    });

    test("should correctly detect front corners for T-piece pointing down (rotation 2)", () => {
      // T-piece pointing down, bottom front corners filled
      const occupiedPositions: Position[] = [
        { x: 3, y: 11 }, // Bottom-left corner (front)
        { x: 5, y: 11 }, // Bottom-right corner (front)
        { x: 3, y: 9 }, // Top-left corner (back)
      ];
      const board = createTestBoard(occupiedPositions);
      const tPiece = createTestTPiece({ x: 4, y: 10 }, 2);
      const kickAttempts = [
        createWallKickAttempt({ x: 0, y: 1 }, { x: 4, y: 11 }), // Wall kick used
      ];
      const rotationResult = createRotationResult(true, tPiece, kickAttempts);

      const result = detectTSpin(board, tPiece, rotationResult);

      expect(result.type).toBe("normal"); // 2 front corners filled and wall kick used
      expect(result.cornersFilled).toBe(3);
      expect(result.usedWallKick).toBe(true);
    });

    test("should correctly detect front corners for T-piece pointing left (rotation 3)", () => {
      // T-piece pointing left, left front corners filled
      const occupiedPositions: Position[] = [
        { x: 3, y: 9 }, // Top-left corner (front)
        { x: 3, y: 11 }, // Bottom-left corner (front)
        { x: 5, y: 9 }, // Top-right corner (back)
      ];
      const board = createTestBoard(occupiedPositions);
      const tPiece = createTestTPiece({ x: 4, y: 10 }, 3);
      const kickAttempts = [
        createWallKickAttempt({ x: -1, y: 0 }, { x: 3, y: 10 }), // Wall kick used
      ];
      const rotationResult = createRotationResult(true, tPiece, kickAttempts);

      const result = detectTSpin(board, tPiece, rotationResult);

      expect(result.type).toBe("normal"); // 2 front corners filled and wall kick used
      expect(result.cornersFilled).toBe(3);
      expect(result.usedWallKick).toBe(true);
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {
    test("should handle T-Spin at board edges correctly", () => {
      // T-piece at left edge, using board boundary as corners
      const occupiedPositions: Position[] = [
        { x: 1, y: 9 }, // Top-right corner
        { x: 1, y: 11 }, // Bottom-right corner
      ];
      const board = createTestBoard(occupiedPositions);
      const tPiece = createTestTPiece({ x: 0, y: 10 }, 0); // At left edge
      const kickAttempts = [createWallKickAttempt({ x: 0, y: 0 }, { x: 0, y: 10 })];
      const rotationResult = createRotationResult(true, tPiece, kickAttempts);

      const result = detectTSpin(board, tPiece, rotationResult);

      // Left edge positions count as occupied corners
      expect(result.cornersFilled).toBe(4); // 2 board edge + 2 filled
      expect(result.type).toBe("mini"); // No wall kick used
    });

    test("should handle T-Spin at top of board correctly", () => {
      // T-piece near top of board
      const occupiedPositions: Position[] = [
        { x: 3, y: 2 }, // Bottom-left corner
        { x: 5, y: 2 }, // Bottom-right corner
      ];
      const board = createTestBoard(occupiedPositions);
      const tPiece = createTestTPiece({ x: 4, y: 1 }, 0); // Near top
      const kickAttempts = [createWallKickAttempt({ x: 0, y: 0 }, { x: 4, y: 1 })];
      const rotationResult = createRotationResult(true, tPiece, kickAttempts);

      const result = detectTSpin(board, tPiece, rotationResult);

      // Top edge positions count as occupied corners
      expect(result.cornersFilled).toBe(4); // 2 top edge + 2 filled
      expect(result.type).toBe("mini"); // No wall kick used
    });

    test("should handle multiple wall kick attempts correctly", () => {
      const occupiedPositions: Position[] = [
        { x: 3, y: 9 }, // Top-left corner
        { x: 5, y: 9 }, // Top-right corner
        { x: 3, y: 11 }, // Bottom-left corner
      ];
      const board = createTestBoard(occupiedPositions);
      const tPiece = createTestTPiece({ x: 4, y: 10 }, 0);
      const kickAttempts = [
        createWallKickAttempt({ x: 0, y: 0 }, { x: 4, y: 10 }, false), // First attempt failed
        createWallKickAttempt({ x: -1, y: 0 }, { x: 3, y: 10 }, true), // Second attempt succeeded
      ];
      const rotationResult = createRotationResult(true, tPiece, kickAttempts);

      const result = detectTSpin(board, tPiece, rotationResult);

      expect(result.usedWallKick).toBe(true); // Any non-zero offset counts
      expect(result.type).toBe("normal"); // Wall kick used and 2 front corners filled
    });
  });
});

// ==============================
// Utility Function Tests
// ==============================

describe("T-Spin Utility Functions", () => {
  describe("isPositionValid", () => {
    test("should return true for valid empty positions", () => {
      const board = createEmptyBoard();

      expect(isPositionValid(board, { x: 0, y: 0 })).toBe(true);
      expect(isPositionValid(board, { x: 5, y: 10 })).toBe(true);
      expect(isPositionValid(board, { x: 9, y: 19 })).toBe(true);
    });

    test("should return false for occupied positions", () => {
      const board = createTestBoard([{ x: 5, y: 10 }]);

      expect(isPositionValid(board, { x: 5, y: 10 })).toBe(false);
    });

    test("should return false for out of bounds positions", () => {
      const board = createEmptyBoard();

      expect(isPositionValid(board, { x: -1, y: 0 })).toBe(false);
      expect(isPositionValid(board, { x: 10, y: 0 })).toBe(false);
      expect(isPositionValid(board, { x: 0, y: -1 })).toBe(false);
      expect(isPositionValid(board, { x: 0, y: 20 })).toBe(false);
    });
  });
});

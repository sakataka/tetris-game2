/**
 * Tetromino definitions and operations
 * Standard Tetris pieces with SRS rotation system
 */

import type { PieceType, RotationState } from "../types.js";

/**
 * Tetromino shape definitions for each rotation state
 * Each shape is a 2D boolean array where true represents a filled cell
 */
export const TETROMINO_SHAPES: Record<PieceType, readonly (readonly (readonly boolean[])[])[4]> = {
  I: [
    // Rotation 0
    [
      [false, false, false, false],
      [true, true, true, true],
      [false, false, false, false],
      [false, false, false, false],
    ],
    // Rotation 1
    [
      [false, false, true, false],
      [false, false, true, false],
      [false, false, true, false],
      [false, false, true, false],
    ],
    // Rotation 2
    [
      [false, false, false, false],
      [false, false, false, false],
      [true, true, true, true],
      [false, false, false, false],
    ],
    // Rotation 3
    [
      [false, true, false, false],
      [false, true, false, false],
      [false, true, false, false],
      [false, true, false, false],
    ],
  ],
  J: [
    // Rotation 0
    [
      [true, false, false],
      [true, true, true],
      [false, false, false],
    ],
    // Rotation 1
    [
      [false, true, true],
      [false, true, false],
      [false, true, false],
    ],
    // Rotation 2
    [
      [false, false, false],
      [true, true, true],
      [false, false, true],
    ],
    // Rotation 3
    [
      [false, true, false],
      [false, true, false],
      [true, true, false],
    ],
  ],
  L: [
    // Rotation 0
    [
      [false, false, true],
      [true, true, true],
      [false, false, false],
    ],
    // Rotation 1
    [
      [false, true, false],
      [false, true, false],
      [false, true, true],
    ],
    // Rotation 2
    [
      [false, false, false],
      [true, true, true],
      [true, false, false],
    ],
    // Rotation 3
    [
      [true, true, false],
      [false, true, false],
      [false, true, false],
    ],
  ],
  O: [
    // All rotations are the same for O piece
    [
      [true, true],
      [true, true],
    ],
    [
      [true, true],
      [true, true],
    ],
    [
      [true, true],
      [true, true],
    ],
    [
      [true, true],
      [true, true],
    ],
  ],
  S: [
    // Rotation 0
    [
      [false, true, true],
      [true, true, false],
      [false, false, false],
    ],
    // Rotation 1
    [
      [false, true, false],
      [false, true, true],
      [false, false, true],
    ],
    // Rotation 2
    [
      [false, false, false],
      [false, true, true],
      [true, true, false],
    ],
    // Rotation 3
    [
      [true, false, false],
      [true, true, false],
      [false, true, false],
    ],
  ],
  T: [
    // Rotation 0
    [
      [false, true, false],
      [true, true, true],
      [false, false, false],
    ],
    // Rotation 1
    [
      [false, true, false],
      [false, true, true],
      [false, true, false],
    ],
    // Rotation 2
    [
      [false, false, false],
      [true, true, true],
      [false, true, false],
    ],
    // Rotation 3
    [
      [false, true, false],
      [true, true, false],
      [false, true, false],
    ],
  ],
  Z: [
    // Rotation 0
    [
      [true, true, false],
      [false, true, true],
      [false, false, false],
    ],
    // Rotation 1
    [
      [false, false, true],
      [false, true, true],
      [false, true, false],
    ],
    // Rotation 2
    [
      [false, false, false],
      [true, true, false],
      [false, true, true],
    ],
    // Rotation 3
    [
      [false, true, false],
      [true, true, false],
      [true, false, false],
    ],
  ],
};

/**
 * Spawn positions for each tetromino type
 * These are the initial positions when a piece enters the playing field
 */
export const SPAWN_POSITIONS: Record<PieceType, { x: number; y: number }> = {
  I: { x: 3, y: 0 },
  J: { x: 3, y: 0 },
  L: { x: 3, y: 0 },
  O: { x: 4, y: 0 },
  S: { x: 3, y: 0 },
  T: { x: 3, y: 0 },
  Z: { x: 3, y: 0 },
};

/**
 * Get the shape of a tetromino at a specific rotation
 * @param type Piece type
 * @param rotation Rotation state (0-3)
 * @returns 2D boolean array representing the shape
 */
export const getTetrominoShape = (
  type: PieceType,
  rotation: RotationState,
): readonly (readonly boolean[])[] => {
  return TETROMINO_SHAPES[type][rotation];
};

/**
 * Get the spawn position for a tetromino type
 * @param type Piece type
 * @returns Spawn position { x, y }
 */
export const getSpawnPosition = (type: PieceType): { x: number; y: number } => {
  return SPAWN_POSITIONS[type];
};

/**
 * Get the next rotation state (clockwise)
 * @param currentRotation Current rotation state
 * @returns Next rotation state
 */
export const getNextRotation = (currentRotation: RotationState): RotationState => {
  return ((currentRotation + 1) % 4) as RotationState;
};

/**
 * Get the previous rotation state (counter-clockwise)
 * @param currentRotation Current rotation state
 * @returns Previous rotation state
 */
export const getPreviousRotation = (currentRotation: RotationState): RotationState => {
  return ((currentRotation + 3) % 4) as RotationState;
};

/**
 * Calculate the bounding box of a tetromino shape
 * @param shape 2D boolean array representing the shape
 * @returns Bounding box { width, height, minX, minY }
 */
export const calculateBoundingBox = (
  shape: readonly (readonly boolean[])[],
): {
  width: number;
  height: number;
  minX: number;
  minY: number;
} => {
  let minX = Number.MAX_SAFE_INTEGER;
  let maxX = Number.MIN_SAFE_INTEGER;
  let minY = Number.MAX_SAFE_INTEGER;
  let maxY = Number.MIN_SAFE_INTEGER;

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col]) {
        minX = Math.min(minX, col);
        maxX = Math.max(maxX, col);
        minY = Math.min(minY, row);
        maxY = Math.max(maxY, row);
      }
    }
  }

  return {
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    minX,
    minY,
  };
};

/**
 * All tetromino types in standard order
 */
export const ALL_PIECE_TYPES: readonly PieceType[] = ["I", "J", "L", "O", "S", "T", "Z"] as const;

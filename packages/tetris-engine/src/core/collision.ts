/**
 * Collision detection and SRS (Super Rotation System) implementation
 * Handles wall kicks and advanced rotation mechanics
 */

import type {
  Matrix,
  MoveResult,
  Piece,
  RotationState,
  Vec2,
  WallKickData,
  WallKickOffset,
} from "../types.js";
import { VISIBLE_COLS } from "../types.js";
import { canPlacePiece as canPlacePieceOnMatrix } from "./bitboard.js";
import { getNextRotation, getTetrominoShape } from "./tetrominos.js";

/**
 * SRS Wall Kick data for JLSTZ pieces
 * Each entry represents the offsets to try for rotation from state A to state B
 */
const SRS_WALL_KICK_DATA: WallKickData = {
  // 0->1 (0° to 90°)
  "0->1": [
    { x: 0, y: 0 }, // No offset
    { x: -1, y: 0 }, // Left
    { x: -1, y: 1 }, // Left + Up
    { x: 0, y: -2 }, // Down 2
    { x: -1, y: -2 }, // Left + Down 2
  ],
  // 1->0 (90° to 0°)
  "1->0": [
    { x: 0, y: 0 }, // No offset
    { x: 1, y: 0 }, // Right
    { x: 1, y: -1 }, // Right + Down
    { x: 0, y: 2 }, // Up 2
    { x: 1, y: 2 }, // Right + Up 2
  ],
  // 1->2 (90° to 180°)
  "1->2": [
    { x: 0, y: 0 }, // No offset
    { x: 1, y: 0 }, // Right
    { x: 1, y: -1 }, // Right + Down
    { x: 0, y: 2 }, // Up 2
    { x: 1, y: 2 }, // Right + Up 2
  ],
  // 2->1 (180° to 90°)
  "2->1": [
    { x: 0, y: 0 }, // No offset
    { x: -1, y: 0 }, // Left
    { x: -1, y: 1 }, // Left + Up
    { x: 0, y: -2 }, // Down 2
    { x: -1, y: -2 }, // Left + Down 2
  ],
  // 2->3 (180° to 270°)
  "2->3": [
    { x: 0, y: 0 }, // No offset
    { x: 1, y: 0 }, // Right
    { x: 1, y: 1 }, // Right + Up
    { x: 0, y: -2 }, // Down 2
    { x: 1, y: -2 }, // Right + Down 2
  ],
  // 3->2 (270° to 180°)
  "3->2": [
    { x: 0, y: 0 }, // No offset
    { x: -1, y: 0 }, // Left
    { x: -1, y: -1 }, // Left + Down
    { x: 0, y: 2 }, // Up 2
    { x: -1, y: 2 }, // Left + Up 2
  ],
  // 3->0 (270° to 0°)
  "3->0": [
    { x: 0, y: 0 }, // No offset
    { x: -1, y: 0 }, // Left
    { x: -1, y: -1 }, // Left + Down
    { x: 0, y: 2 }, // Up 2
    { x: -1, y: 2 }, // Left + Up 2
  ],
  // 0->3 (0° to 270°)
  "0->3": [
    { x: 0, y: 0 }, // No offset
    { x: 1, y: 0 }, // Right
    { x: 1, y: 1 }, // Right + Up
    { x: 0, y: -2 }, // Down 2
    { x: 1, y: -2 }, // Right + Down 2
  ],
};

/**
 * SRS Wall Kick data for I piece (different from other pieces)
 */
const SRS_I_WALL_KICK_DATA: WallKickData = {
  // 0->1 (0° to 90°)
  "0->1": [
    { x: 0, y: 0 }, // No offset
    { x: -2, y: 0 }, // Left 2
    { x: 1, y: 0 }, // Right
    { x: -2, y: -1 }, // Left 2 + Down
    { x: 1, y: 2 }, // Right + Up 2
  ],
  // 1->0 (90° to 0°)
  "1->0": [
    { x: 0, y: 0 }, // No offset
    { x: 2, y: 0 }, // Right 2
    { x: -1, y: 0 }, // Left
    { x: 2, y: 1 }, // Right 2 + Up
    { x: -1, y: -2 }, // Left + Down 2
  ],
  // 1->2 (90° to 180°)
  "1->2": [
    { x: 0, y: 0 }, // No offset
    { x: -1, y: 0 }, // Left
    { x: 2, y: 0 }, // Right 2
    { x: -1, y: 2 }, // Left + Up 2
    { x: 2, y: -1 }, // Right 2 + Down
  ],
  // 2->1 (180° to 90°)
  "2->1": [
    { x: 0, y: 0 }, // No offset
    { x: 1, y: 0 }, // Right
    { x: -2, y: 0 }, // Left 2
    { x: 1, y: -2 }, // Right + Down 2
    { x: -2, y: 1 }, // Left 2 + Up
  ],
  // 2->3 (180° to 270°)
  "2->3": [
    { x: 0, y: 0 }, // No offset
    { x: 2, y: 0 }, // Right 2
    { x: -1, y: 0 }, // Left
    { x: 2, y: 1 }, // Right 2 + Up
    { x: -1, y: -2 }, // Left + Down 2
  ],
  // 3->2 (270° to 180°)
  "3->2": [
    { x: 0, y: 0 }, // No offset
    { x: -2, y: 0 }, // Left 2
    { x: 1, y: 0 }, // Right
    { x: -2, y: -1 }, // Left 2 + Down
    { x: 1, y: 2 }, // Right + Up 2
  ],
  // 3->0 (270° to 0°)
  "3->0": [
    { x: 0, y: 0 }, // No offset
    { x: 1, y: 0 }, // Right
    { x: -2, y: 0 }, // Left 2
    { x: 1, y: -2 }, // Right + Down 2
    { x: -2, y: 1 }, // Left 2 + Up
  ],
  // 0->3 (0° to 270°)
  "0->3": [
    { x: 0, y: 0 }, // No offset
    { x: -1, y: 0 }, // Left
    { x: 2, y: 0 }, // Right 2
    { x: -1, y: 2 }, // Left + Up 2
    { x: 2, y: -1 }, // Right 2 + Down
  ],
};

/**
 * Check if a piece collides with the board or boundaries
 * @param matrix Game matrix
 * @param piece Piece to check
 * @returns True if there is a collision
 */
export const checkCollision = (matrix: Matrix, piece: Piece): boolean => {
  const shape = getTetrominoShape(piece.type, piece.rotation);
  return !canPlacePieceOnMatrix(matrix, shape, piece.position.x, piece.position.y);
};

/**
 * Check if a piece collides at a specific position
 * @param matrix Game matrix
 * @param piece Piece to check
 * @param x X position to check
 * @param y Y position to check
 * @param rotation Rotation state to check
 * @returns True if there is a collision
 */
export const checkCollisionAt = (
  matrix: Matrix,
  piece: Piece,
  x: number,
  y: number,
  rotation: RotationState,
): boolean => {
  const shape = getTetrominoShape(piece.type, rotation);
  return !canPlacePieceOnMatrix(matrix, shape, x, y);
};

/**
 * Find a valid wall kick offset for rotation
 * @param matrix Game matrix
 * @param piece Current piece
 * @param newRotation Target rotation state
 * @returns Wall kick offset or null if no valid kick found
 */
export const findWallKick = (
  matrix: Matrix,
  piece: Piece,
  newRotation: RotationState,
): WallKickOffset | null => {
  const kickData = piece.type === "I" ? SRS_I_WALL_KICK_DATA : SRS_WALL_KICK_DATA;
  const kickKey = `${piece.rotation}->${newRotation}`;
  const offsets = kickData[kickKey];

  if (!offsets) {
    return null;
  }

  const shape = getTetrominoShape(piece.type, newRotation);

  // Try each offset in order
  for (const offset of offsets) {
    const newX = piece.position.x + offset.x;
    const newY = piece.position.y + offset.y;

    if (canPlacePieceOnMatrix(matrix, shape, newX, newY)) {
      return offset;
    }
  }

  return null; // No valid wall kick found
};

/**
 * Validate a move (position change) for a piece
 * @param matrix Game matrix
 * @param piece Current piece
 * @param newPosition New position to validate
 * @returns Move result with validity and new position
 */
export const validateMove = (matrix: Matrix, piece: Piece, newPosition: Vec2): MoveResult => {
  const shape = getTetrominoShape(piece.type, piece.rotation);

  if (canPlacePieceOnMatrix(matrix, shape, newPosition.x, newPosition.y)) {
    return {
      valid: true,
      newPosition,
      newRotation: piece.rotation,
      wallKickUsed: false,
    };
  }

  return {
    valid: false,
  };
};

/**
 * Validate a rotation with SRS wall kicks
 * @param matrix Game matrix
 * @param piece Current piece
 * @param clockwise True for clockwise rotation
 * @returns Move result with validity, new position, and rotation
 */
export const validateRotation = (matrix: Matrix, piece: Piece, clockwise = true): MoveResult => {
  const newRotation: RotationState = clockwise
    ? getNextRotation(piece.rotation)
    : (((piece.rotation + 3) % 4) as RotationState);

  // Try rotation without wall kick first
  const shape = getTetrominoShape(piece.type, newRotation);

  if (canPlacePieceOnMatrix(matrix, shape, piece.position.x, piece.position.y)) {
    return {
      valid: true,
      newPosition: piece.position,
      newRotation,
      wallKickUsed: false,
    };
  }

  // Try wall kicks
  const wallKickOffset = findWallKick(matrix, piece, newRotation);

  if (wallKickOffset) {
    const newPosition: Vec2 = {
      x: piece.position.x + wallKickOffset.x,
      y: piece.position.y + wallKickOffset.y,
    };

    return {
      valid: true,
      newPosition,
      newRotation,
      wallKickUsed: true,
    };
  }

  return {
    valid: false,
  };
};

/**
 * Check if a piece is out of bounds
 * @param piece Piece to check
 * @param matrixHeight Height of the game matrix
 * @returns True if piece is out of bounds
 */
export const isOutOfBounds = (piece: Piece, matrixHeight: number): boolean => {
  const shape = getTetrominoShape(piece.type, piece.rotation);

  for (let row = 0; row < shape.length; row++) {
    const currentRow = shape[row];
    if (currentRow) {
      for (let col = 0; col < currentRow.length; col++) {
        if (currentRow[col]) {
          const x = piece.position.x + col;
          const y = piece.position.y + row;

          if (x < 0 || x >= VISIBLE_COLS || y < 0 || y >= matrixHeight) {
            return true;
          }
        }
      }
    }
  }

  return false;
};

/**
 * Check if a piece is touching the bottom or landed pieces
 * @param matrix Game matrix
 * @param piece Piece to check
 * @returns True if piece is grounded
 */
export const isGrounded = (matrix: Matrix, piece: Piece): boolean => {
  const shape = getTetrominoShape(piece.type, piece.rotation);

  // Check if moving down would cause collision
  for (let row = 0; row < shape.length; row++) {
    const currentRow = shape[row];
    if (currentRow) {
      for (let col = 0; col < currentRow.length; col++) {
        if (currentRow[col]) {
          const x = piece.position.x + col;
          const y = piece.position.y + row + 1; // One row down

          // Check if next row down is out of bounds (bottom) or occupied
          if (
            y >= matrix.length ||
            (y >= 0 && x >= 0 && x < VISIBLE_COLS && ((matrix[y] || 0) & (1 << x)) !== 0)
          ) {
            return true;
          }
        }
      }
    }
  }

  return false;
};

/**
 * Get all possible positions for a piece (for AI/search purposes)
 * @param matrix Game matrix
 * @param piece Piece to analyze
 * @returns Array of valid positions
 */
export const getPossiblePositions = (matrix: Matrix, piece: Piece): Vec2[] => {
  const positions: Vec2[] = [];
  const shape = getTetrominoShape(piece.type, piece.rotation);

  for (let x = -3; x < VISIBLE_COLS + 3; x++) {
    for (let y = -3; y < matrix.length + 3; y++) {
      if (canPlacePieceOnMatrix(matrix, shape, x, y)) {
        positions.push({ x, y });
      }
    }
  }

  return positions;
};

/**
 * Check if two pieces overlap
 * @param piece1 First piece
 * @param piece2 Second piece
 * @returns True if pieces overlap
 */
export const checkPieceOverlap = (piece1: Piece, piece2: Piece): boolean => {
  const shape1 = getTetrominoShape(piece1.type, piece1.rotation);
  const shape2 = getTetrominoShape(piece2.type, piece2.rotation);

  // Get all occupied cells for both pieces
  const cells1 = new Set<string>();
  for (let row = 0; row < shape1.length; row++) {
    const currentRow1 = shape1[row];
    if (currentRow1) {
      for (let col = 0; col < currentRow1.length; col++) {
        if (currentRow1[col]) {
          const x = piece1.position.x + col;
          const y = piece1.position.y + row;
          cells1.add(`${x},${y}`);
        }
      }
    }
  }

  // Check if any cell of piece2 overlaps with piece1
  for (let row = 0; row < shape2.length; row++) {
    const currentRow2 = shape2[row];
    if (currentRow2) {
      for (let col = 0; col < currentRow2.length; col++) {
        if (currentRow2[col]) {
          const x = piece2.position.x + col;
          const y = piece2.position.y + row;
          if (cells1.has(`${x},${y}`)) {
            return true;
          }
        }
      }
    }
  }

  return false;
};

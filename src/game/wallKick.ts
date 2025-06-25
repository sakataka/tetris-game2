import type { Position, TetrominoTypeName } from "../types/game";

/**
 * Wall kick data for Super Rotation System (SRS)
 * Key format: "{fromRotation}->{toRotation}"
 * Each array contains offset positions to test in order
 */
interface WallKickData {
  [key: string]: Position[];
}

/**
 * SRS wall kick data for JLSTZ pieces
 * Standard rotation states: 0=spawn, 1=right, 2=180, 3=left
 */
const JLSTZ_WALL_KICK_DATA: WallKickData = {
  // 0->1 (spawn to right)
  "0->1": [
    { x: 0, y: 0 }, // No offset
    { x: -1, y: 0 }, // 1 left
    { x: -1, y: 1 }, // 1 left, 1 up
    { x: 0, y: -2 }, // 2 down
    { x: -1, y: -2 }, // 1 left, 2 down
  ],
  // 1->2 (right to 180)
  "1->2": [
    { x: 0, y: 0 }, // No offset
    { x: 1, y: 0 }, // 1 right
    { x: 1, y: -1 }, // 1 right, 1 down
    { x: 0, y: 2 }, // 2 up
    { x: 1, y: 2 }, // 1 right, 2 up
  ],
  // 2->3 (180 to left)
  "2->3": [
    { x: 0, y: 0 }, // No offset
    { x: 1, y: 0 }, // 1 right
    { x: 1, y: 1 }, // 1 right, 1 up
    { x: 0, y: -2 }, // 2 down
    { x: 1, y: -2 }, // 1 right, 2 down
  ],
  // 3->0 (left to spawn)
  "3->0": [
    { x: 0, y: 0 }, // No offset
    { x: -1, y: 0 }, // 1 left
    { x: -1, y: -1 }, // 1 left, 1 down
    { x: 0, y: 2 }, // 2 up
    { x: -1, y: 2 }, // 1 left, 2 up
  ],
  // Counter-clockwise rotations (1->0, 2->1, 3->2, 0->3)
  "1->0": [
    { x: 0, y: 0 }, // No offset
    { x: 1, y: 0 }, // 1 right
    { x: 1, y: 1 }, // 1 right, 1 up
    { x: 0, y: -2 }, // 2 down
    { x: 1, y: -2 }, // 1 right, 2 down
  ],
  "2->1": [
    { x: 0, y: 0 }, // No offset
    { x: -1, y: 0 }, // 1 left
    { x: -1, y: -1 }, // 1 left, 1 down
    { x: 0, y: 2 }, // 2 up
    { x: -1, y: 2 }, // 1 left, 2 up
  ],
  "3->2": [
    { x: 0, y: 0 }, // No offset
    { x: -1, y: 0 }, // 1 left
    { x: -1, y: 1 }, // 1 left, 1 up
    { x: 0, y: -2 }, // 2 down
    { x: -1, y: -2 }, // 1 left, 2 down
  ],
  "0->3": [
    { x: 0, y: 0 }, // No offset
    { x: 1, y: 0 }, // 1 right
    { x: 1, y: -1 }, // 1 right, 1 down
    { x: 0, y: 2 }, // 2 up
    { x: 1, y: 2 }, // 1 right, 2 up
  ],
};

/**
 * SRS wall kick data for I piece (special case)
 * I piece has different wall kick behavior
 */
const I_WALL_KICK_DATA: WallKickData = {
  // 0->1 (spawn to right)
  "0->1": [
    { x: 0, y: 0 }, // No offset
    { x: -2, y: 0 }, // 2 left
    { x: 1, y: 0 }, // 1 right
    { x: -2, y: -1 }, // 2 left, 1 down
    { x: 1, y: 2 }, // 1 right, 2 up
  ],
  // 1->2 (right to 180)
  "1->2": [
    { x: 0, y: 0 }, // No offset
    { x: -1, y: 0 }, // 1 left
    { x: 2, y: 0 }, // 2 right
    { x: -1, y: 2 }, // 1 left, 2 up
    { x: 2, y: -1 }, // 2 right, 1 down
  ],
  // 2->3 (180 to left)
  "2->3": [
    { x: 0, y: 0 }, // No offset
    { x: 2, y: 0 }, // 2 right
    { x: -1, y: 0 }, // 1 left
    { x: 2, y: 1 }, // 2 right, 1 up
    { x: -1, y: -2 }, // 1 left, 2 down
  ],
  // 3->0 (left to spawn)
  "3->0": [
    { x: 0, y: 0 }, // No offset
    { x: 1, y: 0 }, // 1 right
    { x: -2, y: 0 }, // 2 left
    { x: 1, y: -2 }, // 1 right, 2 down
    { x: -2, y: 1 }, // 2 left, 1 up
  ],
  // Counter-clockwise rotations
  "1->0": [
    { x: 0, y: 0 }, // No offset
    { x: 2, y: 0 }, // 2 right
    { x: -1, y: 0 }, // 1 left
    { x: 2, y: 1 }, // 2 right, 1 up
    { x: -1, y: -2 }, // 1 left, 2 down
  ],
  "2->1": [
    { x: 0, y: 0 }, // No offset
    { x: 1, y: 0 }, // 1 right
    { x: -2, y: 0 }, // 2 left
    { x: 1, y: -2 }, // 1 right, 2 down
    { x: -2, y: 1 }, // 2 left, 1 up
  ],
  "3->2": [
    { x: 0, y: 0 }, // No offset
    { x: -2, y: 0 }, // 2 left
    { x: 1, y: 0 }, // 1 right
    { x: -2, y: -1 }, // 2 left, 1 down
    { x: 1, y: 2 }, // 1 right, 2 up
  ],
  "0->3": [
    { x: 0, y: 0 }, // No offset
    { x: -1, y: 0 }, // 1 left
    { x: 2, y: 0 }, // 2 right
    { x: -1, y: 2 }, // 1 left, 2 up
    { x: 2, y: -1 }, // 2 right, 1 down
  ],
};

/**
 * Get wall kick offsets for a specific piece type and rotation transition
 */
export function getWallKickOffsets(
  pieceType: TetrominoTypeName,
  fromRotation: number,
  toRotation: number,
): Position[] {
  // O piece doesn't need wall kicks (2x2 square)
  if (pieceType === "O") {
    return [{ x: 0, y: 0 }];
  }

  const rotationKey = `${fromRotation}->${toRotation}`;

  if (pieceType === "I") {
    return I_WALL_KICK_DATA[rotationKey] || [{ x: 0, y: 0 }];
  }

  // J, L, S, T, Z pieces use the same wall kick data
  return JLSTZ_WALL_KICK_DATA[rotationKey] || [{ x: 0, y: 0 }];
}

/**
 * Apply wall kick offset to a position
 */
export function applyWallKickOffset(position: Position, offset: Position): Position {
  return {
    x: position.x + offset.x,
    y: position.y + offset.y,
  };
}

/**
 * Try to rotate a piece with wall kick compensation
 * Tests multiple offset positions in order until a valid one is found
 *
 * @param board - Current game board
 * @param shape - Original piece shape
 * @param rotatedShape - Shape after rotation
 * @param position - Current piece position
 * @param pieceType - Type of tetromino piece
 * @param fromRotation - Current rotation state (0-3)
 * @param toRotation - Target rotation state (0-3)
 * @param isValidPositionFn - Function to check if position is valid
 * @returns New position if successful, null if rotation is impossible
 */
export function tryRotateWithWallKick(
  board: number[][],
  _shape: number[][],
  rotatedShape: number[][],
  position: Position,
  pieceType: TetrominoTypeName,
  fromRotation: number,
  toRotation: number,
  isValidPositionFn: (board: number[][], shape: number[][], position: Position) => boolean,
): Position | null {
  const wallKickOffsets = getWallKickOffsets(pieceType, fromRotation, toRotation);

  // Try each wall kick offset in order
  for (const offset of wallKickOffsets) {
    const testPosition = applyWallKickOffset(position, offset);

    if (isValidPositionFn(board, rotatedShape, testPosition)) {
      return testPosition;
    }
  }

  // No valid position found
  return null;
}

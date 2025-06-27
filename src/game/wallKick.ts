import type { Position, TetrominoTypeName } from "../types/game";
import { ROTATION_180, ROTATION_LEFT, ROTATION_RIGHT, ROTATION_SPAWN } from "../utils/constants";

/**
 * Type-safe rotation transition identifiers
 */
type RotationTransition =
  | "0->1"
  | "1->2"
  | "2->3"
  | "3->0" // Clockwise
  | "1->0"
  | "2->1"
  | "3->2"
  | "0->3"; // Counter-clockwise

/**
 * Wall kick data for Super Rotation System (SRS)
 * Maps rotation transitions to offset positions to test in order
 */
interface WallKickData {
  [K in RotationTransition]: Position[];
}

/**
 * Creates a type-safe rotation transition key
 */
function createRotationTransition(from: number, to: number): RotationTransition {
  return `${from}->${to}` as RotationTransition;
}

/**
 * Common wall kick offset patterns used by SRS
 */
const COMMON_OFFSETS = {
  /** No movement - always tried first */
  NONE: { x: 0, y: 0 },
  /** Basic directional offsets */
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
  DOWN_2: { x: 0, y: -2 },
  UP_2: { x: 0, y: 2 },
  /** Diagonal offsets */
  LEFT_UP: { x: -1, y: 1 },
  LEFT_DOWN: { x: -1, y: -1 },
  LEFT_DOWN_2: { x: -1, y: -2 },
  LEFT_UP_2: { x: -1, y: 2 },
  RIGHT_UP: { x: 1, y: 1 },
  RIGHT_DOWN: { x: 1, y: -1 },
  RIGHT_DOWN_2: { x: 1, y: -2 },
  RIGHT_UP_2: { x: 1, y: 2 },
} as const;

/**
 * Creates wall kick offset arrays using common patterns.
 * This reduces duplication while maintaining the exact SRS specification.
 */
function createOffsetPattern(...offsets: (keyof typeof COMMON_OFFSETS)[]): Position[] {
  return offsets.map((key) => COMMON_OFFSETS[key]);
}

/**
 * SRS wall kick data for JLSTZ pieces
 * Standard rotation states: 0=spawn, 1=right, 2=180, 3=left
 */
const JLSTZ_WALL_KICK_DATA: WallKickData = {
  // Clockwise rotations
  "0->1": createOffsetPattern("NONE", "LEFT", "LEFT_UP", "DOWN_2", "LEFT_DOWN_2"),
  "1->2": createOffsetPattern("NONE", "RIGHT", "RIGHT_DOWN", "UP_2", "RIGHT_UP_2"),
  "2->3": createOffsetPattern("NONE", "RIGHT", "RIGHT_UP", "DOWN_2", "RIGHT_DOWN_2"),
  "3->0": createOffsetPattern("NONE", "LEFT", "LEFT_DOWN", "UP_2", "LEFT_UP_2"),
  // Counter-clockwise rotations
  "1->0": createOffsetPattern("NONE", "RIGHT", "RIGHT_UP", "DOWN_2", "RIGHT_DOWN_2"),
  "2->1": createOffsetPattern("NONE", "LEFT", "LEFT_DOWN", "UP_2", "LEFT_UP_2"),
  "3->2": createOffsetPattern("NONE", "LEFT", "LEFT_UP", "DOWN_2", "LEFT_DOWN_2"),
  "0->3": createOffsetPattern("NONE", "RIGHT", "RIGHT_DOWN", "UP_2", "RIGHT_UP_2"),
};

/**
 * Additional I-piece specific offsets
 */
const I_PIECE_OFFSETS = {
  /** I-piece specific 2-cell movements */
  LEFT_2: { x: -2, y: 0 },
  RIGHT_2: { x: 2, y: 0 },
  LEFT_2_DOWN: { x: -2, y: -1 },
  LEFT_2_UP: { x: -2, y: 1 },
  RIGHT_2_DOWN: { x: 2, y: -1 },
  RIGHT_2_UP: { x: 2, y: 1 },
} as const;

/**
 * Creates I-piece wall kick offset arrays using both common and I-specific patterns.
 */
function createIPieceOffsetPattern(
  ...offsets: (keyof typeof COMMON_OFFSETS | keyof typeof I_PIECE_OFFSETS)[]
): Position[] {
  return offsets.map((key) => {
    return (COMMON_OFFSETS as any)[key] ?? (I_PIECE_OFFSETS as any)[key];
  });
}

/**
 * SRS wall kick data for I piece (special case)
 * I piece has different wall kick behavior due to its 4x4 bounding box
 */
const I_WALL_KICK_DATA: WallKickData = {
  // Clockwise rotations
  "0->1": createIPieceOffsetPattern("NONE", "LEFT_2", "RIGHT", "LEFT_2_DOWN", "RIGHT_UP_2"),
  "1->2": createIPieceOffsetPattern("NONE", "LEFT", "RIGHT_2", "LEFT_UP_2", "RIGHT_2_DOWN"),
  "2->3": createIPieceOffsetPattern("NONE", "RIGHT_2", "LEFT", "RIGHT_2_UP", "LEFT_DOWN_2"),
  "3->0": createIPieceOffsetPattern("NONE", "RIGHT", "LEFT_2", "RIGHT_DOWN_2", "LEFT_2_UP"),
  // Counter-clockwise rotations
  "1->0": createIPieceOffsetPattern("NONE", "RIGHT_2", "LEFT", "RIGHT_2_UP", "LEFT_DOWN_2"),
  "2->1": createIPieceOffsetPattern("NONE", "RIGHT", "LEFT_2", "RIGHT_DOWN_2", "LEFT_2_UP"),
  "3->2": createIPieceOffsetPattern("NONE", "LEFT_2", "RIGHT", "LEFT_2_DOWN", "RIGHT_UP_2"),
  "0->3": createIPieceOffsetPattern("NONE", "LEFT", "RIGHT_2", "LEFT_UP_2", "RIGHT_2_DOWN"),
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

  const rotationKey = createRotationTransition(fromRotation, toRotation);

  if (pieceType === "I") {
    return I_WALL_KICK_DATA[rotationKey] ?? [{ x: 0, y: 0 }];
  }

  // J, L, S, T, Z pieces use the same wall kick data
  return JLSTZ_WALL_KICK_DATA[rotationKey] ?? [{ x: 0, y: 0 }];
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

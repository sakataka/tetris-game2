import type {
  CellValue,
  Position,
  RotationState,
  Tetromino,
  TetrominoShape,
  TetrominoTypeName,
} from "@/types/game";
import type { RotationResult, RotationTransition, WallKickAttempt } from "@/types/rotation";

type WallKickData = { [K in RotationTransition]: Position[] };

function createRotationTransition(from: RotationState, to: RotationState): RotationTransition {
  return `${from}->${to}` as RotationTransition;
}

const I_PIECE_OFFSETS = {
  LEFT_2: { x: -2, y: 0 },
  RIGHT_2: { x: 2, y: 0 },
  LEFT_2_DOWN: { x: -2, y: -1 },
  LEFT_2_UP: { x: -2, y: 1 },
  RIGHT_2_DOWN: { x: 2, y: -1 },
  RIGHT_2_UP: { x: 2, y: 1 },
} as const;

const ALL_OFFSETS = {
  NONE: { x: 0, y: 0 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
  DOWN_2: { x: 0, y: -2 },
  UP_2: { x: 0, y: 2 },
  LEFT_UP: { x: -1, y: 1 },
  LEFT_DOWN: { x: -1, y: -1 },
  LEFT_DOWN_2: { x: -1, y: -2 },
  LEFT_UP_2: { x: -1, y: 2 },
  RIGHT_UP: { x: 1, y: 1 },
  RIGHT_DOWN: { x: 1, y: -1 },
  RIGHT_DOWN_2: { x: 1, y: -2 },
  RIGHT_UP_2: { x: 1, y: 2 },
  ...I_PIECE_OFFSETS,
} as const;

const createOffsetPattern = (...keys: (keyof typeof ALL_OFFSETS)[]) =>
  keys.map((key) => ALL_OFFSETS[key]);

const JLSTZ_WALL_KICK_DATA: WallKickData = {
  "0->1": createOffsetPattern("NONE", "LEFT", "LEFT_UP", "DOWN_2", "LEFT_DOWN_2"),
  "1->2": createOffsetPattern("NONE", "RIGHT", "RIGHT_DOWN", "UP_2", "RIGHT_UP_2"),
  "2->3": createOffsetPattern("NONE", "RIGHT", "RIGHT_UP", "DOWN_2", "RIGHT_DOWN_2"),
  "3->0": createOffsetPattern("NONE", "LEFT", "LEFT_DOWN", "UP_2", "LEFT_UP_2"),
  "1->0": createOffsetPattern("NONE", "RIGHT", "RIGHT_UP", "DOWN_2", "RIGHT_DOWN_2"),
  "2->1": createOffsetPattern("NONE", "LEFT", "LEFT_DOWN", "UP_2", "LEFT_UP_2"),
  "3->2": createOffsetPattern("NONE", "LEFT", "LEFT_UP", "DOWN_2", "LEFT_DOWN_2"),
  "0->3": createOffsetPattern("NONE", "RIGHT", "RIGHT_DOWN", "UP_2", "RIGHT_UP_2"),
  // 180° rotation wall kick data for JLSTZ pieces
  "0->2": createOffsetPattern("NONE", "NONE", "LEFT", "RIGHT", "LEFT_UP", "RIGHT_UP"),
  "1->3": createOffsetPattern("NONE", "NONE", "UP_2", "DOWN_2", "LEFT_UP_2", "RIGHT_DOWN_2"),
  "2->0": createOffsetPattern("NONE", "NONE", "RIGHT", "LEFT", "RIGHT_UP", "LEFT_UP"),
  "3->1": createOffsetPattern("NONE", "NONE", "DOWN_2", "UP_2", "RIGHT_DOWN_2", "LEFT_UP_2"),
};

const I_WALL_KICK_DATA: WallKickData = {
  "0->1": createOffsetPattern("NONE", "LEFT_2", "RIGHT", "LEFT_2_DOWN", "RIGHT_UP_2"),
  "1->2": createOffsetPattern("NONE", "LEFT", "RIGHT_2", "LEFT_UP_2", "RIGHT_2_DOWN"),
  "2->3": createOffsetPattern("NONE", "RIGHT_2", "LEFT", "RIGHT_2_UP", "LEFT_DOWN_2"),
  "3->0": createOffsetPattern("NONE", "RIGHT", "LEFT_2", "RIGHT_DOWN_2", "LEFT_2_UP"),
  "1->0": createOffsetPattern("NONE", "RIGHT_2", "LEFT", "RIGHT_2_UP", "LEFT_DOWN_2"),
  "2->1": createOffsetPattern("NONE", "RIGHT", "LEFT_2", "RIGHT_DOWN_2", "LEFT_2_UP"),
  "3->2": createOffsetPattern("NONE", "LEFT_2", "RIGHT", "LEFT_2_DOWN", "RIGHT_UP_2"),
  "0->3": createOffsetPattern("NONE", "LEFT", "RIGHT_2", "LEFT_UP_2", "RIGHT_2_DOWN"),
  // 180° rotation wall kick data for I piece
  "0->2": createOffsetPattern("NONE", "LEFT_2", "RIGHT_2", "LEFT_2_DOWN", "RIGHT_2_UP"),
  "1->3": createOffsetPattern("NONE", "UP_2", "DOWN_2", "LEFT_UP_2", "RIGHT_DOWN_2"),
  "2->0": createOffsetPattern("NONE", "RIGHT_2", "LEFT_2", "RIGHT_2_UP", "LEFT_2_DOWN"),
  "3->1": createOffsetPattern("NONE", "DOWN_2", "UP_2", "RIGHT_DOWN_2", "LEFT_UP_2"),
};

/**
 * Get SRS wall kick offsets for specific piece type and rotation transition
 * O piece doesn't need wall kicks (2x2 square), I piece has special 4x4 behavior
 */
export function getWallKickOffsets(
  pieceType: TetrominoTypeName,
  fromRotation: RotationState,
  toRotation: RotationState,
): Position[] {
  if (pieceType === "O") return [{ x: 0, y: 0 }];

  const rotationKey = createRotationTransition(fromRotation, toRotation);
  const data =
    pieceType === "I" ? I_WALL_KICK_DATA[rotationKey] : JLSTZ_WALL_KICK_DATA[rotationKey];
  return data ?? [{ x: 0, y: 0 }];
}

export function applyWallKickOffset(position: Position, offset: Position): Position {
  return { x: position.x + offset.x, y: position.y + offset.y };
}

/**
 * Try to rotate piece with wall kick compensation
 * Tests multiple offset positions in SRS order until valid position found
 */
export function tryRotateWithWallKick(
  board: CellValue[][],
  rotatedShape: TetrominoShape,
  position: Position,
  pieceType: TetrominoTypeName,
  fromRotation: RotationState,
  toRotation: RotationState,
  isValidPositionFn: (board: CellValue[][], shape: TetrominoShape, position: Position) => boolean,
): Position | null {
  const wallKickOffsets = getWallKickOffsets(pieceType, fromRotation, toRotation);

  // Try each wall kick offset in SRS order
  for (const offset of wallKickOffsets) {
    const testPosition = applyWallKickOffset(position, offset);
    if (isValidPositionFn(board, rotatedShape, testPosition)) return testPosition;
  }
  return null;
}

/**
 * Try to rotate piece with wall kick compensation - unified result object pattern
 * Tests multiple offset positions in SRS order until valid position found
 */
export function tryRotateWithWallKickUnified(
  board: CellValue[][],
  currentPiece: Tetromino,
  rotatedShape: TetrominoShape,
  toRotation: RotationState,
  isValidPositionFn: (board: CellValue[][], shape: TetrominoShape, position: Position) => boolean,
): RotationResult {
  const wallKickOffsets = getWallKickOffsets(currentPiece.type, currentPiece.rotation, toRotation);
  const kicksAttempted: WallKickAttempt[] = [];

  // Try each wall kick offset in SRS order
  for (const offset of wallKickOffsets) {
    const testPosition = applyWallKickOffset(currentPiece.position, offset);
    const attempt: WallKickAttempt = {
      offset,
      tested: true,
      position: testPosition,
    };
    kicksAttempted.push(attempt);

    if (isValidPositionFn(board, rotatedShape, testPosition)) {
      return {
        success: true,
        piece: {
          ...currentPiece,
          shape: rotatedShape,
          position: testPosition,
          rotation: toRotation,
        },
        kicksAttempted,
      };
    }
  }

  return {
    success: false,
    kicksAttempted,
    failureReason: "collision",
  };
}

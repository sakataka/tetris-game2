import type { GameBoard, Position, Tetromino } from "@/types/game";
import type { RotationResult } from "@/types/rotation";

export type TSpinType = "none" | "mini" | "normal";

export interface TSpinDetectionResult {
  type: TSpinType;
  cornersFilled: number;
  usedWallKick: boolean;
  lastMoveWasRotation: boolean;
}

/**
 * Detects T-Spin using the 3-corner rule according to Tetris Guidelines
 * @param board Current game board
 * @param piece Current T-piece after rotation
 * @param rotationResult Result from the rotation operation
 * @returns T-Spin detection result
 */
export function detectTSpin(
  board: GameBoard,
  piece: Tetromino,
  rotationResult: RotationResult,
): TSpinDetectionResult {
  // Only T-pieces can perform T-Spins
  if (piece.type !== "T") {
    return {
      type: "none",
      cornersFilled: 0,
      usedWallKick: false,
      lastMoveWasRotation: false,
    };
  }

  // Must be result of successful rotation
  if (!rotationResult.success) {
    return {
      type: "none",
      cornersFilled: 0,
      usedWallKick: false,
      lastMoveWasRotation: false,
    };
  }

  // Get all 4 corners of the T-piece
  const corners = getTCorners(piece);
  const filledCorners = corners.filter((pos) => isCellOccupied(board, pos)).length;

  // 3-corner rule: at least 3 corners must be filled
  if (filledCorners < 3) {
    return {
      type: "none",
      cornersFilled: filledCorners,
      usedWallKick: false,
      lastMoveWasRotation: true,
    };
  }

  // Check if wall kick was used (any non-zero offset)
  const usedWallKick = rotationResult.kicksAttempted.some(
    (attempt) => attempt.tested && (attempt.offset.x !== 0 || attempt.offset.y !== 0),
  );

  // Determine T-Spin type (Mini vs Normal)
  const frontCornersFilled = checkFrontCorners(board, piece);
  const type = determineTSpinType(frontCornersFilled, usedWallKick);

  return {
    type,
    cornersFilled: filledCorners,
    usedWallKick,
    lastMoveWasRotation: true,
  };
}

/**
 * Gets the 4 corner positions around a T-piece
 * @param piece T-piece to get corners for
 * @returns Array of 4 corner positions
 */
function getTCorners(piece: Tetromino): Position[] {
  const center = getPieceCenter(piece);
  return [
    { x: center.x - 1, y: center.y - 1 }, // Top-left
    { x: center.x + 1, y: center.y - 1 }, // Top-right
    { x: center.x - 1, y: center.y + 1 }, // Bottom-left
    { x: center.x + 1, y: center.y + 1 }, // Bottom-right
  ];
}

/**
 * Gets the center position of a T-piece based on its rotation
 * The center is the position of the T-piece's pivot point in board coordinates
 * @param piece T-piece to get center for
 * @returns Center position
 */
function getPieceCenter(piece: Tetromino): Position {
  // For T-piece, the center is always at position (1,1) within the piece's 3x3 matrix
  // regardless of rotation. We need to translate this to board coordinates.
  return {
    x: piece.position.x + 1,
    y: piece.position.y + 1,
  };
}

/**
 * Checks if a board position is occupied (not empty)
 * @param board Game board
 * @param pos Position to check
 * @returns True if position is occupied or out of bounds
 */
function isCellOccupied(board: GameBoard, pos: Position): boolean {
  // Out of bounds positions are considered occupied
  if (pos.x < 0 || pos.x >= board[0].length || pos.y < 0 || pos.y >= board.length) {
    return true;
  }

  // Check if cell is occupied (non-zero value)
  return board[pos.y][pos.x] !== 0;
}

/**
 * Checks how many front corners are filled for T-Spin Mini detection
 * Front corners are the two corners in the direction the T-piece is pointing
 * @param board Game board
 * @param piece T-piece to check
 * @returns Number of front corners filled
 */
function checkFrontCorners(board: GameBoard, piece: Tetromino): number {
  const center = getPieceCenter(piece);
  let frontCorners: Position[] = [];

  // Define front corners based on T-piece orientation
  // The "front" is the direction where the T-piece's stem points
  switch (piece.rotation) {
    case 0: // T pointing up - front corners are top corners
      frontCorners = [
        { x: center.x - 1, y: center.y - 1 }, // Top-left
        { x: center.x + 1, y: center.y - 1 }, // Top-right
      ];
      break;
    case 1: // T pointing right - front corners are right corners
      frontCorners = [
        { x: center.x + 1, y: center.y - 1 }, // Top-right
        { x: center.x + 1, y: center.y + 1 }, // Bottom-right
      ];
      break;
    case 2: // T pointing down - front corners are bottom corners
      frontCorners = [
        { x: center.x - 1, y: center.y + 1 }, // Bottom-left
        { x: center.x + 1, y: center.y + 1 }, // Bottom-right
      ];
      break;
    case 3: // T pointing left - front corners are left corners
      frontCorners = [
        { x: center.x - 1, y: center.y - 1 }, // Top-left
        { x: center.x - 1, y: center.y + 1 }, // Bottom-left
      ];
      break;
  }

  return frontCorners.filter((pos) => isCellOccupied(board, pos)).length;
}

/**
 * Determines if T-Spin is Mini or Normal based on front corners and wall kick usage
 * @param frontCornersFilled Number of front corners filled
 * @param usedWallKick Whether wall kick was used
 * @returns T-Spin type
 */
function determineTSpinType(frontCornersFilled: number, usedWallKick: boolean): TSpinType {
  // T-Spin Mini conditions:
  // 1. Only 1 front corner filled, OR
  // 2. No wall kick used (point-blank T-Spin)
  if (frontCornersFilled === 1 || !usedWallKick) {
    return "mini";
  }

  // T-Spin Normal: 2 front corners filled AND wall kick used
  return "normal";
}

/**
 * Utility function to check if a position is valid (for testing)
 * @param board Game board
 * @param pos Position to check
 * @returns True if position is valid and not occupied
 */
export function isPositionValid(board: GameBoard, pos: Position): boolean {
  return (
    pos.x >= 0 &&
    pos.x < board[0].length &&
    pos.y >= 0 &&
    pos.y < board.length &&
    board[pos.y][pos.x] === 0
  );
}

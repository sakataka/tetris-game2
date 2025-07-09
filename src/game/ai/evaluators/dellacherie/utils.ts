import type { BitBoard } from "@/game/ai/core/bitboard";
import { getPieceBitsAtPosition } from "@/game/ai/core/piece-bits";
import type { RotationState, TetrominoTypeName } from "@/types/game";
import type { Move } from "./types";

/**
 * Utility function to create a move object
 * Helps with type safety and consistency
 *
 * @param piece - Tetromino type
 * @param rotation - Rotation state
 * @param x - X position
 * @param y - Y position
 * @returns Properly formatted move object
 */
export function createMove(
  piece: TetrominoTypeName,
  rotation: RotationState,
  x: number,
  y: number,
): Move {
  return {
    piece,
    rotation,
    x,
    y,
    pieceBitRows: getPieceBitsAtPosition(piece, rotation, x),
  };
}

/**
 * Find the drop position for a piece at given X and rotation
 * Simulates gravity to find where the piece would naturally land
 *
 * @param board - Current board state
 * @param piece - Tetromino type
 * @param rotation - Rotation state
 * @param x - X position
 * @returns Y position where piece would land, or -1 if invalid
 */
export function findDropPosition(
  board: BitBoard,
  piece: TetrominoTypeName,
  rotation: RotationState,
  x: number,
): number {
  const pieceBitRows = getPieceBitsAtPosition(piece, rotation, x);

  if (pieceBitRows.length === 0) {
    return -1; // Invalid position
  }

  // Start from top and find first valid position
  for (let y = 0; y <= 20 - pieceBitRows.length; y++) {
    if (board.canPlace(pieceBitRows, y)) {
      // Check if the piece would be supported (can't fall further)
      const nextY = y + 1;
      if (nextY + pieceBitRows.length > 20 || !board.canPlace(pieceBitRows, nextY)) {
        return y;
      }
    }
  }

  return -1; // No valid position found
}

import type { BitBoard } from "@/game/ai/core/bitboard";
import { getPieceBitPattern } from "@/game/ai/core/piece-bits";
import type { Move } from "../types";

/**
 * Calculate landing height feature
 * Height of the piece's center of mass plus contributing factor
 *
 * @param board - Original board state
 * @param move - Move being evaluated
 * @returns Landing height value
 */
export function calculateLandingHeight(_board: BitBoard, move: Move): number {
  const pattern = getPieceBitPattern(move.piece, move.rotation);

  // Calculate piece center of mass Y coordinate
  let totalY = 0;
  let cellCount = 0;

  for (let i = 0; i < pattern.rows.length; i++) {
    const rowBits = pattern.rows[i];
    let bits = rowBits;
    while (bits) {
      totalY += move.y + i;
      cellCount++;
      bits &= bits - 1; // Clear lowest set bit
    }
  }

  const centerY = cellCount > 0 ? totalY / cellCount : move.y;

  // Convert to height from bottom (higher values = closer to top)
  return 20 - centerY;
}

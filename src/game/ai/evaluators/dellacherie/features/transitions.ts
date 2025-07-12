import type { BitBoardData } from "@/game/ai/core/bitboard";
import { getRowBits } from "@/game/ai/core/bitboard";

/**
 * Calculate row transitions (horizontal discontinuities)
 * Counts transitions between empty and filled cells along rows
 *
 * @param board - Board state to analyze
 * @returns Number of row transitions
 */
export function calculateRowTransitions(board: BitBoardData): number {
  let transitions = 0;

  for (let y = 0; y < 20; y++) {
    const rowBits = getRowBits(board, y);

    // Only count transitions for non-empty rows
    if (rowBits === 0) continue;

    let lastBit = 1; // Left wall considered filled

    for (let x = 0; x < 10; x++) {
      const currentBit = (rowBits >> x) & 1;
      if (currentBit !== lastBit) {
        transitions++;
      }
      lastBit = currentBit;
    }

    // Right wall transition
    if (lastBit === 0) {
      transitions++;
    }
  }

  return transitions;
}

/**
 * Calculate column transitions (vertical discontinuities)
 * Counts transitions between empty and filled cells along columns
 *
 * @param board - Board state to analyze
 * @returns Number of column transitions
 */
export function calculateColumnTransitions(board: BitBoardData): number {
  let transitions = 0;

  for (let x = 0; x < 10; x++) {
    let lastBit = 1; // Bottom floor considered filled

    for (let y = 19; y >= 0; y--) {
      const currentBit = (getRowBits(board, y) >> x) & 1;
      if (currentBit !== lastBit) {
        transitions++;
      }
      lastBit = currentBit;
    }

    // Top boundary transition
    if (lastBit === 0) {
      transitions++;
    }
  }

  return transitions;
}

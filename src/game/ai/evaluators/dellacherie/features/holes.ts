import type { BitBoardData } from "@/game/ai/core/bitboard";
import { getRowBits } from "@/game/ai/core/bitboard";

/**
 * Calculate holes (empty cells covered by filled cells)
 * A hole is an empty cell with at least one filled cell above it
 *
 * @param board - Board state to analyze
 * @returns Number of holes
 */
export function calculateHoles(board: BitBoardData): number {
  let holes = 0;

  for (let x = 0; x < 10; x++) {
    let blockFound = false;

    for (let y = 0; y < 20; y++) {
      const bit = (getRowBits(board, y) >> x) & 1;

      if (bit === 1) {
        blockFound = true;
      } else if (blockFound) {
        holes++;
      }
    }
  }

  return holes;
}

/**
 * Calculate blocks above holes penalty
 * Counts the number of blocks above each hole to assess depth penalty
 * Deep holes are exponentially harder to clear
 *
 * @param board - Board state to analyze
 * @returns Number of blocks above all holes
 */
export function calculateBlocksAboveHoles(board: BitBoardData): number {
  let penalty = 0;

  for (let x = 0; x < 10; x++) {
    const holes: number[] = [];
    let blockFound = false;

    // First pass: identify all holes in this column
    for (let y = 0; y < 20; y++) {
      const cellFilled = (getRowBits(board, y) >> x) & 1;

      if (cellFilled) {
        blockFound = true;
      } else if (blockFound) {
        // This is a hole
        holes.push(y);
      }
    }

    // Second pass: for each hole, count blocks above it
    for (const holeY of holes) {
      let blocksAbove = 0;
      for (let y = holeY - 1; y >= 0; y--) {
        const cellFilled = (getRowBits(board, y) >> x) & 1;
        if (cellFilled) {
          blocksAbove++;
        }
      }
      penalty += blocksAbove;
    }
  }

  return penalty;
}

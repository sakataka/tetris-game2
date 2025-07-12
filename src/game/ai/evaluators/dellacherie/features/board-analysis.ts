import type { BitBoardData } from "@/game/ai/core/bitboard";
import { getRowBits } from "@/game/ai/core/bitboard";
import { calculateBlocksAboveHoles } from "./holes";
import { calculateWellOpen } from "./wells";

/**
 * Calculate bumpiness feature
 * Sum of absolute height differences between adjacent columns
 * Lower values indicate a flatter, more stable surface
 *
 * @param board - BitBoard to analyze
 * @returns Bumpiness value (0 = perfectly flat)
 */
export function calculateBumpiness(board: BitBoardData): number {
  const heights = getColumnHeights(board);
  let bumpiness = 0;

  // Sum absolute differences between adjacent columns
  for (let x = 0; x < heights.length - 1; x++) {
    bumpiness += Math.abs(heights[x] - heights[x + 1]);
  }

  return bumpiness;
}

/**
 * Calculate maximum height feature
 * Returns the height of the tallest column on the board
 * Critical for height control and dangerous stacking prevention
 *
 * @param board - Board state to analyze
 * @returns Maximum column height
 */
export function calculateMaxHeight(board: BitBoardData): number {
  const heights = getColumnHeights(board);
  return Math.max(...heights);
}

/**
 * Calculate row fill ratio feature
 * Evaluates how close rows are to completion for strategic horizontal filling
 * Rewards moves that work toward completing nearly-full rows
 *
 * @param board - Board state to analyze
 * @returns Row fill ratio score (higher = better horizontal filling)
 */
export function calculateRowFillRatio(board: BitBoardData): number {
  let totalScore = 0;
  let significantRows = 0;

  for (let y = 0; y < 20; y++) {
    const rowBits = getRowBits(board, y);
    if (rowBits === 0) continue; // Skip empty rows

    // Count filled cells in this row using Brian Kernighan's algorithm
    let filledCells = 0;
    let bits = rowBits;
    while (bits) {
      filledCells++;
      bits &= bits - 1; // Clear the lowest set bit
    }
    const fillRatio = filledCells / 10; // 10 is board width

    // Apply weighted scoring for near-complete rows
    if (fillRatio >= 0.7) {
      // Rows that are 70%+ complete get exponential scoring
      const completionBonus = fillRatio ** 3 * 10;
      totalScore += completionBonus;
      significantRows++;
    } else if (fillRatio >= 0.5) {
      // Rows that are 50%+ complete get linear scoring
      totalScore += fillRatio * 2;
      significantRows++;
    }
  }

  // Normalize by number of significant rows to avoid favoring tall stacks
  return significantRows > 0 ? totalScore / significantRows : 0;
}

/**
 * Calculate escape route analysis
 * Evaluates recovery potential from critical situations
 *
 * @param board - Board state to analyze
 * @returns Escape route score (higher = better recovery potential)
 */
export function calculateEscapeRoute(board: BitBoardData): number {
  const heights = getColumnHeights(board);
  const maxHeight = Math.max(...heights);
  const avgHeight = heights.reduce((sum, h) => sum + h, 0) / heights.length;
  const heightVariance =
    heights.reduce((sum, h) => sum + Math.abs(h - avgHeight), 0) / heights.length;

  // Base escape potential
  let escapeScore = 0;

  // Lower board height = better escape potential
  escapeScore += Math.max(0, 10 - maxHeight);

  // Lower height variance = more stable board
  escapeScore += Math.max(0, 5 - heightVariance);

  // Check for well accessibility
  const wellOpen = calculateWellOpen(board);
  if (wellOpen) {
    escapeScore += 5;
  }

  // Penalty for blocks above holes
  const blocksAboveHoles = calculateBlocksAboveHoles(board);
  escapeScore -= blocksAboveHoles * 0.5;

  return escapeScore;
}

/**
 * Get height of each column on the board
 * @param board - Board state to analyze
 * @returns Array of column heights
 */
export function getColumnHeights(board: BitBoardData): number[] {
  const heights: number[] = [];

  for (let x = 0; x < 10; x++) {
    let height = 0;
    for (let y = 0; y < 20; y++) {
      if ((getRowBits(board, y) >> x) & 1) {
        height = 20 - y;
        break;
      }
    }
    heights.push(height);
  }

  return heights;
}

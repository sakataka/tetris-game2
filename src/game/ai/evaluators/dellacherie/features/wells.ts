import type { BitBoard } from "@/game/ai/core/bitboard";

/**
 * Calculate wells (empty columns surrounded by filled cells)
 * Uses depth-weighted scoring: deeper wells are penalized more heavily
 *
 * @param board - Board state to analyze
 * @returns Sum of weighted well depths
 */
export function calculateWells(board: BitBoard): number {
  let wells = 0;

  for (let x = 0; x < 10; x++) {
    // Track well depths from bottom to top
    let wellDepth = 0;
    let inWell = false;

    for (let y = 19; y >= 0; y--) {
      const current = (board.getRowBits(y) >> x) & 1;
      const left = x > 0 ? (board.getRowBits(y) >> (x - 1)) & 1 : 1;
      const right = x < 9 ? (board.getRowBits(y) >> (x + 1)) & 1 : 1;

      if (current === 0 && left === 1 && right === 1) {
        // Empty cell surrounded by filled cells (well)
        if (!inWell) {
          inWell = true;
          wellDepth = 1;
        } else {
          wellDepth++;
        }
      } else {
        // Not a well cell
        if (inWell) {
          // End of well - add weighted depth
          wells += (wellDepth * (wellDepth + 1)) / 2;
          inWell = false;
          wellDepth = 0;
        }
      }
    }

    // Handle well that extends to the top
    if (inWell) {
      wells += (wellDepth * (wellDepth + 1)) / 2;
    }
  }

  return wells;
}

/**
 * Calculate well open detection
 * Determines if the deepest well is accessible for I-piece placement
 *
 * @param board - Board state to analyze
 * @returns true if well is accessible, false otherwise
 */
export function calculateWellOpen(board: BitBoard): boolean {
  const heights = getColumnHeights(board);
  const maxHeight = Math.max(...heights);

  // If board is very low, consider wells open
  if (maxHeight <= 3) {
    return true;
  }

  // Find wells - columns that are significantly lower than neighbors
  for (let x = 0; x < 10; x++) {
    const currentHeight = heights[x];
    const leftHeight = x > 0 ? heights[x - 1] : currentHeight + 10;
    const rightHeight = x < 9 ? heights[x + 1] : currentHeight + 10;

    // Check if this forms a well (lower than both neighbors by at least 1)
    const isWell = currentHeight + 1 <= leftHeight && currentHeight + 1 <= rightHeight;

    if (isWell) {
      // Check if there's enough space for an I-piece (at least 4 rows)
      const availableSpace = Math.min(leftHeight, rightHeight) - currentHeight;
      if (availableSpace >= 4) {
        // Additional check: well must be at least 4 rows deep from bottom
        const wellDepth = 20 - currentHeight;
        if (wellDepth >= 4) {
          // Make sure the well isn't blocked by very high columns elsewhere
          const averageHeight = heights.reduce((sum, h) => sum + h, 0) / heights.length;
          if (currentHeight <= averageHeight + 2) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

/**
 * Get height of each column on the board
 * @param board - Board state to analyze
 * @returns Array of column heights
 */
function getColumnHeights(board: BitBoard): number[] {
  const heights: number[] = [];

  for (let x = 0; x < 10; x++) {
    let height = 0;
    for (let y = 0; y < 20; y++) {
      if ((board.getRowBits(y) >> x) & 1) {
        height = 20 - y;
        break;
      }
    }
    heights.push(height);
  }

  return heights;
}

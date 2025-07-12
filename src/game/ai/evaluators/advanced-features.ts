import type { BitBoardData } from "@/game/ai/core/bitboard";
import { calculateHeight, countOccupiedCells, getRowBits } from "@/game/ai/core/bitboard";

/**
 * T-Spin opportunity detection result
 */
export interface TSpinOpportunity {
  /** Type of T-Spin: TSS (1 line), TSD (2 lines), TST (3 lines) */
  type: "TSS" | "TSD" | "TST";
  /** Position where T-piece should be placed */
  position: { x: number; y: number };
  /** Expected number of lines to clear */
  expectedLines: number;
  /** Priority score for this opportunity */
  priority: number;
}

/**
 * Perfect Clear opportunity detection result
 */
export interface PerfectClearOpportunity {
  /** Number of blocks remaining on board */
  remainingBlocks: number;
  /** Difficulty rating (0-10, lower is easier) */
  difficulty: number;
  /** Estimated moves needed to achieve PC */
  estimatedMoves: number;
}

/**
 * Advanced terrain evaluation metrics
 */
export interface TerrainEvaluation {
  /** Board smoothness (0-1, higher is better) */
  smoothness: number;
  /** Accessibility of empty cells (0-1, higher is better) */
  accessibility: number;
  /** T-Spin setup potential (0-1, higher is better) */
  tSpinPotential: number;
  /** Perfect Clear potential (0-1, higher is better) */
  pcPotential: number;
}

/**
 * Advanced feature detection and evaluation for Tetris AI
 * Implements T-Spin recognition, Perfect Clear detection, and terrain analysis
 */
export class AdvancedFeatures {
  /**
   * Detect T-Spin opportunities on the current board
   * @param board - Current board state
   * @returns Array of T-Spin opportunities sorted by priority
   */
  detectTSpinOpportunity(board: BitBoardData): TSpinOpportunity[] {
    const opportunities: TSpinOpportunity[] = [];

    // Scan board for T-Spin slot patterns
    for (let x = 1; x < 9; x++) {
      for (let y = 1; y < 19; y++) {
        const pattern = this.extractPattern(board, x, y, 3, 3);

        if (this.isTSpinPattern(pattern)) {
          const tSpinType = this.getTSpinType(pattern);
          const expectedLines = this.calculateTSpinLines(pattern);
          const priority = this.calculateTSpinPriority(pattern, x, y);

          opportunities.push({
            type: tSpinType,
            position: { x, y },
            expectedLines,
            priority,
          });
        }
      }
    }

    // Sort by priority (highest first)
    return opportunities.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Detect Perfect Clear opportunities
   * @param board - Current board state
   * @returns Perfect Clear opportunity or null if not possible
   */
  detectPerfectClear(board: BitBoardData): PerfectClearOpportunity | null {
    const totalBlocks = countOccupiedCells(board);

    // Perfect Clear only feasible with some blocks present (1-40) and divisible by 4
    if (totalBlocks > 0 && totalBlocks <= 40 && totalBlocks % 4 === 0) {
      const difficulty = this.calculatePCDifficulty(board);
      const estimatedMoves = Math.ceil(totalBlocks / 4);

      return {
        remainingBlocks: totalBlocks,
        difficulty,
        estimatedMoves,
      };
    }

    return null;
  }

  /**
   * Evaluate terrain characteristics for strategic planning
   * @param board - Current board state
   * @returns Comprehensive terrain evaluation
   */
  evaluateTerrain(board: BitBoardData): TerrainEvaluation {
    return {
      smoothness: this.calculateSmoothness(board),
      accessibility: this.calculateAccessibility(board),
      tSpinPotential: this.calculateTSpinPotential(board),
      pcPotential: this.calculatePCPotential(board),
    };
  }

  /**
   * Extract a pattern from the board at specific coordinates
   * @param board - Board state
   * @param x - Starting X coordinate
   * @param y - Starting Y coordinate
   * @param width - Pattern width
   * @param height - Pattern height
   * @returns 2D pattern array (1 = occupied, 0 = empty)
   */
  private extractPattern(
    board: BitBoardData,
    x: number,
    y: number,
    width: number,
    height: number,
  ): number[][] {
    const pattern: number[][] = [];

    for (let dy = 0; dy < height; dy++) {
      pattern[dy] = [];
      for (let dx = 0; dx < width; dx++) {
        const row = y + dy;
        const col = x + dx;

        if (row < 0 || row >= 20 || col < 0 || col >= 10) {
          // Out of bounds treated as solid wall
          pattern[dy][dx] = 1;
        } else {
          const rowBits = getRowBits(board, row);
          pattern[dy][dx] = (rowBits >> col) & 1;
        }
      }
    }

    return pattern;
  }

  /**
   * Check if a 3x3 pattern represents a T-Spin slot
   * @param pattern - 3x3 pattern to analyze
   * @returns Whether pattern is T-Spin compatible
   */
  private isTSpinPattern(pattern: number[][]): boolean {
    if (pattern.length !== 3 || pattern[0].length !== 3) {
      return false;
    }

    // Basic T-Spin pattern: center should be empty with proper corners
    const center = pattern[1][1];
    if (center !== 0) return false;

    // Count solid corners (minimum 3 for T-Spin)
    const corners = [
      pattern[0][0], // Top-left
      pattern[0][2], // Top-right
      pattern[2][0], // Bottom-left
      pattern[2][2], // Bottom-right
    ];

    const solidCorners = corners.filter((c) => c === 1).length;
    return solidCorners >= 3;
  }

  /**
   * Determine T-Spin type from pattern
   * @param pattern - 3x3 pattern
   * @returns T-Spin type
   */
  private getTSpinType(pattern: number[][]): "TSS" | "TSD" | "TST" {
    // Count potential lines that could be cleared
    const potentialLines = this.countPotentialTSpinLines(pattern);

    if (potentialLines >= 3) return "TST";
    if (potentialLines >= 2) return "TSD";
    return "TSS";
  }

  /**
   * Count potential lines for T-Spin
   * @param pattern - 3x3 pattern
   * @returns Number of potential lines
   */
  private countPotentialTSpinLines(pattern: number[][]): number {
    let lines = 0;

    // Check each row for near-completion
    for (let row = 0; row < 3; row++) {
      const emptyCount = pattern[row].filter((cell) => cell === 0).length;
      if (emptyCount <= 1) lines++; // Row is nearly complete
    }

    return lines;
  }

  /**
   * Calculate expected lines to clear for T-Spin
   * @param pattern - 3x3 pattern
   * @returns Number of lines that will be cleared
   */
  private calculateTSpinLines(pattern: number[][]): number {
    // Simplified calculation based on pattern analysis
    return this.countPotentialTSpinLines(pattern);
  }

  /**
   * Calculate priority score for T-Spin opportunity
   * @param pattern - 3x3 pattern
   * @param x - X position
   * @param y - Y position
   * @returns Priority score (higher is better)
   */
  private calculateTSpinPriority(pattern: number[][], x: number, y: number): number {
    let priority = 0;

    // Base priority from lines cleared
    const lines = this.calculateTSpinLines(pattern);
    priority += lines * 10;

    // Bonus for lower positions (easier to set up)
    priority += (20 - y) * 0.5;

    // Bonus for center positions (more accessible)
    const centerDistance = Math.abs(x - 5);
    priority += (5 - centerDistance) * 0.3;

    return priority;
  }

  /**
   * Calculate Perfect Clear difficulty rating
   * @param board - Board state
   * @returns Difficulty score (0-10, lower is easier)
   */
  private calculatePCDifficulty(board: BitBoardData): number {
    const height = calculateHeight(board);
    const blocks = countOccupiedCells(board);

    // Base difficulty from height and block count
    let difficulty = height * 0.3 + blocks * 0.1;

    // Increase difficulty for irregular shapes
    const smoothness = this.calculateSmoothness(board);
    difficulty += (1 - smoothness) * 5;

    return Math.min(difficulty, 10);
  }

  /**
   * Calculate board smoothness metric
   * @param board - Board state
   * @returns Smoothness score (0-1, higher is smoother)
   */
  private calculateSmoothness(board: BitBoardData): number {
    const heights = this.getColumnHeights(board);
    let heightDifferences = 0;

    for (let x = 0; x < 9; x++) {
      heightDifferences += Math.abs(heights[x] - heights[x + 1]);
    }

    // Normalize to 0-1 scale
    return 1 / (1 + heightDifferences * 0.1);
  }

  /**
   * Calculate accessibility of empty cells
   * @param board - Board state
   * @returns Accessibility score (0-1, higher is better)
   */
  private calculateAccessibility(board: BitBoardData): number {
    let accessibleCells = 0;
    let totalEmptyCells = 0;

    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 20; y++) {
        const rowBits = getRowBits(board, y);
        const cell = (rowBits >> x) & 1;

        if (cell === 0) {
          totalEmptyCells++;

          // Check if cell is accessible from top
          let accessible = true;
          for (let checkY = 0; checkY < y; checkY++) {
            const checkRowBits = getRowBits(board, checkY);
            if ((checkRowBits >> x) & 1) {
              accessible = false;
              break;
            }
          }

          if (accessible) accessibleCells++;
        }
      }
    }

    return totalEmptyCells === 0 ? 1 : accessibleCells / totalEmptyCells;
  }

  /**
   * Calculate T-Spin setup potential
   * @param board - Board state
   * @returns T-Spin potential score (0-1, higher is better)
   */
  private calculateTSpinPotential(board: BitBoardData): number {
    const opportunities = this.detectTSpinOpportunity(board);

    if (opportunities.length === 0) return 0;

    // Normalize based on best opportunity priority
    const maxPriority = opportunities[0].priority;
    return Math.min(maxPriority / 50, 1);
  }

  /**
   * Calculate Perfect Clear potential
   * @param board - Board state
   * @returns PC potential score (0-1, higher is better)
   */
  private calculatePCPotential(board: BitBoardData): number {
    const pcOp = this.detectPerfectClear(board);

    if (!pcOp) return 0;

    // Higher potential for fewer blocks and lower difficulty
    const blockFactor = 1 - pcOp.remainingBlocks / 40;
    const difficultyFactor = 1 - pcOp.difficulty / 10;

    return (blockFactor + difficultyFactor) / 2;
  }

  /**
   * Get height of each column
   * @param board - Board state
   * @returns Array of column heights
   */
  private getColumnHeights(board: BitBoardData): number[] {
    const heights: number[] = [];

    for (let x = 0; x < 10; x++) {
      heights[x] = 0;

      for (let y = 0; y < 20; y++) {
        const rowBits = getRowBits(board, y);
        if ((rowBits >> x) & 1) {
          heights[x] = 20 - y;
          break;
        }
      }
    }

    return heights;
  }
}

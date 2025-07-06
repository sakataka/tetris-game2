import type { TSpinType } from "./tSpin";

// Re-export TSpinType for external use
export type { TSpinType } from "./tSpin";

/**
 * T-Spin scoring multipliers based on Tetris Guidelines
 */
const TSPIN_SCORING = {
  none: {
    0: 0,
    1: 100,
    2: 300,
    3: 500,
    4: 800,
  },
  mini: {
    0: 100,
    1: 200,
    2: 400,
    3: 0, // T-Spin Mini Triple doesn't exist in standard rules
    4: 0, // T-Spin Mini Tetris doesn't exist in standard rules
  },
  normal: {
    0: 400,
    1: 800,
    2: 1200,
    3: 1600,
    4: 0, // T-Spin Tetris doesn't exist in standard rules
  },
} as const;

/**
 * Calculates score for line clears with T-Spin detection
 * @param linesCleared Number of lines cleared (0-4)
 * @param level Current game level
 * @param tSpinType Type of T-Spin performed
 * @returns Score points to award
 */
export function calculateTSpinScore(
  linesCleared: number,
  level: number,
  tSpinType: TSpinType = "none",
): number {
  // Validate input parameters
  if (linesCleared < 0 || linesCleared > 4) {
    throw new Error(`Invalid linesCleared: ${linesCleared}. Must be 0-4.`);
  }

  if (level < 1) {
    throw new Error(`Invalid level: ${level}. Must be >= 1.`);
  }

  // Get base score from T-Spin scoring table
  const baseScore =
    TSPIN_SCORING[tSpinType][linesCleared as keyof (typeof TSPIN_SCORING)[TSpinType]];

  // Apply level multiplier
  return baseScore * level;
}

/**
 * Legacy scoring function for backward compatibility
 * @param linesCleared Number of lines cleared (0-4)
 * @param level Current game level
 * @returns Score points to award
 */
export function calculateScore(linesCleared: number, level: number): number {
  return calculateTSpinScore(linesCleared, level, "none");
}

/**
 * Gets the T-Spin type name for display purposes
 * @param tSpinType Type of T-Spin
 * @param linesCleared Number of lines cleared
 * @returns Display name for the T-Spin type
 */
export function getTSpinDisplayName(tSpinType: TSpinType, linesCleared: number): string {
  if (tSpinType === "none") {
    switch (linesCleared) {
      case 1:
        return "SINGLE";
      case 2:
        return "DOUBLE";
      case 3:
        return "TRIPLE";
      case 4:
        return "TETRIS";
      default:
        return "";
    }
  }

  const spinTypeName = tSpinType === "mini" ? "T-SPIN MINI" : "T-SPIN";

  switch (linesCleared) {
    case 0:
      return spinTypeName;
    case 1:
      return `${spinTypeName} SINGLE`;
    case 2:
      return `${spinTypeName} DOUBLE`;
    case 3:
      return `${spinTypeName} TRIPLE`;
    default:
      return spinTypeName;
  }
}

/**
 * Checks if a T-Spin type and line clear combination is valid
 * @param tSpinType Type of T-Spin
 * @param linesCleared Number of lines cleared
 * @returns True if combination is valid
 */
export function isValidTSpinCombination(tSpinType: TSpinType, linesCleared: number): boolean {
  if (tSpinType === "none") {
    return linesCleared >= 0 && linesCleared <= 4;
  }

  if (tSpinType === "mini") {
    return linesCleared >= 0 && linesCleared <= 2;
  }

  if (tSpinType === "normal") {
    return linesCleared >= 0 && linesCleared <= 3;
  }

  return false;
}

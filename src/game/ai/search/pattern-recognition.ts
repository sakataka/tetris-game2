import type { Move } from "@/game/ai/core/move-generator";
import type { PatternTemplate } from "@/game/ai/evaluators/patterns";
import type { TetrominoTypeName } from "@/types/game";
import { DEFAULT_PRUNING_RULES, PatternSearchCore } from "./pattern-search-core";

/**
 * Count number of set bits in a number
 */
function countBits(n: number): number {
  let count = 0;
  let temp = n;
  while (temp) {
    count++;
    temp &= temp - 1;
  }
  return count;
}

/**
 * Check if pattern is complete on the given board
 */
export function isPatternComplete(board: Uint32Array, template: PatternTemplate): boolean {
  // Check if all required positions are filled
  for (let row = 0; row < Math.min(20, template.occupiedMask.length); row++) {
    if ((board[row] & template.occupiedMask[row]) !== template.occupiedMask[row]) {
      return false;
    }
  }

  // Check if all required empty positions are empty
  for (let row = 0; row < Math.min(20, template.emptyMask.length); row++) {
    if ((board[row] & template.emptyMask[row]) !== 0) {
      return false;
    }
  }

  return true;
}

/**
 * Count empty squares required to complete pattern
 */
export function countEmptySquares(board: Uint32Array, template: PatternTemplate): number {
  let count = 0;
  for (let row = 0; row < Math.min(20, template.occupiedMask.length); row++) {
    const missingMask = template.occupiedMask[row] & ~board[row];
    count += countBits(missingMask);
  }
  return count;
}

/**
 * Score how well a move fits the pattern
 */
export function scoreMoveFit(move: Move, template: PatternTemplate): number {
  let score = 0;

  // This is a simplified version - in the full implementation,
  // we would need to import the piece bits utilities
  // For now, we'll use a basic scoring system

  // Bonus for lower placement (prefer building from bottom)
  score += (20 - move.y) * 0.1;

  // Additional scoring based on piece type and pattern requirements
  if (template.requiredPieces.includes(move.piece)) {
    score += 2.0; // Bonus for using required pieces
  }

  // Prefer hold piece if specified
  if (template.holdPiece === move.piece) {
    score += 1.0;
  }

  return score;
}

/**
 * Analyze pattern difficulty based on board state and piece queue
 */
export function analyzePatternDifficulty(
  board: Uint32Array,
  pieceQueue: TetrominoTypeName[],
  template: PatternTemplate,
): {
  missingPieces: TetrominoTypeName[];
  emptySquares: number;
  heightRequirement: number;
  estimatedDifficulty: number;
} {
  const availablePieces = new Map<TetrominoTypeName, number>();
  const lookAheadLimit = Math.min(pieceQueue.length, 7);

  // Count available pieces
  for (let i = 0; i < lookAheadLimit; i++) {
    const piece = pieceQueue[i];
    availablePieces.set(piece, (availablePieces.get(piece) || 0) + 1);
  }

  // Find missing pieces
  const missingPieces: TetrominoTypeName[] = [];
  for (const requiredPiece of template.requiredPieces) {
    const available = availablePieces.get(requiredPiece) || 0;
    if (available === 0) {
      missingPieces.push(requiredPiece);
    }
  }

  // Calculate empty squares and height requirement
  const emptySquares = countEmptySquares(board, template);
  let heightRequirement = 0;
  for (let row = 19; row >= 0; row--) {
    if (template.occupiedMask[row] !== 0) {
      heightRequirement = row + 1;
      break;
    }
  }

  // Estimate difficulty (0-1 scale, higher = more difficult)
  let difficulty = 0;
  difficulty += missingPieces.length * 0.3; // Missing pieces increase difficulty
  difficulty += emptySquares * 0.01; // More empty squares = harder
  difficulty += Math.max(0, heightRequirement - 10) * 0.05; // Height penalty
  difficulty = Math.min(1, difficulty);

  return {
    missingPieces,
    emptySquares,
    heightRequirement,
    estimatedDifficulty: difficulty,
  };
}

/**
 * Enhanced feasibility check using pattern search
 */
export function checkPatternFeasibility(
  board: Uint32Array,
  pieceQueue: TetrominoTypeName[],
  template: PatternTemplate,
): { isPossible: boolean; moveSequence: Move[]; confidence: number } {
  // Pre-check: ensure all required pieces are available in the queue
  const availablePieces = new Map<TetrominoTypeName, number>();
  const lookAheadLimit = Math.min(pieceQueue.length, 7); // Look ahead up to 7 pieces

  for (let i = 0; i < lookAheadLimit; i++) {
    const piece = pieceQueue[i];
    availablePieces.set(piece, (availablePieces.get(piece) || 0) + 1);
  }

  // Check if we have all required pieces
  const missingPieces: TetrominoTypeName[] = [];
  for (const requiredPiece of template.requiredPieces) {
    const available = availablePieces.get(requiredPiece) || 0;
    if (available === 0) {
      missingPieces.push(requiredPiece);
    }
  }

  // If missing critical pieces, return early with template-specific confidence
  if (missingPieces.length > 0) {
    // Give small confidence based on template complexity and piece availability
    const availabilityRatio =
      (template.requiredPieces.length - missingPieces.length) / template.requiredPieces.length;
    const baseConfidence = template.successRate * 0.1; // 10% of base success rate
    const confidence = Math.max(0.01, baseConfidence * availabilityRatio); // Ensure minimum confidence

    return {
      isPossible: false,
      moveSequence: [],
      confidence,
    };
  }

  const search = new PatternSearchCore({
    maxDepth: template.requiredPieces.length,
    pruningRules: [
      DEFAULT_PRUNING_RULES.noEarlyHoles,
      DEFAULT_PRUNING_RULES.heightLimit,
      DEFAULT_PRUNING_RULES.symmetryReduction,
    ],
    timeLimit: 100, // 100ms time limit
  });

  const result = search.search(board, pieceQueue, template);

  // Calculate confidence based on search result and piece queue position
  let confidence = 0;

  // First, calculate position-based confidence
  let totalWeightedPosition = 0;
  let totalWeight = 0;

  for (const requiredPiece of template.requiredPieces) {
    const position = pieceQueue.indexOf(requiredPiece);
    if (position >= 0 && position < lookAheadLimit) {
      // Give more weight to hold piece and critical pieces
      const weight = template.holdPiece === requiredPiece ? 3 : 1;
      totalWeightedPosition += position * weight;
      totalWeight += weight;
    }
  }

  // Calculate base confidence from piece positions
  if (totalWeight > 0) {
    const averagePosition = totalWeightedPosition / totalWeight;
    // Base confidence starts from success rate but scaled by position
    confidence = template.successRate * (1.0 - averagePosition / 10.0);
    confidence = Math.max(0.01, confidence); // Ensure minimum
  } else {
    confidence = 0.01; // Minimum if no pieces found
  }

  if (result.found) {
    // If pattern is actually found, boost confidence significantly
    confidence = Math.max(confidence, template.successRate);

    // Apply position-based adjustments
    const averagePosition = totalWeight > 0 ? totalWeightedPosition / totalWeight : 6;

    if (averagePosition <= 2) {
      confidence *= 1.15; // Strong bonus for early pieces
    } else if (averagePosition <= 4) {
      confidence *= 1.05; // Mild bonus for moderate position
    } else if (averagePosition > 5) {
      confidence *= 0.85; // Penalty for late pieces
    }

    // Special case: Give extra bonus/penalty for hold piece position
    if (template.holdPiece) {
      const holdPosition = pieceQueue.indexOf(template.holdPiece);
      if (holdPosition === 0) {
        confidence *= 1.1; // Extra bonus for immediate hold piece
      } else if (holdPosition > 4) {
        confidence *= 0.9; // Extra penalty for very late hold piece
      }
    }

    // Clamp confidence to reasonable bounds
    confidence = Math.min(confidence, 1.0);

    // Reduce confidence if many nodes were explored (harder to find)
    if (result.nodesExplored > 1000) {
      confidence *= 0.9;
    }
    // Reduce confidence if search took long
    if (result.timeElapsed > 50) {
      confidence *= 0.95;
    }
  }

  return {
    isPossible: result.found,
    moveSequence: result.path,
    confidence,
  };
}

/**
 * PCO (Perfect Clear Opener) pattern detection
 */
export function detectPCOPattern(board: Uint32Array): {
  isPCOSetup: boolean;
  pcoType: string | null;
  completionPercentage: number;
} {
  // This is a simplified PCO detection - in a full implementation,
  // we would check for specific PCO patterns
  let filledRows = 0;
  let totalCells = 0;

  for (let row = 0; row < 4; row++) {
    // PCO typically focuses on bottom 4 rows
    let cellsInRow = 0;
    for (let col = 0; col < 10; col++) {
      if (board[row] & (1 << col)) {
        cellsInRow++;
      }
    }
    if (cellsInRow > 0) {
      filledRows++;
      totalCells += cellsInRow;
    }
  }

  const completionPercentage = totalCells / 40; // 40 cells in 4 rows
  const isPCOSetup = filledRows >= 2 && completionPercentage >= 0.3;

  return {
    isPCOSetup,
    pcoType: isPCOSetup ? "generic" : null,
    completionPercentage,
  };
}

/**
 * DT Cannon pattern detection
 */
export function detectDTCannonPattern(board: Uint32Array): {
  isDTSetup: boolean;
  cannonType: string | null;
  readinessLevel: number;
} {
  // Simplified DT Cannon detection
  // DT Cannon typically has specific stacking patterns in columns 0-3
  let leftSideHeight = 0;
  let stackingPattern = 0;

  for (let col = 0; col < 4; col++) {
    let colHeight = 0;
    for (let row = 0; row < 20; row++) {
      if (board[row] & (1 << col)) {
        colHeight = row + 1;
      }
    }
    leftSideHeight += colHeight;
    if (colHeight > 6) stackingPattern++;
  }

  const averageLeftHeight = leftSideHeight / 4;
  const isDTSetup = averageLeftHeight >= 6 && stackingPattern >= 2;
  const readinessLevel = Math.min(1, averageLeftHeight / 12);

  return {
    isDTSetup,
    cannonType: isDTSetup ? "generic" : null,
    readinessLevel,
  };
}

/**
 * ST-Stack pattern detection
 */
export function detectSTStackPattern(board: Uint32Array): {
  isSTSetup: boolean;
  stackType: string | null;
  efficiency: number;
} {
  // Simplified ST-Stack detection
  // ST-Stack focuses on smooth stacking patterns
  let totalHeight = 0;
  let heightVariation = 0;

  const columnHeights: number[] = [];
  for (let col = 0; col < 10; col++) {
    let colHeight = 0;
    for (let row = 0; row < 20; row++) {
      if (board[row] & (1 << col)) {
        colHeight = row + 1;
      }
    }
    columnHeights.push(colHeight);
    totalHeight += colHeight;
  }

  // Calculate height variation (lower is better for ST-Stack)
  const averageHeight = totalHeight / 10;
  for (const height of columnHeights) {
    heightVariation += Math.abs(height - averageHeight);
  }
  heightVariation /= 10;

  const isSTSetup = averageHeight >= 3 && heightVariation <= 3;
  const efficiency = Math.max(0, 1 - heightVariation / 6);

  return {
    isSTSetup,
    stackType: isSTSetup ? "smooth" : null,
    efficiency,
  };
}

import type { Move } from "@/game/ai/core/move-generator";
import type { TetrominoTypeName } from "@/types/game";
import { GAME_CONSTANTS } from "@/utils/gameConstants";

/**
 * Game phase for pattern selection strategy
 */
export type GamePhase = "early" | "mid" | "late" | "danger";

/**
 * Pattern template interface for advanced Tetris patterns
 */
export interface PatternTemplate {
  name: string;
  requiredPieces: TetrominoTypeName[];
  occupiedMask: Uint32Array; // Bit mask of required occupied positions
  emptyMask: Uint32Array; // Bit mask of required empty positions
  holdPiece?: TetrominoTypeName;
  attackValue: number; // Number of attack lines
  successRate: number; // Probability of successful execution
  minHeight?: number; // Minimum height requirement
  maxHeight?: number; // Maximum height requirement
}

/**
 * Pattern match result with move sequence and confidence
 */
export interface PatternMatch {
  pattern: PatternTemplate;
  moveSequence: Move[];
  confidence: number;
  estimatedTurns: number;
}

/**
 * Feasibility check result for pattern execution
 */
export interface FeasibilityResult {
  isPossible: boolean;
  moveSequence: Move[];
  confidence: number;
  requiredPieces: TetrominoTypeName[];
  missingPieces: TetrominoTypeName[];
}

/**
 * Pattern weights configuration
 */
export interface PatternWeights {
  PCO: number;
  DT_Cannon: number;
  ST_Stack: number;
  patternTransitionPenalty: number;
}

/**
 * Default pattern weights optimized for competitive play
 */
export const DEFAULT_PATTERN_WEIGHTS: PatternWeights = {
  PCO: 100, // Perfect Clear high value
  DT_Cannon: 120, // Highest attack efficiency
  ST_Stack: 80, // Sustainable attack pattern
  patternTransitionPenalty: -30, // Cost of switching patterns
};

/**
 * Create PCO (Perfect Clear Opener) occupied mask
 */
function createPCOMask(): Uint32Array {
  const mask = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
  // PCO standard formation (rows 0-3 from bottom)
  // Row 0: L L J J S Z □ □ □ □ (6 blocks)
  // Row 1: L J J T T □ □ □ □ □ (5 blocks)
  // Row 2: O O □ □ □ □ □ □ □ □ (2 blocks)
  // Row 3: □ □ □ □ □ □ □ □ □ □ (0 blocks)
  mask[0] = 0b0000111111; // 6 leftmost blocks
  mask[1] = 0b0000011111; // 5 leftmost blocks
  mask[2] = 0b0000000011; // 2 leftmost blocks
  mask[3] = 0b0000000000; // empty row
  return mask;
}

/**
 * Create PCO empty mask (positions that must be empty)
 */
function createPCOEmptyMask(): Uint32Array {
  const mask = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
  // For PCO, columns 6-9 must be empty in rows 0-1 for I-piece placement
  mask[0] = 0b1111000000; // rightmost 4 columns empty
  mask[1] = 0b1111100000; // rightmost 5 columns empty
  mask[2] = 0b1111111100; // rightmost 8 columns empty
  mask[3] = 0b1111111111; // all empty
  // Rows 4+ must be completely empty
  for (let i = 4; i < GAME_CONSTANTS.BOARD.HEIGHT; i++) {
    mask[i] = 0b1111111111;
  }
  return mask;
}

/**
 * Create DT Cannon LS-base occupied mask
 */
function createDTLSMask(): Uint32Array {
  const mask = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
  // DT Cannon LS-base formation (bit 0 = rightmost column, bit 9 = leftmost column)
  // Row 0: L L O O □ □ □ □ □ □  (columns 0-3 occupied)
  // Row 1: L S J J □ □ □ □ □ □  (columns 0-3 occupied)
  // Row 2: S S J □ □ □ □ □ □ □  (columns 0-2 occupied)
  // Row 3: □ S □ □ □ □ □ □ □ □  (column 1 occupied for S continuation)
  mask[0] = 0b1111000000; // 4 rightmost blocks (columns 0-3)
  mask[1] = 0b1111000000; // 4 rightmost blocks (columns 0-3)
  mask[2] = 0b0111000000; // 3 rightmost blocks (columns 0-2)
  mask[3] = 0b0100000000; // S continuation at column 1
  return mask;
}

/**
 * Create DT Cannon empty mask
 */
function createDTLSEmptyMask(): Uint32Array {
  const mask = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
  // T-spin slot must be empty - columns 2-4 in rows 3-4 for T-piece placement
  mask[3] = 0b1000111000; // columns 0,2,3,4 must be empty (T-spin cavity)
  mask[4] = 0b1110000000; // columns 2,3,4 must be empty for T-piece top
  // Rows above formation must be empty
  for (let i = 5; i < GAME_CONSTANTS.BOARD.HEIGHT; i++) {
    mask[i] = 0b1111111111;
  }
  return mask;
}

/**
 * Create ST-Stack notch mask
 */
function createSTStackMask(): Uint32Array {
  const mask = new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT);
  // ST-Stack notch pattern - minimal structure for S-T stacking
  // This is a more flexible pattern as ST-Stack adapts to existing stack
  // Row 0-1: S piece base (2x2 with offset)
  mask[0] = 0b0110000000; // S piece bottom part (columns 1-2)
  mask[1] = 0b1100000000; // S piece top part (columns 0-1)
  // Row 2: T piece will be placed to create 4-line clear potential
  return mask;
}

/**
 * Pattern templates for competitive Tetris
 */
export const PATTERN_TEMPLATES: PatternTemplate[] = [
  {
    name: "PCO_standard",
    requiredPieces: ["L", "J", "O", "T", "S", "Z", "I"],
    occupiedMask: createPCOMask(),
    emptyMask: createPCOEmptyMask(),
    holdPiece: "I",
    attackValue: 10,
    successRate: 0.846,
    maxHeight: 4,
  },
  {
    name: "PCO_vertical_I",
    requiredPieces: ["L", "J", "O", "T", "S", "Z", "I"],
    occupiedMask: createPCOMask(),
    emptyMask: createPCOEmptyMask(),
    holdPiece: undefined,
    attackValue: 10,
    successRate: 0.612,
    maxHeight: 4,
  },
  {
    name: "DT_LS_base",
    requiredPieces: ["L", "S", "J", "O", "T"],
    occupiedMask: createDTLSMask(),
    emptyMask: createDTLSEmptyMask(),
    holdPiece: "T",
    attackValue: 12,
    successRate: 0.4,
    maxHeight: 4,
  },
  {
    name: "ST_Stack_unit",
    requiredPieces: ["S", "T"],
    occupiedMask: createSTStackMask(),
    emptyMask: new Uint32Array(GAME_CONSTANTS.BOARD.HEIGHT),
    holdPiece: undefined,
    attackValue: 4,
    successRate: 0.9,
    minHeight: 4,
    maxHeight: 16,
  },
];

/**
 * Pattern matching engine for detecting and executing advanced Tetris patterns
 */
export class PatternMatcher {
  private templates: Map<string, PatternTemplate>;

  constructor() {
    this.templates = new Map();
    for (const template of PATTERN_TEMPLATES) {
      this.templates.set(template.name, template);
    }
  }

  /**
   * Detect matching patterns on the current board
   */
  detectPatterns(
    board: Uint32Array,
    pieceQueue: TetrominoTypeName[],
    currentHeight: number,
  ): PatternMatch[] {
    const matches: PatternMatch[] = [];

    for (const template of this.templates.values()) {
      // Check height constraints
      if (template.minHeight && currentHeight < template.minHeight) continue;
      if (template.maxHeight && currentHeight > template.maxHeight) continue;

      if (this.matchesTemplate(board, template)) {
        const feasibility = this.checkPieceFeasibility(board, pieceQueue, template);

        if (feasibility.isPossible) {
          matches.push({
            pattern: template,
            moveSequence: feasibility.moveSequence,
            confidence: feasibility.confidence,
            estimatedTurns: feasibility.moveSequence.length,
          });
        }
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Check if board matches pattern template using bit masks
   */
  private matchesTemplate(board: Uint32Array, template: PatternTemplate): boolean {
    // Check occupied positions match
    for (let row = 0; row < Math.min(20, template.occupiedMask.length); row++) {
      if ((board[row] & template.occupiedMask[row]) !== template.occupiedMask[row]) {
        return false;
      }
    }

    // Check empty positions match
    for (let row = 0; row < Math.min(20, template.emptyMask.length); row++) {
      if ((board[row] & template.emptyMask[row]) !== 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if pattern can be completed with available pieces
   */
  private checkPieceFeasibility(
    _board: Uint32Array,
    pieceQueue: TetrominoTypeName[],
    template: PatternTemplate,
  ): FeasibilityResult {
    // Create piece inventory from queue
    const availablePieces = new Map<TetrominoTypeName, number>();
    for (const piece of pieceQueue.slice(0, 7)) {
      // Look ahead up to 7 pieces
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

    // Calculate confidence based on missing pieces and queue position
    let confidence = 1.0;
    if (missingPieces.length > 0) {
      confidence *= Math.max(0, 1 - missingPieces.length * 0.3);
    }

    // Reduce confidence if required pieces are far in the queue
    for (const requiredPiece of template.requiredPieces) {
      const position = pieceQueue.indexOf(requiredPiece);
      if (position > 3) {
        confidence *= 0.9; // Penalty for pieces far in queue
      }
    }

    // For now, return simplified result
    // Full implementation would use DFS to find actual move sequence
    return {
      isPossible: missingPieces.length === 0 && confidence > 0.5,
      moveSequence: [], // Would be filled by path-finding algorithm
      confidence,
      requiredPieces: template.requiredPieces,
      missingPieces,
    };
  }

  /**
   * Get pattern by name
   */
  getPattern(name: string): PatternTemplate | undefined {
    return this.templates.get(name);
  }

  /**
   * Get all available patterns
   */
  getAllPatterns(): PatternTemplate[] {
    return Array.from(this.templates.values());
  }
}

/**
 * Mid-game pattern detector for continuous patterns like ST-Stack
 */
export class MidGamePatternDetector {
  // Pre-computed hashes for ST-notch patterns would be calculated based on specific board configurations

  /**
   * Detect ST-Stack opportunity in current board state
   */
  detectSTStackOpportunity(
    board: Uint32Array,
    pieceQueue: TetrominoTypeName[],
    currentHeight: number,
  ): boolean {
    // Check if height is appropriate for ST-Stack
    if (currentHeight < 4 || currentHeight > 16) {
      return false;
    }

    // Future: Get top rows for pattern matching and optimization
    // const topRows = this.getTopRows(board, this.ST_NOTCH_HEIGHT);
    // const hash = this.hashBoardSection(topRows);

    // Check if pattern matches ST-notch
    if (!this.isSTNotchPattern(board, currentHeight)) {
      return false;
    }

    // Check if S and T pieces are available
    const nextPieces = pieceQueue.slice(0, 6);
    return nextPieces.includes("S") && nextPieces.includes("T");
  }

  /**
   * Check if board has ST-notch pattern
   */
  private isSTNotchPattern(board: Uint32Array, currentHeight: number): boolean {
    // Simplified ST-notch detection
    // Look for specific pattern in top rows that allows ST-stacking

    if (currentHeight < 4) return false;

    // Check for characteristic notch shape
    // This is a simplified version - full implementation would check
    // for specific patterns that enable S → T-Spin sequences
    const topRow = currentHeight - 1;
    if (topRow >= 0 && topRow < board.length) {
      const rowPattern = board[topRow];
      // Check for gaps that could accommodate S and T pieces
      const hasNotch =
        (rowPattern & 0b0001110000) === 0b0001010000 ||
        (rowPattern & 0b0000111000) === 0b0000101000;
      return hasNotch;
    }

    return false;
  }
}

/**
 * Calculate pattern bonus for evaluation
 */
export function calculatePatternBonus(
  match: PatternMatch,
  phase: GamePhase,
  weights: PatternWeights = DEFAULT_PATTERN_WEIGHTS,
): number {
  const { pattern } = match;

  // Base bonus = attack value × success rate × confidence
  let bonus = pattern.attackValue * pattern.successRate * match.confidence;

  // Phase-specific multipliers
  const phaseMultipliers: Record<GamePhase, number> = {
    early: 1.5, // Encourage patterns in early game
    mid: 1.2, // Still valuable in mid game
    late: 0.8, // Less important when board is high
    danger: 0.5, // Survival more important than patterns
  };

  bonus *= phaseMultipliers[phase];

  // Apply pattern-specific weights
  if (pattern.name.includes("PCO")) {
    bonus *= weights.PCO / 100;
  } else if (pattern.name.includes("DT")) {
    bonus *= weights.DT_Cannon / 100;
  } else if (pattern.name.includes("ST")) {
    bonus *= weights.ST_Stack / 100;
  }

  // B2B (Back-to-Back) bonus for T-Spin patterns
  if (pattern.name.includes("DT") || pattern.name.includes("ST")) {
    bonus *= 1.2;
  }

  return bonus * 20; // Scaling factor
}

/**
 * Evaluate board with pattern detection
 */
export function evaluateWithPatterns(
  board: Uint32Array,
  pieceQueue: TetrominoTypeName[],
  currentPhase: GamePhase,
  baseScore: number,
  currentHeight: number,
  weights: PatternWeights = DEFAULT_PATTERN_WEIGHTS,
): number {
  const patternMatcher = new PatternMatcher();

  // Detect matching patterns
  const patterns = patternMatcher.detectPatterns(board, pieceQueue, currentHeight);

  if (patterns.length === 0) {
    return baseScore;
  }

  // Calculate bonus from best pattern
  const bestPattern = patterns[0];
  const patternBonus = calculatePatternBonus(bestPattern, currentPhase, weights);

  return baseScore + patternBonus;
}

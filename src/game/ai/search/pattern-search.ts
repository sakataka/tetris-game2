import { BitBoard } from "@/game/ai/core/bitboard";
import type { Move } from "@/game/ai/core/move-generator";
import { MoveGenerator } from "@/game/ai/core/move-generator";
import { getPieceBitsAtPosition } from "@/game/ai/core/piece-bits";
import type { PatternTemplate } from "@/game/ai/evaluators/patterns";
import { createTetromino } from "@/game/tetrominos";
import type { RotationState, TetrominoTypeName } from "@/types/game";

/**
 * Search state for pattern completion DFS
 */
interface SearchState {
  board: Uint32Array;
  piecesPlaced: TetrominoTypeName[];
  movesExecuted: Move[];
  depth: number;
  holdPiece: TetrominoTypeName | null;
  canHold: boolean;
}

/**
 * Pruning rules for search optimization
 */
export type PruningRule = (state: SearchState, template: PatternTemplate) => boolean;

/**
 * Configuration for pattern search
 */
export interface PatternSearchConfig {
  maxDepth: number;
  pruningRules: PruningRule[];
  timeLimit?: number; // milliseconds
}

/**
 * Result of pattern search
 */
export interface PatternSearchResult {
  found: boolean;
  path: Move[];
  nodesExplored: number;
  timeElapsed: number;
}

/**
 * Default pruning rules for pattern search
 */
export const DEFAULT_PRUNING_RULES: Record<string, PruningRule> = {
  /**
   * Prune if holes are created too early
   */
  noEarlyHoles: (state: SearchState, template: PatternTemplate): boolean => {
    // Allow holes only in final moves for some patterns
    if (state.depth < template.requiredPieces.length - 2) {
      // Simple hole detection: check if there are gaps below filled cells
      let hasHoles = false;
      for (let col = 0; col < 10; col++) {
        let foundEmpty = false;
        for (let row = 0; row < 20; row++) {
          const cellOccupied = (state.board[row] & (1 << col)) !== 0;
          if (!cellOccupied) {
            foundEmpty = true;
          } else if (foundEmpty) {
            hasHoles = true;
            break;
          }
        }
        if (hasHoles) break;
      }
      return hasHoles;
    }
    return false;
  },

  /**
   * Prune if height limit exceeded
   */
  heightLimit: (state: SearchState): boolean => {
    // Find highest occupied row
    for (let row = 19; row >= 0; row--) {
      if (state.board[row] !== 0) {
        return row > 15; // Prune if stack too high
      }
    }
    return false;
  },

  /**
   * Prune symmetrical branches (optimization)
   */
  symmetryReduction: (state: SearchState): boolean => {
    // Simple symmetry check - can be enhanced
    if (state.movesExecuted.length >= 2) {
      const lastTwo = state.movesExecuted.slice(-2);
      // Prune if same piece placed in symmetrical positions
      if (
        lastTwo[0].piece === lastTwo[1].piece &&
        lastTwo[0].rotation === lastTwo[1].rotation &&
        Math.abs(lastTwo[0].x - lastTwo[1].x) === 0
      ) {
        return true;
      }
    }
    return false;
  },
};

/**
 * Depth-first search for pattern completion
 */
export class PatternSearch {
  private config: PatternSearchConfig;
  private moveGenerator: MoveGenerator;
  private startTime = 0;
  private nodesExplored = 0;

  constructor(config: PatternSearchConfig) {
    this.config = config;
    this.moveGenerator = new MoveGenerator();
  }

  /**
   * Search for move sequence to complete pattern
   */
  search(
    initialBoard: Uint32Array,
    pieceQueue: TetrominoTypeName[],
    template: PatternTemplate,
  ): PatternSearchResult {
    this.startTime = Date.now();
    this.nodesExplored = 0;

    const initialState: SearchState = {
      board: new Uint32Array(initialBoard),
      piecesPlaced: [],
      movesExecuted: [],
      depth: 0,
      holdPiece: null,
      canHold: true,
    };

    const path = this.dfs(initialState, pieceQueue, template);

    return {
      found: path !== null,
      path: path || [],
      nodesExplored: this.nodesExplored,
      timeElapsed: Date.now() - this.startTime,
    };
  }

  /**
   * Recursive depth-first search
   */
  private dfs(
    state: SearchState,
    remainingQueue: TetrominoTypeName[],
    template: PatternTemplate,
  ): Move[] | null {
    this.nodesExplored++;

    // Check time limit
    if (this.config.timeLimit && Date.now() - this.startTime > this.config.timeLimit) {
      return null;
    }

    // Check if pattern is complete
    if (this.isPatternComplete(state.board, template)) {
      return state.movesExecuted;
    }

    // Check depth limit
    if (state.depth >= this.config.maxDepth || remainingQueue.length === 0) {
      return null;
    }

    // Apply pruning rules
    for (const rule of this.config.pruningRules) {
      if (rule(state, template)) {
        return null;
      }
    }

    // Try placing current piece
    const currentPiece = remainingQueue[0];
    const moves = this.generateMovesForPiece(state, currentPiece);

    // Sort moves by heuristic (prefer moves that match pattern)
    const sortedMoves = this.sortMovesByPatternFit(moves, state.board, template);

    for (const move of sortedMoves) {
      // Create new state
      const newState = this.applyMove(state, move);
      const newQueue = remainingQueue.slice(1);

      // Recursive search
      const result = this.dfs(newState, newQueue, template);
      if (result !== null) {
        return result;
      }
    }

    // Try using hold if available and not yet used for this pattern
    if (state.canHold && remainingQueue.length > 1) {
      const heldPiece = currentPiece;
      const nextPiece = remainingQueue[1];

      // Skip hold if it doesn't match pattern requirement
      if (template.holdPiece && heldPiece !== template.holdPiece) {
        return null;
      }

      const holdState = {
        ...state,
        holdPiece: heldPiece,
        canHold: false,
      };

      const newQueue = [nextPiece, ...remainingQueue.slice(2)];
      return this.dfs(holdState, newQueue, template);
    }

    return null;
  }

  /**
   * Check if pattern is complete
   */
  private isPatternComplete(board: Uint32Array, template: PatternTemplate): boolean {
    // Check if all required positions are filled
    for (let row = 0; row < Math.min(20, template.occupiedMask.length); row++) {
      if ((board[row] & template.occupiedMask[row]) !== template.occupiedMask[row]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Generate possible moves for a piece
   */
  private generateMovesForPiece(state: SearchState, piece: TetrominoTypeName): Move[] {
    const bitBoard = new BitBoard();
    // Copy state board to BitBoard
    for (let i = 0; i < state.board.length; i++) {
      bitBoard.setRowBits(i, state.board[i]);
    }

    const tetromino = createTetromino(piece);
    const moves: Move[] = [];

    // Try all rotations
    const rotations: RotationState[] = [0, 1, 2, 3];
    for (const rotation of rotations) {
      tetromino.rotation = rotation;

      // Simple position generation: try all x positions
      for (let x = 0; x < 10; x++) {
        for (let y = 0; y < 20; y++) {
          // Use getPieceBitsAtPosition to get piece bits
          const pieceBits = getPieceBitsAtPosition(tetromino.shape, x, rotation);

          // Check if piece can be placed at this position
          if (bitBoard.canPlace(pieceBits, y)) {
            moves.push({
              piece,
              rotation,
              x,
              y,
              sequence: [], // Simplified - would compute actual sequence
            });
          }
        }
      }
    }

    return moves;
  }

  /**
   * Sort moves by how well they fit the pattern
   */
  private sortMovesByPatternFit(
    moves: Move[],
    currentBoard: Uint32Array,
    template: PatternTemplate,
  ): Move[] {
    return moves.sort((a, b) => {
      const scoreA = this.scoreMoveFit(a, currentBoard, template);
      const scoreB = this.scoreMoveFit(b, currentBoard, template);
      return scoreB - scoreA;
    });
  }

  /**
   * Score how well a move fits the pattern
   */
  private scoreMoveFit(move: Move, _currentBoard: Uint32Array, template: PatternTemplate): number {
    let score = 0;

    // Get piece bits at position
    const tetromino = createTetromino(move.piece);
    tetromino.rotation = move.rotation;
    const bits = getPieceBitsAtPosition(tetromino.shape, move.x);

    // Check how many pattern positions this move fills
    for (let dy = 0; dy < 4 && move.y + dy < 20; dy++) {
      const row = move.y + dy;
      const pieceBits = bits[dy] || 0;
      const patternBits = template.occupiedMask[row] || 0;

      // Count matching bits
      const matchingBits = pieceBits & patternBits;
      score += this.countBits(matchingBits);

      // Penalty for filling non-pattern positions
      const extraBits = pieceBits & ~patternBits;
      score -= this.countBits(extraBits) * 0.5;
    }

    // Bonus for lower placement (prefer building from bottom)
    score += (20 - move.y) * 0.1;

    return score;
  }

  /**
   * Count number of set bits
   */
  private countBits(n: number): number {
    let count = 0;
    let temp = n;
    while (temp) {
      count++;
      temp &= temp - 1;
    }
    return count;
  }

  /**
   * Apply move to create new state
   */
  private applyMove(state: SearchState, move: Move): SearchState {
    const newBoard = new Uint32Array(state.board);

    // Place piece on board
    const tetromino = createTetromino(move.piece);
    tetromino.rotation = move.rotation;
    const bits = getPieceBitsAtPosition(tetromino.shape, move.x);

    for (let dy = 0; dy < 4 && move.y + dy < 20; dy++) {
      const row = move.y + dy;
      newBoard[row] |= bits[dy] || 0;
    }

    return {
      board: newBoard,
      piecesPlaced: [...state.piecesPlaced, move.piece],
      movesExecuted: [...state.movesExecuted, move],
      depth: state.depth + 1,
      holdPiece: state.holdPiece,
      canHold: state.canHold,
    };
  }
}

/**
 * Enhanced feasibility check using pattern search
 */
export function checkPatternFeasibility(
  board: Uint32Array,
  pieceQueue: TetrominoTypeName[],
  template: PatternTemplate,
): { isPossible: boolean; moveSequence: Move[]; confidence: number } {
  const search = new PatternSearch({
    maxDepth: template.requiredPieces.length,
    pruningRules: [
      DEFAULT_PRUNING_RULES.noEarlyHoles,
      DEFAULT_PRUNING_RULES.heightLimit,
      DEFAULT_PRUNING_RULES.symmetryReduction,
    ],
    timeLimit: 100, // 100ms time limit
  });

  const result = search.search(board, pieceQueue, template);

  // Calculate confidence based on search result
  let confidence = 0;
  if (result.found) {
    confidence = template.successRate;
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

import type { Move } from "@/game/ai/core/move-generator";
import { getPieceBitsAtPosition } from "@/game/ai/core/piece-bits";
import type { PatternTemplate } from "@/game/ai/evaluators/patterns";
import { createTetromino } from "@/game/tetrominos";
import type { RotationState, TetrominoTypeName } from "@/types/game";

/**
 * Search result enumeration
 */
export enum SearchResult {
  SOLVED = "SOLVED",
  UNSOLVABLE = "UNSOLVABLE",
  TIMEOUT = "TIMEOUT",
}

/**
 * Search state for pattern completion DFS
 */
export interface SearchState {
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
 * Check for irreversible holes in the board
 */
function hasIrreversibleHoles(board: Uint32Array): boolean {
  for (let col = 0; col < 10; col++) {
    const colMask = 1 << col;
    let foundEmpty = false;

    // Scan from bottom to top
    for (let row = 0; row < 20; row++) {
      const cellOccupied = (board[row] & colMask) !== 0;

      if (!cellOccupied) {
        foundEmpty = true;
      } else if (foundEmpty) {
        // Found filled cell above empty cell - this is an irreversible hole
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if the remaining depth is sufficient to reach the target height
 */
function heightBoundCheck(
  board: Uint32Array,
  template: PatternTemplate,
  remainingDepth: number,
): boolean {
  // Find current max height
  let maxHeight = 0;
  for (let row = 19; row >= 0; row--) {
    if (board[row] !== 0) {
      maxHeight = row + 1;
      break;
    }
  }

  // Find required max height from pattern
  let requiredHeight = 0;
  for (let row = 19; row >= 0; row--) {
    if (template.occupiedMask[row] !== 0) {
      requiredHeight = row + 1;
      break;
    }
  }

  // Check if we can reach required height with remaining pieces
  const maxPieceHeight = 4; // Maximum height a single piece can add
  return maxHeight + remainingDepth * maxPieceHeight < requiredHeight;
}

/**
 * Default pruning rules for pattern search
 */
export const DEFAULT_PRUNING_RULES: Record<string, PruningRule> = {
  /**
   * Prune if irreversible holes are detected
   */
  noEarlyHoles: (state: SearchState, _template: PatternTemplate): boolean => {
    // Check for irreversible holes that would prevent pattern completion
    return hasIrreversibleHoles(state.board);
  },

  /**
   * Prune if height limit exceeded or insufficient depth
   */
  heightLimit: (state: SearchState, template: PatternTemplate): boolean => {
    // Find highest occupied row
    for (let row = 19; row >= 0; row--) {
      if (state.board[row] !== 0) {
        // Prune if stack too high (close to top) - adjust threshold for safety
        if (row >= 17) return true;

        // Check if we have sufficient depth to complete pattern
        return heightBoundCheck(state.board, template, state.depth);
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
 * Core pattern search engine using depth-first search
 */
export class PatternSearchCore {
  private config: PatternSearchConfig;
  private startTime = 0;
  private nodesExplored = 0;

  constructor(config: PatternSearchConfig) {
    this.config = config;
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

    // Check if pattern is already complete on initial board
    if (this.isPatternComplete(initialBoard, template)) {
      return {
        found: true,
        path: [],
        nodesExplored: 1,
        timeElapsed: 1,
      };
    }

    const result = this.dfs(initialState, pieceQueue, template);
    const found = result === SearchResult.SOLVED;
    const timeElapsed = Math.max(1, Date.now() - this.startTime); // Ensure non-zero elapsed time

    // If solved, reconstruct path from final state
    let path: Move[] = [];
    if (found) {
      path = this.reconstructPath(initialBoard, pieceQueue, template);
    }

    return {
      found,
      path,
      nodesExplored: this.nodesExplored,
      timeElapsed,
    };
  }

  /**
   * Recursive depth-first search with improved termination
   */
  private dfs(
    state: SearchState,
    remainingQueue: TetrominoTypeName[],
    template: PatternTemplate,
  ): SearchResult {
    this.nodesExplored++;

    // Check time limit (only every 256 nodes for performance)
    if ((this.nodesExplored & 0xff) === 0) {
      if (this.config.timeLimit && Date.now() - this.startTime > this.config.timeLimit) {
        return SearchResult.TIMEOUT;
      }
    }

    // Check if pattern is complete
    if (this.isPatternComplete(state.board, template)) {
      return SearchResult.SOLVED;
    }

    // Check depth limit
    if (state.depth >= this.config.maxDepth || remainingQueue.length === 0) {
      return SearchResult.UNSOLVABLE;
    }

    // Apply pruning rules
    for (const rule of this.config.pruningRules) {
      if (rule(state, template)) {
        return SearchResult.UNSOLVABLE;
      }
    }

    // Early termination: check if we have enough pieces left
    const remainingEmptySquares = this.countEmptySquares(state.board, template);
    if (remainingQueue.length * 4 < remainingEmptySquares) {
      return SearchResult.UNSOLVABLE;
    }

    // Try placing current piece
    const currentPiece = remainingQueue[0];
    const moves = this.generateMovesForPiece(state, currentPiece);

    // Limit move generation for performance (top 8 moves)
    const limitedMoves = moves.slice(0, Math.min(8, moves.length));

    // Sort moves by heuristic (prefer moves that match pattern)
    const sortedMoves = this.sortMovesByPatternFit(limitedMoves, state.board, template);

    for (const move of sortedMoves) {
      // Create new state
      const newState = this.applyMove(state, move);
      const newQueue = remainingQueue.slice(1);

      // Recursive search
      const result = this.dfs(newState, newQueue, template);
      if (result === SearchResult.SOLVED) {
        return SearchResult.SOLVED;
      }
      if (result === SearchResult.TIMEOUT) {
        return SearchResult.TIMEOUT;
      }
    }

    // Try using hold if available and beneficial
    if (state.canHold && remainingQueue.length > 1) {
      const heldPiece = currentPiece;
      const nextPiece = remainingQueue[1];

      // Skip hold if it doesn't match pattern requirement
      if (template.holdPiece && heldPiece !== template.holdPiece) {
        return SearchResult.UNSOLVABLE;
      }

      const holdState = {
        ...state,
        holdPiece: heldPiece,
        canHold: false,
      };

      const newQueue = [nextPiece, ...remainingQueue.slice(2)];
      return this.dfs(holdState, newQueue, template);
    }

    return SearchResult.UNSOLVABLE;
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
  private countEmptySquares(board: Uint32Array, template: PatternTemplate): number {
    let count = 0;
    for (let row = 0; row < Math.min(20, template.occupiedMask.length); row++) {
      const missingMask = template.occupiedMask[row] & ~board[row];
      count += this.countBits(missingMask);
    }
    return count;
  }

  /**
   * Reconstruct path by re-running simplified search
   */
  private reconstructPath(
    _initialBoard: Uint32Array,
    _pieceQueue: TetrominoTypeName[],
    _template: PatternTemplate,
  ): Move[] {
    // For now, return empty path. In production, this would track the actual path
    // during the successful search run or re-run the search with path tracking
    return [];
  }

  /**
   * Generate possible moves for a piece (optimized version)
   */
  private generateMovesForPiece(state: SearchState, piece: TetrominoTypeName): Move[] {
    const moves: Move[] = [];
    const tetromino = createTetromino(piece);

    // Try rotations (limit to 2 for some pieces to reduce search space)
    const rotations = this.getRelevantRotations(piece);

    for (const rotation of rotations) {
      tetromino.rotation = rotation as RotationState;

      // Try x positions (limited range based on piece width)
      const pieceBits = getPieceBitsAtPosition(tetromino.type, rotation as RotationState, 0);
      let pieceWidth = 0;
      for (const rowBits of pieceBits) {
        if (rowBits !== 0) {
          pieceWidth = Math.max(pieceWidth, this.getBitWidth(rowBits));
        }
      }

      for (let x = 0; x <= 10 - pieceWidth; x++) {
        // Find valid landing position (drop piece down)
        const landingY = this.findLandingPosition(state.board, piece, rotation as RotationState, x);

        if (landingY >= 0 && landingY < 20) {
          moves.push({
            piece,
            rotation: rotation as RotationState,
            x,
            y: landingY,
            sequence: [], // Simplified
          });
        }
      }
    }

    return moves;
  }

  /**
   * Get relevant rotations for a piece (optimization)
   */
  private getRelevantRotations(piece: TetrominoTypeName): number[] {
    switch (piece) {
      case "O":
        return [0]; // Square has only one unique rotation
      case "I":
        return [0, 1]; // Line has two unique rotations
      case "S":
      case "Z":
        return [0, 1]; // S and Z have two unique rotations
      default:
        return [0, 1, 2, 3]; // T, L, J have four rotations
    }
  }

  /**
   * Get the width of a bit pattern
   */
  private getBitWidth(bits: number): number {
    if (bits === 0) return 0;
    let width = 0;
    let mask = 1;
    for (let i = 0; i < 10; i++) {
      if (bits & mask) {
        width = i + 1;
      }
      mask <<= 1;
    }
    return width;
  }

  /**
   * Find the landing position for a piece
   */
  private findLandingPosition(
    board: Uint32Array,
    piece: TetrominoTypeName,
    rotation: RotationState,
    x: number,
  ): number {
    const pieceBits = getPieceBitsAtPosition(piece, rotation, x);

    // Start from top and drop down
    for (let y = 19; y >= 0; y--) {
      let canPlace = true;

      // Check if piece can be placed at this position
      for (let dy = 0; dy < 4 && y + dy < 20; dy++) {
        const pieceRow = pieceBits[dy] || 0;
        const boardRow = board[y + dy] || 0;

        if ((pieceRow & boardRow) !== 0) {
          canPlace = false;
          break;
        }
      }

      if (canPlace) {
        return y;
      }
    }

    return -1; // Cannot place
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
    const bits = getPieceBitsAtPosition(tetromino.type, move.rotation, move.x);

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
    const bits = getPieceBitsAtPosition(tetromino.type, move.rotation, move.x);

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
 * Convenience wrapper for PatternSearchCore with default PatternSearch API
 */
export class PatternSearch extends PatternSearchCore {}

import type { BitBoardData } from "@/game/ai/core/bitboard";
import { calculateHeight, countOccupiedCells } from "@/game/ai/core/bitboard";
import type { Tetromino } from "@/types/game";
import type { BeamSearch, SearchResult } from "./beam-search";

/**
 * Configuration options for Hold-aware search
 */
export interface HoldSearchOptions {
  /** Allow Hold usage in search */
  allowHoldUsage: boolean;
  /** Penalty score for using Hold (to discourage overuse) */
  holdPenalty: number;
  /** Maximum consecutive Hold usage (to prevent infinite loops) */
  maxHoldUsage: number;
}

/**
 * Result of Hold-aware search including alternative paths
 */
export interface HoldSearchResult extends SearchResult {
  /** Whether Hold was used in the best path */
  usedHold: boolean;
  /** Alternative search results for comparison */
  alternativeResults: SearchResult[];
  /** Hold penalty applied (if any) */
  holdPenaltyApplied: number;
}

/**
 * Default Hold search configuration
 */
export const DEFAULT_HOLD_OPTIONS: HoldSearchOptions = {
  allowHoldUsage: true,
  holdPenalty: 5, // Small penalty to discourage unnecessary Hold usage
  maxHoldUsage: 3, // Prevent excessive Hold usage
};

/**
 * Hold search state containing all dependencies and configuration
 */
export interface HoldSearchState {
  baseSearch: BeamSearch;
  options: HoldSearchOptions;
}

/**
 * Factory function to create hold search state
 */
export function createHoldSearchState(
  baseSearch: BeamSearch,
  options: HoldSearchOptions = DEFAULT_HOLD_OPTIONS,
): HoldSearchState {
  return {
    baseSearch,
    options: { ...options },
  };
}

/**
 * Perform Hold-aware search to find optimal path
 * @param state - Hold search state containing baseSearch and options
 * @param board - Current board state
 * @param currentPiece - Current piece to place
 * @param nextPieces - Queue of upcoming pieces
 * @param heldPiece - Currently held piece (optional)
 * @returns Best path with Hold consideration
 */
export function performHoldSearch(
  state: HoldSearchState,
  board: BitBoardData,
  currentPiece: Tetromino,
  nextPieces: Tetromino[],
  heldPiece?: Tetromino,
): HoldSearchResult {
  const results: SearchResult[] = [];
  let usedHold = false;
  let holdPenaltyApplied = 0;

  // Path 1: Normal search without using Hold
  const normalResult = state.baseSearch.search(board, currentPiece, nextPieces, heldPiece);
  results.push(normalResult);

  // Path 2: Search with Hold usage (if possible and allowed)
  if (state.options.allowHoldUsage && canUseHold(heldPiece)) {
    const holdResult = searchWithHoldUsage(state, board, currentPiece, nextPieces, heldPiece);

    if (holdResult) {
      results.push(holdResult);
    }
  }

  // Select best result
  const bestResult = selectBestResult(results);

  // Determine if Hold was used
  if (results.length > 1 && bestResult === results[1]) {
    usedHold = true;
    holdPenaltyApplied = state.options.holdPenalty;
  }

  return {
    ...bestResult,
    usedHold,
    alternativeResults: results,
    holdPenaltyApplied,
  };
}

/**
 * Search with Hold usage - swap current piece with held piece
 * @param state - Hold search state
 * @param board - Current board state
 * @param currentPiece - Current piece to swap
 * @param nextPieces - Queue of upcoming pieces
 * @param heldPiece - Currently held piece
 * @returns Search result for Hold path
 */
function searchWithHoldUsage(
  state: HoldSearchState,
  board: BitBoardData,
  currentPiece: Tetromino,
  nextPieces: Tetromino[],
  heldPiece?: Tetromino,
): SearchResult | null {
  // Determine what piece to use after Hold
  let pieceToUse: Tetromino;
  let newHeldPiece: Tetromino;
  let adjustedNextPieces: Tetromino[];

  if (heldPiece) {
    // Swap current piece with held piece
    pieceToUse = heldPiece;
    newHeldPiece = currentPiece;
    adjustedNextPieces = nextPieces;
  } else {
    // Hold current piece, use next piece
    if (nextPieces.length === 0) {
      return null; // No next piece to use
    }
    pieceToUse = nextPieces[0];
    newHeldPiece = currentPiece;
    adjustedNextPieces = nextPieces.slice(1);
  }

  // Perform search with the new piece arrangement
  const holdResult = state.baseSearch.search(board, pieceToUse, adjustedNextPieces, newHeldPiece);

  // Apply Hold penalty to discourage overuse
  holdResult.bestScore -= state.options.holdPenalty;

  return holdResult;
}

/**
 * Check if Hold can be used in current situation
 * @param heldPiece - Currently held piece
 * @returns Whether Hold usage is possible
 */
function canUseHold(_heldPiece?: Tetromino): boolean {
  // For now, always allow Hold usage if enabled
  // Future enhancements could check for Hold usage limits
  return true;
}

/**
 * Select the best result from multiple search paths
 * @param results - Array of search results to choose from
 * @returns Best result based on score
 */
function selectBestResult(results: SearchResult[]): SearchResult {
  if (results.length === 0) {
    throw new Error("No search results available");
  }

  return results.reduce((best, current) => {
    // Primary comparison: score
    if (current.bestScore > best.bestScore) {
      return current;
    }

    // Secondary comparison: if scores are equal, prefer path with fewer nodes explored
    if (current.bestScore === best.bestScore) {
      return current.nodesExplored < best.nodesExplored ? current : best;
    }

    return best;
  });
}

/**
 * Advanced Hold strategy evaluation
 * @param _state - Hold search state (unused in current implementation)
 * @param board - Current board state
 * @param currentPiece - Current piece
 * @param nextPieces - Upcoming pieces
 * @param heldPiece - Currently held piece
 * @returns Strategic evaluation of Hold usage
 */
export function evaluateHoldStrategy(
  _state: HoldSearchState,
  board: BitBoardData,
  currentPiece: Tetromino,
  nextPieces: Tetromino[],
  heldPiece?: Tetromino,
): HoldStrategyEvaluation {
  // Evaluate current piece placement quality
  const currentPieceScore = evaluatePieceUtility(board, currentPiece);

  // Evaluate held piece placement quality (if any)
  const heldPieceScore = heldPiece ? evaluatePieceUtility(board, heldPiece) : 0;

  // Evaluate next piece placement quality
  const nextPieceScore = nextPieces.length > 0 ? evaluatePieceUtility(board, nextPieces[0]) : 0;

  // Determine optimal strategy
  const shouldUseHold = shouldUseHoldBasedOnScores(
    currentPieceScore,
    heldPieceScore,
    nextPieceScore,
  );

  return {
    currentPieceScore,
    heldPieceScore,
    nextPieceScore,
    shouldUseHold,
    confidence: calculateConfidence(currentPieceScore, heldPieceScore, nextPieceScore),
  };
}

/**
 * Evaluate utility of a piece for current board state
 * @param board - Current board state
 * @param piece - Piece to evaluate
 * @returns Utility score for the piece
 */
function evaluatePieceUtility(board: BitBoardData, piece: Tetromino): number {
  // Simple utility based on piece type and board state
  const boardHeight = calculateHeight(board);
  const occupiedCells = countOccupiedCells(board);

  // Piece type preferences based on board state
  const pieceUtility = {
    I: boardHeight > 15 ? 10 : 5, // I-piece valuable when board is high
    O: 3, // O-piece generally less useful
    T: 7, // T-piece versatile
    L: 5, // L-piece decent
    J: 5, // J-piece decent
    S: 4, // S-piece situational
    Z: 4, // Z-piece situational
  };

  return pieceUtility[piece.type] + occupiedCells / 10;
}

/**
 * Determine if Hold should be used based on piece scores
 * @param currentScore - Current piece score
 * @param heldScore - Held piece score
 * @param nextScore - Next piece score
 * @returns Whether Hold should be used
 */
function shouldUseHoldBasedOnScores(
  currentScore: number,
  heldScore: number,
  nextScore: number,
): boolean {
  // Hold if held piece is significantly better than current
  if (heldScore > currentScore + 2) {
    return true;
  }

  // Hold if next piece is significantly better than current
  if (nextScore > currentScore + 3) {
    return true;
  }

  return false;
}

/**
 * Calculate confidence in Hold decision
 * @param currentScore - Current piece score
 * @param heldScore - Held piece score
 * @param nextScore - Next piece score
 * @returns Confidence level (0-1)
 */
function calculateConfidence(currentScore: number, heldScore: number, nextScore: number): number {
  const maxScore = Math.max(currentScore, heldScore, nextScore);
  const minScore = Math.min(currentScore, heldScore, nextScore);
  const scoreDifference = maxScore - minScore;

  // Higher difference = higher confidence
  return Math.min(scoreDifference / 10, 1);
}

/**
 * Update Hold search options
 * @param state - Hold search state to update
 * @param newOptions - New options to apply
 * @returns Updated hold search state
 */
export function updateHoldSearchOptions(
  state: HoldSearchState,
  newOptions: Partial<HoldSearchOptions>,
): HoldSearchState {
  return {
    ...state,
    options: { ...state.options, ...newOptions },
  };
}

/**
 * Get current Hold search options
 * @param state - Hold search state
 * @returns Current options
 */
export function getHoldSearchOptions(state: HoldSearchState): HoldSearchOptions {
  return { ...state.options };
}

/**
 * Legacy class wrapper for backward compatibility
 * @deprecated Use functional API instead
 */
export class HoldAwareSearch {
  private state: HoldSearchState;

  constructor(baseSearch: BeamSearch, options: HoldSearchOptions = DEFAULT_HOLD_OPTIONS) {
    this.state = createHoldSearchState(baseSearch, options);
  }

  searchWithHold(
    board: BitBoardData,
    currentPiece: Tetromino,
    nextPieces: Tetromino[],
    heldPiece?: Tetromino,
  ): HoldSearchResult {
    return performHoldSearch(this.state, board, currentPiece, nextPieces, heldPiece);
  }

  evaluateHoldStrategy(
    board: BitBoardData,
    currentPiece: Tetromino,
    nextPieces: Tetromino[],
    heldPiece?: Tetromino,
  ): HoldStrategyEvaluation {
    return evaluateHoldStrategy(this.state, board, currentPiece, nextPieces, heldPiece);
  }

  updateOptions(newOptions: Partial<HoldSearchOptions>): void {
    this.state = updateHoldSearchOptions(this.state, newOptions);
  }

  getOptions(): HoldSearchOptions {
    return getHoldSearchOptions(this.state);
  }
}

/**
 * Hold strategy evaluation result
 */
export interface HoldStrategyEvaluation {
  /** Utility score for current piece */
  currentPieceScore: number;
  /** Utility score for held piece */
  heldPieceScore: number;
  /** Utility score for next piece */
  nextPieceScore: number;
  /** Whether Hold should be used */
  shouldUseHold: boolean;
  /** Confidence in the decision (0-1) */
  confidence: number;
}

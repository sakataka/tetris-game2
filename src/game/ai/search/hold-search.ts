import type { Tetromino } from "@/types/game";
import type { BitBoard } from "../core/bitboard";
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
 * Hold-aware search implementation that evaluates both normal and Hold paths
 * Optimizes search space by comparing Hold vs non-Hold strategies
 */
export class HoldAwareSearch {
  private readonly baseSearch: BeamSearch;
  private readonly options: HoldSearchOptions;

  constructor(baseSearch: BeamSearch, options: HoldSearchOptions = DEFAULT_HOLD_OPTIONS) {
    this.baseSearch = baseSearch;
    this.options = { ...options };
  }

  /**
   * Perform Hold-aware search to find optimal path
   * @param board - Current board state
   * @param currentPiece - Current piece to place
   * @param nextPieces - Queue of upcoming pieces
   * @param heldPiece - Currently held piece (optional)
   * @returns Best path with Hold consideration
   */
  searchWithHold(
    board: BitBoard,
    currentPiece: Tetromino,
    nextPieces: Tetromino[],
    heldPiece?: Tetromino,
  ): HoldSearchResult {
    const results: SearchResult[] = [];
    let usedHold = false;
    let holdPenaltyApplied = 0;

    // Path 1: Normal search without using Hold
    const normalResult = this.baseSearch.search(board, currentPiece, nextPieces, heldPiece);
    results.push(normalResult);

    // Path 2: Search with Hold usage (if possible and allowed)
    if (this.options.allowHoldUsage && this.canUseHold(heldPiece)) {
      const holdResult = this.searchWithHoldUsage(board, currentPiece, nextPieces, heldPiece);

      if (holdResult) {
        results.push(holdResult);
      }
    }

    // Select best result
    const bestResult = this.selectBestResult(results);

    // Determine if Hold was used
    if (results.length > 1 && bestResult === results[1]) {
      usedHold = true;
      holdPenaltyApplied = this.options.holdPenalty;
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
   * @param board - Current board state
   * @param currentPiece - Current piece to swap
   * @param nextPieces - Queue of upcoming pieces
   * @param heldPiece - Currently held piece
   * @returns Search result for Hold path
   */
  private searchWithHoldUsage(
    board: BitBoard,
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
    const holdResult = this.baseSearch.search(board, pieceToUse, adjustedNextPieces, newHeldPiece);

    // Apply Hold penalty to discourage overuse
    holdResult.bestScore -= this.options.holdPenalty;

    return holdResult;
  }

  /**
   * Check if Hold can be used in current situation
   * @param heldPiece - Currently held piece
   * @returns Whether Hold usage is possible
   */
  private canUseHold(_heldPiece?: Tetromino): boolean {
    // For now, always allow Hold usage if enabled
    // Future enhancements could check for Hold usage limits
    return true;
  }

  /**
   * Select the best result from multiple search paths
   * @param results - Array of search results to choose from
   * @returns Best result based on score
   */
  private selectBestResult(results: SearchResult[]): SearchResult {
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
   * @param board - Current board state
   * @param currentPiece - Current piece
   * @param nextPieces - Upcoming pieces
   * @param heldPiece - Currently held piece
   * @returns Strategic evaluation of Hold usage
   */
  evaluateHoldStrategy(
    board: BitBoard,
    currentPiece: Tetromino,
    nextPieces: Tetromino[],
    heldPiece?: Tetromino,
  ): HoldStrategyEvaluation {
    // Evaluate current piece placement quality
    const currentPieceScore = this.evaluatePieceUtility(board, currentPiece);

    // Evaluate held piece placement quality (if any)
    const heldPieceScore = heldPiece ? this.evaluatePieceUtility(board, heldPiece) : 0;

    // Evaluate next piece placement quality
    const nextPieceScore =
      nextPieces.length > 0 ? this.evaluatePieceUtility(board, nextPieces[0]) : 0;

    // Determine optimal strategy
    const shouldUseHold = this.shouldUseHoldBasedOnScores(
      currentPieceScore,
      heldPieceScore,
      nextPieceScore,
    );

    return {
      currentPieceScore,
      heldPieceScore,
      nextPieceScore,
      shouldUseHold,
      confidence: this.calculateConfidence(currentPieceScore, heldPieceScore, nextPieceScore),
    };
  }

  /**
   * Evaluate utility of a piece for current board state
   * @param board - Current board state
   * @param piece - Piece to evaluate
   * @returns Utility score for the piece
   */
  private evaluatePieceUtility(board: BitBoard, piece: Tetromino): number {
    // Simple utility based on piece type and board state
    const boardHeight = board.calculateHeight();
    const occupiedCells = board.countOccupiedCells();

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
  private shouldUseHoldBasedOnScores(
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
  private calculateConfidence(currentScore: number, heldScore: number, nextScore: number): number {
    const maxScore = Math.max(currentScore, heldScore, nextScore);
    const minScore = Math.min(currentScore, heldScore, nextScore);
    const scoreDifference = maxScore - minScore;

    // Higher difference = higher confidence
    return Math.min(scoreDifference / 10, 1);
  }

  /**
   * Update Hold search options
   * @param newOptions - New options to apply
   */
  updateOptions(newOptions: Partial<HoldSearchOptions>): void {
    Object.assign(this.options, newOptions);
  }

  /**
   * Get current Hold search options
   * @returns Current options
   */
  getOptions(): HoldSearchOptions {
    return { ...this.options };
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

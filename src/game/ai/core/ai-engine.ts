import { getTetrominoShape } from "@/game/tetrominos";
import type { GameState } from "@/types/game";
import { DellacherieEvaluator } from "../evaluators/dellacherie";
import { StackingEvaluator } from "../evaluators/stacking-evaluator";
import { DynamicWeights } from "../evaluators/weights";
import type { BitBoard } from "./bitboard";
import { BitBoard as BitBoardImpl } from "./bitboard";
import { type Move, MoveGenerator } from "./move-generator";
import { getPieceBitsAtPosition } from "./piece-bits";

/**
 * AI configuration options for decision making
 */
export interface AIConfig {
  /** Maximum thinking time in milliseconds */
  thinkingTimeLimit: number;
  /** Evaluator type to use */
  evaluator: "dellacherie" | "stacking" | "custom";
  /** Enable debug logging */
  enableLogging: boolean;
  /** Use fallback move when timeout occurs */
  fallbackOnTimeout: boolean;
  /** Use dynamic weight adjustment */
  useDynamicWeights: boolean;
}

/**
 * Result of AI decision making process
 */
export interface AIDecision {
  /** Best move found (null if no valid moves) */
  bestMove: Move | null;
  /** All generated moves for analysis */
  allMoves: Move[];
  /** Time spent thinking in milliseconds */
  thinkingTime: number;
  /** Number of moves evaluated */
  evaluationCount: number;
  /** Whether thinking was interrupted by timeout */
  timedOut: boolean;
  /** Error message if decision failed */
  error?: string;
}

/**
 * AI performance statistics
 */
export interface AIStats {
  /** Total decisions made */
  totalDecisions: number;
  /** Average thinking time */
  averageThinkTime: number;
  /** Number of timeouts occurred */
  timeoutCount: number;
  /** Best evaluation score seen */
  bestScore: number;
  /** Worst evaluation score seen */
  worstScore: number;
}

/**
 * Default AI configuration optimized for LINE CLEARING
 * Based on o3 MCP recommendations: prioritize line clearing above all else
 */
export const DEFAULT_AI_CONFIG: AIConfig = {
  thinkingTimeLimit: 200, // 200ms as specified in issue
  evaluator: "dellacherie", // Changed from "stacking" to prioritize line clearing
  enableLogging: true, // Enable for debugging
  fallbackOnTimeout: true,
  useDynamicWeights: true,
};

/**
 * High-performance AI decision engine for Tetris
 * Integrates move generation, evaluation, and time management
 */
export class AIEngine {
  private readonly config: AIConfig;
  private readonly moveGenerator: MoveGenerator;
  private readonly evaluator: DellacherieEvaluator | StackingEvaluator;
  private readonly dynamicWeights: DynamicWeights;
  private abortController: AbortController | null = null;
  private stats: AIStats;

  constructor(config: AIConfig = DEFAULT_AI_CONFIG) {
    this.config = { ...config };
    this.moveGenerator = new MoveGenerator({
      useHold: false, // Not used in Phase 1
      maxSearchDepth: 1,
      includeWallKicks: true,
      enableTSpinDetection: false,
    });
    this.evaluator = this.createEvaluator(config.evaluator);
    this.dynamicWeights = new DynamicWeights();
    this.stats = this.createInitialStats();
  }

  /**
   * Create evaluator based on configuration
   * @param evaluatorType - Type of evaluator to create
   * @returns Evaluator instance
   */
  private createEvaluator(evaluatorType: string): DellacherieEvaluator | StackingEvaluator {
    switch (evaluatorType) {
      case "dellacherie":
        return new DellacherieEvaluator();
      case "stacking":
        return new StackingEvaluator();
      case "custom":
        // For now, default to Dellacherie for custom
        return new DellacherieEvaluator();
      default:
        console.warn(`Unknown evaluator type: ${evaluatorType}, defaulting to Dellacherie`);
        return new DellacherieEvaluator();
    }
  }

  /**
   * Find the best move for the current game state
   * @param gameState - Current game state
   * @returns AI decision with best move and metadata
   */
  async findBestMove(gameState: GameState): Promise<AIDecision> {
    const startTime = performance.now();
    this.abortController = new AbortController();

    try {
      // Validate game state
      if (!gameState.currentPiece) {
        console.error("[AI] No current piece in game state");
        return this.createDecision(null, [], 0, 0, false, "No current piece");
      }

      if (gameState.isGameOver) {
        console.error("[AI] Game over state detected");
        return this.createDecision(null, [], 0, 0, false, "Game over");
      }

      // Convert board to BitBoard for AI processing
      const board = new BitBoardImpl(gameState.board);

      // Update evaluator weights if dynamic adjustment enabled
      if (this.config.useDynamicWeights) {
        this.updateDynamicWeights(board, gameState.lines, gameState.level);
      }

      // Generate all possible moves
      const allMoves = this.moveGenerator.generateAllMoves(
        board,
        gameState.currentPiece,
        gameState.heldPiece
          ? {
              type: gameState.heldPiece,
              position: { x: 4, y: 0 },
              rotation: 0,
              shape: getTetrominoShape(gameState.heldPiece),
            }
          : null,
      );

      if (this.config.enableLogging) {
        console.log(`[AI] Generated ${allMoves.length} moves`);
        if (allMoves.length > 0) {
          console.log(
            "[AI] Sample moves:",
            allMoves.slice(0, 3).map((m) => ({
              piece: m.piece,
              rotation: m.rotation,
              x: m.x,
              y: m.y,
              actions: m.sequence.length,
            })),
          );
        }
      }

      if (allMoves.length === 0) {
        console.error("[AI] No moves generated - Debug info:", {
          currentPiece: gameState.currentPiece,
          boardState: board.toBoardState().slice(0, 5), // Top 5 rows
          boardHeight: board.getDimensions().height,
        });
        return this.createDecision(
          null,
          [],
          performance.now() - startTime,
          0,
          false,
          "No valid moves",
        );
      }

      // Evaluate moves with timeout management
      const evaluationResult = await this.evaluateMovesWithTimeout(board, allMoves, startTime);

      // Update statistics
      this.updateStats(evaluationResult);

      return evaluationResult;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return this.createTimeoutDecision(startTime);
      }

      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return this.createDecision(null, [], performance.now() - startTime, 0, false, errorMessage);
    }
  }

  /**
   * Abort current thinking process
   */
  abortThinking(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Evaluate all moves with timeout management
   * Enhanced with LINE-CLEARING PRIORITY FILTER
   * @param board - Board state
   * @param moves - Moves to evaluate
   * @param startTime - Start time for timeout calculation
   * @returns AI decision result
   */
  private async evaluateMovesWithTimeout(
    board: BitBoard,
    moves: Move[],
    startTime: number,
  ): Promise<AIDecision> {
    let bestMove: Move | null = null;
    let bestScore = Number.NEGATIVE_INFINITY;
    let evaluationCount = 0;
    let timedOut = false;

    // BEAM PRE-FILTER: Prioritize line-clearing moves
    const lineClearingMoves = this.identifyLineClearingMoves(board, moves);
    const movesToEvaluate = lineClearingMoves.length > 0 ? lineClearingMoves : moves;

    if (this.config.enableLogging && lineClearingMoves.length > 0) {
      console.log(
        `🎯 [AI] LINE-CLEARING FILTER: Found ${lineClearingMoves.length} line-clearing moves out of ${moves.length} total moves`,
      );
    }

    // Process moves in batches to allow for timeout checking
    const batchSize = 10; // Process 10 moves at a time

    for (let i = 0; i < movesToEvaluate.length; i += batchSize) {
      // Check timeout before each batch
      const elapsedTime = performance.now() - startTime;
      if (elapsedTime > this.config.thinkingTimeLimit) {
        timedOut = true;
        if (this.config.enableLogging) {
          console.warn(
            `[AI] Timeout after ${elapsedTime}ms, ${evaluationCount}/${movesToEvaluate.length} moves evaluated`,
          );
        }
        break;
      }

      // Check for abort signal
      if (this.abortController?.signal.aborted) {
        throw new Error("AbortError");
      }

      // Process current batch
      const batchEnd = Math.min(i + batchSize, movesToEvaluate.length);
      for (let j = i; j < batchEnd; j++) {
        const move = movesToEvaluate[j];
        const score = this.evaluator.evaluateMove(board, move);
        move.evaluationScore = score;
        evaluationCount++;

        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }

        // Log individual evaluations if enabled
        if (this.config.enableLogging) {
          console.debug(
            `[AI] ${move.piece} R${move.rotation} (${move.x},${move.y}) = ${score.toFixed(2)}`,
          );
        }
      }

      // Yield control to prevent blocking the main thread
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    // Handle timeout fallback
    if (timedOut && !bestMove && this.config.fallbackOnTimeout) {
      bestMove = this.createFallbackMove(movesToEvaluate);
    }

    const thinkingTime = performance.now() - startTime;

    if (this.config.enableLogging) {
      console.log(
        `[AI] Decision: ${bestMove ? `${bestMove.piece} R${bestMove.rotation} (${bestMove.x},${bestMove.y}) = ${bestMove.evaluationScore?.toFixed(2)}` : "none"}, ${evaluationCount}/${movesToEvaluate.length} evaluated in ${thinkingTime.toFixed(1)}ms`,
      );
    }

    return this.createDecision(bestMove, moves, thinkingTime, evaluationCount, timedOut);
  }

  /**
   * Update dynamic weights based on game situation
   * @param board - Current board state
   * @param lines - Lines cleared
   * @param level - Current level
   */
  private updateDynamicWeights(board: BitBoard, lines: number, level: number): void {
    try {
      // Dynamic weights only supported for Dellacherie evaluator
      if (this.evaluator instanceof DellacherieEvaluator) {
        const situation = this.dynamicWeights.analyzeSituation(board, lines, level);
        const adjustedWeights = this.dynamicWeights.adjustWeights(situation);
        this.evaluator.updateWeights(adjustedWeights);
      }
      // Stacking evaluator has its own internal weight tuning
    } catch (error) {
      console.error("[AI] Error in updateDynamicWeights:", error);
      // Continue without dynamic weights if there's an error
    }
  }

  /**
   * Create fallback move for timeout situations
   * @param moves - Available moves
   * @returns Simple fallback move
   */
  private createFallbackMove(moves: Move[]): Move | null {
    if (moves.length === 0) return null;

    // Find move closest to center with minimal rotation
    let bestFallback = moves[0];
    let bestScore = Number.POSITIVE_INFINITY;

    for (const move of moves) {
      // Score based on center distance + rotation penalty
      const centerDistance = Math.abs(move.x - 4); // Board center is x=4
      const rotationPenalty = move.rotation * 10; // Prefer no rotation
      const score = centerDistance + rotationPenalty;

      if (score < bestScore) {
        bestScore = score;
        bestFallback = move;
      }
    }

    bestFallback.evaluationScore = -1000; // Mark as fallback
    return bestFallback;
  }

  /**
   * Create timeout decision
   * @param startTime - Start time for duration calculation
   * @returns Timeout decision
   */
  private createTimeoutDecision(startTime: number): AIDecision {
    const fallbackMove = this.config.fallbackOnTimeout ? this.createSimpleFallbackMove() : null;

    return this.createDecision(
      fallbackMove,
      fallbackMove ? [fallbackMove] : [],
      performance.now() - startTime,
      0,
      true,
      "Thinking aborted",
    );
  }

  /**
   * Create simple fallback move for emergency situations
   * @returns Emergency fallback move
   */
  private createSimpleFallbackMove(): Move {
    return {
      piece: "I", // Dummy piece type
      rotation: 0,
      x: 4, // Center position
      y: 18, // Near bottom
      sequence: [{ type: "HARD_DROP" }],
      evaluationScore: -2000, // Very low score
    };
  }

  /**
   * Create AI decision result
   */
  private createDecision(
    bestMove: Move | null,
    allMoves: Move[],
    thinkingTime: number,
    evaluationCount: number,
    timedOut: boolean,
    error?: string,
  ): AIDecision {
    return {
      bestMove,
      allMoves,
      thinkingTime,
      evaluationCount,
      timedOut,
      error,
    };
  }

  /**
   * Update AI performance statistics
   * @param decision - Latest AI decision
   */
  private updateStats(decision: AIDecision): void {
    this.stats.totalDecisions++;

    // Update average thinking time
    const totalTime =
      this.stats.averageThinkTime * (this.stats.totalDecisions - 1) + decision.thinkingTime;
    this.stats.averageThinkTime = totalTime / this.stats.totalDecisions;

    // Update timeout count
    if (decision.timedOut) {
      this.stats.timeoutCount++;
    }

    // Update score range
    if (decision.bestMove?.evaluationScore !== undefined) {
      const score = decision.bestMove.evaluationScore;
      this.stats.bestScore = Math.max(this.stats.bestScore, score);
      this.stats.worstScore = Math.min(this.stats.worstScore, score);
    }
  }

  /**
   * Create initial statistics
   * @returns Initial stats object
   */
  private createInitialStats(): AIStats {
    return {
      totalDecisions: 0,
      averageThinkTime: 0,
      timeoutCount: 0,
      bestScore: Number.NEGATIVE_INFINITY,
      worstScore: Number.POSITIVE_INFINITY,
    };
  }

  /**
   * Get current AI performance statistics
   * @returns Current stats
   */
  getStats(): AIStats {
    return { ...this.stats };
  }

  /**
   * Reset AI performance statistics
   */
  resetStats(): void {
    this.stats = this.createInitialStats();
  }

  /**
   * Identify moves that can clear lines (BEAM PRE-FILTER)
   * This filter ensures line-clearing moves are always prioritized
   * @param board - Current board state
   * @param moves - All possible moves
   * @returns Moves that can clear lines
   */
  private identifyLineClearingMoves(board: BitBoard, moves: Move[]): Move[] {
    const lineClearingMoves: Move[] = [];

    for (const move of moves) {
      // Create a temporary board to test the move
      const tempBoard = board.clone();

      // Get piece bit patterns
      const pieceBitRows = getPieceBitsAtPosition(move.piece, move.rotation, move.x);

      // Skip invalid moves
      if (!pieceBitRows || pieceBitRows.length === 0) {
        continue;
      }

      // Simulate piece placement
      if (tempBoard.canPlace(pieceBitRows, move.y)) {
        tempBoard.place(pieceBitRows, move.y);

        // Check if this move clears any lines
        const clearedLines = tempBoard.clearLines();
        if (clearedLines.length > 0) {
          // Store the number of lines cleared in the move
          move.linesCleared = clearedLines.length;
          lineClearingMoves.push(move);

          if (this.config.enableLogging) {
            console.log(
              `🎯 [AI] Line-clearing move found: ${move.piece} R${move.rotation} (${move.x},${move.y}) clears ${clearedLines.length} lines`,
            );
          }
        }
      }
    }

    return lineClearingMoves;
  }

  /**
   * Update AI configuration
   * @param newConfig - New configuration options
   */
  updateConfig(newConfig: Partial<AIConfig>): void {
    Object.assign(this.config, newConfig);
  }

  /**
   * Get current AI configuration
   * @returns Current configuration
   */
  getConfig(): AIConfig {
    return { ...this.config };
  }
}

import {
  AdvancedFeatures,
  type PerfectClearOpportunity,
  type TerrainEvaluation,
  type TSpinOpportunity,
} from "@/game/ai/evaluators/advanced-features";
import { DellacherieEvaluator } from "@/game/ai/evaluators/dellacherie";
import {
  DEFAULT_PATTERN_CONFIG,
  PatternEvaluator,
  type PatternEvaluatorConfig,
} from "@/game/ai/evaluators/pattern-evaluator";
import { DynamicWeights } from "@/game/ai/evaluators/weights";
import {
  BeamSearch,
  type BeamSearchConfig,
  DEFAULT_BEAM_CONFIG,
} from "@/game/ai/search/beam-search";
import {
  DEFAULT_HOLD_OPTIONS,
  HoldAwareSearch,
  type HoldSearchOptions,
  type HoldSearchResult,
} from "@/game/ai/search/hold-search";
import {
  DEFAULT_BEAM_SEARCH_CONFIG,
  DEFAULT_HOLD_SEARCH_CONFIG,
  type UnifiedSearchConfig,
} from "@/game/ai/search/search-config";
import { getTetrominoShape } from "@/game/tetrominos";
import type { GameState, Tetromino } from "@/types/game";
import { type AIConfig, type AIDecision, AIEngine } from "./ai-engine";
import type { BitBoardData } from "./bitboard";
import { createBitBoard } from "./bitboard";
import { type Move, MoveGenerator } from "./move-generator";

/**
 * Advanced AI configuration extending base AI config
 */
export interface AdvancedAIConfig extends AIConfig {
  /** Beam search configuration */
  beamSearchConfig: BeamSearchConfig;
  /** Hold search options */
  holdSearchOptions: HoldSearchOptions;
  /** Enable advanced features (T-Spin, PC detection) */
  enableAdvancedFeatures: boolean;
  /** Enable debug logging for search process */
  enableSearchLogging: boolean;
  /** Enable pattern detection (PCO, DT Cannon, ST-Stack) */
  enablePatternDetection: boolean;
  /** Pattern evaluator configuration */
  patternEvaluatorConfig?: PatternEvaluatorConfig;
  /** Search strategy selection (beam, hold, pattern, diversity) */
  searchStrategy?: string;
  /** Use unified search strategy interface */
  useUnifiedSearchStrategy?: boolean;
  /** Unified search configuration */
  unifiedSearchConfig?: UnifiedSearchConfig;
}

/**
 * Advanced AI decision result with detailed analysis
 * Extends both base AIDecision and HoldSearchResult for compatibility
 */
export interface AdvancedAIDecision extends AIDecision, HoldSearchResult {
  /** T-Spin opportunities detected */
  tSpinOpportunities: TSpinOpportunity[];
  /** Perfect Clear opportunity if detected */
  perfectClearOpportunity: PerfectClearOpportunity | null;
  /** Terrain evaluation metrics */
  terrainEvaluation: TerrainEvaluation;
  /** Search depth actually reached */
  searchDepth: number;
  /** Whether beam search timed out */
  searchTimedOut: boolean;
}

/**
 * Default advanced AI configuration optimized for aggressive line clearing
 */
export const DEFAULT_ADVANCED_CONFIG: AdvancedAIConfig = {
  thinkingTimeLimit: 80, // Increased for deeper search
  evaluator: "dellacherie",
  enableLogging: false, // Disable for performance in production
  fallbackOnTimeout: true,
  useDynamicWeights: true,
  beamSearchConfig: {
    ...DEFAULT_BEAM_CONFIG,
    timeLimit: 70, // Increased time for deeper search
  },
  holdSearchOptions: {
    ...DEFAULT_HOLD_OPTIONS,
    holdPenalty: 2, // Further reduced penalty for more Hold usage
  },
  enableAdvancedFeatures: true,
  enableSearchLogging: false, // Disable for performance unless debugging
  enablePatternDetection: true, // Enable advanced pattern detection
  patternEvaluatorConfig: DEFAULT_PATTERN_CONFIG,
  searchStrategy: "hold", // Default to hold search strategy
  useUnifiedSearchStrategy: false, // Disabled by default for backward compatibility
  unifiedSearchConfig: {
    maxDepth: 3,
    timeLimit: 70,
    enablePruning: false,
    beamSearch: {
      ...DEFAULT_BEAM_SEARCH_CONFIG,
      timeLimit: 70,
    },
    holdSearch: {
      ...DEFAULT_HOLD_SEARCH_CONFIG,
      timeLimit: 70,
      holdPenalty: 2,
    },
    patternSearch: {
      maxDepth: 2,
      timeLimit: 80,
      enablePruning: true,
      strategyConfig: {},
      patternDepth: 2,
      patternTypes: ["PCO", "DT_CANNON", "ST_STACK"],
      maxPatternAttempts: 10,
    },
    diversityBeamSearch: {
      ...DEFAULT_BEAM_SEARCH_CONFIG,
      timeLimit: 70,
      diversityWeight: 0.3,
      explorationFactor: 0.2,
      diversityConfig: {
        surfaceAnalysisWeight: 0.4,
        heightVariationWeight: 0.3,
        positionSpreadWeight: 0.3,
        baseDiversityRatio: 0.5,
        depthDiscountFactor: 0.95,
        uncertaintyPenalty: 0.1,
        complexityBonusWeight: 0.3,
        dynamicDiversityRatio: true,
      },
    },
  },
};

/**
 * Advanced AI Engine for Phase 2 implementing beam search with 2-depth lookahead
 * Integrates Hold support, T-Spin detection, and Perfect Clear recognition
 */
export class AdvancedAIEngine extends AIEngine {
  private readonly beamSearch: BeamSearch;
  private readonly holdSearch: HoldAwareSearch;
  private readonly advancedFeatures: AdvancedFeatures;
  private readonly advancedConfig: AdvancedAIConfig;

  // Unified search strategy interface
  private readonly searchStrategy?: BeamSearch | HoldAwareSearch;
  private readonly useUnifiedSearch: boolean;

  constructor(config: AdvancedAIConfig = DEFAULT_ADVANCED_CONFIG) {
    // Initialize base AI engine with modified config for advanced features
    const baseConfig = {
      ...config,
      thinkingTimeLimit: config.thinkingTimeLimit,
    };
    super(baseConfig);

    this.advancedConfig = { ...config };
    this.useUnifiedSearch = config.useUnifiedSearchStrategy ?? false;

    // Initialize evaluator based on pattern detection setting
    const evaluator = config.enablePatternDetection
      ? new PatternEvaluator(undefined, config.patternEvaluatorConfig)
      : new DellacherieEvaluator();

    const moveGenerator = new MoveGenerator({
      useHold: config.holdSearchOptions.allowHoldUsage,
      maxSearchDepth: config.beamSearchConfig.maxDepth,
      includeWallKicks: true,
      enableTSpinDetection: config.enableAdvancedFeatures,
    });

    // Initialize beam search
    this.beamSearch = new BeamSearch(evaluator, moveGenerator, config.beamSearchConfig);

    // Initialize Hold-aware search
    this.holdSearch = new HoldAwareSearch(this.beamSearch, config.holdSearchOptions);

    // Initialize unified search strategy if enabled
    if (this.useUnifiedSearch) {
      const strategy = config.searchStrategy || "hold";
      this.searchStrategy = this.createSearchStrategy(strategy, evaluator, moveGenerator, config);
    }

    // Initialize advanced features
    this.advancedFeatures = new AdvancedFeatures();
  }

  /**
   * Create search strategy based on configuration
   */
  private createSearchStrategy(
    strategy: string,
    _evaluator: DellacherieEvaluator,
    _moveGenerator: MoveGenerator,
    _config: AdvancedAIConfig,
  ): BeamSearch | HoldAwareSearch {
    switch (strategy) {
      case "beam": {
        return this.beamSearch;
      }
      case "hold": {
        return this.holdSearch;
      }
      default:
        throw new Error(`Unsupported search strategy: ${strategy}`);
    }
  }

  /**
   * Convert unified search result to legacy HoldSearchResult format
   */
  private convertUnifiedResult(unifiedResult: {
    bestPath: Move[];
    bestScore: number;
  }): HoldSearchResult {
    // If the result is already a HoldSearchResult, return it as is
    if ("usedHold" in unifiedResult) {
      return unifiedResult as unknown as HoldSearchResult;
    }

    // Otherwise, convert basic SearchResult to HoldSearchResult format
    return {
      bestPath: unifiedResult.bestPath,
      bestScore: unifiedResult.bestScore,
      nodesExplored: 0,
      searchTime: 0,
      reachedDepth: 0,
      usedHold: false, // Default to false for non-hold strategies
      alternativeResults: [], // Empty for non-hold strategies
      holdPenaltyApplied: 0, // No penalty for non-hold strategies
    };
  }

  /**
   * Find best move using advanced beam search with Hold support
   * @param gameState - Current game state
   * @returns Advanced AI decision with detailed analysis
   */
  async findBestMove(gameState: GameState): Promise<AdvancedAIDecision> {
    const startTime = performance.now();

    try {
      // Validate game state
      if (!gameState.currentPiece) {
        return this.createAdvancedErrorDecision(startTime, "No current piece");
      }

      if (gameState.isGameOver) {
        return this.createAdvancedErrorDecision(startTime, "Game over");
      }

      // Convert board to BitBoard for AI processing
      const board = createBitBoard(gameState.board);

      // Update dynamic weights if enabled
      if (this.advancedConfig.useDynamicWeights) {
        await this.updateAdvancedDynamicWeights(board, gameState.lines, gameState.level);
      }

      // Detect advanced features if enabled
      let tSpinOpportunities: TSpinOpportunity[] = [];
      let perfectClearOpportunity: PerfectClearOpportunity | null = null;
      let terrainEvaluation: TerrainEvaluation;

      if (this.advancedConfig.enableAdvancedFeatures) {
        tSpinOpportunities = this.advancedFeatures.detectTSpinOpportunity(board);
        perfectClearOpportunity = this.advancedFeatures.detectPerfectClear(board);
        terrainEvaluation = this.advancedFeatures.evaluateTerrain(board);

        if (this.advancedConfig.enableSearchLogging) {
          console.log("[AdvancedAI] T-Spin opportunities:", tSpinOpportunities.length);
          console.log("[AdvancedAI] Perfect Clear opportunity:", !!perfectClearOpportunity);
          console.log("[AdvancedAI] Terrain evaluation:", terrainEvaluation);
        }
      } else {
        terrainEvaluation = {
          smoothness: 0,
          accessibility: 0,
          tSpinPotential: 0,
          pcPotential: 0,
        };
      }

      // Prepare pieces for search
      const currentPiece = gameState.currentPiece;
      const nextPieces = this.buildNextPieceQueue(gameState);
      const heldPiece = gameState.heldPiece
        ? this.createTetrominoFromType(gameState.heldPiece)
        : undefined;

      // Update pattern evaluator with current game state if pattern detection is enabled
      if (
        this.advancedConfig.enablePatternDetection &&
        this.beamSearch.getEvaluator() instanceof PatternEvaluator
      ) {
        const pieceTypes = [currentPiece.type, ...nextPieces.map((p) => p.type)];
        (this.beamSearch.getEvaluator() as PatternEvaluator).updateGameState(
          pieceTypes,
          gameState.lines,
          gameState.level,
        );
      }

      // Perform search using unified strategy or legacy approach
      let searchResult: HoldSearchResult;
      if (this.useUnifiedSearch && this.searchStrategy) {
        // Use unified search strategy interface
        if (this.searchStrategy instanceof BeamSearch) {
          const unifiedResult = this.searchStrategy.search(
            board,
            currentPiece,
            nextPieces,
            heldPiece,
          );
          searchResult = this.convertUnifiedResult(unifiedResult);
        } else {
          searchResult = this.searchStrategy.searchWithHold(
            board,
            currentPiece,
            nextPieces,
            heldPiece,
          );
        }
      } else {
        // Use legacy Hold-aware beam search
        searchResult = this.holdSearch.searchWithHold(board, currentPiece, nextPieces, heldPiece);
      }

      const thinkingTime = performance.now() - startTime;

      if (this.advancedConfig.enableSearchLogging) {
        console.log(
          `[AdvancedAI] Search completed: ${searchResult.nodesExplored} nodes, ` +
            `depth ${searchResult.reachedDepth}, ${thinkingTime.toFixed(1)}ms, ` +
            `score ${searchResult.bestScore.toFixed(2)}, hold: ${searchResult.usedHold}`,
        );
      }

      // Create compatible decision with both AIDecision and HoldSearchResult properties
      const bestMove = searchResult.bestPath.length > 0 ? searchResult.bestPath[0] : null;
      const allMoves = searchResult.bestPath;

      // If no best path was found, create a fallback decision with default moves
      if (!bestMove && this.advancedConfig.fallbackOnTimeout) {
        // Generate a simple fallback move (straight drop)
        const fallbackMove = this.generateFallbackMove(currentPiece);
        if (fallbackMove) {
          const fallbackPath = [fallbackMove];

          return {
            // AIDecision properties
            bestMove: fallbackMove,
            allMoves: fallbackPath,
            thinkingTime,
            evaluationCount: searchResult.nodesExplored,
            timedOut: searchResult.searchTime >= this.advancedConfig.beamSearchConfig.timeLimit,

            // HoldSearchResult properties
            ...searchResult,
            bestPath: fallbackPath,
            bestScore:
              searchResult.bestScore !== Number.NEGATIVE_INFINITY ? searchResult.bestScore : 0,

            // AdvancedAIDecision properties
            tSpinOpportunities,
            perfectClearOpportunity,
            terrainEvaluation,
            searchDepth: searchResult.reachedDepth,
            searchTimedOut:
              searchResult.searchTime >= this.advancedConfig.beamSearchConfig.timeLimit,
          };
        }
      }

      return {
        // AIDecision properties
        bestMove,
        allMoves,
        thinkingTime,
        evaluationCount: searchResult.nodesExplored,
        timedOut: searchResult.searchTime >= this.advancedConfig.beamSearchConfig.timeLimit,

        // HoldSearchResult properties
        ...searchResult,

        // AdvancedAIDecision properties
        tSpinOpportunities,
        perfectClearOpportunity,
        terrainEvaluation,
        searchDepth: searchResult.reachedDepth,
        searchTimedOut: searchResult.searchTime >= this.advancedConfig.beamSearchConfig.timeLimit,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return this.createAdvancedErrorDecision(startTime, errorMessage);
    }
  }

  /**
   * Update dynamic weights based on advanced analysis
   * @param board - Current board state
   * @param lines - Lines cleared
   * @param level - Current level
   */
  private async updateAdvancedDynamicWeights(
    board: BitBoardData,
    lines: number,
    level: number,
  ): Promise<void> {
    try {
      const dynamicWeights = new DynamicWeights();
      const situation = dynamicWeights.analyzeSituation(board, lines, level);

      // Enhance situation analysis with advanced features
      if (this.advancedConfig.enableAdvancedFeatures) {
        const terrain = this.advancedFeatures.evaluateTerrain(board);

        // Adjust weights based on T-Spin and PC potential
        if (terrain.tSpinPotential > 0.5) {
          // Increase T-Spin setup incentives
          situation.gamePhase = "mid"; // Prefer more strategic play
        }

        if (terrain.pcPotential > 0.7) {
          // Increase Perfect Clear incentives
          situation.gamePhase = "early"; // Prefer line clearing
        }
      }

      // Apply weights to beam search evaluator
      // Note: This would require access to the evaluator in beam search
      // For now, weights are applied at the base level
      // TODO: Implement weight propagation to beam search evaluator
      dynamicWeights.adjustWeights(situation);
    } catch (error) {
      console.error("[AdvancedAI] Error in updateDynamicWeights:", error);
    }
  }

  /**
   * Build queue of next pieces for lookahead
   * @param gameState - Current game state
   * @returns Array of Tetromino objects for search
   */
  private buildNextPieceQueue(gameState: GameState): Tetromino[] {
    const queue: Tetromino[] = [];
    const maxLookahead = this.advancedConfig.beamSearchConfig.maxDepth;

    // Add next piece from game state
    if (gameState.nextPiece) {
      queue.push(this.createTetrominoFromType(gameState.nextPiece));
    }

    // Generate additional pieces from bag system if needed
    // For Phase 2, we'll use the next piece from the game state
    // and generate additional pieces for deeper lookahead
    for (let i = queue.length; i < maxLookahead + 2; i++) {
      // Use simple piece generation for demonstration
      // In practice, this should use the game's 7-bag system
      const pieceTypes = ["I", "O", "T", "S", "Z", "J", "L"] as const;
      const randomType = pieceTypes[i % 7];
      queue.push(this.createTetrominoFromType(randomType));
    }

    return queue.slice(0, maxLookahead + 2);
  }

  /**
   * Create Tetromino object from piece type
   * @param type - Piece type name
   * @returns Tetromino object
   */
  private createTetrominoFromType(type: string): Tetromino {
    return {
      type: type as Tetromino["type"],
      position: { x: 4, y: 0 },
      rotation: 0,
      shape: getTetrominoShape(type as Tetromino["type"]),
    };
  }

  /**
   * Generate a simple fallback move (straight drop)
   * @param piece - Current piece
   * @returns Fallback move or null
   */
  private generateFallbackMove(piece: Tetromino): Move | null {
    try {
      // Create a simple straight drop move
      return {
        piece: piece.type,
        rotation: piece.rotation,
        x: piece.position.x,
        y: piece.position.y,
        sequence: [{ type: "HARD_DROP" }],
        evaluationScore: 0,
      };
    } catch (error) {
      console.error("[AdvancedAI] Error generating fallback move:", error);
      return null;
    }
  }

  /**
   * Create error decision for advanced AI
   * @param startTime - Start time for duration calculation
   * @param error - Error message
   * @returns Advanced error decision
   */
  private createAdvancedErrorDecision(startTime: number, error: string): AdvancedAIDecision {
    const thinkingTime = performance.now() - startTime;

    return {
      // AIDecision properties
      bestMove: null,
      allMoves: [],
      thinkingTime,
      evaluationCount: 0,
      timedOut: false,
      error,

      // HoldSearchResult properties
      bestPath: [],
      bestScore: Number.NEGATIVE_INFINITY,
      nodesExplored: 0,
      searchTime: thinkingTime,
      reachedDepth: 0,
      usedHold: false,
      alternativeResults: [],
      holdPenaltyApplied: 0,

      // AdvancedAIDecision properties
      tSpinOpportunities: [],
      perfectClearOpportunity: null,
      terrainEvaluation: {
        smoothness: 0,
        accessibility: 0,
        tSpinPotential: 0,
        pcPotential: 0,
      },
      searchDepth: 0,
      searchTimedOut: false,
    };
  }

  /**
   * Update advanced AI configuration
   * @param newConfig - New configuration options
   */
  updateAdvancedConfig(newConfig: Partial<AdvancedAIConfig>): void {
    Object.assign(this.advancedConfig, newConfig);

    // Update sub-component configurations
    if (newConfig.beamSearchConfig) {
      this.beamSearch.updateConfig(newConfig.beamSearchConfig);
    }

    if (newConfig.holdSearchOptions) {
      this.holdSearch.updateOptions(newConfig.holdSearchOptions);
    }

    // Update unified search strategy configuration
    if (this.useUnifiedSearch && this.searchStrategy && newConfig.unifiedSearchConfig) {
      // Configuration update is handled by the component search strategies
    }
  }

  /**
   * Get current advanced configuration
   * @returns Current advanced configuration
   */
  getAdvancedConfig(): AdvancedAIConfig {
    return { ...this.advancedConfig };
  }

  /**
   * Get performance statistics for the advanced AI
   * @returns Extended stats including search metrics
   */
  getAdvancedStats(): AdvancedAIStats {
    const baseStats = this.getStats();

    return {
      ...baseStats,
      averageSearchDepth: 0, // TODO: Track this
      averageNodesExplored: 0, // TODO: Track this
      holdUsageRate: 0, // TODO: Track this
      tSpinDetectionRate: 0, // TODO: Track this
      perfectClearDetectionRate: 0, // TODO: Track this
    };
  }
}

/**
 * Extended statistics for advanced AI
 */
export interface AdvancedAIStats {
  totalDecisions: number;
  averageThinkTime: number;
  timeoutCount: number;
  bestScore: number;
  worstScore: number;
  averageSearchDepth: number;
  averageNodesExplored: number;
  holdUsageRate: number;
  tSpinDetectionRate: number;
  perfectClearDetectionRate: number;
}

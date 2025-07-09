import type { Tetromino } from "@/types/game";
import type { BitBoard } from "../core/bitboard";
import type { PatternTemplate } from "../evaluators/patterns";
import { PatternSearch } from "./pattern-search";
import {
  ConfigManager,
  ConfigValidator,
  DEFAULT_PATTERN_SEARCH_CONFIG,
  type PatternSearchConfigUnified,
} from "./search-config";
import {
  BaseSearchStrategy,
  type SearchConfig,
  type PatternSearchResult as UnifiedPatternSearchResult,
} from "./search-strategy";

/**
 * Adapter for PatternSearch that implements the unified SearchStrategy interface
 */
export class PatternSearchAdapter extends BaseSearchStrategy {
  private patternSearch: PatternSearch;
  private patternConfig: PatternSearchConfigUnified;

  constructor(config: PatternSearchConfigUnified = DEFAULT_PATTERN_SEARCH_CONFIG) {
    super(config);
    this.patternConfig = ConfigManager.sanitizeConfig(config);
    this.patternSearch = new PatternSearch(this.patternConfig.patternConfig);
  }

  /**
   * Convert BitBoard to Uint32Array format expected by PatternSearch
   */
  private convertBitBoardToUint32Array(board: BitBoard): Uint32Array {
    // BitBoard has getRowBits method to get row bits directly
    const array = new Uint32Array(20);
    for (let y = 0; y < 20; y++) {
      array[y] = board.getRowBits(y);
    }
    return array;
  }

  /**
   * Convert Tetromino objects to TetrominoTypeName array
   */
  private convertTetrominos(tetrominoes: Tetromino[]): import("@/types/game").TetrominoTypeName[] {
    return tetrominoes.map((tetromino) => tetromino.type);
  }

  /**
   * Convert PatternSearchResult to unified SearchResult
   */
  private convertResult(
    result: import("./pattern-search").PatternSearchResult,
    template: PatternTemplate,
  ): UnifiedPatternSearchResult {
    return {
      bestPath: result.path,
      bestScore: result.found ? 1000 : 0, // High score if pattern found
      nodesExplored: result.nodesExplored,
      searchTime: result.timeElapsed,
      reachedDepth: result.path.length,
      found: result.found,
      metadata: {
        strategy: "pattern",
        patternType: template.name || "unknown",
        patternData: {
          template,
          timeElapsed: result.timeElapsed,
        },
      },
    };
  }

  /**
   * Perform pattern search using the unified interface
   * Note: Pattern search requires a specific pattern template to search for
   */
  search(
    initialBoard: BitBoard,
    currentPiece: Tetromino,
    nextPieces: Tetromino[],
    _heldPiece?: Tetromino,
    config?: SearchConfig,
  ): UnifiedPatternSearchResult {
    // Use provided config or fall back to instance config
    const searchConfig = config
      ? ConfigManager.mergeConfigs(this.patternConfig, config)
      : this.patternConfig;

    // Update pattern search configuration if needed
    if (config) {
      this.patternSearch = new PatternSearch(searchConfig.patternConfig);
    }

    // Convert parameters to format expected by PatternSearch
    const boardArray = this.convertBitBoardToUint32Array(initialBoard);
    const pieceQueue = [currentPiece.type, ...this.convertTetrominos(nextPieces)];

    // For pattern search, we need a specific template
    // This is a limitation of the current pattern search implementation
    // In a real implementation, we would either:
    // 1. Accept the template as a parameter in the search method
    // 2. Have a default template or auto-detect patterns
    // For now, we'll use a basic template or throw an error

    const template = this.getDefaultTemplate(searchConfig);

    if (!template) {
      // Return empty result if no template is available
      return {
        bestPath: [],
        bestScore: 0,
        nodesExplored: 0,
        searchTime: 0,
        reachedDepth: 0,
        found: false,
        metadata: {
          strategy: "pattern",
          error: "No pattern template available",
        },
      };
    }

    // Execute pattern search
    const result = this.patternSearch.search(boardArray, pieceQueue, template);

    // Convert result to unified format
    return this.convertResult(result, template);
  }

  /**
   * Get default template for pattern search
   * This is a placeholder - in a real implementation, this would be
   * more sophisticated
   */
  private getDefaultTemplate(config: PatternSearchConfigUnified): PatternTemplate | null {
    // This is a placeholder implementation
    // In practice, you would either:
    // 1. Have the template passed as part of the config
    // 2. Have a pattern detection system
    // 3. Use a default template

    if (config.strategyConfig?.template) {
      return config.strategyConfig.template as PatternTemplate;
    }

    // Return null if no template is available
    return null;
  }

  /**
   * Get strategy name
   */
  getName(): string {
    return "pattern";
  }

  /**
   * Get supported configuration options
   */
  getSupportedOptions(): string[] {
    return [
      "maxDepth",
      "timeLimit",
      "enablePruning",
      "patternConfig",
      "patternConfig.maxDepth",
      "patternConfig.pruningRules",
      "patternConfig.timeLimit",
    ];
  }

  /**
   * Update configuration with validation
   */
  updateConfig(config: Partial<SearchConfig>): void {
    const newConfig = ConfigManager.mergeConfigs(this.patternConfig, config);

    if (!ConfigValidator.validatePatternSearchConfig(newConfig as PatternSearchConfigUnified)) {
      throw new Error("Invalid pattern search configuration");
    }

    this.patternConfig = ConfigManager.sanitizeConfig(newConfig as PatternSearchConfigUnified);
    this.config = this.patternConfig;

    // Recreate pattern search with new config
    this.patternSearch = new PatternSearch(this.patternConfig.patternConfig);
  }

  /**
   * Get current configuration
   */
  getConfig(): SearchConfig {
    return { ...this.patternConfig };
  }

  /**
   * Validate configuration
   */
  validateConfig(config: SearchConfig): boolean {
    return ConfigValidator.validatePatternSearchConfig(config as PatternSearchConfigUnified);
  }

  /**
   * Get the underlying PatternSearch instance for compatibility
   */
  getPatternSearch(): PatternSearch {
    return this.patternSearch;
  }

  /**
   * Search for a specific pattern template
   * This is a pattern-specific method that allows direct template specification
   */
  searchForPattern(
    initialBoard: BitBoard,
    currentPiece: Tetromino,
    nextPieces: Tetromino[],
    template: PatternTemplate,
    config?: SearchConfig,
  ): UnifiedPatternSearchResult {
    // Use provided config or fall back to instance config
    const searchConfig = config
      ? ConfigManager.mergeConfigs(this.patternConfig, config)
      : this.patternConfig;

    // Update pattern search configuration if needed
    if (config) {
      this.patternSearch = new PatternSearch(searchConfig.patternConfig);
    }

    // Convert parameters to format expected by PatternSearch
    const boardArray = this.convertBitBoardToUint32Array(initialBoard);
    const pieceQueue = [currentPiece.type, ...this.convertTetrominos(nextPieces)];

    // Execute pattern search
    const result = this.patternSearch.search(boardArray, pieceQueue, template);

    // Convert result to unified format
    return this.convertResult(result, template);
  }
}

/**
 * Factory function for creating PatternSearchAdapter instances
 */
export function createPatternSearchAdapter(
  config: PatternSearchConfigUnified = DEFAULT_PATTERN_SEARCH_CONFIG,
): PatternSearchAdapter {
  return new PatternSearchAdapter(config);
}

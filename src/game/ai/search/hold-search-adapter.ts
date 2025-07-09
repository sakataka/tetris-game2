import type { Tetromino } from "@/types/game";
import type { BitBoard } from "../core/bitboard";
import type { BeamSearch } from "./beam-search";
import { HoldAwareSearch } from "./hold-search";
import {
  ConfigManager,
  ConfigValidator,
  DEFAULT_HOLD_SEARCH_CONFIG,
  type HoldSearchConfigUnified,
} from "./search-config";
import {
  BaseSearchStrategy,
  type SearchConfig,
  type HoldSearchResult as UnifiedHoldSearchResult,
} from "./search-strategy";

/**
 * Adapter for HoldAwareSearch that implements the unified SearchStrategy interface
 */
export class HoldSearchAdapter extends BaseSearchStrategy {
  private holdSearch: HoldAwareSearch;
  private holdConfig: HoldSearchConfigUnified;

  constructor(
    baseSearch: BeamSearch,
    config: HoldSearchConfigUnified = DEFAULT_HOLD_SEARCH_CONFIG,
  ) {
    super(config);
    this.holdConfig = ConfigManager.sanitizeConfig(config);
    this.holdSearch = new HoldAwareSearch(baseSearch, this.holdConfig.holdOptions);
  }

  /**
   * Convert HoldSearchResult to unified format
   */
  private convertResult(result: import("./hold-search").HoldSearchResult): UnifiedHoldSearchResult {
    return {
      bestPath: result.bestPath,
      bestScore: result.bestScore,
      nodesExplored: result.nodesExplored,
      searchTime: result.searchTime,
      reachedDepth: result.reachedDepth,
      usedHold: result.usedHold,
      alternativeResults: result.alternativeResults,
      holdPenaltyApplied: result.holdPenaltyApplied,
      metadata: {
        strategy: "hold",
        holdEnabled: this.holdConfig.holdOptions.allowHoldUsage,
        holdPenalty: this.holdConfig.holdOptions.holdPenalty,
        maxHoldUsage: this.holdConfig.holdOptions.maxHoldUsage,
      },
    };
  }

  /**
   * Perform Hold-aware search using the unified interface
   */
  search(
    initialBoard: BitBoard,
    currentPiece: Tetromino,
    nextPieces: Tetromino[],
    heldPiece?: Tetromino,
    config?: SearchConfig,
  ): UnifiedHoldSearchResult {
    // Use provided config or fall back to instance config
    const searchConfig = config
      ? ConfigManager.mergeConfigs(this.holdConfig, config)
      : this.holdConfig;

    // Update hold search configuration if needed
    if (config) {
      const holdOptions = (searchConfig as HoldSearchConfigUnified).holdOptions;
      this.holdSearch.updateOptions(holdOptions);
    }

    // Execute Hold-aware search
    const result = this.holdSearch.searchWithHold(
      initialBoard,
      currentPiece,
      nextPieces,
      heldPiece,
    );

    // Convert result to unified format
    return this.convertResult(result);
  }

  /**
   * Get strategy name
   */
  getName(): string {
    return "hold";
  }

  /**
   * Get supported configuration options
   */
  getSupportedOptions(): string[] {
    return [
      "maxDepth",
      "timeLimit",
      "enablePruning",
      "holdOptions",
      "holdOptions.allowHoldUsage",
      "holdOptions.holdPenalty",
      "holdOptions.maxHoldUsage",
    ];
  }

  /**
   * Update configuration with validation
   */
  updateConfig(config: Partial<SearchConfig>): void {
    const newConfig = ConfigManager.mergeConfigs(this.holdConfig, config);

    if (!ConfigValidator.validateHoldSearchConfig(newConfig as HoldSearchConfigUnified)) {
      throw new Error("Invalid hold search configuration");
    }

    this.holdConfig = ConfigManager.sanitizeConfig(newConfig as HoldSearchConfigUnified);
    this.config = this.holdConfig;

    // Update underlying hold search
    this.holdSearch.updateOptions(this.holdConfig.holdOptions);
  }

  /**
   * Get current configuration
   */
  getConfig(): SearchConfig {
    return { ...this.holdConfig };
  }

  /**
   * Validate configuration
   */
  validateConfig(config: SearchConfig): boolean {
    return ConfigValidator.validateHoldSearchConfig(config as HoldSearchConfigUnified);
  }

  /**
   * Get the underlying HoldAwareSearch instance for compatibility
   */
  getHoldSearch(): HoldAwareSearch {
    return this.holdSearch;
  }

  /**
   * Get the current hold options
   */
  getHoldOptions(): import("./hold-search").HoldSearchOptions {
    return this.holdSearch.getOptions();
  }

  /**
   * Direct search method that returns the native HoldSearchResult
   * This is for compatibility with existing code that expects the original format
   */
  searchWithHold(
    initialBoard: BitBoard,
    currentPiece: Tetromino,
    nextPieces: Tetromino[],
    heldPiece?: Tetromino,
  ): import("./hold-search").HoldSearchResult {
    return this.holdSearch.searchWithHold(initialBoard, currentPiece, nextPieces, heldPiece);
  }
}

/**
 * Factory function for creating HoldSearchAdapter instances
 */
export function createHoldSearchAdapter(
  baseSearch: BeamSearch,
  config: HoldSearchConfigUnified = DEFAULT_HOLD_SEARCH_CONFIG,
): HoldSearchAdapter {
  return new HoldSearchAdapter(baseSearch, config);
}

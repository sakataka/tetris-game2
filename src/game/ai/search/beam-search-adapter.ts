import type { Tetromino } from "@/types/game";
import type { BitBoard } from "../core/bitboard";
import type { MoveGenerator } from "../core/move-generator";
import type { DellacherieEvaluator } from "../evaluators/dellacherie";
import { BeamSearch, type DEFAULT_BEAM_CONFIG } from "./beam-search";
import {
  type BeamSearchConfig,
  ConfigManager,
  ConfigValidator,
  DEFAULT_BEAM_SEARCH_CONFIG,
} from "./search-config";
import { BaseSearchStrategy, type SearchConfig, type SearchResult } from "./search-strategy";

/**
 * Adapter for BeamSearch that implements the unified SearchStrategy interface
 */
export class BeamSearchAdapter extends BaseSearchStrategy {
  private readonly beamSearch: BeamSearch;
  private beamConfig: BeamSearchConfig;

  constructor(
    evaluator: DellacherieEvaluator,
    moveGenerator: MoveGenerator,
    config: BeamSearchConfig = DEFAULT_BEAM_SEARCH_CONFIG,
  ) {
    super(config);
    this.beamConfig = ConfigManager.sanitizeConfig(config);

    // Convert unified config to legacy BeamSearch config
    const legacyConfig = this.convertToLegacyConfig(this.beamConfig);
    this.beamSearch = new BeamSearch(evaluator, moveGenerator, legacyConfig);
  }

  /**
   * Convert unified config to legacy BeamSearch config format
   */
  private convertToLegacyConfig(config: BeamSearchConfig): typeof DEFAULT_BEAM_CONFIG {
    return {
      beamWidth: config.beamWidth,
      maxDepth: config.maxDepth,
      useHold: config.useHold,
      enablePruning: config.enablePruning,
      timeLimit: config.timeLimit,
      enableDiversity: config.enableDiversity,
      diversityConfig: config.diversityConfig,
    };
  }

  /**
   * Perform beam search using the unified interface
   */
  search(
    initialBoard: BitBoard,
    currentPiece: Tetromino,
    nextPieces: Tetromino[],
    heldPiece?: Tetromino,
    config?: SearchConfig,
  ): SearchResult {
    // Use provided config or fall back to instance config
    const searchConfig = config
      ? ConfigManager.mergeConfigs(this.beamConfig, config)
      : this.beamConfig;

    // Update beam search configuration if needed
    if (config) {
      const legacyConfig = this.convertToLegacyConfig(searchConfig as BeamSearchConfig);
      this.beamSearch.updateConfig(legacyConfig);
    }

    // Execute search using legacy BeamSearch
    const result = this.beamSearch.search(initialBoard, currentPiece, nextPieces, heldPiece);

    // Convert result to unified format (already compatible)
    return {
      bestPath: result.bestPath,
      bestScore: result.bestScore,
      nodesExplored: result.nodesExplored,
      searchTime: result.searchTime,
      reachedDepth: result.reachedDepth,
      metadata: {
        strategy: "beam",
        beamWidth: searchConfig.beamWidth,
        diversityEnabled: (searchConfig as BeamSearchConfig).enableDiversity,
        holdEnabled: (searchConfig as BeamSearchConfig).useHold,
      },
    };
  }

  /**
   * Get strategy name
   */
  getName(): string {
    return "beam";
  }

  /**
   * Get supported configuration options
   */
  getSupportedOptions(): string[] {
    return [
      "maxDepth",
      "timeLimit",
      "enablePruning",
      "beamWidth",
      "useHold",
      "enableDiversity",
      "diversityConfig",
    ];
  }

  /**
   * Update configuration with validation
   */
  updateConfig(config: Partial<SearchConfig>): void {
    const newConfig = ConfigManager.mergeConfigs(this.beamConfig, config);

    if (!ConfigValidator.validateBeamSearchConfig(newConfig as BeamSearchConfig)) {
      throw new Error("Invalid beam search configuration");
    }

    this.beamConfig = ConfigManager.sanitizeConfig(newConfig as BeamSearchConfig);
    this.config = this.beamConfig;

    // Update underlying beam search
    const legacyConfig = this.convertToLegacyConfig(this.beamConfig);
    this.beamSearch.updateConfig(legacyConfig);
  }

  /**
   * Get current configuration
   */
  getConfig(): SearchConfig {
    return { ...this.beamConfig };
  }

  /**
   * Validate configuration
   */
  validateConfig(config: SearchConfig): boolean {
    return ConfigValidator.validateBeamSearchConfig(config as BeamSearchConfig);
  }

  /**
   * Get the underlying BeamSearch instance for compatibility
   */
  getBeamSearch(): BeamSearch {
    return this.beamSearch;
  }

  /**
   * Get the evaluator instance
   */
  getEvaluator(): DellacherieEvaluator {
    return this.beamSearch.getEvaluator();
  }
}

/**
 * Factory function for creating BeamSearchAdapter instances
 */
export function createBeamSearchAdapter(
  evaluator: DellacherieEvaluator,
  moveGenerator: MoveGenerator,
  config: BeamSearchConfig = DEFAULT_BEAM_SEARCH_CONFIG,
): BeamSearchAdapter {
  return new BeamSearchAdapter(evaluator, moveGenerator, config);
}

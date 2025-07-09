import type { Tetromino } from "@/types/game";
import type { BitBoard } from "../core/bitboard";
import type { MoveGenerator } from "../core/move-generator";
import type { DellacherieEvaluator } from "../evaluators/dellacherie";
import { BeamSearch } from "./beam-search";
import {
  ConfigManager,
  ConfigValidator,
  DEFAULT_DIVERSITY_BEAM_SEARCH_CONFIG,
  type DiversityBeamSearchConfig,
} from "./search-config";
import { BaseSearchStrategy, type SearchConfig, type SearchResult } from "./search-strategy";

/**
 * Adapter for Diversity Beam Search that implements the unified SearchStrategy interface
 * This adapter configures BeamSearch with diversity features enabled
 */
export class DiversityBeamSearchAdapter extends BaseSearchStrategy {
  private readonly beamSearch: BeamSearch;
  private diversityConfig: DiversityBeamSearchConfig;

  constructor(
    evaluator: DellacherieEvaluator,
    moveGenerator: MoveGenerator,
    config: DiversityBeamSearchConfig = DEFAULT_DIVERSITY_BEAM_SEARCH_CONFIG,
  ) {
    super(config);
    this.diversityConfig = ConfigManager.sanitizeConfig(config);

    // Convert unified config to legacy BeamSearch config with diversity enabled
    const legacyConfig = this.convertToLegacyConfig(this.diversityConfig);
    this.beamSearch = new BeamSearch(evaluator, moveGenerator, legacyConfig);
  }

  /**
   * Convert unified config to legacy BeamSearch config format with diversity enabled
   */
  private convertToLegacyConfig(
    config: DiversityBeamSearchConfig,
  ): import("./beam-search").BeamSearchConfig {
    return {
      beamWidth: config.beamWidth,
      maxDepth: config.maxDepth,
      useHold: true, // Diversity beam search typically uses hold
      enablePruning: config.enablePruning,
      timeLimit: config.timeLimit,
      enableDiversity: true, // Always enable diversity for this adapter
      diversityConfig: config.diversityConfig,
    };
  }

  /**
   * Perform diversity beam search using the unified interface
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
      ? ConfigManager.mergeConfigs(this.diversityConfig, config)
      : this.diversityConfig;

    // Update beam search configuration if needed
    if (config) {
      const legacyConfig = this.convertToLegacyConfig(searchConfig as DiversityBeamSearchConfig);
      this.beamSearch.updateConfig(legacyConfig);
    }

    // Execute search using BeamSearch with diversity enabled
    const result = this.beamSearch.search(initialBoard, currentPiece, nextPieces, heldPiece);

    // Convert result to unified format with diversity-specific metadata
    return {
      bestPath: result.bestPath,
      bestScore: result.bestScore,
      nodesExplored: result.nodesExplored,
      searchTime: result.searchTime,
      reachedDepth: result.reachedDepth,
      metadata: {
        strategy: "diversity-beam",
        beamWidth: searchConfig.beamWidth,
        diversityEnabled: true,
        diversityConfig: (searchConfig as DiversityBeamSearchConfig).diversityConfig,
        baseDiversityRatio: (searchConfig as DiversityBeamSearchConfig).diversityConfig
          .baseDiversityRatio,
        depthDiscountFactor: (searchConfig as DiversityBeamSearchConfig).diversityConfig
          .depthDiscountFactor,
        uncertaintyPenalty: (searchConfig as DiversityBeamSearchConfig).diversityConfig
          .uncertaintyPenalty,
        complexityBonusWeight: (searchConfig as DiversityBeamSearchConfig).diversityConfig
          .complexityBonusWeight,
        dynamicDiversityRatio: (searchConfig as DiversityBeamSearchConfig).diversityConfig
          .dynamicDiversityRatio,
      },
    };
  }

  /**
   * Get strategy name
   */
  getName(): string {
    return "diversity-beam";
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
      "diversityConfig",
      "diversityConfig.baseDiversityRatio",
      "diversityConfig.depthDiscountFactor",
      "diversityConfig.uncertaintyPenalty",
      "diversityConfig.complexityBonusWeight",
      "diversityConfig.dynamicDiversityRatio",
    ];
  }

  /**
   * Update configuration with validation
   */
  updateConfig(config: Partial<SearchConfig>): void {
    const newConfig = ConfigManager.mergeConfigs(this.diversityConfig, config);

    if (!this.validateDiversityConfig(newConfig as DiversityBeamSearchConfig)) {
      throw new Error("Invalid diversity beam search configuration");
    }

    this.diversityConfig = ConfigManager.sanitizeConfig(newConfig as DiversityBeamSearchConfig);
    this.config = this.diversityConfig;

    // Update underlying beam search
    const legacyConfig = this.convertToLegacyConfig(this.diversityConfig);
    this.beamSearch.updateConfig(legacyConfig);
  }

  /**
   * Get current configuration
   */
  getConfig(): SearchConfig {
    return { ...this.diversityConfig };
  }

  /**
   * Validate configuration
   */
  validateConfig(config: SearchConfig): boolean {
    return this.validateDiversityConfig(config as DiversityBeamSearchConfig);
  }

  /**
   * Validate diversity beam search configuration
   */
  private validateDiversityConfig(config: DiversityBeamSearchConfig): boolean {
    const baseValid = ConfigValidator.validateSearchConfig(config);
    const beamValid =
      typeof config.beamWidth === "number" && config.beamWidth > 0 && config.beamWidth <= 50;

    const diversityValid =
      typeof config.diversityConfig.baseDiversityRatio === "number" &&
      config.diversityConfig.baseDiversityRatio >= 0 &&
      config.diversityConfig.baseDiversityRatio <= 1 &&
      typeof config.diversityConfig.depthDiscountFactor === "number" &&
      config.diversityConfig.depthDiscountFactor >= 0 &&
      config.diversityConfig.depthDiscountFactor <= 1 &&
      typeof config.diversityConfig.uncertaintyPenalty === "number" &&
      config.diversityConfig.uncertaintyPenalty >= 0 &&
      typeof config.diversityConfig.complexityBonusWeight === "number" &&
      config.diversityConfig.complexityBonusWeight >= 0 &&
      typeof config.diversityConfig.dynamicDiversityRatio === "boolean";

    return baseValid && beamValid && diversityValid;
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

  /**
   * Get the current diversity configuration
   */
  getDiversityConfig(): import("./diversity-beam-search").DiversityConfig {
    return this.diversityConfig.diversityConfig;
  }
}

/**
 * Factory function for creating DiversityBeamSearchAdapter instances
 */
export function createDiversityBeamSearchAdapter(
  evaluator: DellacherieEvaluator,
  moveGenerator: MoveGenerator,
  config: DiversityBeamSearchConfig = DEFAULT_DIVERSITY_BEAM_SEARCH_CONFIG,
): DiversityBeamSearchAdapter {
  return new DiversityBeamSearchAdapter(evaluator, moveGenerator, config);
}

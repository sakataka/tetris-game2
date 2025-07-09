import type { DiversityConfig } from "./diversity-beam-search";
import type { HoldSearchOptions } from "./hold-search";
import type { PatternSearchConfig } from "./pattern-search";
import type { SearchConfig } from "./search-strategy";

/**
 * Beam search specific configuration
 */
export interface BeamSearchConfig extends SearchConfig {
  /** Beam width (number of nodes to keep at each level) */
  beamWidth: number;
  /** Whether to use Hold functionality */
  useHold: boolean;
  /** Enable diversified beam search */
  enableDiversity: boolean;
  /** Diversity configuration */
  diversityConfig: DiversityConfig;
}

/**
 * Pattern search specific configuration
 */
export interface PatternSearchConfigUnified extends SearchConfig {
  /** Pattern search specific configuration */
  patternConfig: PatternSearchConfig;
}

/**
 * Hold search specific configuration
 */
export interface HoldSearchConfigUnified extends SearchConfig {
  /** Hold search specific options */
  holdOptions: HoldSearchOptions;
}

/**
 * Diversity beam search specific configuration
 */
export interface DiversityBeamSearchConfig extends SearchConfig {
  /** Beam width for diversity search */
  beamWidth: number;
  /** Diversity configuration */
  diversityConfig: DiversityConfig;
}

/**
 * Unified configuration for all search strategies
 */
export interface UnifiedSearchConfig extends SearchConfig {
  /** Strategy-specific configurations */
  beamSearch?: Partial<BeamSearchConfig>;
  patternSearch?: Partial<PatternSearchConfigUnified>;
  holdSearch?: Partial<HoldSearchConfigUnified>;
  diversityBeamSearch?: Partial<DiversityBeamSearchConfig>;
}

/**
 * Default configurations for each search strategy
 */
export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  maxDepth: 3,
  timeLimit: 80,
  enablePruning: false,
  strategyConfig: {},
};

export const DEFAULT_BEAM_SEARCH_CONFIG: BeamSearchConfig = {
  ...DEFAULT_SEARCH_CONFIG,
  beamWidth: 16,
  useHold: true,
  enableDiversity: true,
  diversityConfig: {
    baseDiversityRatio: 0.5,
    depthDiscountFactor: 0.95,
    uncertaintyPenalty: 0.1,
    complexityBonusWeight: 0.3,
    dynamicDiversityRatio: true,
  },
};

export const DEFAULT_PATTERN_SEARCH_CONFIG: PatternSearchConfigUnified = {
  ...DEFAULT_SEARCH_CONFIG,
  maxDepth: 5,
  timeLimit: 100,
  patternConfig: {
    maxDepth: 5,
    pruningRules: [],
    timeLimit: 100,
  },
};

export const DEFAULT_HOLD_SEARCH_CONFIG: HoldSearchConfigUnified = {
  ...DEFAULT_SEARCH_CONFIG,
  holdOptions: {
    allowHoldUsage: true,
    holdPenalty: 5,
    maxHoldUsage: 3,
  },
};

export const DEFAULT_DIVERSITY_BEAM_SEARCH_CONFIG: DiversityBeamSearchConfig = {
  ...DEFAULT_SEARCH_CONFIG,
  beamWidth: 16,
  diversityConfig: {
    baseDiversityRatio: 0.5,
    depthDiscountFactor: 0.95,
    uncertaintyPenalty: 0.1,
    complexityBonusWeight: 0.3,
    dynamicDiversityRatio: true,
  },
};

export const DEFAULT_UNIFIED_CONFIG: UnifiedSearchConfig = {
  ...DEFAULT_SEARCH_CONFIG,
  beamSearch: DEFAULT_BEAM_SEARCH_CONFIG,
  patternSearch: DEFAULT_PATTERN_SEARCH_CONFIG,
  holdSearch: DEFAULT_HOLD_SEARCH_CONFIG,
  diversityBeamSearch: DEFAULT_DIVERSITY_BEAM_SEARCH_CONFIG,
};

/**
 * Configuration validation utilities
 */
export class ConfigValidator {
  /**
   * Validate basic search configuration
   */
  static validateSearchConfig(config: SearchConfig): boolean {
    return (
      typeof config.maxDepth === "number" &&
      config.maxDepth > 0 &&
      config.maxDepth <= 10 &&
      typeof config.timeLimit === "number" &&
      config.timeLimit > 0 &&
      config.timeLimit <= 1000 &&
      typeof config.enablePruning === "boolean"
    );
  }

  /**
   * Validate beam search configuration
   */
  static validateBeamSearchConfig(config: BeamSearchConfig): boolean {
    return (
      ConfigValidator.validateSearchConfig(config) &&
      typeof config.beamWidth === "number" &&
      config.beamWidth > 0 &&
      config.beamWidth <= 50 &&
      typeof config.useHold === "boolean" &&
      typeof config.enableDiversity === "boolean" &&
      ConfigValidator.validateDiversityConfig(config.diversityConfig)
    );
  }

  /**
   * Validate diversity configuration
   */
  static validateDiversityConfig(config: DiversityConfig): boolean {
    return (
      typeof config.baseDiversityRatio === "number" &&
      config.baseDiversityRatio >= 0 &&
      config.baseDiversityRatio <= 1 &&
      typeof config.depthDiscountFactor === "number" &&
      config.depthDiscountFactor >= 0 &&
      config.depthDiscountFactor <= 1 &&
      typeof config.uncertaintyPenalty === "number" &&
      config.uncertaintyPenalty >= 0 &&
      typeof config.complexityBonusWeight === "number" &&
      config.complexityBonusWeight >= 0 &&
      typeof config.dynamicDiversityRatio === "boolean"
    );
  }

  /**
   * Validate hold search configuration
   */
  static validateHoldSearchConfig(config: HoldSearchConfigUnified): boolean {
    return (
      ConfigValidator.validateSearchConfig(config) &&
      typeof config.holdOptions.allowHoldUsage === "boolean" &&
      typeof config.holdOptions.holdPenalty === "number" &&
      config.holdOptions.holdPenalty >= 0 &&
      typeof config.holdOptions.maxHoldUsage === "number" &&
      config.holdOptions.maxHoldUsage >= 0 &&
      config.holdOptions.maxHoldUsage <= 10
    );
  }

  /**
   * Validate pattern search configuration
   */
  static validatePatternSearchConfig(config: PatternSearchConfigUnified): boolean {
    return (
      ConfigValidator.validateSearchConfig(config) &&
      typeof config.patternConfig.maxDepth === "number" &&
      config.patternConfig.maxDepth > 0 &&
      config.patternConfig.maxDepth <= 10 &&
      Array.isArray(config.patternConfig.pruningRules) &&
      (!config.patternConfig.timeLimit ||
        (typeof config.patternConfig.timeLimit === "number" && config.patternConfig.timeLimit > 0))
    );
  }

  /**
   * Validate diversity beam search configuration
   */
  static validateDiversityBeamSearchConfig(config: DiversityBeamSearchConfig): boolean {
    return (
      ConfigValidator.validateSearchConfig(config) &&
      typeof config.beamWidth === "number" &&
      config.beamWidth > 0 &&
      config.beamWidth <= 50 &&
      ConfigValidator.validateDiversityConfig(config.diversityConfig)
    );
  }

  /**
   * Validate unified configuration
   */
  static validateUnifiedConfig(config: UnifiedSearchConfig): boolean {
    const baseValid = ConfigValidator.validateSearchConfig(config);

    const beamValid =
      !config.beamSearch ||
      ConfigValidator.validateBeamSearchConfig({
        ...DEFAULT_BEAM_SEARCH_CONFIG,
        ...config.beamSearch,
      });

    const patternValid =
      !config.patternSearch ||
      ConfigValidator.validatePatternSearchConfig({
        ...DEFAULT_PATTERN_SEARCH_CONFIG,
        ...config.patternSearch,
      });

    const holdValid =
      !config.holdSearch ||
      ConfigValidator.validateHoldSearchConfig({
        ...DEFAULT_HOLD_SEARCH_CONFIG,
        ...config.holdSearch,
      });

    const diversityValid =
      !config.diversityBeamSearch ||
      ConfigValidator.validateDiversityBeamSearchConfig({
        ...DEFAULT_DIVERSITY_BEAM_SEARCH_CONFIG,
        ...config.diversityBeamSearch,
      });

    return baseValid && beamValid && patternValid && holdValid && diversityValid;
  }
}

/**
 * Configuration management utilities
 */
export class ConfigManager {
  /**
   * Merge configurations with deep merge for nested objects
   */
  static mergeConfigs<T extends SearchConfig>(base: T, override: Partial<T>): T {
    const merged = { ...base };

    for (const key in override) {
      const value = override[key];
      if (value !== undefined) {
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
          merged[key] = { ...merged[key], ...value } as any;
        } else {
          merged[key] = value as any;
        }
      }
    }

    return merged;
  }

  /**
   * Create configuration for specific strategy
   */
  static createStrategyConfig(
    strategy: string,
    baseConfig: UnifiedSearchConfig,
    overrides?: Partial<SearchConfig>,
  ): SearchConfig {
    let strategyConfig: SearchConfig;

    switch (strategy) {
      case "beam":
        strategyConfig = ConfigManager.mergeConfigs(
          DEFAULT_BEAM_SEARCH_CONFIG,
          baseConfig.beamSearch || {},
        );
        break;
      case "pattern":
        strategyConfig = ConfigManager.mergeConfigs(
          DEFAULT_PATTERN_SEARCH_CONFIG,
          baseConfig.patternSearch || {},
        );
        break;
      case "hold":
        strategyConfig = ConfigManager.mergeConfigs(
          DEFAULT_HOLD_SEARCH_CONFIG,
          baseConfig.holdSearch || {},
        );
        break;
      case "diversity":
        strategyConfig = ConfigManager.mergeConfigs(
          DEFAULT_DIVERSITY_BEAM_SEARCH_CONFIG,
          baseConfig.diversityBeamSearch || {},
        );
        break;
      default:
        strategyConfig = DEFAULT_SEARCH_CONFIG;
    }

    if (overrides) {
      strategyConfig = ConfigManager.mergeConfigs(strategyConfig, overrides);
    }

    return strategyConfig;
  }

  /**
   * Sanitize configuration by removing invalid values
   */
  static sanitizeConfig<T extends SearchConfig>(config: T): T {
    const sanitized = { ...config };

    // Clamp numeric values to valid ranges
    sanitized.maxDepth = Math.max(1, Math.min(10, sanitized.maxDepth));
    sanitized.timeLimit = Math.max(1, Math.min(1000, sanitized.timeLimit));

    // Handle beam search specific values
    if ("beamWidth" in sanitized && typeof sanitized.beamWidth === "number") {
      sanitized.beamWidth = Math.max(1, Math.min(50, sanitized.beamWidth));
    }

    return sanitized;
  }
}

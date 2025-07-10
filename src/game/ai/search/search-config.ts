import type { SearchConfig } from "./search-strategy";

/**
 * Diversity configuration for beam search
 */
export interface DiversityConfig {
  surfaceAnalysisWeight: number;
  heightVariationWeight: number;
  positionSpreadWeight: number;
  baseDiversityRatio?: number;
  depthDiscountFactor?: number;
  uncertaintyPenalty?: number;
  complexityBonusWeight?: number;
  dynamicDiversityRatio?: boolean;
}

/**
 * Beam search configuration
 */
export interface BeamSearchConfig extends SearchConfig {
  beamWidth: number;
  useHold: boolean;
  enableDiversity: boolean;
  diversityConfig: DiversityConfig;
}

/**
 * Pattern search configuration
 */
export interface PatternSearchConfig extends SearchConfig {
  patternDepth: number;
  patternTypes: string[];
  maxPatternAttempts: number;
}

/**
 * Hold search configuration
 */
export interface HoldSearchConfig extends SearchConfig {
  holdPenalty: number;
  holdDepth: number;
}

/**
 * Diversity beam search configuration
 */
export interface DiversityBeamSearchConfig extends BeamSearchConfig {
  diversityWeight: number;
  explorationFactor: number;
  diversityConfig: DiversityConfig & {
    baseDiversityRatio: number;
    depthDiscountFactor: number;
    uncertaintyPenalty: number;
    complexityBonusWeight: number;
    dynamicDiversityRatio: boolean;
  };
}

/**
 * Unified search configuration
 */
export interface UnifiedSearchConfig extends SearchConfig {
  beamSearch: BeamSearchConfig;
  patternSearch: PatternSearchConfig;
  holdSearch: HoldSearchConfig;
  diversityBeamSearch: DiversityBeamSearchConfig;
}

/**
 * Default search configuration
 */
export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  maxDepth: 4,
  timeLimit: 80,
  enablePruning: true,
  strategyConfig: {},
};

/**
 * Default beam search configuration
 */
export const DEFAULT_BEAM_SEARCH_CONFIG: BeamSearchConfig = {
  ...DEFAULT_SEARCH_CONFIG,
  beamWidth: 20,
  useHold: true,
  enableDiversity: false,
  diversityConfig: {
    surfaceAnalysisWeight: 0.3,
    heightVariationWeight: 0.3,
    positionSpreadWeight: 0.4,
  },
};

/**
 * Default hold search configuration
 */
export const DEFAULT_HOLD_SEARCH_CONFIG: HoldSearchConfig = {
  ...DEFAULT_SEARCH_CONFIG,
  holdPenalty: 50,
  holdDepth: 2,
};

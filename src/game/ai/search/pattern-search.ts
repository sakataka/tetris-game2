// Re-export all functionality from the split modules to maintain API compatibility

// Pattern recognition functionality
export {
  analyzePatternDifficulty,
  checkPatternFeasibility,
  countEmptySquares,
  detectDTCannonPattern,
  detectPCOPattern,
  detectSTStackPattern,
  isPatternComplete,
  scoreMoveFit,
} from "./pattern-recognition";
// Core search functionality
// Export for backwards compatibility - these are the main exports that existing code depends on
export {
  DEFAULT_PRUNING_RULES,
  PatternSearch,
  PatternSearch as default,
  type PatternSearchConfig,
  PatternSearchCore,
  type PatternSearchResult,
  type PruningRule,
  SearchResult,
  type SearchState,
} from "./pattern-search-core";

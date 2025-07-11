// Pattern recognition functionality removed - pattern search disabled
// Core search functionality
// Export for backwards compatibility - these are the main exports that existing code depends on
export {
  checkPatternFeasibility,
  DEFAULT_PRUNING_RULES,
  type PatternFeasibilityResult,
  PatternSearch,
  PatternSearch as default,
  type PatternSearchConfig,
  PatternSearchCore,
  type PatternSearchResult,
  type PruningRule,
  SearchResult,
  type SearchState,
} from "./pattern-search-core";

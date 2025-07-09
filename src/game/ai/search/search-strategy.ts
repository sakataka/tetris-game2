import type { Tetromino } from "@/types/game";
import type { BitBoard } from "../core/bitboard";
import type { Move } from "../core/move-generator";

/**
 * Unified search result interface for all search strategies
 */
export interface SearchResult {
  /** Best sequence of moves found */
  bestPath: Move[];
  /** Score of the best path */
  bestScore: number;
  /** Number of nodes explored during search */
  nodesExplored: number;
  /** Time spent searching in milliseconds */
  searchTime: number;
  /** Actual depth reached (may be less than maxDepth if limited by time) */
  reachedDepth: number;
  /** Strategy-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Extended search result with Hold-aware information
 */
export interface HoldSearchResult extends SearchResult {
  /** Whether Hold was used in the best path */
  usedHold: boolean;
  /** Alternative search results for comparison */
  alternativeResults: SearchResult[];
  /** Hold penalty applied (if any) */
  holdPenaltyApplied: number;
}

/**
 * Extended search result with pattern-specific information
 */
export interface PatternSearchResult extends SearchResult {
  /** Whether pattern was found */
  found: boolean;
  /** Pattern-specific metadata */
  patternData?: Record<string, unknown>;
}

/**
 * Search configuration base interface
 */
export interface SearchConfig {
  /** Maximum search depth */
  maxDepth: number;
  /** Time limit in milliseconds */
  timeLimit: number;
  /** Enable/disable specific optimizations */
  enablePruning: boolean;
  /** Strategy-specific configuration */
  strategyConfig?: Record<string, unknown>;
}

/**
 * Unified search strategy interface
 * All search algorithms must implement this interface
 */
export interface SearchStrategy {
  /**
   * Perform search to find optimal move sequence
   * @param initialBoard - Starting board state
   * @param currentPiece - Current piece to place
   * @param nextPieces - Array of upcoming pieces for lookahead
   * @param heldPiece - Currently held piece (optional)
   * @param config - Search configuration
   * @returns Search result with best path and metadata
   */
  search(
    initialBoard: BitBoard,
    currentPiece: Tetromino,
    nextPieces: Tetromino[],
    heldPiece?: Tetromino,
    config?: SearchConfig,
  ): SearchResult;

  /**
   * Get the name of the search strategy
   * @returns Strategy name
   */
  getName(): string;

  /**
   * Get list of supported configuration options
   * @returns Array of supported option names
   */
  getSupportedOptions(): string[];

  /**
   * Update search configuration
   * @param config - New configuration to apply
   */
  updateConfig(config: Partial<SearchConfig>): void;

  /**
   * Get current search configuration
   * @returns Current configuration
   */
  getConfig(): SearchConfig;

  /**
   * Validate configuration parameters
   * @param config - Configuration to validate
   * @returns True if valid, false otherwise
   */
  validateConfig(config: SearchConfig): boolean;
}

/**
 * Base search strategy class with common functionality
 */
export abstract class BaseSearchStrategy implements SearchStrategy {
  protected config: SearchConfig;

  constructor(config: SearchConfig) {
    this.config = { ...config };
  }

  abstract search(
    initialBoard: BitBoard,
    currentPiece: Tetromino,
    nextPieces: Tetromino[],
    heldPiece?: Tetromino,
    config?: SearchConfig,
  ): SearchResult;

  abstract getName(): string;

  abstract getSupportedOptions(): string[];

  updateConfig(config: Partial<SearchConfig>): void {
    Object.assign(this.config, config);
  }

  getConfig(): SearchConfig {
    return { ...this.config };
  }

  validateConfig(config: SearchConfig): boolean {
    return (
      typeof config.maxDepth === "number" &&
      config.maxDepth > 0 &&
      typeof config.timeLimit === "number" &&
      config.timeLimit > 0 &&
      typeof config.enablePruning === "boolean"
    );
  }
}

/**
 * Factory function to create search strategies
 */
export type SearchStrategyFactory = (config: SearchConfig) => SearchStrategy;

/**
 * Registry of available search strategies
 */
export class SearchStrategyRegistry {
  private static strategies = new Map<string, SearchStrategyFactory>();

  static register(name: string, factory: SearchStrategyFactory): void {
    SearchStrategyRegistry.strategies.set(name, factory);
  }

  static create(name: string, config: SearchConfig): SearchStrategy | null {
    const factory = SearchStrategyRegistry.strategies.get(name);
    return factory ? factory(config) : null;
  }

  static getAvailableStrategies(): string[] {
    return Array.from(SearchStrategyRegistry.strategies.keys());
  }
}

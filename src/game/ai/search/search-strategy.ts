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

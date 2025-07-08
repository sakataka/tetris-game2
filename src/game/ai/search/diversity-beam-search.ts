import type { BitBoard } from "@/game/ai/core/bitboard";
import { determineGamePhase } from "@/game/ai/evaluators/new-weights";
import type { SearchNode } from "./beam-search";

/**
 * Extended search node with diversity metrics
 */
export interface DiverseSearchNode extends SearchNode {
  /** Diversity score for exploration */
  diversityScore?: number;
  /** Exploration bonus for diversified selection */
  explorationBonus?: number;
  /** Surface profile for diversity calculation */
  surfaceProfile?: number[];
}

/**
 * Configuration for diversified beam search
 */
export interface DiversityConfig {
  /** Base diversity ratio (0.0 = pure exploitation, 1.0 = pure exploration) */
  baseDiversityRatio: number;
  /** Depth discount factor for uncertainty (0.9-0.99) */
  depthDiscountFactor: number;
  /** Uncertainty penalty per depth level */
  uncertaintyPenalty: number;
  /** Complexity bonus weight for profile variance */
  complexityBonusWeight: number;
  /** Enable dynamic diversity ratio adjustment */
  dynamicDiversityRatio: boolean;
}

/**
 * Default diversity configuration optimized for balanced exploration/exploitation
 */
export const DEFAULT_DIVERSITY_CONFIG: DiversityConfig = {
  baseDiversityRatio: 0.5,
  depthDiscountFactor: 0.95,
  uncertaintyPenalty: 0.1,
  complexityBonusWeight: 0.3,
  dynamicDiversityRatio: true,
};

/**
 * Calculate surface profile (height of each column) for diversity metrics
 * @param board - BitBoard to analyze
 * @returns Array of column heights (0-20)
 */
export function calculateSurfaceProfile(board: BitBoard): number[] {
  const profile = new Array(10).fill(0);

  for (let col = 0; col < 10; col++) {
    // Find the highest occupied cell in this column
    for (let row = 0; row < 20; row++) {
      const rowBits = board.getRowBits(row);
      if ((rowBits >> col) & 1) {
        profile[col] = 20 - row;
        break;
      }
    }
  }

  return profile;
}

/**
 * Calculate Manhattan distance between two surface profiles
 * @param profile1 - First surface profile
 * @param profile2 - Second surface profile
 * @returns Manhattan distance between profiles
 */
export function profileDistance(profile1: number[], profile2: number[]): number {
  if (profile1.length !== profile2.length) {
    throw new Error("Profile lengths must match");
  }

  return profile1.reduce((sum, h1, i) => sum + Math.abs(h1 - profile2[i]), 0);
}

/**
 * Calculate variance of surface profile (complexity measure)
 * @param profile - Surface profile to analyze
 * @returns Variance of profile heights
 */
export function profileVariance(profile: number[]): number {
  if (profile.length === 0) return 0;

  const mean = profile.reduce((sum, h) => sum + h, 0) / profile.length;
  return profile.reduce((sum, h) => sum + (h - mean) ** 2, 0) / profile.length;
}

/**
 * Calculate diversity score for a candidate node
 * @param candidate - Candidate node to evaluate
 * @param selectedProfiles - Surface profiles of already selected nodes
 * @param config - Diversity configuration
 * @returns Diversity score (higher = more diverse)
 */
export function calculateDiversityScore(
  candidate: DiverseSearchNode,
  selectedProfiles: number[][],
  config: DiversityConfig,
): number {
  const candidateProfile = candidate.surfaceProfile || calculateSurfaceProfile(candidate.board);

  // If no nodes selected yet, use complexity as diversity score
  if (selectedProfiles.length === 0) {
    return profileVariance(candidateProfile) * config.complexityBonusWeight;
  }

  // Calculate minimum distance to any selected node
  const minDistance = Math.min(
    ...selectedProfiles.map((p) => profileDistance(candidateProfile, p)),
  );

  // Add complexity bonus
  const complexityBonus = profileVariance(candidateProfile) * config.complexityBonusWeight;

  return minDistance + complexityBonus;
}

/**
 * Apply depth discount to score for uncertainty handling
 * @param score - Original score
 * @param depth - Current depth
 * @param config - Diversity configuration
 * @returns Discounted score
 */
export function applyDepthDiscount(score: number, depth: number, config: DiversityConfig): number {
  // Basic discount: score * γ^depth
  const discountedScore = score * config.depthDiscountFactor ** depth;

  // Uncertainty penalty (quadratic growth with depth)
  const uncertainty = config.uncertaintyPenalty * depth * depth;

  return discountedScore - uncertainty;
}

/**
 * Determine diversity ratio based on game phase and board state
 * @param maxHeight - Maximum height on board
 * @param holes - Number of holes on board
 * @param config - Diversity configuration
 * @returns Diversity ratio (0.0 = pure exploitation, 1.0 = pure exploration)
 */
export function getDiversityRatio(
  maxHeight: number,
  holes: number,
  config: DiversityConfig,
): number {
  if (!config.dynamicDiversityRatio) {
    return config.baseDiversityRatio;
  }

  const gamePhase = determineGamePhase(maxHeight);

  switch (gamePhase) {
    case "early":
      // Early game: higher exploration for diverse strategies
      return Math.min(0.7, config.baseDiversityRatio + 0.2);

    case "mid":
      // Mid game: balanced approach, adjusted for complexity
      return holes > 3 ? Math.max(0.2, config.baseDiversityRatio - 0.1) : config.baseDiversityRatio;

    case "late":
      // Late game: focus on exploitation with some exploration
      return maxHeight > 16
        ? Math.max(0.1, config.baseDiversityRatio - 0.3)
        : Math.max(0.2, config.baseDiversityRatio - 0.2);

    default:
      return config.baseDiversityRatio;
  }
}

/**
 * Select diversified nodes using exploration/exploitation balance
 * @param nodes - All candidate nodes
 * @param beamWidth - Number of nodes to select
 * @param config - Diversity configuration
 * @returns Selected nodes with diversity consideration
 */
export function selectDiversifiedNodes(
  nodes: DiverseSearchNode[],
  beamWidth: number,
  config: DiversityConfig,
): DiverseSearchNode[] {
  if (nodes.length === 0) return [];
  if (nodes.length <= beamWidth) return nodes;

  // Calculate board statistics for diversity ratio
  const maxHeight = Math.max(...nodes.map((n) => n.board.calculateHeight()));
  const holes = Math.max(...nodes.map((n) => countHoles(n.board)));
  const diversityRatio = getDiversityRatio(maxHeight, holes, config);

  // Calculate split between exploitation and exploration
  const exploitCount = Math.floor(beamWidth * (1 - diversityRatio));
  const exploreCount = beamWidth - exploitCount;

  // EXPLOITATION: Select top scoring nodes with line clearing priority
  const sortedByScore = [...nodes].sort((a, b) => {
    // 1. Prioritize line clearing (more lines cleared = higher priority)
    const aLines = a.move?.linesCleared || 0;
    const bLines = b.move?.linesCleared || 0;
    if (aLines !== bLines) {
      return bLines - aLines; // Higher line count first
    }

    // 2. If line clearing is equal, sort by evaluation score
    return b.score - a.score;
  });
  const exploitNodes = sortedByScore.slice(0, exploitCount);

  if (exploreCount === 0) {
    return exploitNodes;
  }

  // EXPLORATION: Select diverse nodes from remaining candidates
  const remainingNodes = sortedByScore.slice(exploitCount);
  const selectedProfiles = exploitNodes.map(
    (n) => n.surfaceProfile || calculateSurfaceProfile(n.board),
  );

  // Calculate diversity scores for remaining nodes
  for (const node of remainingNodes) {
    node.surfaceProfile = calculateSurfaceProfile(node.board);
    node.diversityScore = calculateDiversityScore(node, selectedProfiles, config);
  }

  // Select most diverse nodes
  const exploreNodes = remainingNodes
    .sort((a, b) => (b.diversityScore || 0) - (a.diversityScore || 0))
    .slice(0, exploreCount);

  return [...exploitNodes, ...exploreNodes];
}

/**
 * Count holes in the board (empty cells with filled cells above)
 * @param board - BitBoard to analyze
 * @returns Number of holes
 */
function countHoles(board: BitBoard): number {
  let holes = 0;

  for (let col = 0; col < 10; col++) {
    let blockFound = false;
    for (let row = 0; row < 20; row++) {
      const rowBits = board.getRowBits(row);
      const bit = (rowBits >> col) & 1;

      if (bit === 1) {
        blockFound = true;
      } else if (blockFound) {
        holes++;
      }
    }
  }

  return holes;
}

/**
 * Check if early termination should occur based on beam convergence
 * @param nodes - Current beam nodes
 * @param config - Diversity configuration (unused for now)
 * @returns True if search should terminate early
 */
export function shouldTerminateEarly(nodes: DiverseSearchNode[], config: DiversityConfig): boolean {
  // Currently unused but kept for future extensions
  void config;

  if (nodes.length <= 1) return true;

  // Check if all nodes have very similar profiles (convergence)
  const profiles = nodes.map((n) => n.surfaceProfile || calculateSurfaceProfile(n.board));

  // Calculate average pairwise distance
  let totalDistance = 0;
  let pairs = 0;

  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      totalDistance += profileDistance(profiles[i], profiles[j]);
      pairs++;
    }
  }

  const avgDistance = pairs > 0 ? totalDistance / pairs : 0;

  // Terminate if average distance is too low (convergence threshold)
  return avgDistance < 2.0;
}

import type { BitBoardData } from "@/game/ai/core/bitboard";
import { calculateHeight, clearLines, clone, getRowBits, place } from "@/game/ai/core/bitboard";
import type { Move, MoveGenerator } from "@/game/ai/core/move-generator";
import { getPieceBitsAtPosition } from "@/game/ai/core/piece-bits";
import type { DellacherieEvaluator } from "@/game/ai/evaluators/dellacherie";
import type { Tetromino } from "@/types/game";
import {
  applyDepthDiscount,
  DEFAULT_DIVERSITY_CONFIG,
  type DiverseSearchNode,
  type DiversityConfig,
  selectDiversifiedNodes,
  shouldTerminateEarly,
} from "./diversity-beam-search";

/**
 * Represents a search node in the beam search tree
 */
export interface SearchNode {
  board: BitBoardData;
  move: Move | null;
  score: number;
  depth: number;
  path: Move[];
  parent?: SearchNode;
}

/**
 * Configuration for beam search algorithm
 */
export interface BeamSearchConfig {
  /** Beam width (number of nodes to keep at each level) */
  beamWidth: number;
  /** Maximum search depth */
  maxDepth: number;
  /** Whether to use Hold functionality */
  useHold: boolean;
  /** Enable pruning optimization */
  enablePruning: boolean;
  /** Time limit in milliseconds */
  timeLimit: number;
  /** Enable diversified beam search */
  enableDiversity: boolean;
  /** Diversity configuration */
  diversityConfig: DiversityConfig;
}

/**
 * Result of beam search operation
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
}

/**
 * Default beam search configuration optimized for aggressive line clearing
 */
export const DEFAULT_BEAM_CONFIG: BeamSearchConfig = {
  beamWidth: 16, // Increased for better line clearing opportunities
  maxDepth: 3, // Increased depth for lookahead line clearing
  useHold: true,
  enablePruning: false, // Disable pruning to find more line clearing opportunities
  timeLimit: 80, // Increased time limit for deeper search
  enableDiversity: true, // Enable diversified beam search
  diversityConfig: DEFAULT_DIVERSITY_CONFIG,
};

/**
 * Beam search state containing all dependencies and configuration
 */
export interface BeamSearchState {
  evaluator: DellacherieEvaluator;
  moveGenerator: MoveGenerator;
  config: BeamSearchConfig;
}

/**
 * Factory function to create beam search state
 */
export function createBeamSearchState(
  evaluator: DellacherieEvaluator,
  moveGenerator: MoveGenerator,
  config: BeamSearchConfig = DEFAULT_BEAM_CONFIG,
): BeamSearchState {
  return {
    evaluator,
    moveGenerator,
    config: { ...config },
  };
}

/**
 * Get the evaluator instance for external access
 */
export function getEvaluator(state: BeamSearchState): DellacherieEvaluator {
  return state.evaluator;
}

/**
 * Perform beam search to find optimal move sequence
 * @param state - Beam search state containing evaluator, moveGenerator, and config
 * @param initialBoard - Starting board state
 * @param currentPiece - Current piece to place
 * @param nextPieces - Array of upcoming pieces for lookahead
 * @param heldPiece - Currently held piece (optional)
 * @returns Search result with best path and metadata
 */
export function performBeamSearch(
  state: BeamSearchState,
  initialBoard: BitBoardData,
  currentPiece: Tetromino,
  nextPieces: Tetromino[],
  heldPiece?: Tetromino,
): SearchResult {
  const startTime = Date.now();
  let nodesExplored = 0;

  // Initialize root node
  const rootNode: DiverseSearchNode = {
    board: clone(initialBoard),
    move: null,
    score: 0,
    depth: 0,
    path: [],
    diversityScore: undefined,
    explorationBonus: undefined,
    surfaceProfile: undefined,
  };

  let currentLevel: DiverseSearchNode[] = [rootNode];
  let bestPath: Move[] = [];
  let bestScore = Number.NEGATIVE_INFINITY;
  let reachedDepth = 0;

  // Beam search main loop
  for (let depth = 0; depth < state.config.maxDepth; depth++) {
    // Check time limit
    if (Date.now() - startTime > state.config.timeLimit) {
      break;
    }

    const nextLevel: DiverseSearchNode[] = [];
    reachedDepth = depth;

    // Expand each node in current level
    for (const node of currentLevel) {
      // Get available pieces for this depth
      const availablePieces = getAvailablePieces(
        state.config,
        currentPiece,
        nextPieces,
        heldPiece,
        depth,
      );

      // Generate moves for each available piece
      for (const piece of availablePieces) {
        const moves = state.moveGenerator.generateAllMoves(node.board, piece);

        if (moves.length === 0) {
          console.warn(
            `⚠️ [BeamSearch] No moves generated for piece ${piece.type} at depth ${depth}`,
          );
          continue;
        }

        // Create child nodes for each move
        for (const move of moves) {
          // Simulate move on board
          const newBoard = simulateMove(node.board, move);
          let moveScore = state.evaluator.evaluate(newBoard, move);

          // Apply depth discount if diversity is enabled
          if (state.config.enableDiversity) {
            moveScore = applyDepthDiscount(moveScore, depth + 1, state.config.diversityConfig);
          }

          // Set evaluation score on move for visualization
          move.evaluationScore = moveScore;

          const childNode: DiverseSearchNode = {
            board: newBoard,
            move,
            score: node.score + moveScore,
            depth: depth + 1,
            path: [...node.path, move],
            parent: node,
            // Initialize diversity fields
            diversityScore: undefined,
            explorationBonus: undefined,
            surfaceProfile: undefined,
          };

          nextLevel.push(childNode);
          nodesExplored++;

          // Update best solution at any depth if we find a better score
          if (childNode.score > bestScore) {
            bestScore = childNode.score;
            bestPath = [...childNode.path];
          }
        }
      }

      // Check time limit periodically
      if (Date.now() - startTime > state.config.timeLimit) {
        break;
      }
    }

    // Apply beam selection (keep top N nodes)
    if (state.config.enableDiversity) {
      // Use diversified selection
      currentLevel = selectDiversifiedNodes(
        nextLevel,
        state.config.beamWidth,
        state.config.diversityConfig,
      );

      // Check for early termination based on convergence
      if (shouldTerminateEarly(currentLevel, state.config.diversityConfig)) {
        break;
      }
    } else {
      // Use traditional top-N selection
      currentLevel = selectTopNodes(nextLevel, state.config.beamWidth);
    }

    // Apply pruning if enabled
    if (state.config.enablePruning) {
      currentLevel = pruneNodes(currentLevel);
    }

    // Early termination if no nodes remain
    if (currentLevel.length === 0) {
      break;
    }
  }

  // If no solution found at max depth, take best from any depth
  if (bestPath.length === 0 && currentLevel.length > 0) {
    const bestNode = currentLevel.reduce((best, node) => (node.score > best.score ? node : best));
    bestPath = [...bestNode.path];
    bestScore = bestNode.score;
  }

  return {
    bestPath,
    bestScore,
    nodesExplored,
    searchTime: Date.now() - startTime,
    reachedDepth: reachedDepth + 1,
  };
}

/**
 * Get available pieces for a given depth
 * @param config - Beam search configuration
 * @param current - Current piece
 * @param next - Next pieces queue
 * @param held - Held piece
 * @param depth - Current search depth
 * @returns Array of available pieces
 */
function getAvailablePieces(
  config: BeamSearchConfig,
  current: Tetromino,
  next: Tetromino[],
  held: Tetromino | undefined,
  depth: number,
): Tetromino[] {
  const pieces: Tetromino[] = [];

  if (depth === 0) {
    // First move: current piece
    pieces.push(current);

    // Hold option if available and enabled
    if (config.useHold && held) {
      pieces.push(held);
    }
  } else {
    // Subsequent moves: next pieces
    if (next[depth - 1]) {
      pieces.push(next[depth - 1]);
    }
  }

  return pieces;
}

/**
 * Simulate a move on the board
 * @param board - Original board state
 * @param move - Move to simulate
 * @returns New board state after move
 */
function simulateMove(board: BitBoardData, move: Move): BitBoardData {
  const newBoard = clone(board);

  // Get piece bits for the move
  const pieceBits = getPieceBitsAtPosition(move.piece, move.rotation, move.x);

  // Place piece on board
  const placedBoard = place(newBoard, pieceBits, move.y);

  // Clear completed lines and store count in move
  const clearResult = clearLines(placedBoard);
  const finalBoard = clearResult.board;
  const clearedLines = clearResult.clearedLines;
  move.linesCleared = clearedLines.length;

  return finalBoard;
}

/**
 * Select top N nodes based on score with line clearing priority
 * @param nodes - All nodes to select from
 * @param count - Number of nodes to select
 * @returns Top N nodes sorted by line clearing priority then score
 */
function selectTopNodes(nodes: DiverseSearchNode[], count: number): DiverseSearchNode[] {
  return nodes
    .sort((a, b) => {
      // 1. Prioritize line clearing (more lines cleared = higher priority)
      const aLines = a.move?.linesCleared || 0;
      const bLines = b.move?.linesCleared || 0;
      if (aLines !== bLines) {
        return bLines - aLines; // Higher line count first
      }

      // 2. If line clearing is equal, sort by evaluation score
      return b.score - a.score;
    })
    .slice(0, count);
}

/**
 * Prune nodes that are unlikely to lead to good solutions
 * Relaxed pruning to allow more line clearing opportunities
 * @param nodes - Nodes to prune
 * @returns Pruned nodes
 */
function pruneNodes(nodes: DiverseSearchNode[]): DiverseSearchNode[] {
  return nodes.filter((node) => {
    // Very relaxed height pruning - allow building for line clearing
    const maxHeight = getMaxHeight(node.board);
    if (maxHeight > 19) return false;

    // Very relaxed hole pruning - holes are acceptable for line clearing
    const holes = countHoles(node.board);
    if (holes > 15) return false;

    return true;
  });
}

/**
 * Get maximum height of the board
 * @param board - Board to analyze
 * @returns Maximum height (0-20)
 */
function getMaxHeight(board: BitBoardData): number {
  return calculateHeight(board);
}

/**
 * Count holes in the board
 * @param board - Board to analyze
 * @returns Number of holes
 */
function countHoles(board: BitBoardData): number {
  let holes = 0;

  for (let x = 0; x < 10; x++) {
    let blockFound = false;
    for (let y = 0; y < 20; y++) {
      const bit = (getRowBits(board, y) >> x) & 1;
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
 * Update search configuration
 * @param state - Beam search state to update
 * @param newConfig - New configuration options
 * @returns Updated beam search state
 */
export function updateBeamSearchConfig(
  state: BeamSearchState,
  newConfig: Partial<BeamSearchConfig>,
): BeamSearchState {
  return {
    ...state,
    config: { ...state.config, ...newConfig },
  };
}

/**
 * Get current search configuration
 * @param state - Beam search state
 * @returns Current configuration
 */
export function getBeamSearchConfig(state: BeamSearchState): BeamSearchConfig {
  return { ...state.config };
}

/**
 * Legacy class wrapper for backward compatibility
 * @deprecated Use functional API instead
 */
export class BeamSearch {
  private state: BeamSearchState;

  constructor(
    evaluator: DellacherieEvaluator,
    moveGenerator: MoveGenerator,
    config: BeamSearchConfig = DEFAULT_BEAM_CONFIG,
  ) {
    this.state = createBeamSearchState(evaluator, moveGenerator, config);
  }

  getEvaluator(): DellacherieEvaluator {
    return getEvaluator(this.state);
  }

  search(
    initialBoard: BitBoardData,
    currentPiece: Tetromino,
    nextPieces: Tetromino[],
    heldPiece?: Tetromino,
  ): SearchResult {
    return performBeamSearch(this.state, initialBoard, currentPiece, nextPieces, heldPiece);
  }

  updateConfig(newConfig: Partial<BeamSearchConfig>): void {
    this.state = updateBeamSearchConfig(this.state, newConfig);
  }

  getConfig(): BeamSearchConfig {
    return getBeamSearchConfig(this.state);
  }
}

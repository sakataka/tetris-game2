import type { Tetromino } from "@/types/game";
import type { BitBoard } from "../core/bitboard";
import type { Move, MoveGenerator } from "../core/move-generator";
import { getPieceBitsAtPosition } from "../core/piece-bits";
import type { DellacherieEvaluator } from "../evaluators/dellacherie";

/**
 * Represents a search node in the beam search tree
 */
export interface SearchNode {
  board: BitBoard;
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
};

/**
 * High-performance beam search implementation for Tetris AI
 * Implements multi-depth lookahead with configurable beam width
 */
export class BeamSearch {
  private readonly evaluator: DellacherieEvaluator;
  private readonly moveGenerator: MoveGenerator;
  private readonly config: BeamSearchConfig;

  constructor(
    evaluator: DellacherieEvaluator,
    moveGenerator: MoveGenerator,
    config: BeamSearchConfig = DEFAULT_BEAM_CONFIG,
  ) {
    this.evaluator = evaluator;
    this.moveGenerator = moveGenerator;
    this.config = { ...config };
  }

  /**
   * Perform beam search to find optimal move sequence
   * @param initialBoard - Starting board state
   * @param currentPiece - Current piece to place
   * @param nextPieces - Array of upcoming pieces for lookahead
   * @param heldPiece - Currently held piece (optional)
   * @returns Search result with best path and metadata
   */
  search(
    initialBoard: BitBoard,
    currentPiece: Tetromino,
    nextPieces: Tetromino[],
    heldPiece?: Tetromino,
  ): SearchResult {
    const startTime = Date.now();
    let nodesExplored = 0;

    // Initialize root node
    const rootNode: SearchNode = {
      board: initialBoard.clone(),
      move: null,
      score: 0,
      depth: 0,
      path: [],
    };

    let currentLevel = [rootNode];
    let bestPath: Move[] = [];
    let bestScore = Number.NEGATIVE_INFINITY;
    let reachedDepth = 0;

    // Beam search main loop
    for (let depth = 0; depth < this.config.maxDepth; depth++) {
      // Check time limit
      if (Date.now() - startTime > this.config.timeLimit) {
        break;
      }

      const nextLevel: SearchNode[] = [];
      reachedDepth = depth;

      // Expand each node in current level
      for (const node of currentLevel) {
        // Get available pieces for this depth
        const availablePieces = this.getAvailablePieces(currentPiece, nextPieces, heldPiece, depth);

        // Generate moves for each available piece
        for (const piece of availablePieces) {
          const moves = this.moveGenerator.generateAllMoves(node.board, piece);

          if (moves.length === 0) {
            console.warn(
              `⚠️ [BeamSearch] No moves generated for piece ${piece.type} at depth ${depth}`,
            );
            continue;
          }

          // Create child nodes for each move
          for (const move of moves) {
            // Simulate move on board
            const newBoard = this.simulateMove(node.board, move);
            const moveScore = this.evaluator.evaluate(newBoard, move);

            // Set evaluation score on move for visualization
            move.evaluationScore = moveScore;

            const childNode: SearchNode = {
              board: newBoard,
              move,
              score: node.score + moveScore,
              depth: depth + 1,
              path: [...node.path, move],
              parent: node,
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
        if (Date.now() - startTime > this.config.timeLimit) {
          break;
        }
      }

      // Apply beam selection (keep top N nodes)
      currentLevel = this.selectTopNodes(nextLevel, this.config.beamWidth);

      // Apply pruning if enabled
      if (this.config.enablePruning) {
        currentLevel = this.pruneNodes(currentLevel);
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
   * @param current - Current piece
   * @param next - Next pieces queue
   * @param held - Held piece
   * @param depth - Current search depth
   * @returns Array of available pieces
   */
  private getAvailablePieces(
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
      if (this.config.useHold && held) {
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
  private simulateMove(board: BitBoard, move: Move): BitBoard {
    const newBoard = board.clone();

    // Get piece bits for the move
    const pieceBits = getPieceBitsAtPosition(move.piece, move.rotation, move.x);

    // Place piece on board
    newBoard.place(pieceBits, move.y);

    // Clear completed lines
    newBoard.clearLines();

    return newBoard;
  }

  /**
   * Select top N nodes based on score
   * @param nodes - All nodes to select from
   * @param count - Number of nodes to select
   * @returns Top N nodes sorted by score
   */
  private selectTopNodes(nodes: SearchNode[], count: number): SearchNode[] {
    return nodes.sort((a, b) => b.score - a.score).slice(0, count);
  }

  /**
   * Prune nodes that are unlikely to lead to good solutions
   * Relaxed pruning to allow more line clearing opportunities
   * @param nodes - Nodes to prune
   * @returns Pruned nodes
   */
  private pruneNodes(nodes: SearchNode[]): SearchNode[] {
    return nodes.filter((node) => {
      // Very relaxed height pruning - allow building for line clearing
      const maxHeight = this.getMaxHeight(node.board);
      if (maxHeight > 19) return false;

      // Very relaxed hole pruning - holes are acceptable for line clearing
      const holes = this.countHoles(node.board);
      if (holes > 15) return false;

      return true;
    });
  }

  /**
   * Get maximum height of the board
   * @param board - Board to analyze
   * @returns Maximum height (0-20)
   */
  private getMaxHeight(board: BitBoard): number {
    return board.calculateHeight();
  }

  /**
   * Count holes in the board
   * @param board - Board to analyze
   * @returns Number of holes
   */
  private countHoles(board: BitBoard): number {
    let holes = 0;

    for (let x = 0; x < 10; x++) {
      let blockFound = false;
      for (let y = 0; y < 20; y++) {
        const bit = (board.getRowBits(y) >> x) & 1;
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
   * @param newConfig - New configuration options
   */
  updateConfig(newConfig: Partial<BeamSearchConfig>): void {
    Object.assign(this.config, newConfig);
  }

  /**
   * Get current search configuration
   * @returns Current configuration
   */
  getConfig(): BeamSearchConfig {
    return { ...this.config };
  }
}

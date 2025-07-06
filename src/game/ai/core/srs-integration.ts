import { applyWallKickOffset, getWallKickOffsets } from "@/game/wallKick";
import type {
  GameBoard,
  Position,
  RotationState,
  Tetromino,
  TetrominoTypeName,
} from "@/types/game";
import type { RotationResult } from "@/types/rotation";
import { BitBoard } from "./bitboard";
import { getCollisionDetector } from "./collision-detection";

/**
 * Ultra-fast SRS rotation result for AI optimization
 * Extends the standard RotationResult with BitBoard-specific optimizations
 */
export interface FastRotationResult {
  /** Whether the rotation was successful */
  success: boolean;
  /** Final position after successful rotation (if success is true) */
  finalPosition?: Position;
  /** Final rotation state after successful rotation */
  finalRotation?: RotationState;
  /** Number of wall kick attempts made */
  kickAttempts: number;
  /** Which wall kick offset succeeded (0-4, where 0 = no kick needed) */
  successfulKickIndex?: number;
  /** Performance metrics */
  metrics?: {
    /** Total time for rotation attempt in microseconds */
    timeUs: number;
    /** Number of collision checks performed */
    collisionChecks: number;
  };
}

/**
 * Ultra-fast SRS rotation system integrated with BitBoard
 * Optimized for AI algorithms that need to test many rotation possibilities
 *
 * Performance targets:
 * - <10μs per rotation attempt
 * - Support for batch rotation testing
 * - Minimal memory allocation
 */
export class FastSRSRotation {
  public readonly enableMetrics: boolean;
  private readonly collisionDetector: ReturnType<typeof getCollisionDetector>;

  constructor(enableMetrics = false) {
    this.enableMetrics = enableMetrics;
    this.collisionDetector = getCollisionDetector(enableMetrics);
  }

  /**
   * Attempt to rotate a piece using SRS wall kick system
   * Ultra-fast implementation using BitBoard collision detection
   *
   * @param bitBoard - Current board state
   * @param piece - Tetromino type
   * @param currentRotation - Current rotation state
   * @param currentPosition - Current position
   * @param targetRotation - Desired rotation state
   * @returns Fast rotation result with success/failure information
   */
  tryRotate(
    bitBoard: BitBoard,
    piece: TetrominoTypeName,
    currentRotation: RotationState,
    currentPosition: Position,
    targetRotation: RotationState,
  ): FastRotationResult {
    const startTime = this.enableMetrics ? performance.now() : 0;
    let collisionChecks = 0;

    // Get wall kick offsets for this rotation transition
    const wallKickOffsets = getWallKickOffsets(piece, currentRotation, targetRotation);

    // Try each wall kick offset in SRS order
    for (let kickIndex = 0; kickIndex < wallKickOffsets.length; kickIndex++) {
      const offset = wallKickOffsets[kickIndex];
      const testPosition = applyWallKickOffset(currentPosition, offset);

      // Check if the rotated piece can be placed at the test position
      const canPlace = this.collisionDetector.canPlace(
        bitBoard,
        piece,
        targetRotation,
        testPosition.x,
        testPosition.y,
      );
      collisionChecks++;

      if (canPlace.canPlace) {
        // Rotation successful
        return {
          success: true,
          finalPosition: testPosition,
          finalRotation: targetRotation,
          kickAttempts: kickIndex + 1,
          successfulKickIndex: kickIndex,
          metrics: this.enableMetrics
            ? {
                timeUs: (performance.now() - startTime) * 1000,
                collisionChecks,
              }
            : undefined,
        };
      }
    }

    // All wall kick attempts failed
    return {
      success: false,
      kickAttempts: wallKickOffsets.length,
      metrics: this.enableMetrics
        ? {
            timeUs: (performance.now() - startTime) * 1000,
            collisionChecks,
          }
        : undefined,
    };
  }

  /**
   * Test all possible rotations from current state
   * Useful for AI algorithms that need to explore all rotation options
   *
   * @param bitBoard - Current board state
   * @param piece - Tetromino type
   * @param currentRotation - Current rotation state
   * @param currentPosition - Current position
   * @returns Array of results for each possible target rotation
   */
  tryAllRotations(
    bitBoard: BitBoard,
    piece: TetrominoTypeName,
    currentRotation: RotationState,
    currentPosition: Position,
  ): FastRotationResult[] {
    const results: FastRotationResult[] = [];

    // Test each of the 4 possible rotations
    for (let targetRotation = 0; targetRotation < 4; targetRotation++) {
      if (targetRotation === currentRotation) {
        // Skip current rotation (no change needed)
        results.push({
          success: true,
          finalPosition: currentPosition,
          finalRotation: currentRotation as RotationState,
          kickAttempts: 0,
          successfulKickIndex: 0,
        });
      } else {
        const result = this.tryRotate(
          bitBoard,
          piece,
          currentRotation,
          currentPosition,
          targetRotation as RotationState,
        );
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Find all valid rotation and position combinations for a piece
   * Exhaustive search optimized for AI move generation
   *
   * @param bitBoard - Current board state
   * @param piece - Tetromino type
   * @param startRotation - Starting rotation state (default: 0)
   * @returns Array of all valid {position, rotation} combinations
   */
  findAllValidPlacements(
    bitBoard: BitBoard,
    piece: TetrominoTypeName,
    startRotation: RotationState = 0,
  ): Array<{ position: Position; rotation: RotationState; reachable: boolean }> {
    const validPlacements: Array<{
      position: Position;
      rotation: RotationState;
      reachable: boolean;
    }> = [];

    // Test each rotation state
    for (let rotation = 0; rotation < 4; rotation++) {
      const rotationState = rotation as RotationState;

      // Find all valid positions for this rotation
      const validPositions = this.collisionDetector.findValidPositions(
        bitBoard,
        piece,
        rotationState,
      );

      // For each valid position, determine if it's reachable through SRS
      for (const position of validPositions) {
        let reachable = false;

        if (rotation === startRotation) {
          // Same rotation as start - always reachable
          reachable = true;
        } else {
          // Test if this rotation is reachable from start rotation
          // We use a simplified reachability test here
          // For a complete AI, you might want to implement full path finding
          reachable = this.isRotationReachable(
            bitBoard,
            piece,
            startRotation,
            rotationState,
            position,
          );
        }

        validPlacements.push({
          position,
          rotation: rotationState,
          reachable,
        });
      }
    }

    return validPlacements;
  }

  /**
   * Check if a specific rotation state is reachable from current state
   * Simplified reachability test for AI algorithms
   *
   * @param bitBoard - Current board state
   * @param piece - Tetromino type
   * @param fromRotation - Starting rotation
   * @param toRotation - Target rotation
   * @param targetPosition - Final position to reach
   * @returns true if the rotation is reachable
   */
  private isRotationReachable(
    bitBoard: BitBoard,
    piece: TetrominoTypeName,
    fromRotation: RotationState,
    toRotation: RotationState,
    targetPosition: Position,
  ): boolean {
    // For simplicity, we check if direct rotation is possible
    // A more sophisticated implementation could use BFS to find rotation paths

    const rotationDiff = (toRotation - fromRotation + 4) % 4;

    // Test different rotation paths
    if (rotationDiff === 1) {
      // Single clockwise rotation
      return this.tryRotate(bitBoard, piece, fromRotation, targetPosition, toRotation).success;
    }
    if (rotationDiff === 3) {
      // Single counter-clockwise rotation
      return this.tryRotate(bitBoard, piece, fromRotation, targetPosition, toRotation).success;
    }
    if (rotationDiff === 2) {
      // 180-degree rotation
      return this.tryRotate(bitBoard, piece, fromRotation, targetPosition, toRotation).success;
    }

    return false;
  }

  /**
   * Convert FastRotationResult to standard RotationResult format
   * Provides compatibility with existing game logic
   *
   * @param fastResult - Fast rotation result
   * @param piece - Original tetromino
   * @param targetShape - Target shape after rotation
   * @returns Standard rotation result
   */
  toStandardRotationResult(
    fastResult: FastRotationResult,
    piece: Tetromino,
    targetShape: any, // TetrominoShape
  ): RotationResult {
    if (fastResult.success && fastResult.finalPosition && fastResult.finalRotation !== undefined) {
      return {
        success: true,
        piece: {
          ...piece,
          position: fastResult.finalPosition,
          rotation: fastResult.finalRotation,
          shape: targetShape,
        },
        kicksAttempted: [], // Could be populated with detailed kick information if needed
      };
    }
    return {
      success: false,
      kicksAttempted: [],
      failureReason: "collision",
    };
  }
}

/**
 * Singleton instance for optimal performance
 */
let globalSRSRotation: FastSRSRotation | null = null;

/**
 * Get the global SRS rotation instance
 *
 * @param enableMetrics - Whether to enable performance metrics
 * @returns FastSRSRotation instance
 */
export function getFastSRSRotation(enableMetrics = false): FastSRSRotation {
  if (!globalSRSRotation || (enableMetrics && !globalSRSRotation.enableMetrics)) {
    globalSRSRotation = new FastSRSRotation(enableMetrics);
  }
  return globalSRSRotation;
}

/**
 * Convenience functions for common SRS operations
 */

/**
 * Quick rotation test - most common operation
 */
export function canRotatePiece(
  board: GameBoard | BitBoard,
  piece: TetrominoTypeName,
  currentRotation: RotationState,
  currentPosition: Position,
  targetRotation: RotationState,
): boolean {
  const bitBoard = board instanceof BitBoard ? board : new BitBoard(board);
  const srsRotation = getFastSRSRotation();
  return srsRotation.tryRotate(bitBoard, piece, currentRotation, currentPosition, targetRotation)
    .success;
}

/**
 * Find all possible rotations from current state
 */
export function getAllPossibleRotations(
  board: GameBoard | BitBoard,
  piece: TetrominoTypeName,
  currentRotation: RotationState,
  currentPosition: Position,
): FastRotationResult[] {
  const bitBoard = board instanceof BitBoard ? board : new BitBoard(board);
  const srsRotation = getFastSRSRotation();
  return srsRotation.tryAllRotations(bitBoard, piece, currentRotation, currentPosition);
}

/**
 * Generate all valid piece placements for AI move generation
 */
export function generateAllMoves(
  board: GameBoard | BitBoard,
  piece: TetrominoTypeName,
  startRotation: RotationState = 0,
): Array<{ position: Position; rotation: RotationState; reachable: boolean }> {
  const bitBoard = board instanceof BitBoard ? board : new BitBoard(board);
  const srsRotation = getFastSRSRotation();
  return srsRotation.findAllValidPlacements(bitBoard, piece, startRotation);
}

/**
 * Reset the global SRS rotation instance (mainly for testing)
 */
export function resetFastSRSRotation(): void {
  globalSRSRotation = null;
}

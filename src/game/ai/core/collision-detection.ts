import type { GameBoard, Position, RotationState, TetrominoTypeName } from "@/types/game";
import { BitBoard } from "./bitboard";
import { getPieceBitPattern, getPieceBitsAtPosition, isValidBounds } from "./piece-bits";

/**
 * Result of a collision detection operation
 */
export interface CollisionResult {
  /** Whether the piece can be placed at the given position */
  canPlace: boolean;
  /** Reason for collision (if any) */
  reason?: "bounds" | "collision" | "invalid";
  /** Performance metrics (in debug mode) */
  metrics?: {
    /** Time taken for the operation in microseconds */
    timeUs: number;
    /** Number of bitwise operations performed */
    bitwiseOps: number;
  };
}

/**
 * Ultra-fast collision detection engine for Tetris AI
 *
 * Performance targets:
 * - <1μs per collision check on modern hardware
 * - <1ms for 1,000 collision operations
 * - Supports 100,000+ evaluations per second
 *
 * Optimizations:
 * - Bounds checking before expensive collision detection
 * - Bitwise AND operations for collision detection
 * - Minimal object allocation for GC efficiency
 * - Branch prediction optimization
 */
export class CollisionDetector {
  public readonly enableMetrics: boolean;

  constructor(enableMetrics = false) {
    this.enableMetrics = enableMetrics;
  }

  /**
   * Check if a piece can be placed at the given position
   * Ultra-fast implementation using bitwise operations
   *
   * @param bitBoard - Current board state as BitBoard
   * @param piece - Tetromino type to place
   * @param rotation - Rotation state of the piece
   * @param x - X position (0-9)
   * @param y - Y position (0-19)
   * @returns Collision detection result
   */
  canPlace(
    bitBoard: BitBoard,
    piece: TetrominoTypeName,
    rotation: RotationState,
    x: number,
    y: number,
  ): CollisionResult {
    const startTime = this.enableMetrics ? performance.now() : 0;
    let bitwiseOps = 0;

    // Fast bounds check first (most likely to fail)
    if (!isValidBounds(piece, rotation, x, y)) {
      return this.createResult(false, "bounds", startTime, bitwiseOps);
    }

    // Get optimized bit pattern for the piece
    const pieceBits = getPieceBitsAtPosition(piece, rotation, x);

    // Handle out-of-bounds piece (empty array returned)
    if (pieceBits.length === 0) {
      return this.createResult(false, "bounds", startTime, bitwiseOps);
    }

    // Perform ultra-fast collision detection using bitwise operations
    const canPlaceResult = bitBoard.canPlace(pieceBits, y);
    bitwiseOps += pieceBits.length; // Each row requires one bitwise AND

    return this.createResult(
      canPlaceResult,
      canPlaceResult ? undefined : "collision",
      startTime,
      bitwiseOps,
    );
  }

  /**
   * Batch collision detection for multiple positions
   * Optimized for AI algorithms that need to test many positions quickly
   *
   * @param bitBoard - Current board state
   * @param piece - Tetromino type
   * @param rotation - Rotation state
   * @param positions - Array of positions to test
   * @returns Array of results corresponding to input positions
   */
  canPlaceBatch(
    bitBoard: BitBoard,
    piece: TetrominoTypeName,
    rotation: RotationState,
    positions: Position[],
  ): CollisionResult[] {
    const results: CollisionResult[] = [];

    // Pre-calculate piece bit pattern for reuse
    const pattern = getPieceBitPattern(piece, rotation);

    for (const pos of positions) {
      // Optimized individual check with pre-calculated pattern
      const result = this.canPlaceOptimized(bitBoard, pattern, pos.x, pos.y);
      results.push(result);
    }

    return results;
  }

  /**
   * Find all valid placement positions for a piece
   * Scans the entire board efficiently using bitwise operations
   *
   * @param bitBoard - Current board state
   * @param piece - Tetromino type
   * @param rotation - Rotation state
   * @returns Array of valid positions where the piece can be placed
   */
  findValidPositions(
    bitBoard: BitBoard,
    piece: TetrominoTypeName,
    rotation: RotationState,
  ): Position[] {
    const validPositions: Position[] = [];
    const pattern = getPieceBitPattern(piece, rotation);

    // Scan all possible positions efficiently
    const maxX = 10 - pattern.width;
    const maxY = 20 - pattern.height;

    for (let y = 0; y <= maxY; y++) {
      for (let x = 0; x <= maxX; x++) {
        if (this.canPlaceOptimized(bitBoard, pattern, x, y).canPlace) {
          validPositions.push({ x, y });
        }
      }
    }

    return validPositions;
  }

  /**
   * Find the lowest valid position for a piece at a given X coordinate
   * Simulates gravity - useful for AI placement algorithms
   *
   * @param bitBoard - Current board state
   * @param piece - Tetromino type
   * @param rotation - Rotation state
   * @param x - X coordinate to drop the piece
   * @returns Lowest valid Y position, or null if no valid position exists
   */
  findDropPosition(
    bitBoard: BitBoard,
    piece: TetrominoTypeName,
    rotation: RotationState,
    x: number,
  ): number | null {
    const pattern = getPieceBitPattern(piece, rotation);

    // Bounds check for X coordinate
    if (x < 0 || x + pattern.width > 10) {
      return null;
    }

    // Search from bottom to top for the first valid position
    const maxY = 20 - pattern.height;
    for (let y = maxY; y >= 0; y--) {
      if (this.canPlaceOptimized(bitBoard, pattern, x, y).canPlace) {
        return y;
      }
    }

    return null;
  }

  /**
   * Calculate the ghost position for a piece (where it would land if dropped)
   * Essential for AI algorithms and user interface
   *
   * @param bitBoard - Current board state
   * @param piece - Tetromino type
   * @param rotation - Rotation state
   * @param currentPos - Current position of the piece
   * @returns Ghost position, or null if piece cannot be placed anywhere below
   */
  calculateGhostPosition(
    bitBoard: BitBoard,
    piece: TetrominoTypeName,
    rotation: RotationState,
    currentPos: Position,
  ): Position | null {
    const dropY = this.findDropPosition(bitBoard, piece, rotation, currentPos.x);

    if (dropY === null) {
      return null;
    }

    return { x: currentPos.x, y: dropY };
  }

  /**
   * Optimized collision detection with pre-calculated pattern
   * Used internally for batch operations and performance optimization
   */
  private canPlaceOptimized(
    bitBoard: BitBoard,
    pattern: { rows: number[]; width: number; height: number },
    x: number,
    y: number,
  ): CollisionResult {
    const startTime = this.enableMetrics ? performance.now() : 0;

    // Bounds check
    if (x < 0 || y < 0 || x + pattern.width > 10 || y + pattern.height > 20) {
      return this.createResult(false, "bounds", startTime, 0);
    }

    // Generate shifted bit patterns
    const shiftedRows = pattern.rows.map((rowBits: number) => rowBits << x);

    // Collision detection
    const canPlaceResult = bitBoard.canPlace(shiftedRows, y);

    return this.createResult(
      canPlaceResult,
      canPlaceResult ? undefined : "collision",
      startTime,
      pattern.rows.length,
    );
  }

  /**
   * Helper to create consistent result objects
   */
  private createResult(
    canPlace: boolean,
    reason?: "bounds" | "collision" | "invalid",
    startTime = 0,
    bitwiseOps = 0,
  ): CollisionResult {
    const result: CollisionResult = { canPlace };

    if (reason) {
      result.reason = reason;
    }

    if (this.enableMetrics && startTime > 0) {
      const endTime = performance.now();
      result.metrics = {
        timeUs: (endTime - startTime) * 1000, // Convert ms to μs
        bitwiseOps,
      };
    }

    return result;
  }
}

/**
 * Singleton collision detector instance for optimal performance
 * Avoids object creation overhead in hot paths
 */
let globalCollisionDetector: CollisionDetector | null = null;

/**
 * Get the global collision detector instance
 * Creates one if it doesn't exist
 *
 * @param enableMetrics - Whether to enable performance metrics
 * @returns Collision detector instance
 */
export function getCollisionDetector(enableMetrics = false): CollisionDetector {
  if (!globalCollisionDetector || (enableMetrics && !globalCollisionDetector.enableMetrics)) {
    globalCollisionDetector = new CollisionDetector(enableMetrics);
  }
  return globalCollisionDetector;
}

/**
 * Convenience functions for common collision detection operations
 * These provide a simple API for the most frequent use cases
 */

/**
 * Quick collision check - most common operation
 */
export function canPlacePiece(
  board: GameBoard | BitBoard,
  piece: TetrominoTypeName,
  rotation: RotationState,
  x: number,
  y: number,
): boolean {
  const bitBoard = board instanceof BitBoard ? board : new BitBoard(board);
  const detector = getCollisionDetector();
  return detector.canPlace(bitBoard, piece, rotation, x, y).canPlace;
}

/**
 * Find drop position - common for AI algorithms
 */
export function findPieceDropPosition(
  board: GameBoard | BitBoard,
  piece: TetrominoTypeName,
  rotation: RotationState,
  x: number,
): number | null {
  const bitBoard = board instanceof BitBoard ? board : new BitBoard(board);
  const detector = getCollisionDetector();
  return detector.findDropPosition(bitBoard, piece, rotation, x);
}

/**
 * Get all valid positions - useful for AI move generation
 */
export function getAllValidPositions(
  board: GameBoard | BitBoard,
  piece: TetrominoTypeName,
  rotation: RotationState,
): Position[] {
  const bitBoard = board instanceof BitBoard ? board : new BitBoard(board);
  const detector = getCollisionDetector();
  return detector.findValidPositions(bitBoard, piece, rotation);
}

/**
 * Reset the global collision detector (mainly for testing)
 */
export function resetCollisionDetector(): void {
  globalCollisionDetector = null;
}

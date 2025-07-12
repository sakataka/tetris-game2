import type { GameBoard, Position, RotationState, TetrominoTypeName } from "@/types/game";
import type { BitBoardData } from "./bitboard";
import { canPlace as bitBoardCanPlace, createBitBoard } from "./bitboard";
import { getPieceBitPattern, getPieceBitsAtPosition, isValidBounds } from "./piece-bits";

/**
 * Configuration for collision detection operations
 */
export interface CollisionConfig {
  readonly enableMetrics: boolean;
}

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
 * Create default collision detection configuration
 */
export const createCollisionConfig = (enableMetrics = false): CollisionConfig => ({
  enableMetrics,
});

/**
 * Check if a piece can be placed at the given position
 * Ultra-fast implementation using bitwise operations
 */
export const canPlace = (
  config: CollisionConfig,
  bitBoard: BitBoardData,
  piece: TetrominoTypeName,
  rotation: RotationState,
  x: number,
  y: number,
): CollisionResult => {
  const startTime = config.enableMetrics ? performance.now() : 0;
  let bitwiseOps = 0;

  // Fast bounds check first (most likely to fail)
  if (!isValidBounds(piece, rotation, x, y)) {
    return createResult(config, false, "bounds", startTime, bitwiseOps);
  }

  // Get optimized bit pattern for the piece
  const pieceBits = getPieceBitsAtPosition(piece, rotation, x);

  // Handle out-of-bounds piece (empty array returned)
  if (pieceBits.length === 0) {
    return createResult(config, false, "bounds", startTime, bitwiseOps);
  }

  // Perform ultra-fast collision detection using bitwise operations
  const canPlaceResult = bitBoardCanPlace(bitBoard, pieceBits, y);
  bitwiseOps += pieceBits.length; // Each row requires one bitwise AND

  return createResult(
    config,
    canPlaceResult,
    canPlaceResult ? undefined : "collision",
    startTime,
    bitwiseOps,
  );
};

/**
 * Batch collision detection for multiple positions
 * Optimized for AI algorithms that need to test many positions quickly
 */
export const canPlaceBatch = (
  config: CollisionConfig,
  bitBoard: BitBoardData,
  piece: TetrominoTypeName,
  rotation: RotationState,
  positions: Position[],
): CollisionResult[] => {
  const results: CollisionResult[] = [];

  // Pre-calculate piece bit pattern for reuse
  const pattern = getPieceBitPattern(piece, rotation);

  for (const pos of positions) {
    // Optimized individual check with pre-calculated pattern
    const result = canPlaceOptimized(config, bitBoard, pattern, pos.x, pos.y);
    results.push(result);
  }

  return results;
};

/**
 * Find all valid placement positions for a piece
 * Scans the entire board efficiently using bitwise operations
 */
export const findValidPositions = (
  config: CollisionConfig,
  bitBoard: BitBoardData,
  piece: TetrominoTypeName,
  rotation: RotationState,
): Position[] => {
  const validPositions: Position[] = [];
  const pattern = getPieceBitPattern(piece, rotation);

  // Scan all possible positions efficiently
  const maxX = 10 - pattern.width;
  const maxY = 20 - pattern.height;

  for (let y = 0; y <= maxY; y++) {
    for (let x = 0; x <= maxX; x++) {
      if (canPlaceOptimized(config, bitBoard, pattern, x, y).canPlace) {
        validPositions.push({ x, y });
      }
    }
  }

  return validPositions;
};

/**
 * Find the lowest valid position for a piece at a given X coordinate
 * Simulates gravity - useful for AI placement algorithms
 */
export const findDropPosition = (
  config: CollisionConfig,
  bitBoard: BitBoardData,
  piece: TetrominoTypeName,
  rotation: RotationState,
  x: number,
): number | null => {
  const pattern = getPieceBitPattern(piece, rotation);

  // Bounds check for X coordinate
  if (x < 0 || x + pattern.width > 10) {
    return null;
  }

  // Search from bottom to top for the first valid position
  const maxY = 20 - pattern.height;
  for (let y = maxY; y >= 0; y--) {
    if (canPlaceOptimized(config, bitBoard, pattern, x, y).canPlace) {
      return y;
    }
  }

  return null;
};

/**
 * Calculate the ghost position for a piece (where it would land if dropped)
 * Essential for AI algorithms and user interface
 */
export const calculateGhostPosition = (
  config: CollisionConfig,
  bitBoard: BitBoardData,
  piece: TetrominoTypeName,
  rotation: RotationState,
  currentPos: Position,
): Position | null => {
  const dropY = findDropPosition(config, bitBoard, piece, rotation, currentPos.x);

  if (dropY === null) {
    return null;
  }

  return { x: currentPos.x, y: dropY };
};

/**
 * Optimized collision detection with pre-calculated pattern
 * Used internally for batch operations and performance optimization
 */
const canPlaceOptimized = (
  config: CollisionConfig,
  bitBoard: BitBoardData,
  pattern: { rows: number[]; width: number; height: number },
  x: number,
  y: number,
): CollisionResult => {
  const startTime = config.enableMetrics ? performance.now() : 0;

  // Bounds check
  if (x < 0 || y < 0 || x + pattern.width > 10 || y + pattern.height > 20) {
    return createResult(config, false, "bounds", startTime, 0);
  }

  // Generate shifted bit patterns
  const shiftedRows = pattern.rows.map((rowBits: number) => rowBits << x);

  // Collision detection
  const canPlaceResult = bitBoardCanPlace(bitBoard, shiftedRows, y);

  return createResult(
    config,
    canPlaceResult,
    canPlaceResult ? undefined : "collision",
    startTime,
    pattern.rows.length,
  );
};

/**
 * Helper to create consistent result objects
 */
const createResult = (
  config: CollisionConfig,
  canPlace: boolean,
  reason?: "bounds" | "collision" | "invalid",
  startTime = 0,
  bitwiseOps = 0,
): CollisionResult => {
  const result: CollisionResult = { canPlace };

  if (reason) {
    result.reason = reason;
  }

  if (config.enableMetrics && startTime > 0) {
    const endTime = performance.now();
    result.metrics = {
      timeUs: (endTime - startTime) * 1000, // Convert ms to μs
      bitwiseOps,
    };
  }

  return result;
};

/**
 * Convenience functions for common collision detection operations
 * These provide a simple API for the most frequent use cases
 */

/**
 * Quick collision check - most common operation
 */
export const canPlacePiece = (
  board: GameBoard | BitBoardData,
  piece: TetrominoTypeName,
  rotation: RotationState,
  x: number,
  y: number,
): boolean => {
  const bitBoard = "rows" in board ? board : createBitBoard(board);
  const config = createCollisionConfig();
  return canPlace(config, bitBoard, piece, rotation, x, y).canPlace;
};

/**
 * Find drop position - common for AI algorithms
 */
export const findPieceDropPosition = (
  board: GameBoard | BitBoardData,
  piece: TetrominoTypeName,
  rotation: RotationState,
  x: number,
): number | null => {
  const bitBoard = "rows" in board ? board : createBitBoard(board);
  const config = createCollisionConfig();
  return findDropPosition(config, bitBoard, piece, rotation, x);
};

/**
 * Get all valid positions - useful for AI move generation
 */
export const getAllValidPositions = (
  board: GameBoard | BitBoardData,
  piece: TetrominoTypeName,
  rotation: RotationState,
): Position[] => {
  const bitBoard = "rows" in board ? board : createBitBoard(board);
  const config = createCollisionConfig();
  return findValidPositions(config, bitBoard, piece, rotation);
};

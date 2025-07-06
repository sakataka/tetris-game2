import { rotateTetromino, TETROMINOS } from "@/game/tetrominos";
import type { RotationState, TetrominoShape, TetrominoTypeName } from "@/types/game";

/**
 * Ultra-fast tetromino bit representation for AI collision detection
 *
 * Each piece is represented as an array of integers where:
 * - Each integer represents a row of the piece
 * - Each bit in the integer represents a cell (1 = occupied, 0 = empty)
 * - Bits are ordered from right to left (bit 0 = leftmost column)
 *
 * Performance benefits:
 * - O(1) lookup for any piece/rotation combination
 * - Bitwise operations for collision detection
 * - Memory efficient: ~280 bytes total for all pieces/rotations
 */

export interface PieceBitPattern {
  /** Array of bit patterns for each row of the piece */
  rows: number[];
  /** Width of the piece bounding box */
  width: number;
  /** Height of the piece bounding box */
  height: number;
  /** Minimum X offset for placement (for pieces with leading empty columns) */
  minX: number;
  /** Minimum Y offset for placement (for pieces with leading empty rows) */
  minY: number;
}

/**
 * Convert a 2D tetromino shape to bit representation
 * Removes empty leading/trailing rows and columns for optimal collision detection
 *
 * @param shape - 2D array representing the tetromino shape
 * @returns Optimized bit pattern with metadata
 */
function shapeToBitPattern(shape: TetrominoShape): PieceBitPattern {
  const height = shape.length;
  const width = shape[0]?.length || 0;

  // Find bounding box to eliminate empty space
  let minY = height;
  let maxY = -1;
  let minX = width;
  let maxX = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (shape[y][x] !== 0) {
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
    }
  }

  // Handle empty shape (shouldn't happen with valid tetrominos)
  if (maxY === -1) {
    return { rows: [], width: 0, height: 0, minX: 0, minY: 0 };
  }

  // Extract optimized bit patterns
  const rows: number[] = [];
  const boundedHeight = maxY - minY + 1;
  const boundedWidth = maxX - minX + 1;

  for (let y = minY; y <= maxY; y++) {
    let rowBits = 0;
    for (let x = minX; x <= maxX; x++) {
      if (shape[y][x] !== 0) {
        // Set bit at position (x - minX) from the right
        rowBits |= 1 << (x - minX);
      }
    }
    rows.push(rowBits);
  }

  return {
    rows,
    width: boundedWidth,
    height: boundedHeight,
    minX,
    minY,
  };
}

/**
 * Generate all 4 rotation states for a given tetromino
 * Uses the existing rotation logic to ensure consistency
 *
 * @param baseShape - Base tetromino shape (rotation 0)
 * @returns Array of 4 bit patterns (one for each rotation)
 */
function generateAllRotations(baseShape: TetrominoShape): PieceBitPattern[] {
  const rotations: PieceBitPattern[] = [];
  let currentShape = baseShape;

  // Generate all 4 rotations
  for (let i = 0; i < 4; i++) {
    rotations.push(shapeToBitPattern(currentShape));
    currentShape = rotateTetromino(currentShape);
  }

  return rotations;
}

/**
 * Pre-computed bit patterns for all tetromino pieces and rotations
 * Organized as PIECE_TYPE -> [rotation0, rotation1, rotation2, rotation3]
 */
export const PIECE_BIT_PATTERNS: Record<TetrominoTypeName, PieceBitPattern[]> = {
  // I-piece: Horizontal line ↔ Vertical line
  I: generateAllRotations(TETROMINOS.I),

  // O-piece: 2x2 square (same for all rotations)
  O: generateAllRotations(TETROMINOS.O),

  // T-piece: T-shape with 4 orientations
  T: generateAllRotations(TETROMINOS.T),

  // S-piece: S-shape with 2 distinct orientations (0/2 same, 1/3 same)
  S: generateAllRotations(TETROMINOS.S),

  // Z-piece: Z-shape with 2 distinct orientations (0/2 same, 1/3 same)
  Z: generateAllRotations(TETROMINOS.Z),

  // J-piece: J-shape with 4 orientations
  J: generateAllRotations(TETROMINOS.J),

  // L-piece: L-shape with 4 orientations
  L: generateAllRotations(TETROMINOS.L),
};

/**
 * Get optimized bit pattern for a specific piece and rotation
 * Ultra-fast O(1) lookup for AI collision detection
 *
 * @param piece - Tetromino type (I, O, T, S, Z, J, L)
 * @param rotation - Rotation state (0, 1, 2, 3)
 * @returns Optimized bit pattern for collision detection
 */
export function getPieceBitPattern(
  piece: TetrominoTypeName,
  rotation: RotationState,
): PieceBitPattern {
  return PIECE_BIT_PATTERNS[piece][rotation];
}

/**
 * Get bit pattern rows for a piece at a specific X position
 * Shifts the piece's bit pattern to the target X coordinate
 *
 * @param piece - Tetromino type
 * @param rotation - Rotation state
 * @param x - Target X position on the board
 * @returns Array of shifted bit patterns ready for collision detection
 */
export function getPieceBitsAtPosition(
  piece: TetrominoTypeName,
  rotation: RotationState,
  x: number,
): number[] {
  const pattern = getPieceBitPattern(piece, rotation);

  // Validate position bounds
  if (x + pattern.width > 10 || x < 0) {
    // Return empty array for out-of-bounds positions
    return [];
  }

  // Shift each row to the target X position
  return pattern.rows.map((rowBits) => rowBits << x);
}

/**
 * Calculate the actual board position for a piece considering its bounding box
 * Adjusts for pieces that have empty leading rows/columns
 *
 * @param piece - Tetromino type
 * @param rotation - Rotation state
 * @param x - Logical X position
 * @param y - Logical Y position
 * @returns Actual board position for the piece's bounding box
 */
export function getActualPosition(
  piece: TetrominoTypeName,
  rotation: RotationState,
  x: number,
  y: number,
): { x: number; y: number } {
  const pattern = getPieceBitPattern(piece, rotation);
  return {
    x: x + pattern.minX,
    y: y + pattern.minY,
  };
}

/**
 * Validate if a piece can be placed at the given position (bounds check only)
 * Used as a fast pre-check before expensive collision detection
 *
 * @param piece - Tetromino type
 * @param rotation - Rotation state
 * @param x - Target X position
 * @param y - Target Y position
 * @returns true if position is within board bounds, false otherwise
 */
export function isValidBounds(
  piece: TetrominoTypeName,
  rotation: RotationState,
  x: number,
  y: number,
): boolean {
  const pattern = getPieceBitPattern(piece, rotation);

  // Check all bounds
  return x >= 0 && y >= 0 && x + pattern.width <= 10 && y + pattern.height <= 20;
}

/**
 * Get metadata about a piece's dimensions and characteristics
 * Useful for AI algorithms that need to understand piece geometry
 *
 * @param piece - Tetromino type
 * @param rotation - Rotation state
 * @returns Metadata about the piece
 */
export function getPieceMetadata(piece: TetrominoTypeName, rotation: RotationState) {
  const pattern = getPieceBitPattern(piece, rotation);

  return {
    width: pattern.width,
    height: pattern.height,
    minX: pattern.minX,
    minY: pattern.minY,
    cellCount: pattern.rows.reduce((sum, row) => {
      // Count set bits using Brian Kernighan's algorithm
      let bits = row;
      let count = 0;
      while (bits) {
        count++;
        bits &= bits - 1;
      }
      return sum + count;
    }, 0),
  };
}

/**
 * Debug function to visualize bit patterns
 * Useful for development and testing
 *
 * @param piece - Tetromino type
 * @param rotation - Rotation state
 * @returns String representation of the bit pattern
 */
export function debugBitPattern(piece: TetrominoTypeName, rotation: RotationState): string {
  const pattern = getPieceBitPattern(piece, rotation);
  const lines: string[] = [];

  lines.push(`${piece} rotation ${rotation}:`);
  lines.push(
    `Size: ${pattern.width}x${pattern.height}, Offset: (${pattern.minX}, ${pattern.minY})`,
  );

  for (let i = 0; i < pattern.rows.length; i++) {
    const rowBits = pattern.rows[i];
    let rowStr = "";
    for (let x = 0; x < pattern.width; x++) {
      rowStr += rowBits & (1 << x) ? "█" : "·";
    }
    lines.push(`  ${rowStr} (${rowBits.toString(2).padStart(pattern.width, "0")})`);
  }

  return lines.join("\n");
}

/**
 * Performance optimization: Pre-calculate commonly used patterns
 * These can be used directly without function calls in hot paths
 */
export const COMMON_PATTERNS = {
  // I-piece patterns (most common in AI evaluation)
  I_HORIZONTAL: PIECE_BIT_PATTERNS.I[0],
  I_VERTICAL: PIECE_BIT_PATTERNS.I[1],

  // T-piece patterns (important for T-spins)
  T_UP: PIECE_BIT_PATTERNS.T[0],
  T_RIGHT: PIECE_BIT_PATTERNS.T[1],
  T_DOWN: PIECE_BIT_PATTERNS.T[2],
  T_LEFT: PIECE_BIT_PATTERNS.T[3],

  // O-piece (simplest case)
  O_SQUARE: PIECE_BIT_PATTERNS.O[0],
} as const;

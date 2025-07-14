/**
 * Core game operations for Tetris engine
 * Pure functions for piece manipulation and game state updates
 */

import type { LineClearResult, Matrix, Piece, PieceType, RotationState, Vec2 } from "../types.js";
import { VISIBLE_COLS } from "../types.js";
import {
  canPlacePiece as canPlacePieceOnMatrix,
  clearLines as clearLinesFromMatrix,
  findFullRows,
  placePiece as placePieceOnMatrix,
} from "./bitboard.js";
import { getNextRotation, getSpawnPosition, getTetrominoShape } from "./tetrominos.js";

/**
 * Drop a piece one row down
 * @param matrix Game matrix
 * @param piece Current piece
 * @returns New piece position or null if cannot drop
 */
export const dropPiece = (matrix: Matrix, piece: Piece): Piece | null => {
  const newPosition: Vec2 = {
    x: piece.position.x,
    y: piece.position.y + 1,
  };

  const shape = getTetrominoShape(piece.type, piece.rotation);

  if (canPlacePieceOnMatrix(matrix, shape, newPosition.x, newPosition.y)) {
    return {
      ...piece,
      position: newPosition,
    };
  }

  return null; // Cannot drop further
};

/**
 * Hard drop a piece to the bottom
 * @param matrix Game matrix
 * @param piece Current piece
 * @returns Object with new piece position and drop distance
 */
export const hardDropPiece = (matrix: Matrix, piece: Piece): { piece: Piece; distance: number } => {
  const shape = getTetrominoShape(piece.type, piece.rotation);
  let currentY = piece.position.y;
  let distance = 0;

  // Drop until collision
  while (canPlacePieceOnMatrix(matrix, shape, piece.position.x, currentY + 1)) {
    currentY++;
    distance++;
  }

  return {
    piece: {
      ...piece,
      position: { x: piece.position.x, y: currentY },
    },
    distance,
  };
};

/**
 * Move a piece horizontally
 * @param matrix Game matrix
 * @param piece Current piece
 * @param direction Direction to move (-1 for left, 1 for right)
 * @returns New piece position or null if cannot move
 */
export const movePiece = (matrix: Matrix, piece: Piece, direction: -1 | 1): Piece | null => {
  const newPosition: Vec2 = {
    x: piece.position.x + direction,
    y: piece.position.y,
  };

  const shape = getTetrominoShape(piece.type, piece.rotation);

  if (canPlacePieceOnMatrix(matrix, shape, newPosition.x, newPosition.y)) {
    return {
      ...piece,
      position: newPosition,
    };
  }

  return null; // Cannot move
};

/**
 * Rotate a piece (basic rotation without wall kicks)
 * @param matrix Game matrix
 * @param piece Current piece
 * @param clockwise True for clockwise, false for counter-clockwise
 * @returns New piece with rotation or null if cannot rotate
 */
export const rotatePiece = (matrix: Matrix, piece: Piece, clockwise = true): Piece | null => {
  const newRotation: RotationState = clockwise
    ? getNextRotation(piece.rotation)
    : (((piece.rotation + 3) % 4) as RotationState);

  const shape = getTetrominoShape(piece.type, newRotation);

  if (canPlacePieceOnMatrix(matrix, shape, piece.position.x, piece.position.y)) {
    return {
      ...piece,
      rotation: newRotation,
    };
  }

  return null; // Cannot rotate
};

/**
 * Place a piece on the matrix permanently
 * @param matrix Game matrix
 * @param piece Piece to place
 * @returns New matrix with piece placed
 */
export const placePieceOnBoard = (matrix: Matrix, piece: Piece): Matrix => {
  const shape = getTetrominoShape(piece.type, piece.rotation);
  return placePieceOnMatrix(matrix, shape, piece.position.x, piece.position.y);
};

/**
 * Check if a piece can be placed at its current position
 * @param matrix Game matrix
 * @param piece Piece to check
 * @returns True if piece can be placed
 */
export const canPlacePiece = (matrix: Matrix, piece: Piece): boolean => {
  const shape = getTetrominoShape(piece.type, piece.rotation);
  return canPlacePieceOnMatrix(matrix, shape, piece.position.x, piece.position.y);
};

/**
 * Clear completed lines and return result
 * @param matrix Game matrix
 * @returns Line clear result with new matrix and cleared lines
 */
export const clearLines = (matrix: Matrix): LineClearResult => {
  const fullRows = findFullRows(matrix);

  if (fullRows.length === 0) {
    return {
      clearedLines: [],
      newBoard: matrix,
      score: 0,
      isTSpin: false,
    };
  }

  const newBoard = clearLinesFromMatrix(matrix, fullRows);
  const score = calculateLineClearScore(fullRows.length);

  return {
    clearedLines: fullRows,
    newBoard,
    score,
    isTSpin: false, // T-Spin detection will be implemented later
  };
};

/**
 * Calculate score for line clears
 * @param lineCount Number of lines cleared
 * @param level Current game level
 * @returns Score points
 */
export const calculateScore = (lineCount: number, level = 1): number => {
  return calculateLineClearScore(lineCount) * level;
};

/**
 * Calculate base score for line clears (before level multiplier)
 * @param lineCount Number of lines cleared
 * @returns Base score points
 */
export const calculateLineClearScore = (lineCount: number): number => {
  switch (lineCount) {
    case 1:
      return 100; // Single
    case 2:
      return 300; // Double
    case 3:
      return 500; // Triple
    case 4:
      return 800; // Tetris
    default:
      return 0;
  }
};

/**
 * Create a new piece at spawn position
 * @param type Piece type
 * @returns New piece at spawn position
 */
export const createPiece = (type: PieceType): Piece => {
  const spawnPosition = getSpawnPosition(type);
  const shape = getTetrominoShape(type, 0);

  return {
    type,
    position: spawnPosition,
    rotation: 0,
    shape: shape as readonly boolean[][],
  };
};

/**
 * Get ghost piece position (where piece would land if hard dropped)
 * @param matrix Game matrix
 * @param piece Current piece
 * @returns Ghost piece position
 */
export const getGhostPiece = (matrix: Matrix, piece: Piece): Piece => {
  const { piece: ghostPiece } = hardDropPiece(matrix, piece);
  return ghostPiece;
};

/**
 * Check if the game is over (piece cannot be placed at spawn)
 * @param matrix Game matrix
 * @param piece Piece to check
 * @returns True if game is over
 */
export const isGameOver = (matrix: Matrix, piece: Piece): boolean => {
  return !canPlacePiece(matrix, piece);
};

/**
 * Calculate drop score based on distance
 * @param distance Drop distance
 * @param isHardDrop True if hard drop, false if soft drop
 * @returns Score points
 */
export const calculateDropScore = (distance: number, isHardDrop: boolean): number => {
  return isHardDrop ? distance * 2 : distance;
};

/**
 * Get the lowest Y position where a piece can be placed
 * @param matrix Game matrix
 * @param piece Piece to check
 * @returns Lowest Y position
 */
export const getLowestValidY = (matrix: Matrix, piece: Piece): number => {
  const shape = getTetrominoShape(piece.type, piece.rotation);
  let y = piece.position.y;

  // Find the lowest valid position
  while (canPlacePieceOnMatrix(matrix, shape, piece.position.x, y + 1)) {
    y++;
  }

  return y;
};

/**
 * Check if a position is within the game board boundaries
 * @param x X coordinate
 * @param y Y coordinate
 * @param matrixHeight Height of the game matrix
 * @returns True if position is valid
 */
export const isValidPosition = (x: number, y: number, matrixHeight: number): boolean => {
  return x >= 0 && x < VISIBLE_COLS && y >= 0 && y < matrixHeight;
};

/**
 * Get all occupied cells of a piece at its current position
 * @param piece Piece to analyze
 * @returns Array of occupied cell positions
 */
export const getOccupiedCells = (piece: Piece): Vec2[] => {
  const shape = getTetrominoShape(piece.type, piece.rotation);
  const cells: Vec2[] = [];

  for (let row = 0; row < shape.length; row++) {
    const currentRow = shape[row];
    if (currentRow) {
      for (let col = 0; col < currentRow.length; col++) {
        if (currentRow[col]) {
          cells.push({
            x: piece.position.x + col,
            y: piece.position.y + row,
          });
        }
      }
    }
  }

  return cells;
};

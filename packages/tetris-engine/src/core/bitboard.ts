/**
 * BitBoard Implementation for Tetris Game Engine
 * Uses Uint32Array for optimal performance and future WASM compatibility
 * Each row is encoded in 16 bits (10 columns + 6 spare bits for metadata)
 */

import { MAX_ROWS, type Matrix, VISIBLE_COLS } from "../types.js";

/**
 * Creates a new empty game matrix
 * @param rows Number of rows (default: MAX_ROWS)
 * @returns Empty matrix
 */
export const createMatrix = (rows: number = MAX_ROWS): Matrix => {
  return new Uint32Array(rows);
};

/**
 * Sets a cell in the matrix (immutable operation)
 * @param matrix Source matrix
 * @param row Row index (0-based from top)
 * @param col Column index (0-based from left)
 * @returns New matrix with cell set
 */
export const setCell = (matrix: Matrix, row: number, col: number): Matrix => {
  if (row < 0 || row >= matrix.length || col < 0 || col >= VISIBLE_COLS) {
    throw new Error(`Invalid position: row=${row}, col=${col}`);
  }

  const newMatrix = matrix.slice(); // Create shallow copy
  newMatrix[row] = (newMatrix[row] || 0) | (1 << col); // Set bit at column position
  return newMatrix;
};

/**
 * Clears a cell in the matrix (immutable operation)
 * @param matrix Source matrix
 * @param row Row index
 * @param col Column index
 * @returns New matrix with cell cleared
 */
export const clearCell = (matrix: Matrix, row: number, col: number): Matrix => {
  if (row < 0 || row >= matrix.length || col < 0 || col >= VISIBLE_COLS) {
    throw new Error(`Invalid position: row=${row}, col=${col}`);
  }

  const newMatrix = matrix.slice();
  newMatrix[row] = (newMatrix[row] || 0) & ~(1 << col); // Clear bit at column position
  return newMatrix;
};

/**
 * Checks if a cell is occupied
 * @param matrix Game matrix
 * @param row Row index
 * @param col Column index
 * @returns true if cell is occupied
 */
export const isOccupied = (matrix: Matrix, row: number, col: number): boolean => {
  if (row < 0 || row >= matrix.length || col < 0 || col >= VISIBLE_COLS) {
    return true; // Out of bounds is considered occupied
  }
  return ((matrix[row] || 0) & (1 << col)) !== 0;
};

/**
 * Checks if a row is completely filled
 * @param matrix Game matrix
 * @param row Row index
 * @returns true if row is full
 */
export const isRowFull = (matrix: Matrix, row: number): boolean => {
  if (row < 0 || row >= matrix.length) {
    return false;
  }
  // Check if all 10 columns are filled
  const fullRowMask = (1 << VISIBLE_COLS) - 1; // 0b1111111111 (10 bits)
  return ((matrix[row] || 0) & fullRowMask) === fullRowMask;
};

/**
 * Checks if a row is completely empty
 * @param matrix Game matrix
 * @param row Row index
 * @returns true if row is empty
 */
export const isRowEmpty = (matrix: Matrix, row: number): boolean => {
  if (row < 0 || row >= matrix.length) {
    return false;
  }
  // Check if all 10 columns are empty
  const fullRowMask = (1 << VISIBLE_COLS) - 1; // 0b1111111111 (10 bits)
  return ((matrix[row] || 0) & fullRowMask) === 0;
};

/**
 * Clears a line and shifts rows down (immutable operation)
 * @param matrix Source matrix
 * @param row Row index to clear
 * @returns New matrix with line cleared
 */
export const clearLine = (matrix: Matrix, row: number): Matrix => {
  if (row < 0 || row >= matrix.length) {
    throw new Error(`Invalid row index: ${row}`);
  }

  const newMatrix = matrix.slice();
  // Shift all rows above the cleared row down by one
  for (let i = row; i > 0; i--) {
    newMatrix[i] = newMatrix[i - 1] || 0;
  }
  newMatrix[0] = 0; // Clear top row
  return newMatrix;
};

/**
 * Clears multiple lines and shifts rows down (immutable operation)
 * @param matrix Source matrix
 * @param rows Array of row indices to clear (sorted in descending order)
 * @returns New matrix with lines cleared
 */
export const clearLines = (matrix: Matrix, rows: readonly number[]): Matrix => {
  if (rows.length === 0) {
    return matrix;
  }

  // Validate rows
  for (const row of rows) {
    if (row < 0 || row >= matrix.length) {
      throw new Error(`Invalid row index: ${row}`);
    }
  }

  // Create a set for fast lookup
  const rowsToDelete = new Set(rows);
  const newMatrix = new Uint32Array(matrix.length);

  // Copy non-deleted rows to the bottom of the new matrix
  let writeIndex = matrix.length - 1;
  for (let readIndex = matrix.length - 1; readIndex >= 0; readIndex--) {
    if (!rowsToDelete.has(readIndex)) {
      newMatrix[writeIndex] = matrix[readIndex] || 0;
      writeIndex--;
    }
  }

  // Fill the remaining top rows with zeros (already done by Uint32Array constructor)
  return newMatrix;
};

/**
 * Creates a deep copy of the matrix
 * @param matrix Source matrix
 * @returns New matrix copy
 */
export const copyMatrix = (matrix: Matrix): Matrix => {
  return matrix.slice();
};

/**
 * Converts matrix to string representation for debugging
 * @param matrix Game matrix
 * @returns String representation
 */
export const matrixToString = (matrix: Matrix): string => {
  const rows: string[] = [];

  for (let row = 0; row < matrix.length; row++) {
    const rowValue = matrix[row] || 0;
    let rowStr = "";

    for (let col = 0; col < VISIBLE_COLS; col++) {
      const isOccupied = (rowValue & (1 << col)) !== 0;
      rowStr += isOccupied ? "■" : "□";
    }

    rows.push(`${row.toString().padStart(2, "0")}: ${rowStr}`);
  }

  return rows.join("\n");
};

/**
 * Finds all full rows in the matrix
 * @param matrix Game matrix
 * @returns Array of full row indices
 */
export const findFullRows = (matrix: Matrix): number[] => {
  const fullRows: number[] = [];

  for (let row = 0; row < matrix.length; row++) {
    if (isRowFull(matrix, row)) {
      fullRows.push(row);
    }
  }

  return fullRows;
};

/**
 * Places a piece shape on the matrix (immutable operation)
 * @param matrix Source matrix
 * @param shape Piece shape (2D boolean array)
 * @param x X position
 * @param y Y position
 * @returns New matrix with piece placed
 */
export const placePiece = (
  matrix: Matrix,
  shape: readonly (readonly boolean[])[],
  x: number,
  y: number,
): Matrix => {
  const newMatrix = matrix.slice();

  for (let shapeRow = 0; shapeRow < shape.length; shapeRow++) {
    const currentShapeRow = shape[shapeRow];
    if (currentShapeRow) {
      for (let shapeCol = 0; shapeCol < currentShapeRow.length; shapeCol++) {
        if (currentShapeRow[shapeCol]) {
          const boardRow = y + shapeRow;
          const boardCol = x + shapeCol;

          if (
            boardRow >= 0 &&
            boardRow < matrix.length &&
            boardCol >= 0 &&
            boardCol < VISIBLE_COLS
          ) {
            newMatrix[boardRow] = (newMatrix[boardRow] || 0) | (1 << boardCol);
          }
        }
      }
    }
  }

  return newMatrix;
};

/**
 * Checks if a piece can be placed at the given position
 * @param matrix Game matrix
 * @param shape Piece shape (2D boolean array)
 * @param x X position
 * @param y Y position
 * @returns true if piece can be placed
 */
export const canPlacePiece = (
  matrix: Matrix,
  shape: readonly (readonly boolean[])[],
  x: number,
  y: number,
): boolean => {
  for (let shapeRow = 0; shapeRow < shape.length; shapeRow++) {
    const currentShapeRow = shape[shapeRow];
    if (currentShapeRow) {
      for (let shapeCol = 0; shapeCol < currentShapeRow.length; shapeCol++) {
        if (currentShapeRow[shapeCol]) {
          const boardRow = y + shapeRow;
          const boardCol = x + shapeCol;

          // Check bounds
          if (
            boardRow < 0 ||
            boardRow >= matrix.length ||
            boardCol < 0 ||
            boardCol >= VISIBLE_COLS
          ) {
            return false;
          }

          // Check collision
          if (isOccupied(matrix, boardRow, boardCol)) {
            return false;
          }
        }
      }
    }
  }

  return true;
};

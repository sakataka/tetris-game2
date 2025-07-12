import type { CellValue, GameBoard } from "@/types/game";
import { GAME_CONSTANTS } from "@/utils/gameConstants";

/**
 * Immutable BitBoard data structure
 * Represents the board state with bitwise operations for high performance
 */
export interface BitBoardData {
  readonly rows: Uint32Array;
  readonly vacancyCache: Uint8Array;
  readonly width: number;
  readonly height: number;
  readonly fullRowMask: number;
}

/**
 * Create a new BitBoard from optional existing board
 * Factory function for creating immutable BitBoard data
 */
export const createBitBoard = (existingBoard?: GameBoard): BitBoardData => {
  const width = GAME_CONSTANTS.BOARD.WIDTH; // 10
  const height = GAME_CONSTANTS.BOARD.HEIGHT; // 20
  const fullRowMask = (1 << width) - 1; // 0b1111111111 (10 bits set)
  const rows = new Uint32Array(height);
  const vacancyCache = new Uint8Array(height);

  if (existingBoard) {
    // Initialize from existing board
    const bitBoard = { rows, vacancyCache, width, height, fullRowMask };
    return fromBoardState(bitBoard, existingBoard);
  }
  // Initialize with empty board
  vacancyCache.fill(width);
  return { rows, vacancyCache, width, height, fullRowMask };
};

/**
 * Ultra-fast collision detection using bitwise AND operations
 * Check if a piece row can be placed at the given position
 */
export const canPlaceRow = (board: BitBoardData, pieceBits: number, y: number): boolean => {
  // Bounds check: ensure y is within valid range
  if (y < 0 || y >= board.height) {
    return false;
  }

  // Collision detection: bitwise AND with existing row
  return (board.rows[y] & pieceBits) === 0;
};

/**
 * Multi-row collision detection for complex tetromino shapes
 * Check if entire piece can be placed at the given position
 */
export const canPlace = (board: BitBoardData, pieceBitRows: number[], startY: number): boolean => {
  // Early bounds check
  if (startY < 0 || startY + pieceBitRows.length > board.height) {
    return false;
  }

  // Check each row of the piece against the board
  for (let i = 0; i < pieceBitRows.length; i++) {
    const targetY = startY + i;
    const pieceBits = pieceBitRows[i];

    // Skip empty rows (optimization)
    if (pieceBits === 0) continue;

    // Collision detection using bitwise AND
    if ((board.rows[targetY] & pieceBits) !== 0) {
      return false;
    }
  }

  return true;
};

/**
 * Place a piece on the board using bitwise OR operations
 * Returns new board state with the piece placed
 */
export const place = (
  board: BitBoardData,
  pieceBitRows: number[],
  startY: number,
): BitBoardData => {
  // Bounds validation in debug mode only
  if (process.env.NODE_ENV !== "production") {
    if (startY < 0 || startY + pieceBitRows.length > board.height) {
      throw new Error(`Invalid placement: startY=${startY}, pieceHeight=${pieceBitRows.length}`);
    }
  }

  // Create new arrays for immutable update
  const newRows = new Uint32Array(board.rows);
  const newVacancyCache = new Uint8Array(board.vacancyCache);

  // Place each row using bitwise OR and update vacancy cache
  for (let i = 0; i < pieceBitRows.length; i++) {
    const targetY = startY + i;
    const pieceBits = pieceBitRows[i];

    // Skip empty rows
    if (pieceBits === 0) continue;

    newRows[targetY] |= pieceBits;
    newVacancyCache[targetY] = updateVacancyForRow({ ...board, rows: newRows }, targetY);
  }

  return {
    ...board,
    rows: newRows,
    vacancyCache: newVacancyCache,
  };
};

/**
 * Ultra-fast line clearing using bitwise operations
 * Returns new board state with full lines cleared and array of cleared line indices
 */
export const clearLines = (
  board: BitBoardData,
): { board: BitBoardData; clearedLines: number[] } => {
  const clearedLines: number[] = [];
  const tempRows = new Uint32Array(board.height);
  const tempVacancy = new Uint8Array(board.height);
  let writeIndex = board.height - 1;

  // Scan from bottom to top for better cache locality
  for (let y = board.height - 1; y >= 0; y--) {
    // Mask to 10 bits to ignore any garbage in upper bits
    const maskedRow = board.rows[y] & board.fullRowMask;
    if (maskedRow === board.fullRowMask) {
      // Full row detected - add to cleared lines
      clearedLines.push(y);
    } else {
      // Keep this row - copy to temp buffer
      tempRows[writeIndex] = board.rows[y];
      tempVacancy[writeIndex] = board.vacancyCache[y];
      writeIndex--;
    }
  }

  // Fill remaining rows with empty (0) and vacancy with full (width)
  while (writeIndex >= 0) {
    tempRows[writeIndex] = 0;
    tempVacancy[writeIndex] = board.width;
    writeIndex--;
  }

  // Return cleared lines in ascending order (top to bottom)
  return {
    board: {
      ...board,
      rows: tempRows,
      vacancyCache: tempVacancy,
    },
    clearedLines: clearedLines.reverse(),
  };
};

/**
 * Convert BitBoard state to standard GameBoard format
 * Returns 2D array representation of the board
 */
export const toBoardState = (board: BitBoardData): GameBoard => {
  const gameBoard: GameBoard = [];

  for (let y = 0; y < board.height; y++) {
    const row: CellValue[] = [];
    const rowBits = board.rows[y];

    for (let x = 0; x < board.width; x++) {
      // Extract bit at position x
      const isOccupied = (rowBits & (1 << x)) !== 0;
      // Use 1 for occupied, 0 for empty (loses color information)
      row.push(isOccupied ? (1 as CellValue) : (0 as CellValue));
    }

    gameBoard.push(row);
  }

  return gameBoard;
};

/**
 * Initialize BitBoard from standard GameBoard format
 * Returns new BitBoard with data from 2D array
 */
export const fromBoardState = (board: BitBoardData, gameBoard: GameBoard): BitBoardData => {
  // Validate board dimensions
  if (gameBoard.length !== board.height) {
    throw new Error(`Invalid board height: expected ${board.height}, got ${gameBoard.length}`);
  }

  const newRows = new Uint32Array(board.height);
  const newVacancyCache = new Uint8Array(board.height);

  for (let y = 0; y < board.height; y++) {
    if (gameBoard[y].length !== board.width) {
      throw new Error(
        `Invalid board width at row ${y}: expected ${board.width}, got ${gameBoard[y].length}`,
      );
    }

    let rowBits = 0;
    for (let x = 0; x < board.width; x++) {
      // Convert any non-zero value to 1 (occupied)
      if (gameBoard[y][x] !== 0) {
        rowBits |= 1 << x;
      }
    }

    newRows[y] = rowBits;
    newVacancyCache[y] = updateVacancyForRow({ ...board, rows: newRows }, y);
  }

  return {
    ...board,
    rows: newRows,
    vacancyCache: newVacancyCache,
  };
};

/**
 * Create a deep copy of the BitBoard
 * Returns new BitBoard with identical state
 */
export const clone = (board: BitBoardData): BitBoardData => {
  return {
    ...board,
    rows: new Uint32Array(board.rows),
    vacancyCache: new Uint8Array(board.vacancyCache),
  };
};

/**
 * Reset board to empty state
 * Returns new empty BitBoard
 */
export const clear = (board: BitBoardData): BitBoardData => {
  const newRows = new Uint32Array(board.height);
  const newVacancyCache = new Uint8Array(board.height);
  newVacancyCache.fill(board.width);

  return {
    ...board,
    rows: newRows,
    vacancyCache: newVacancyCache,
  };
};

/**
 * Get raw bit representation of a specific row
 */
export const getRowBits = (board: BitBoardData, y: number): number => {
  if (y < 0 || y >= board.height) {
    throw new Error(`Row index out of bounds: ${y}`);
  }
  return board.rows[y];
};

/**
 * Set raw bit representation of a specific row
 * Returns new board with updated row
 */
export const setRowBits = (board: BitBoardData, y: number, bits: number): BitBoardData => {
  if (y < 0 || y >= board.height) {
    throw new Error(`Row index out of bounds: ${y}`);
  }

  const newRows = new Uint32Array(board.rows);
  const newVacancyCache = new Uint8Array(board.vacancyCache);

  newRows[y] = bits & board.fullRowMask; // Mask to ensure only valid bits
  newVacancyCache[y] = updateVacancyForRow({ ...board, rows: newRows }, y);

  return {
    ...board,
    rows: newRows,
    vacancyCache: newVacancyCache,
  };
};

/**
 * Calculate board height (number of occupied rows from bottom)
 */
export const calculateHeight = (board: BitBoardData): number => {
  for (let y = 0; y < board.height; y++) {
    if (board.rows[y] !== 0) {
      return board.height - y;
    }
  }
  return 0;
};

/**
 * Count total number of occupied cells
 */
export const countOccupiedCells = (board: BitBoardData): number => {
  let count = 0;
  for (let y = 0; y < board.height; y++) {
    // Count set bits in each row using Brian Kernighan's algorithm
    let rowBits = board.rows[y];
    while (rowBits) {
      count++;
      rowBits &= rowBits - 1; // Clear the lowest set bit
    }
  }
  return count;
};

/**
 * Check if the board is in a game over state
 */
export const isGameOver = (board: BitBoardData): boolean => {
  return board.rows[0] !== 0;
};

/**
 * Get board dimensions
 */
export const getDimensions = (board: BitBoardData): { width: number; height: number } => {
  return { width: board.width, height: board.height };
};

/**
 * Get vacancy count for a specific row
 */
export const getVacancy = (board: BitBoardData, y: number): number => {
  if (y < 0 || y >= board.height) {
    throw new Error(`Row index out of bounds: ${y}`);
  }
  return board.vacancyCache[y];
};

/**
 * Find rows that are candidates for line clearing
 * Returns rows with vacancy count <= maxVacancy
 */
export const findNearFullRows = (board: BitBoardData, maxVacancy = 2): number[] => {
  const nearFullRows: number[] = [];

  for (let y = 0; y < board.height; y++) {
    const vacancy = board.vacancyCache[y];
    if (vacancy > 0 && vacancy <= maxVacancy) {
      nearFullRows.push(y);
    }
  }

  return nearFullRows;
};

/**
 * Find immediate line clearing opportunities
 * Returns rows that are completely full
 */
export const findFullRows = (board: BitBoardData): number[] => {
  const fullRows: number[] = [];

  for (let y = 0; y < board.height; y++) {
    if (board.vacancyCache[y] === 0) {
      fullRows.push(y);
    }
  }

  return fullRows;
};

/**
 * Check if a piece can complete a specific row
 */
export const canCompleteRow = (
  board: BitBoardData,
  pieceBits: number,
  targetRow: number,
): boolean => {
  if (targetRow < 0 || targetRow >= board.height) {
    return false;
  }

  const rowBits = board.rows[targetRow];
  const vacancy = board.vacancyCache[targetRow];

  // Check if piece bits don't overlap with existing bits
  if ((rowBits & pieceBits) !== 0) {
    return false;
  }

  // Check if piece bits can fill the vacancy
  const pieceBitCount = popcount(pieceBits);
  return pieceBitCount >= vacancy;
};

/**
 * Calculate potential lines that could be filled by a piece
 */
export const calculatePotentialLinesFilled = (
  board: BitBoardData,
  pieceBitRows: number[],
  startY: number,
): number => {
  let potentialLines = 0;

  for (let i = 0; i < pieceBitRows.length; i++) {
    const targetY = startY + i;
    const pieceBits = pieceBitRows[i];

    if (targetY < 0 || targetY >= board.height || pieceBits === 0) {
      continue;
    }

    const resultingRowBits = board.rows[targetY] | pieceBits;
    if ((resultingRowBits & board.fullRowMask) === board.fullRowMask) {
      potentialLines++;
    }
  }

  return potentialLines;
};

/**
 * Calculate potential near-full rows after placing a piece
 */
export const calculatePotentialNearFullRows = (
  board: BitBoardData,
  pieceBitRows: number[],
  startY: number,
): number => {
  let potentialNearFull = 0;

  for (let i = 0; i < pieceBitRows.length; i++) {
    const targetY = startY + i;
    const pieceBits = pieceBitRows[i];

    if (targetY < 0 || targetY >= board.height || pieceBits === 0) {
      continue;
    }

    const resultingRowBits = board.rows[targetY] | pieceBits;
    const resultingVacancy = board.width - popcount(resultingRowBits);

    if (resultingVacancy === 1) {
      potentialNearFull++;
    }
  }

  return potentialNearFull;
};

/**
 * Update vacancy count for a specific row
 * Internal helper function
 */
const updateVacancyForRow = (board: BitBoardData, y: number): number => {
  const rowBits = board.rows[y] & board.fullRowMask;
  // Count empty cells by counting 0 bits in the row
  return board.width - popcount(rowBits);
};

/**
 * Count set bits in a number using Brian Kernighan's algorithm
 */
const popcount = (n: number): number => {
  let count = 0;
  let num = n;
  while (num) {
    count++;
    num &= num - 1; // Clear the lowest set bit
  }
  return count;
};

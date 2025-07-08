import type { CellValue, GameBoard } from "@/types/game";
import { GAME_CONSTANTS } from "@/utils/gameConstants";

/**
 * Ultra-high-performance BitBoard implementation for Tetris AI
 * Uses Uint32Array to represent the board state with bitwise operations
 *
 * Performance targets:
 * - <1ms for 1,000 collision detection operations
 * - 100,000+ board evaluations per second
 * - Memory efficient: 20 * 4 bytes = 80 bytes per board state
 *
 * Bit representation:
 * - Each row is a 32-bit integer in Uint32Array
 * - Rightmost 10 bits represent the 10 columns (0-9)
 * - 1 = occupied cell, 0 = empty cell
 * - Leftmost 22 bits are unused (reserved for future extensions)
 */
export class BitBoard {
  private readonly rows: Uint32Array;
  private readonly width: number;
  private readonly height: number;
  private readonly fullRowMask: number;

  constructor(existingBoard?: GameBoard) {
    this.width = GAME_CONSTANTS.BOARD.WIDTH; // 10
    this.height = GAME_CONSTANTS.BOARD.HEIGHT; // 20
    this.fullRowMask = (1 << this.width) - 1; // 0b1111111111 (10 bits set)
    this.rows = new Uint32Array(this.height);

    if (existingBoard) {
      this.fromBoardState(existingBoard);
    }
  }

  /**
   * Ultra-fast collision detection using bitwise AND operations
   * Optimized for AI evaluation with minimal branch prediction overhead
   *
   * @param pieceBits - Bit representation of the piece at target position
   * @param y - Target row position
   * @returns true if piece can be placed, false if collision detected
   */
  canPlaceRow(pieceBits: number, y: number): boolean {
    // Bounds check: ensure y is within valid range
    if (y < 0 || y >= this.height) {
      return false;
    }

    // Collision detection: bitwise AND with existing row
    // If result is 0, no collision; if non-zero, collision detected
    return (this.rows[y] & pieceBits) === 0;
  }

  /**
   * Multi-row collision detection for complex tetromino shapes
   * Processes multiple rows in a single operation for maximum performance
   *
   * @param pieceBitRows - Array of bit patterns for each row of the piece
   * @param startY - Starting Y position for the piece
   * @returns true if entire piece can be placed, false if any collision
   */
  canPlace(pieceBitRows: number[], startY: number): boolean {
    // Early bounds check
    if (startY < 0 || startY + pieceBitRows.length > this.height) {
      return false;
    }

    // Check each row of the piece against the board
    for (let i = 0; i < pieceBitRows.length; i++) {
      const targetY = startY + i;
      const pieceBits = pieceBitRows[i];

      // Skip empty rows (optimization)
      if (pieceBits === 0) continue;

      // Collision detection using bitwise AND
      if ((this.rows[targetY] & pieceBits) !== 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Place a piece on the board using bitwise OR operations
   * Modifies the board state in-place for maximum performance
   *
   * @param pieceBitRows - Array of bit patterns for each row of the piece
   * @param startY - Starting Y position for the piece
   */
  place(pieceBitRows: number[], startY: number): void {
    // Bounds validation in debug mode only
    if (process.env.NODE_ENV !== "production") {
      if (startY < 0 || startY + pieceBitRows.length > this.height) {
        throw new Error(`Invalid placement: startY=${startY}, pieceHeight=${pieceBitRows.length}`);
      }
    }

    // Place each row using bitwise OR
    for (let i = 0; i < pieceBitRows.length; i++) {
      const targetY = startY + i;
      const pieceBits = pieceBitRows[i];

      // Skip empty rows
      if (pieceBits === 0) continue;

      this.rows[targetY] |= pieceBits;
    }
  }

  /**
   * Ultra-fast line clearing using bitwise operations
   * Detects full rows by comparing with fullRowMask
   *
   * @returns Array of cleared line indices (bottom to top)
   */
  clearLines(): number[] {
    const clearedLines: number[] = [];
    const tempRows = new Uint32Array(this.height);
    let writeIndex = this.height - 1;

    // Scan from bottom to top for better cache locality
    for (let y = this.height - 1; y >= 0; y--) {
      // Mask to 10 bits to ignore any garbage in upper bits
      const maskedRow = this.rows[y] & this.fullRowMask;
      if (maskedRow === this.fullRowMask) {
        // Full row detected - add to cleared lines
        clearedLines.push(y);
      } else {
        // Keep this row - copy to temp buffer
        tempRows[writeIndex] = this.rows[y];
        writeIndex--;
      }
    }

    // Fill remaining rows with empty (0)
    while (writeIndex >= 0) {
      tempRows[writeIndex] = 0;
      writeIndex--;
    }

    // Copy temp buffer back to main buffer
    this.rows.set(tempRows);

    // Return cleared lines in ascending order (top to bottom)
    return clearedLines.reverse();
  }

  /**
   * Convert current BitBoard state to standard GameBoard format
   * Used for compatibility with existing game logic
   *
   * @returns 2D array representation of the board
   */
  toBoardState(): GameBoard {
    const board: GameBoard = [];

    for (let y = 0; y < this.height; y++) {
      const row: CellValue[] = [];
      const rowBits = this.rows[y];

      for (let x = 0; x < this.width; x++) {
        // Extract bit at position x
        const isOccupied = (rowBits & (1 << x)) !== 0;
        // Use 1 for occupied, 0 for empty (loses color information)
        row.push(isOccupied ? (1 as CellValue) : (0 as CellValue));
      }

      board.push(row);
    }

    return board;
  }

  /**
   * Initialize BitBoard from standard GameBoard format
   * Converts 2D array to bit representation
   *
   * @param board - Standard 2D board array
   */
  fromBoardState(board: GameBoard): void {
    // Validate board dimensions
    if (board.length !== this.height) {
      throw new Error(`Invalid board height: expected ${this.height}, got ${board.length}`);
    }

    for (let y = 0; y < this.height; y++) {
      if (board[y].length !== this.width) {
        throw new Error(
          `Invalid board width at row ${y}: expected ${this.width}, got ${board[y].length}`,
        );
      }

      let rowBits = 0;
      for (let x = 0; x < this.width; x++) {
        // Convert any non-zero value to 1 (occupied)
        if (board[y][x] !== 0) {
          rowBits |= 1 << x;
        }
      }

      this.rows[y] = rowBits;
    }
  }

  /**
   * Create a deep copy of the current BitBoard
   * Essential for AI tree search where board states are explored
   *
   * @returns New BitBoard instance with identical state
   */
  clone(): BitBoard {
    const newBitBoard = new BitBoard();
    newBitBoard.rows.set(this.rows);
    return newBitBoard;
  }

  /**
   * Reset the board to empty state
   * High-performance alternative to creating new instances
   */
  clear(): void {
    this.rows.fill(0);
  }

  /**
   * Get raw bit representation of a specific row
   * Useful for debugging and advanced AI algorithms
   *
   * @param y - Row index
   * @returns 32-bit integer representing the row
   */
  getRowBits(y: number): number {
    if (y < 0 || y >= this.height) {
      throw new Error(`Row index out of bounds: ${y}`);
    }
    return this.rows[y];
  }

  /**
   * Set raw bit representation of a specific row
   * Advanced method for direct bit manipulation
   *
   * @param y - Row index
   * @param bits - 32-bit integer representing the row
   */
  setRowBits(y: number, bits: number): void {
    if (y < 0 || y >= this.height) {
      throw new Error(`Row index out of bounds: ${y}`);
    }
    this.rows[y] = bits & this.fullRowMask; // Mask to ensure only valid bits
  }

  /**
   * Calculate board height (number of occupied rows from bottom)
   * Useful for AI evaluation functions
   *
   * @returns Height of the current board state
   */
  calculateHeight(): number {
    for (let y = 0; y < this.height; y++) {
      if (this.rows[y] !== 0) {
        return this.height - y;
      }
    }
    return 0;
  }

  /**
   * Count total number of occupied cells
   * Useful for AI evaluation functions
   *
   * @returns Total number of occupied cells
   */
  countOccupiedCells(): number {
    let count = 0;
    for (let y = 0; y < this.height; y++) {
      // Count set bits in each row using Brian Kernighan's algorithm
      let rowBits = this.rows[y];
      while (rowBits) {
        count++;
        rowBits &= rowBits - 1; // Clear the lowest set bit
      }
    }
    return count;
  }

  /**
   * Check if the board is in a game over state
   * Game over when any cell in the top row is occupied
   *
   * @returns true if game over, false otherwise
   */
  isGameOver(): boolean {
    return this.rows[0] !== 0;
  }

  /**
   * Get board dimensions
   * @returns Object containing width and height
   */
  getDimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }
}

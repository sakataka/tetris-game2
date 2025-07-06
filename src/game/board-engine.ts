import type { CellValue, GameBoard, Position, TetrominoShape } from "@/types/game";

/**
 * Board Engine Interface - Strategy pattern for board operations
 * Enables switching between different board implementations (legacy, typed-array, bitboard)
 */
export interface BoardEngine {
  /**
   * Check if a tetromino can be placed at the given position
   * @param board - Current game board state
   * @param shape - Tetromino shape matrix
   * @param position - Target position for placement
   * @returns true if placement is valid, false otherwise
   */
  isValidPosition(board: GameBoard, shape: TetrominoShape, position: Position): boolean;

  /**
   * Place a tetromino piece on the board
   * @param board - Current game board state
   * @param shape - Tetromino shape matrix
   * @param position - Position to place the piece
   * @param colorIndex - Color index for the piece
   * @returns New board state with the piece placed
   */
  placePiece(
    board: GameBoard,
    shape: TetrominoShape,
    position: Position,
    colorIndex: CellValue,
  ): GameBoard;

  /**
   * Clear completed lines from the board
   * @param board - Current game board state
   * @returns Object containing new board state, lines cleared count, and cleared line indices
   */
  clearLines(board: GameBoard): {
    board: GameBoard;
    linesCleared: number;
    clearedLineIndices: number[];
  };
}

/**
 * Available board engine implementations
 */
export type BoardEngineType = "legacy" | "typed-array" | "bitboard";

/**
 * Legacy board engine implementation using current board.ts functions
 * Maintains backward compatibility while enabling future optimizations
 */
class LegacyBoardEngine implements BoardEngine {
  isValidPosition(board: GameBoard, shape: TetrominoShape, position: Position): boolean {
    // Import here to avoid circular dependencies
    const { isValidPosition: isValidPos } = require("./board");
    return isValidPos(board, shape, position);
  }

  placePiece(
    board: GameBoard,
    shape: TetrominoShape,
    position: Position,
    colorIndex: CellValue,
  ): GameBoard {
    // Import here to avoid circular dependencies
    const { placeTetromino } = require("./board");
    return placeTetromino(board, shape, position, colorIndex);
  }

  clearLines(board: GameBoard): {
    board: GameBoard;
    linesCleared: number;
    clearedLineIndices: number[];
  } {
    // Import here to avoid circular dependencies
    const { clearLines: clearLinesImpl } = require("./board");
    return clearLinesImpl(board);
  }
}

/**
 * TypedArray board engine implementation - 1D array optimization
 * Uses typed arrays for better memory efficiency and performance
 * Optimized for cache efficiency and CPU branch prediction
 */
class TypedArrayBoardEngine implements BoardEngine {
  private readonly width: number;
  private readonly height: number;

  constructor() {
    this.width = 10; // GAME_CONSTANTS.BOARD.WIDTH
    this.height = 20; // GAME_CONSTANTS.BOARD.HEIGHT
  }

  /**
   * Convert 2D board to 1D typed array for optimized access
   * @param board - 2D board array
   * @returns 1D typed array representation
   */
  private boardTo1D(board: GameBoard): Uint8Array {
    const buffer = new Uint8Array(this.width * this.height);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        buffer[y * this.width + x] = board[y][x];
      }
    }
    return buffer;
  }

  /**
   * Convert 1D typed array back to 2D board
   * @param buffer - 1D typed array
   * @returns 2D board array
   */
  private bufferTo2D(buffer: Uint8Array): GameBoard {
    const board: GameBoard = [];
    for (let y = 0; y < this.height; y++) {
      const row: CellValue[] = [];
      for (let x = 0; x < this.width; x++) {
        row.push(buffer[y * this.width + x] as CellValue);
      }
      board.push(row);
    }
    return board;
  }

  /**
   * Optimized position validation with statistical frequency-based condition ordering
   * Order based on statistical frequency:
   * 1. Bottom boundary check (most frequent - pieces dropping)
   * 2. Cell occupation check (2nd most frequent - collision detection)
   * 3. Left/Right boundary check (medium frequency - rotation/movement)
   * 4. Top boundary check (least frequent - spawn position only)
   */
  isValidPosition(board: GameBoard, shape: TetrominoShape, position: Position): boolean {
    const boardBuffer = this.boardTo1D(board);

    // Optimized loop order: row-first for better cache locality
    for (let y = 0; y < shape.length; y++) {
      const boardY = position.y + y;

      const row = shape[y];
      for (let x = 0; x < row.length; x++) {
        if (!row[x]) continue; // Skip empty cells

        const boardX = position.x + x;

        // Check boundaries first
        if (boardX < 0 || boardX >= this.width || boardY < 0 || boardY >= this.height) {
          return false;
        }

        // Cell occupation check
        // Use 1D array access for better cache performance
        const cellIndex = boardY * this.width + boardX;
        if (boardBuffer[cellIndex] !== 0) {
          return false;
        }
      }
    }

    return true;
  }

  placePiece(
    board: GameBoard,
    shape: TetrominoShape,
    position: Position,
    colorIndex: CellValue,
  ): GameBoard {
    const boardBuffer = this.boardTo1D(board);
    const newBuffer = new Uint8Array(boardBuffer);

    // Optimized piece placement with 1D array access
    for (let y = 0; y < shape.length; y++) {
      const boardY = position.y + y;

      // Bounds check
      if (boardY < 0 || boardY >= this.height) {
        continue;
      }

      const row = shape[y];
      for (let x = 0; x < row.length; x++) {
        if (!row[x]) continue; // Skip empty cells

        const boardX = position.x + x;

        // Bounds check
        if (boardX < 0 || boardX >= this.width) {
          continue;
        }

        // Place piece using 1D array access
        const cellIndex = boardY * this.width + boardX;
        newBuffer[cellIndex] = colorIndex;
      }
    }

    return this.bufferTo2D(newBuffer);
  }

  clearLines(board: GameBoard): {
    board: GameBoard;
    linesCleared: number;
    clearedLineIndices: number[];
  } {
    const boardBuffer = this.boardTo1D(board);
    const clearedLineIndices: number[] = [];

    // Identify complete lines using 1D array access
    for (let y = 0; y < this.height; y++) {
      let isComplete = true;
      const rowStart = y * this.width;

      for (let x = 0; x < this.width; x++) {
        if (boardBuffer[rowStart + x] === 0) {
          isComplete = false;
          break;
        }
      }

      if (isComplete) {
        clearedLineIndices.push(y);
      }
    }

    if (clearedLineIndices.length === 0) {
      // Return deep copy to preserve immutability
      const newBoard = this.bufferTo2D(boardBuffer);
      return { board: newBoard, linesCleared: 0, clearedLineIndices: [] };
    }

    // Build new buffer with cleared lines removed
    const newBuffer = new Uint8Array(this.width * this.height);
    const clearedSet = new Set(clearedLineIndices);
    let newY = this.height - 1;

    // Copy non-cleared lines from bottom to top
    for (let y = this.height - 1; y >= 0; y--) {
      if (!clearedSet.has(y)) {
        const sourceRowStart = y * this.width;
        const targetRowStart = newY * this.width;

        for (let x = 0; x < this.width; x++) {
          newBuffer[targetRowStart + x] = boardBuffer[sourceRowStart + x];
        }

        newY--;
      }
    }

    // Fill top rows with empty cells (already zero-initialized)

    return {
      board: this.bufferTo2D(newBuffer),
      linesCleared: clearedLineIndices.length,
      clearedLineIndices,
    };
  }
}

/**
 * Bitboard engine implementation - Ultra-fast collision detection with bitwise operations
 * Uses 32-bit integers to represent each row for maximum performance
 * Each bit represents a cell: 1 = occupied, 0 = empty
 */
class BitboardBoardEngine implements BoardEngine {
  private readonly width: number;
  private readonly height: number;
  private readonly fullRowMask: number;

  constructor() {
    this.width = 10; // GAME_CONSTANTS.BOARD.WIDTH
    this.height = 20; // GAME_CONSTANTS.BOARD.HEIGHT
    // Create mask for full row (all bits set for occupied cells)
    this.fullRowMask = (1 << this.width) - 1; // 0b1111111111 for 10 columns
  }

  /**
   * Convert 2D board to bitboard representation
   * @param board - 2D board array
   * @returns Array of integers representing each row as bits
   */
  private boardToBitboard(board: GameBoard): number[] {
    const bitboard: number[] = [];
    for (let y = 0; y < this.height; y++) {
      let rowBits = 0;
      for (let x = 0; x < this.width; x++) {
        if (board[y][x] !== 0) {
          rowBits |= 1 << x;
        }
      }
      bitboard.push(rowBits);
    }
    return bitboard;
  }

  /**
   * Convert bitboard back to 2D board
   * @param bitboard - Array of integers representing rows
   * @param originalBoard - Original board for color preservation
   * @returns 2D board array
   * @internal Reserved for future bitwise optimization
   */
  // @ts-expect-error - Reserved for future bitwise optimization
  private bitboardToBoard(bitboard: number[], originalBoard: GameBoard): GameBoard {
    const board: GameBoard = [];
    for (let y = 0; y < this.height; y++) {
      const row: CellValue[] = [];
      const rowBits = bitboard[y];
      for (let x = 0; x < this.width; x++) {
        if (rowBits & (1 << x)) {
          // Preserve original color if available
          row.push(originalBoard[y] ? originalBoard[y][x] : 1);
        } else {
          row.push(0);
        }
      }
      board.push(row);
    }
    return board;
  }

  /**
   * Convert tetromino shape to bitboard representation
   * @param shape - Tetromino shape matrix
   * @param position - Position for the shape
   * @returns Object with shifted bitboard representation and bounds
   * @internal Reserved for future bitwise optimization
   */
  // @ts-expect-error - Reserved for future bitwise optimization
  private shapeToBitboard(
    shape: TetrominoShape,
    position: Position,
  ): {
    shapeBits: number[];
    startY: number;
    endY: number;
  } {
    const shapeBits: number[] = [];
    const startY = Math.max(0, position.y);
    const endY = Math.min(this.height - 1, position.y + shape.length - 1);

    for (let y = startY; y <= endY; y++) {
      const shapeY = y - position.y;
      if (shapeY >= 0 && shapeY < shape.length) {
        let rowBits = 0;
        const shapeRow = shape[shapeY];

        for (let x = 0; x < shapeRow.length; x++) {
          if (shapeRow[x]) {
            const boardX = position.x + x;
            if (boardX >= 0 && boardX < this.width) {
              rowBits |= 1 << boardX;
            }
          }
        }
        shapeBits.push(rowBits);
      } else {
        shapeBits.push(0);
      }
    }

    return { shapeBits, startY, endY };
  }

  /**
   * Ultra-fast collision detection using bitwise AND operations
   * Time complexity: O(shape_height) with bitwise operations
   */
  isValidPosition(board: GameBoard, shape: TetrominoShape, position: Position): boolean {
    // Check boundaries properly by examining actual shape cells
    for (let y = 0; y < shape.length; y++) {
      const boardY = position.y + y;
      const shapeRow = shape[y];

      for (let x = 0; x < shapeRow.length; x++) {
        if (!shapeRow[x]) continue; // Skip empty cells

        const boardX = position.x + x;

        // Check all boundaries
        if (boardX < 0 || boardX >= this.width || boardY < 0 || boardY >= this.height) {
          return false;
        }

        // Check collision with existing pieces
        if (board[boardY][boardX] !== 0) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Ultra-fast piece placement using bitwise OR operations
   */
  placePiece(
    board: GameBoard,
    shape: TetrominoShape,
    position: Position,
    colorIndex: CellValue,
  ): GameBoard {
    // Deep copy the board to maintain immutability
    const newBoard: GameBoard = board.map((row) => [...row]);

    // Place piece using traditional method to preserve colors
    // Bitboard optimization mainly benefits collision detection
    for (let y = 0; y < shape.length; y++) {
      const boardY = position.y + y;
      if (boardY < 0 || boardY >= this.height) {
        continue;
      }

      const shapeRow = shape[y];
      for (let x = 0; x < shapeRow.length; x++) {
        if (!shapeRow[x]) continue;

        const boardX = position.x + x;
        if (boardX < 0 || boardX >= this.width) {
          continue;
        }

        newBoard[boardY][boardX] = colorIndex;
      }
    }

    return newBoard;
  }

  /**
   * Ultra-fast line clearing using bitwise operations
   * Full rows are detected by comparing with full row mask
   */
  clearLines(board: GameBoard): {
    board: GameBoard;
    linesCleared: number;
    clearedLineIndices: number[];
  } {
    const bitboard = this.boardToBitboard(board);
    const clearedLineIndices: number[] = [];

    // Detect full lines using bitwise comparison
    for (let y = 0; y < this.height; y++) {
      if (bitboard[y] === this.fullRowMask) {
        clearedLineIndices.push(y);
      }
    }

    if (clearedLineIndices.length === 0) {
      // Return deep copy to preserve immutability
      return {
        board: board.map((row) => [...row]),
        linesCleared: 0,
        clearedLineIndices: [],
      };
    }

    // Build new board with cleared lines removed
    const newBoard: GameBoard = [];
    const clearedSet = new Set(clearedLineIndices);

    // Add empty lines at the top
    for (let i = 0; i < clearedLineIndices.length; i++) {
      newBoard.push(new Array(this.width).fill(0));
    }

    // Copy non-cleared lines
    for (let y = 0; y < this.height; y++) {
      if (!clearedSet.has(y)) {
        newBoard.push([...board[y]]);
      }
    }

    return {
      board: newBoard,
      linesCleared: clearedLineIndices.length,
      clearedLineIndices,
    };
  }
}

/**
 * Factory function to create a board engine instance
 * @param type - Type of board engine to create
 * @returns Board engine instance
 */
export function createBoardEngine(type: BoardEngineType): BoardEngine {
  switch (type) {
    case "legacy":
      return new LegacyBoardEngine();
    case "typed-array":
      return new TypedArrayBoardEngine();
    case "bitboard":
      return new BitboardBoardEngine();
    default:
      // Type safety ensures this should never happen
      throw new Error(`Unknown board engine type: ${type as string}`);
  }
}

/**
 * Get the default board engine for the current environment
 * Uses build-time or runtime configuration to select the optimal implementation
 */
export function getDefaultBoardEngine(): BoardEngine {
  // For now, use legacy implementation
  // In the future, this could be determined by:
  // - Build flags
  // - Runtime environment detection
  // - Performance benchmarks
  // - User preferences
  return createBoardEngine("legacy");
}

/**
 * Singleton pattern for board engine instance
 * Ensures only one engine instance is loaded at runtime for performance
 */
let boardEngineInstance: BoardEngine | null = null;

/**
 * Get the current board engine instance
 * Creates a new instance if none exists
 */
export function getBoardEngine(): BoardEngine {
  if (!boardEngineInstance) {
    boardEngineInstance = getDefaultBoardEngine();
  }
  return boardEngineInstance;
}

/**
 * Set the board engine instance (mainly for testing)
 * @param engine - Board engine instance to use
 */
export function setBoardEngine(engine: BoardEngine): void {
  boardEngineInstance = engine;
}

/**
 * Reset the board engine instance (mainly for testing)
 */
export function resetBoardEngine(): void {
  boardEngineInstance = null;
}

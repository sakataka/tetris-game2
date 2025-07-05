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

      // Early exit for bottom boundary (most frequent check)
      if (boardY >= this.height) {
        return false;
      }

      // Skip rows that are above the board (negative y)
      if (boardY < 0) {
        continue;
      }

      const row = shape[y];
      for (let x = 0; x < row.length; x++) {
        if (!row[x]) continue; // Skip empty cells

        const boardX = position.x + x;

        // Left/Right boundary checks (medium frequency)
        if (boardX < 0 || boardX >= this.width) {
          return false;
        }

        // Cell occupation check (2nd most frequent)
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
      return { board, linesCleared: 0, clearedLineIndices: [] };
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
 * Bitboard engine implementation (future optimization)
 * Uses bitwise operations for maximum performance
 */
class BitboardBoardEngine implements BoardEngine {
  isValidPosition(board: GameBoard, shape: TetrominoShape, position: Position): boolean {
    // TODO: Implement bitboard-based collision detection
    // For now, fallback to legacy implementation
    return new LegacyBoardEngine().isValidPosition(board, shape, position);
  }

  placePiece(
    board: GameBoard,
    shape: TetrominoShape,
    position: Position,
    colorIndex: CellValue,
  ): GameBoard {
    // TODO: Implement bitboard-based piece placement
    // For now, fallback to legacy implementation
    return new LegacyBoardEngine().placePiece(board, shape, position, colorIndex);
  }

  clearLines(board: GameBoard): {
    board: GameBoard;
    linesCleared: number;
    clearedLineIndices: number[];
  } {
    // TODO: Implement bitboard-based line clearing
    // For now, fallback to legacy implementation
    return new LegacyBoardEngine().clearLines(board);
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

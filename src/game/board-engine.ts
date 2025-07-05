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
 * TypedArray board engine implementation (future optimization)
 * Uses typed arrays for better memory efficiency and performance
 */
class TypedArrayBoardEngine implements BoardEngine {
  isValidPosition(board: GameBoard, shape: TetrominoShape, position: Position): boolean {
    // TODO: Implement optimized version using typed arrays
    // For now, fallback to legacy implementation
    return new LegacyBoardEngine().isValidPosition(board, shape, position);
  }

  placePiece(
    board: GameBoard,
    shape: TetrominoShape,
    position: Position,
    colorIndex: CellValue,
  ): GameBoard {
    // TODO: Implement optimized version using typed arrays
    // For now, fallback to legacy implementation
    return new LegacyBoardEngine().placePiece(board, shape, position, colorIndex);
  }

  clearLines(board: GameBoard): {
    board: GameBoard;
    linesCleared: number;
    clearedLineIndices: number[];
  } {
    // TODO: Implement optimized version using typed arrays
    // For now, fallback to legacy implementation
    return new LegacyBoardEngine().clearLines(board);
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

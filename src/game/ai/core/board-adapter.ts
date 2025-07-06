import type { BoardEngine } from "@/game/board-engine";
import type {
  CellValue,
  GameBoard,
  Position,
  TetrominoShape,
  TetrominoTypeName,
} from "@/types/game";
import { BitBoard } from "./bitboard";
import { getCollisionDetector } from "./collision-detection";
import { getPieceBitsAtPosition } from "./piece-bits";

/**
 * Advanced board conversion and adapter utilities
 * Provides seamless integration between BitBoard and existing game systems
 *
 * Features:
 * - Bidirectional conversion with color preservation
 * - BoardEngine adapter for drop-in replacement
 * - Batch conversion for performance
 * - Validation and error handling
 */

export interface ConversionResult<T> {
  success: boolean;
  result?: T;
  error?: string;
  metadata?: {
    conversionTimeUs: number;
    originalSize: number;
    convertedSize: number;
  };
}

/**
 * Enhanced board conversion utilities
 * Handles edge cases and provides performance optimization
 */
export class BoardConverter {
  public readonly enableMetrics: boolean;

  constructor(enableMetrics = false) {
    this.enableMetrics = enableMetrics;
  }

  /**
   * Convert GameBoard to BitBoard with optional color preservation
   * Supports both simple occupancy and full color mapping
   *
   * @param gameBoard - Standard 2D game board
   * @param preserveColors - Whether to preserve color information in metadata
   * @returns Conversion result with BitBoard and optional color map
   */
  toBitBoard(
    gameBoard: GameBoard,
    preserveColors = false,
  ): ConversionResult<{ bitBoard: BitBoard; colorMap?: Map<string, CellValue> }> {
    const startTime = this.enableMetrics ? performance.now() : 0;

    try {
      // Validate input dimensions
      if (gameBoard.length !== 20) {
        return {
          success: false,
          error: `Invalid board height: expected 20, got ${gameBoard.length}`,
        };
      }

      for (let y = 0; y < gameBoard.length; y++) {
        if (gameBoard[y].length !== 10) {
          return {
            success: false,
            error: `Invalid board width at row ${y}: expected 10, got ${gameBoard[y].length}`,
          };
        }
      }

      const bitBoard = new BitBoard();
      let colorMap: Map<string, CellValue> | undefined;

      if (preserveColors) {
        colorMap = new Map();

        // Convert with color preservation
        for (let y = 0; y < 20; y++) {
          let rowBits = 0;
          for (let x = 0; x < 10; x++) {
            const cellValue = gameBoard[y][x];
            if (cellValue !== 0) {
              rowBits |= 1 << x;
              // Store color information using position key
              const posKey = `${x},${y}`;
              colorMap.set(posKey, cellValue);
            }
          }
          bitBoard.setRowBits(y, rowBits);
        }
      } else {
        // Simple conversion without color preservation
        bitBoard.fromBoardState(gameBoard);
      }

      return {
        success: true,
        result: { bitBoard, colorMap },
        metadata: this.enableMetrics
          ? {
              conversionTimeUs: (performance.now() - startTime) * 1000,
              originalSize: gameBoard.length * gameBoard[0].length * 4, // Approximate bytes
              convertedSize: 20 * 4, // Uint32Array bytes
            }
          : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown conversion error",
      };
    }
  }

  /**
   * Convert BitBoard to GameBoard with optional color restoration
   *
   * @param bitBoard - BitBoard instance
   * @param colorMap - Optional color map for restoration
   * @param defaultColor - Default color for occupied cells (if no color map)
   * @returns Conversion result with GameBoard
   */
  toGameBoard(
    bitBoard: BitBoard,
    colorMap?: Map<string, CellValue>,
    defaultColor: CellValue = 1,
  ): ConversionResult<GameBoard> {
    const startTime = this.enableMetrics ? performance.now() : 0;

    try {
      const gameBoard: GameBoard = [];

      for (let y = 0; y < 20; y++) {
        const row: CellValue[] = [];
        const rowBits = bitBoard.getRowBits(y);

        for (let x = 0; x < 10; x++) {
          const isOccupied = (rowBits & (1 << x)) !== 0;

          if (isOccupied) {
            if (colorMap) {
              const posKey = `${x},${y}`;
              const color = colorMap.get(posKey) || defaultColor;
              row.push(color);
            } else {
              row.push(defaultColor);
            }
          } else {
            row.push(0);
          }
        }

        gameBoard.push(row);
      }

      return {
        success: true,
        result: gameBoard,
        metadata: this.enableMetrics
          ? {
              conversionTimeUs: (performance.now() - startTime) * 1000,
              originalSize: 20 * 4, // BitBoard bytes
              convertedSize: 20 * 10 * 4, // GameBoard approximate bytes
            }
          : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown conversion error",
      };
    }
  }

  /**
   * Create a BitBoard copy with specific piece placed
   * Useful for AI simulation without modifying the original board
   *
   * @param sourceBitBoard - Original BitBoard
   * @param piece - Tetromino type to place
   * @param rotation - Rotation state
   * @param position - Position to place the piece
   * @param colorIndex - Color index for the piece
   * @returns New BitBoard with piece placed, or null if placement is invalid
   */
  placePieceOnCopy(
    sourceBitBoard: BitBoard,
    piece: TetrominoTypeName,
    rotation: number,
    position: Position,
    _colorIndex?: CellValue,
  ): BitBoard | null {
    // Validate placement first
    const detector = getCollisionDetector();
    const canPlace = detector.canPlace(
      sourceBitBoard,
      piece,
      rotation as any,
      position.x,
      position.y,
    );

    if (!canPlace.canPlace) {
      return null;
    }

    // Create copy and place piece
    const newBitBoard = sourceBitBoard.clone();
    const pieceBits = getPieceBitsAtPosition(piece, rotation as any, position.x);
    newBitBoard.place(pieceBits, position.y);

    return newBitBoard;
  }

  /**
   * Batch convert multiple GameBoards to BitBoards
   * Optimized for scenarios where many conversions are needed
   *
   * @param gameBoards - Array of GameBoards to convert
   * @param preserveColors - Whether to preserve color information
   * @returns Array of conversion results
   */
  toBitBoardBatch(
    gameBoards: GameBoard[],
    preserveColors = false,
  ): ConversionResult<{ bitBoard: BitBoard; colorMap?: Map<string, CellValue> }>[] {
    return gameBoards.map((board) => this.toBitBoard(board, preserveColors));
  }
}

/**
 * BitBoard-based BoardEngine implementation
 * Provides a drop-in replacement for existing BoardEngine implementations
 * with BitBoard performance optimizations
 */
export class BitBoardEngine implements BoardEngine {
  public readonly enableMetrics: boolean;
  private readonly converter: BoardConverter;

  constructor(enableMetrics = false) {
    this.enableMetrics = enableMetrics;
    this.converter = new BoardConverter(enableMetrics);
  }

  /**
   * Check if a tetromino can be placed at the given position
   * Uses ultra-fast BitBoard collision detection
   */
  isValidPosition(board: GameBoard, shape: TetrominoShape, position: Position): boolean {
    // Convert board to BitBoard for fast collision detection
    const conversionResult = this.converter.toBitBoard(board);
    if (!conversionResult.success || !conversionResult.result) {
      return false;
    }

    const { bitBoard } = conversionResult.result;

    // Convert shape to bit representation for collision detection
    // Note: This is a simplified conversion - in a full implementation,
    // you might want to cache piece bit patterns or use piece type directly
    return this.isValidPositionWithBitBoard(bitBoard, shape, position);
  }

  /**
   * Place a tetromino piece on the board
   * Uses BitBoard for efficient placement and conversion back
   */
  placePiece(
    board: GameBoard,
    shape: TetrominoShape,
    position: Position,
    colorIndex: CellValue,
  ): GameBoard {
    // Convert to BitBoard for efficient processing
    const conversionResult = this.converter.toBitBoard(board, true);
    if (!conversionResult.success || !conversionResult.result) {
      // Fallback to original board if conversion fails
      return board.map((row) => [...row]);
    }

    const { bitBoard, colorMap } = conversionResult.result;

    // Place piece using BitBoard
    const pieceBits = this.shapeToBitRows(shape);
    bitBoard.place(pieceBits, position.y);

    // Update color map if available
    if (colorMap) {
      for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
          if (shape[y][x] !== 0) {
            const boardX = position.x + x;
            const boardY = position.y + y;
            const posKey = `${boardX},${boardY}`;
            colorMap.set(posKey, colorIndex);
          }
        }
      }
    }

    // Convert back to GameBoard
    const gameboardResult = this.converter.toGameBoard(bitBoard, colorMap, colorIndex);
    return gameboardResult.success && gameboardResult.result ? gameboardResult.result : board;
  }

  /**
   * Clear completed lines from the board
   * Uses BitBoard's optimized line clearing algorithm
   */
  clearLines(board: GameBoard): {
    board: GameBoard;
    linesCleared: number;
    clearedLineIndices: number[];
  } {
    // Convert to BitBoard for efficient line clearing
    const conversionResult = this.converter.toBitBoard(board, true);
    if (!conversionResult.success || !conversionResult.result) {
      // Fallback to empty result if conversion fails
      return {
        board: board.map((row) => [...row]),
        linesCleared: 0,
        clearedLineIndices: [],
      };
    }

    const { bitBoard, colorMap } = conversionResult.result;

    // Perform line clearing using BitBoard
    const clearedLineIndices = bitBoard.clearLines();

    // Update color map to remove cleared lines
    if (colorMap && clearedLineIndices.length > 0) {
      const newColorMap = new Map<string, CellValue>();
      for (const [posKey, color] of colorMap.entries()) {
        const [xStr, yStr] = posKey.split(",");
        const y = Number.parseInt(yStr, 10);

        // Skip cleared lines
        if (clearedLineIndices.includes(y)) {
          continue;
        }

        // Adjust Y coordinate for lines that moved down
        let newY = y;
        for (const clearedY of clearedLineIndices) {
          if (clearedY < y) {
            newY++;
          }
        }

        const newPosKey = `${xStr},${newY}`;
        newColorMap.set(newPosKey, color);
      }
      colorMap.clear();
      for (const [key, value] of newColorMap) {
        colorMap.set(key, value);
      }
    }

    // Convert back to GameBoard
    const gameboardResult = this.converter.toGameBoard(bitBoard, colorMap);
    const resultBoard =
      gameboardResult.success && gameboardResult.result ? gameboardResult.result : board;

    return {
      board: resultBoard,
      linesCleared: clearedLineIndices.length,
      clearedLineIndices,
    };
  }

  /**
   * Helper method for collision detection with BitBoard
   */
  private isValidPositionWithBitBoard(
    bitBoard: BitBoard,
    shape: TetrominoShape,
    position: Position,
  ): boolean {
    const pieceBits = this.shapeToBitRows(shape);

    // Shift bits to position
    const shiftedBits = pieceBits.map((rowBits) => rowBits << position.x);

    return bitBoard.canPlace(shiftedBits, position.y);
  }

  /**
   * Convert TetrominoShape to bit representation
   */
  private shapeToBitRows(shape: TetrominoShape): number[] {
    const bitRows: number[] = [];

    for (const row of shape) {
      let rowBits = 0;
      for (let x = 0; x < row.length; x++) {
        if (row[x] !== 0) {
          rowBits |= 1 << x;
        }
      }
      bitRows.push(rowBits);
    }

    return bitRows;
  }
}

/**
 * Singleton instances for performance optimization
 */
let globalConverter: BoardConverter | null = null;
let globalBitBoardEngine: BitBoardEngine | null = null;

/**
 * Get the global board converter instance
 */
export function getBoardConverter(enableMetrics = false): BoardConverter {
  if (!globalConverter || (enableMetrics && !globalConverter.enableMetrics)) {
    globalConverter = new BoardConverter(enableMetrics);
  }
  return globalConverter;
}

/**
 * Get the global BitBoard engine instance
 */
export function getBitBoardEngine(enableMetrics = false): BitBoardEngine {
  if (!globalBitBoardEngine || (enableMetrics && !globalBitBoardEngine.enableMetrics)) {
    globalBitBoardEngine = new BitBoardEngine(enableMetrics);
  }
  return globalBitBoardEngine;
}

/**
 * Convenience functions for common conversion operations
 */

/**
 * Quick conversion from GameBoard to BitBoard
 */
export function gameboardToBitboard(gameBoard: GameBoard): BitBoard | null {
  const converter = getBoardConverter();
  const result = converter.toBitBoard(gameBoard);
  return result.success && result.result ? result.result.bitBoard : null;
}

/**
 * Quick conversion from BitBoard to GameBoard
 */
export function bitboardToGameboard(bitBoard: BitBoard): GameBoard | null {
  const converter = getBoardConverter();
  const result = converter.toGameBoard(bitBoard);
  return result.success && result.result ? result.result : null;
}

/**
 * Reset global instances (mainly for testing)
 */
export function resetBoardAdapter(): void {
  globalConverter = null;
  globalBitBoardEngine = null;
}

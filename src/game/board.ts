import { BoardError, ERROR_CODES } from "../types/errors";
import type { BoardMatrix, Position } from "../types/game";
import { BOARD_HEIGHT, BOARD_WIDTH } from "../utils/constants";

// Type guard to ensure board dimensions
function isBoardMatrix(board: number[][]): board is BoardMatrix {
  return board.length === BOARD_HEIGHT && board.every((row) => row.length === BOARD_WIDTH);
}

/**
 * Creates an empty game board with proper validation
 * @throws {BoardError} When board dimensions are invalid
 */
export function createEmptyBoard(): BoardMatrix {
  const board = Array(BOARD_HEIGHT)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(0));

  if (!isBoardMatrix(board)) {
    throw new BoardError(
      ERROR_CODES.INVALID_BOARD_DIMENSIONS,
      `Failed to create board with dimensions ${BOARD_WIDTH}x${BOARD_HEIGHT}`,
      {
        expectedWidth: BOARD_WIDTH,
        expectedHeight: BOARD_HEIGHT,
        actualWidth: board[0]?.length || 0,
        actualHeight: board.length,
      },
      false,
    );
  }

  return board;
}

/**
 * Validates if a tetromino piece can be placed at the given position
 * @param board Game board matrix
 * @param shape Tetromino shape matrix
 * @param position Target position
 * @returns true if position is valid, false otherwise
 * @throws {ValidationError} When parameters are invalid
 */
export function isValidPosition(
  board: BoardMatrix,
  shape: number[][],
  position: Position,
): boolean {
  // Validate parameters
  if (!board || !Array.isArray(board)) {
    const { ValidationError } = require("../types/errors");
    throw new ValidationError(
      ERROR_CODES.INVALID_INPUT_PARAMETER,
      "Board parameter must be a valid BoardMatrix",
      { board },
      false,
    );
  }

  if (!shape || !Array.isArray(shape) || shape.length === 0) {
    const { ValidationError } = require("../types/errors");
    throw new ValidationError(
      ERROR_CODES.INVALID_INPUT_PARAMETER,
      "Shape parameter must be a non-empty 2D array",
      { shape },
      false,
    );
  }

  if (!position || typeof position.x !== "number" || typeof position.y !== "number") {
    const { ValidationError } = require("../types/errors");
    throw new ValidationError(
      ERROR_CODES.INVALID_INPUT_PARAMETER,
      "Position must have valid x and y coordinates",
      { position },
      false,
    );
  }

  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        const boardX = position.x + x;
        const boardY = position.y + y;

        if (
          boardX < 0 ||
          boardX >= BOARD_WIDTH ||
          boardY < 0 ||
          boardY >= BOARD_HEIGHT ||
          board[boardY]?.[boardX]
        ) {
          return false;
        }
      }
    }
  }
  return true;
}

/**
 * Places a tetromino piece on the board at the specified position
 * @param board Game board matrix
 * @param shape Tetromino shape matrix
 * @param position Target position
 * @param colorIndex Color index for the piece (1-7)
 * @returns New board with the piece placed
 * @throws {ValidationError} When parameters are invalid
 * @throws {PieceError} When piece placement fails
 */
export function placeTetromino(
  board: BoardMatrix,
  shape: number[][],
  position: Position,
  colorIndex: number,
): BoardMatrix {
  // Validate color index
  if (!Number.isInteger(colorIndex) || colorIndex < 1 || colorIndex > 7) {
    const { ValidationError } = require("../types/errors");
    throw new ValidationError(
      ERROR_CODES.INVALID_INPUT_PARAMETER,
      `Color index must be between 1 and 7, got ${colorIndex}`,
      { colorIndex },
      false,
    );
  }

  // Validate that the position is valid before placing
  if (!isValidPosition(board, shape, position)) {
    const { PieceError } = require("../types/errors");
    throw new PieceError(
      ERROR_CODES.PIECE_PLACEMENT_FAILED,
      "Cannot place piece at invalid position",
      { position, shape, boardState: "occupied" },
      false,
    );
  }

  try {
    const newBoard = board.map((row) => [...row]) as BoardMatrix;

    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const boardY = position.y + y;
          const boardX = position.x + x;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = colorIndex;
          }
        }
      }
    }

    return newBoard;
  } catch (error) {
    const { PieceError } = require("../types/errors");
    throw new PieceError(
      ERROR_CODES.PIECE_PLACEMENT_FAILED,
      "Failed to place tetromino on board",
      { position, shape, colorIndex, originalError: error },
      false,
    );
  }
}

/**
 * Clears completed lines from the board and returns the updated board
 * @param board Game board matrix
 * @returns Object containing the updated board, number of lines cleared, and indices of cleared lines
 * @throws {ValidationError} When board parameter is invalid
 * @throws {BoardError} When line clearing operation fails
 */
export function clearLines(board: BoardMatrix): {
  board: BoardMatrix;
  linesCleared: number;
  clearedLineIndices: number[];
} {
  // Validate board parameter
  if (!board || !Array.isArray(board) || !isBoardMatrix(board)) {
    const { ValidationError } = require("../types/errors");
    throw new ValidationError(
      ERROR_CODES.INVALID_INPUT_PARAMETER,
      "Board parameter must be a valid BoardMatrix",
      { board },
      false,
    );
  }

  try {
    // Use ES2024 array methods for better performance
    const clearedLineIndices = board
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.every((cell) => cell !== 0))
      .map(({ index }) => index);

    if (clearedLineIndices.length === 0) {
      return { board, linesCleared: 0, clearedLineIndices: [] };
    }

    // Create new board using modern array methods
    const remainingRows = board.filter((_, index) => !clearedLineIndices.includes(index));
    const emptyRows = Array.from({ length: clearedLineIndices.length }, () =>
      Array(BOARD_WIDTH).fill(0),
    );
    const newBoard = [...emptyRows, ...remainingRows] as BoardMatrix;

    // Validate the resulting board
    if (!isBoardMatrix(newBoard)) {
      const { BoardError } = require("../types/errors");
      throw new BoardError(
        ERROR_CODES.INVALID_BOARD_STATE,
        "Board state became invalid after line clearing",
        {
          originalBoard: board,
          clearedLineIndices,
          newBoard,
        },
        false,
      );
    }

    return {
      board: newBoard,
      linesCleared: clearedLineIndices.length,
      clearedLineIndices,
    };
  } catch (error) {
    // If error is already a game error, re-throw it
    if (
      error instanceof Error &&
      (error.name === "ValidationError" || error.name === "BoardError")
    ) {
      throw error;
    }

    // Convert unexpected errors to BoardError
    const { BoardError } = require("../types/errors");
    throw new BoardError(
      ERROR_CODES.INVALID_BOARD_STATE,
      "Unexpected error during line clearing operation",
      { originalError: error },
      false,
    );
  }
}

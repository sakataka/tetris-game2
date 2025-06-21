import type { BoardMatrix, Position } from "../types/game";
import { BOARD_HEIGHT, BOARD_WIDTH } from "../utils/constants";

// Type guard to ensure board dimensions
function isBoardMatrix(board: number[][]): board is BoardMatrix {
  return board.length === BOARD_HEIGHT && board.every((row) => row.length === BOARD_WIDTH);
}

export function createEmptyBoard(): BoardMatrix {
  const board = Array(BOARD_HEIGHT)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(0));

  if (!isBoardMatrix(board)) {
    throw new Error("Invalid board dimensions");
  }

  return board;
}

export function isValidPosition(
  board: BoardMatrix,
  shape: number[][],
  position: Position,
): boolean {
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

export function placeTetromino(
  board: BoardMatrix,
  shape: number[][],
  position: Position,
  colorIndex: number,
): BoardMatrix {
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
}

export function clearLines(board: BoardMatrix): {
  board: BoardMatrix;
  linesCleared: number;
  clearedLineIndices: number[];
} {
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

  return {
    board: newBoard,
    linesCleared: clearedLineIndices.length,
    clearedLineIndices,
  };
}

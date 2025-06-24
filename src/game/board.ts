import type { BoardMatrix, Position } from "../types/game";
import { BOARD_HEIGHT, BOARD_WIDTH } from "../utils/constants";

export function createEmptyBoard(): BoardMatrix {
  return Array(BOARD_HEIGHT)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(0)) as BoardMatrix;
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

/**
 * Helper function to iterate over each filled cell of a tetromino piece
 * Calls the callback for each filled cell with board coordinates
 */
export function forEachPieceCell(
  shape: number[][],
  position: Position,
  callback: (boardX: number, boardY: number, shapeX: number, shapeY: number) => void,
): void {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        const boardY = position.y + y;
        const boardX = position.x + x;
        callback(boardX, boardY, x, y);
      }
    }
  }
}

export function placeTetromino(
  board: BoardMatrix,
  shape: number[][],
  position: Position,
  colorIndex: number,
): BoardMatrix {
  const newBoard = board.map((row) => [...row]) as BoardMatrix;

  forEachPieceCell(shape, position, (boardX, boardY) => {
    if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
      newBoard[boardY][boardX] = colorIndex;
    }
  });

  return newBoard;
}

export function clearLines(board: BoardMatrix): {
  board: BoardMatrix;
  linesCleared: number;
  clearedLineIndices: number[];
} {
  const clearedLineIndices = board
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.every((cell) => cell !== 0))
    .map(({ index }) => index);

  if (clearedLineIndices.length === 0) {
    return { board, linesCleared: 0, clearedLineIndices: [] };
  }

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

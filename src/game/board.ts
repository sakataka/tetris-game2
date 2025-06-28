import type { CellValue, GameBoard, Position } from "@/types/game";
import { isValidBoardPosition } from "@/utils/boardUtils";
import { GAME_CONSTANTS } from "@/utils/gameConstants";

export function createEmptyBoard(): GameBoard {
  return Array(GAME_CONSTANTS.BOARD.HEIGHT)
    .fill(null)
    .map(() => Array(GAME_CONSTANTS.BOARD.WIDTH).fill(0)) as GameBoard;
}

export function isValidPosition(board: GameBoard, shape: number[][], position: Position): boolean {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        const boardX = position.x + x;
        const boardY = position.y + y;

        if (
          boardX < 0 ||
          boardX >= GAME_CONSTANTS.BOARD.WIDTH ||
          boardY < 0 ||
          boardY >= GAME_CONSTANTS.BOARD.HEIGHT ||
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
  board: GameBoard,
  shape: CellValue[][],
  position: Position,
  colorIndex: CellValue,
): GameBoard {
  const newBoard = board.map((row) => [...row]) as GameBoard;

  forEachPieceCell(shape, position, (boardX, boardY) => {
    if (isValidBoardPosition({ x: boardX, y: boardY })) {
      newBoard[boardY][boardX] = colorIndex;
    }
  });

  return newBoard;
}

export function clearLines(board: GameBoard): {
  board: GameBoard;
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
    Array(GAME_CONSTANTS.BOARD.WIDTH).fill(0),
  );
  const newBoard = [...emptyRows, ...remainingRows] as GameBoard;

  return {
    board: newBoard,
    linesCleared: clearedLineIndices.length,
    clearedLineIndices,
  };
}

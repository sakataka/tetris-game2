import type { CellValue, GameBoard, Position, TetrominoShape } from "../types/game";
import { isValidBoardPosition } from "../utils/boardUtils";
import { GAME_CONSTANTS } from "../utils/gameConstants";

export function createEmptyBoard(): GameBoard {
  // Defensive checks for CI environment compatibility
  if (!GAME_CONSTANTS || !GAME_CONSTANTS.BOARD) {
    throw new Error("GAME_CONSTANTS or GAME_CONSTANTS.BOARD is undefined");
  }

  const height = GAME_CONSTANTS.BOARD.HEIGHT;
  const width = GAME_CONSTANTS.BOARD.WIDTH;

  // Ensure constants are valid numbers
  if (typeof height !== "number" || typeof width !== "number" || height <= 0 || width <= 0) {
    throw new Error(`Invalid board dimensions: height=${height}, width=${width}`);
  }

  return Array.from({ length: height }, () => Array.from({ length: width }, () => 0 as CellValue));
}

export function isValidPosition(
  board: GameBoard,
  shape: TetrominoShape,
  position: Position,
): boolean {
  return shape.every((row, y) =>
    row.every((cell, x) => {
      if (!cell) return true;
      const boardX = position.x + x;
      const boardY = position.y + y;

      // Check boundaries first
      if (
        boardX < 0 ||
        boardX >= GAME_CONSTANTS.BOARD.WIDTH ||
        boardY < 0 ||
        boardY >= GAME_CONSTANTS.BOARD.HEIGHT
      ) {
        return false;
      }

      // Check collision with existing pieces
      return !board[boardY][boardX];
    }),
  );
}

/**
 * Helper function to iterate over each filled cell of a tetromino piece
 * Calls the callback for each filled cell with board coordinates
 */
export function forEachPieceCell(
  shape: TetrominoShape,
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
  shape: TetrominoShape,
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
    .map((row, i) => (row.every((cell) => cell !== 0) ? i : -1))
    .filter((i) => i !== -1);

  if (clearedLineIndices.length === 0) {
    // Return deep copy to preserve immutability
    const newBoard = board.map((row) => [...row]) as GameBoard;
    return { board: newBoard, linesCleared: 0, clearedLineIndices: [] };
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

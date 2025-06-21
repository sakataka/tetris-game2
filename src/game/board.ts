import { BOARD_HEIGHT, BOARD_WIDTH, type Position } from "../types/game";

export function createEmptyBoard(): number[][] {
  return Array(BOARD_HEIGHT)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(0));
}

export function isValidPosition(board: number[][], shape: number[][], position: Position): boolean {
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
  board: number[][],
  shape: number[][],
  position: Position,
  colorIndex: number,
): number[][] {
  const newBoard = board.map((row) => [...row]);

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

export function clearLines(board: number[][]): {
  board: number[][];
  linesCleared: number;
  clearedLineIndices: number[];
} {
  const newBoard = board.map((row) => [...row]);
  const clearedLineIndices: number[] = [];

  // Find all complete lines
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    if (newBoard[y].every((cell) => cell !== 0)) {
      clearedLineIndices.push(y);
    }
  }

  // Remove complete lines and create new board with proper gravity
  const remainingRows = newBoard.filter((_, y) => !clearedLineIndices.includes(y));

  // Add empty rows at the top to maintain board height
  const emptyRows = Array(clearedLineIndices.length)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(0));

  const finalBoard = [...emptyRows, ...remainingRows];

  return {
    board: finalBoard,
    linesCleared: clearedLineIndices.length,
    clearedLineIndices,
  };
}

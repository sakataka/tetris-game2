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
  const clearedLineIndices: number[] = [];
  board.forEach((row, y) => {
    if (row.every((cell) => cell !== 0)) {
      clearedLineIndices.push(y);
    }
  });

  if (clearedLineIndices.length === 0) {
    return { board, linesCleared: 0, clearedLineIndices: [] };
  }

  // 新しい空のボードを作成
  const newBoard = createEmptyBoard();
  let newBoardRowIndex = BOARD_HEIGHT - 1;

  // 元のボードを下から上に走査する
  for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
    // 消去対象でない行の場合
    if (!clearedLineIndices.includes(y)) {
      // 新しいボードの下から詰めていく（深いコピーで配列参照を避ける）
      newBoard[newBoardRowIndex] = [...board[y]];
      newBoardRowIndex--;
    }
  }

  return {
    board: newBoard,
    linesCleared: clearedLineIndices.length,
    clearedLineIndices,
  };
}

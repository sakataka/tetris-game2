import type { CellValue, Tetromino, TetrominoShape, TetrominoTypeName } from "@/types/game";
import { GAME_CONSTANTS } from "@/utils/gameConstants";

// Type-safe color index mapping
export const TETROMINO_COLOR_MAP = {
  I: 1,
  O: 2,
  T: 3,
  S: 4,
  Z: 5,
  J: 6,
  L: 7,
} as const satisfies Record<TetrominoTypeName, CellValue>;

export function getTetrominoColorIndex(type: TetrominoTypeName): CellValue {
  return TETROMINO_COLOR_MAP[type];
}

export const TETROMINOS: Record<TetrominoTypeName, TetrominoShape> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

export function getTetrominoShape(type: TetrominoTypeName): TetrominoShape {
  return TETROMINOS[type].map((row) => [...row]);
}

export const rotateTetromino = (shape: TetrominoShape): TetrominoShape =>
  shape[0].map((_, i) => shape.map((row) => row[i]).reverse());

export function createTetromino(type: TetrominoTypeName): Tetromino {
  const shape = getTetrominoShape(type);
  return {
    type,
    position: {
      x: Math.floor(GAME_CONSTANTS.BOARD.WIDTH / 2) - Math.floor(shape[0].length / 2),
      y: 0,
    },
    rotation: 0,
    shape,
  };
}

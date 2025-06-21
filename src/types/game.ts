export type TetrominoType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

export interface Position {
  x: number;
  y: number;
}

export interface Tetromino {
  type: TetrominoType;
  position: Position;
  rotation: number;
  shape: number[][];
}

export interface GameState {
  board: number[][];
  currentPiece: Tetromino | null;
  nextPiece: TetrominoType;
  score: number;
  lines: number;
  level: number;
  isGameOver: boolean;
  isPaused: boolean;
  placedPositions: Position[];
  clearingLines: number[];
  rotationKey: number;
}

export const TETROMINO_TYPES: TetrominoType[] = ["I", "O", "T", "S", "Z", "J", "L"];

export function getTetrominoColorIndex(type: TetrominoType): number {
  const colorIndices = [1, 2, 3, 4, 5, 6, 7];
  return colorIndices[TETROMINO_TYPES.indexOf(type)];
}

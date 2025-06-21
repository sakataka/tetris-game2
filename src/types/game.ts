// Discriminated union for tetromino types
export type TetrominoType =
  | { type: "I"; colorIndex: 1 }
  | { type: "O"; colorIndex: 2 }
  | { type: "T"; colorIndex: 3 }
  | { type: "S"; colorIndex: 4 }
  | { type: "Z"; colorIndex: 5 }
  | { type: "J"; colorIndex: 6 }
  | { type: "L"; colorIndex: 7 };

export type TetrominoTypeName = TetrominoType["type"];

export interface Position {
  x: number;
  y: number;
}

export interface Tetromino {
  type: TetrominoTypeName;
  position: Position;
  rotation: number;
  shape: number[][];
}

// Board matrix type for better type safety
export type BoardMatrix = number[][];

// Game status type for pattern matching
export type GameStatus =
  | { type: "playing" }
  | { type: "paused" }
  | { type: "gameOver"; finalScore: number };

export interface GameState {
  board: BoardMatrix;
  currentPiece: Tetromino | null;
  nextPiece: TetrominoTypeName;
  score: number;
  lines: number;
  level: number;
  isGameOver: boolean;
  isPaused: boolean;
  placedPositions: Position[];
  clearingLines: number[];
  rotationKey: number;
}

export const TETROMINO_TYPES: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];

// Type-safe color index mapping
export const TETROMINO_COLOR_MAP = {
  I: 1,
  O: 2,
  T: 3,
  S: 4,
  Z: 5,
  J: 6,
  L: 7,
} as const satisfies Record<TetrominoTypeName, number>;

export function getTetrominoColorIndex(type: TetrominoTypeName): number {
  return TETROMINO_COLOR_MAP[type];
}

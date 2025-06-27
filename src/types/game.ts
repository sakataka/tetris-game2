/**
 * Union type for tetromino piece names.
 * Color indices are managed separately via TETROMINO_COLOR_MAP.
 */
export type TetrominoTypeName = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

/**
 * Type-safe rotation states (0=spawn, 1=right, 2=180, 3=left)
 */
export type RotationState = 0 | 1 | 2 | 3;

/**
 * All tetromino piece types as a const array for better type inference
 */
export const TETROMINO_TYPES = ["I", "O", "T", "S", "Z", "J", "L"] as const;

/**
 * Cell values for board matrix (0=empty, 1-7=tetromino color indices)
 */
export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Animation trigger key for board cell animations
 */
export type AnimationTriggerKey = number | `animation-${number}`;

/**
 * Represents a 2D coordinate position on the game board.
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Represents a falling tetromino piece with its current state.
 */
export interface Tetromino {
  type: TetrominoTypeName;
  position: Position;
  rotation: RotationState; // Type-safe rotation states
  shape: CellValue[][]; // 2D matrix representing the piece shape with type-safe values
}

/**
 * 2D matrix representing the game board where each cell contains:
 * 0 = empty, 1-7 = tetromino color indices
 */
export type BoardMatrix = CellValue[][];

/**
 * Complete game state containing all information needed to render and update the game.
 */
export interface GameState {
  board: BoardMatrix;
  boardBeforeClear: BoardMatrix | null; // Board state before line clearing for animation
  currentPiece: Tetromino | null;
  nextPiece: TetrominoTypeName;
  heldPiece: TetrominoTypeName | null;
  canHold: boolean;
  score: number;
  lines: number;
  level: number;
  isGameOver: boolean;
  isPaused: boolean;
  placedPositions: Position[];
  clearingLines: number[];
  animationTriggerKey: AnimationTriggerKey;
  ghostPosition: Position | null;
  pieceBag: TetrominoTypeName[]; // 7-Bag system: current bag state
}

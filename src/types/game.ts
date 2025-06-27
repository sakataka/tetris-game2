/**
 * Union type for tetromino piece names.
 * Color indices are managed separately via TETROMINO_COLOR_MAP.
 */
export type TetrominoTypeName = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

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
  rotation: number; // 0-3, representing 90-degree rotations
  shape: number[][]; // 2D matrix representing the piece shape
}

/**
 * 2D matrix representing the game board where each cell contains:
 * 0 = empty, 1-7 = tetromino color indices
 */
export type BoardMatrix = number[][];

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
  animationTriggerKey: number;
  ghostPosition: Position | null;
  pieceBag: TetrominoTypeName[]; // 7-Bag system: current bag state
}

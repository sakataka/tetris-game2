/**
 * Discriminated union type for tetromino pieces with their associated color indices.
 * Each piece type has a unique shape and color representation.
 */
export type TetrominoType =
  | { type: "I"; colorIndex: 1 }
  | { type: "O"; colorIndex: 2 }
  | { type: "T"; colorIndex: 3 }
  | { type: "S"; colorIndex: 4 }
  | { type: "Z"; colorIndex: 5 }
  | { type: "J"; colorIndex: 6 }
  | { type: "L"; colorIndex: 7 };

export type TetrominoTypeName = TetrominoType["type"];

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
  showGhostPiece: boolean;
  pieceBag: TetrominoTypeName[]; // 7-Bag system: current bag state
}

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
 * Cell values for board matrix (0=empty, 1-9=tetromino color indices)
 * Extended to 0-9 for future expansion support
 */
export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/**
 * Type-safe tetromino shape matrix
 */
export type TetrominoShape = CellValue[][];

/**
 * Animation trigger for board cell animations
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
  shape: TetrominoShape; // Type-safe tetromino shape matrix
}

/**
 * 2D matrix representing the game board where each cell contains:
 * 0 = empty, 1-7 = tetromino color indices
 */
export type GameBoard = CellValue[][];

/**
 * Game animation state machine states
 */
export type GameAnimationState =
  | "idle" // Normal gameplay
  | "line-clearing" // Line clear animation in progress
  | "line-falling" // Gravity animation in progress
  | "piece-placing"; // Piece placement animation in progress

/**
 * Data for line clear animation
 */
export interface LineClearAnimationData {
  readonly clearedLineIndices: readonly number[];
  readonly animationStartTime: number;
  readonly expectedDuration: number;
  readonly lineCount: 1 | 2 | 3 | 4; // Single/Double/Triple/Tetris
}

/**
 * Animation controller interface (placeholder for future implementation)
 */
export interface AnimationController {
  // To be implemented based on specific animation library needs
  [key: string]: unknown;
}

/**
 * Complete game state containing all information needed to render and update the game.
 */
export interface GameState {
  board: GameBoard;
  boardBeforeClear: GameBoard | null; // Board state before line clearing for animation
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
  pieceBag: TetrominoTypeName[]; // 7-Bag system: current bag state (legacy format for compatibility)
}

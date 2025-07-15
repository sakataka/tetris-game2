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
 * Complete game state containing all information needed to render and update the game.
 */
/**
 * T-Spin detection and display information
 */
export interface TSpinState {
  type: "none" | "mini" | "normal";
  show: boolean;
  linesCleared: number;
  rotationResult: unknown | null; // RotationResult from the last rotation
}

/**
 * Combo state for consecutive line clears
 */
export interface ComboState {
  count: number; // Current combo count (0 = no combo)
  isActive: boolean; // Whether combo is currently active
  lastClearType: "single" | "double" | "triple" | "tetris" | "tspin" | null;
}

/**
 * Score animation data for enhanced feedback
 */
export interface ScoreAnimationState {
  previousScore: number;
  scoreIncrease: number;
  lineCount: number;
  clearType: "single" | "double" | "triple" | "tetris" | "tspin" | null;
  isTetris: boolean; // Special effect trigger
  animationTriggerTime: number;
}

/**
 * Floating score text event data
 */
export interface FloatingScoreEvent {
  id: string;
  points: number;
  position: Position;
  startTime: number;
  isActive: boolean;
}

/**
 * Level celebration state and configuration
 */
export interface LevelCelebrationState {
  isActive: boolean; // Whether celebration is currently showing
  level: number | null; // The level that was reached
  startTime: number | null; // When the celebration started
  phase: "intro" | "main" | "outro" | "completed"; // Current celebration phase
  userCancelled: boolean; // Whether user cancelled the celebration
}

export interface GameState {
  board: GameBoard;
  boardBeforeClear: GameBoard | null; // Board state before line clearing for animation
  currentPiece: Tetromino | null;
  ghostPiece: Tetromino | null; // Ghost piece for preview
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
  tSpinState: TSpinState; // T-Spin detection and display state
  comboState: ComboState; // Combo tracking for consecutive line clears
  scoreAnimationState: ScoreAnimationState; // Enhanced score feedback data
  floatingScoreEvents: FloatingScoreEvent[]; // Active floating score text events
  levelCelebrationState: LevelCelebrationState; // Level celebration system state
}

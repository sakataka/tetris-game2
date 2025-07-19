import { TETROMINOS } from "@/game/tetrominos";
import type {
  CellValue,
  ComboState,
  GameBoard,
  GameState,
  Position,
  RotationState,
  ScoreAnimationState,
  Tetromino,
  TetrominoTypeName,
  TSpinState,
} from "@/types/game";
import { GAME_CONSTANTS } from "@/utils/gameConstants";

/**
 * Creates a mock Position with default values
 */
export const createPosition = (overrides: Partial<Position> = {}): Position => ({
  x: 4,
  y: 0,
  ...overrides,
});

/**
 * Creates a mock Tetromino with default values
 */
export const createTetromino = (overrides: Partial<Tetromino> = {}): Tetromino => {
  const type: TetrominoTypeName = overrides.type ?? "T";
  return {
    type,
    position: createPosition(overrides.position),
    rotation: (overrides.rotation ?? 0) as RotationState,
    shape: overrides.shape ?? TETROMINOS[type],
    ...overrides,
  };
};

/**
 * Creates a mock GameBoard with default empty state
 */
export const createGameBoard = (
  overrides: Partial<{
    width: number;
    height: number;
    fillPattern?: "empty" | "full" | "random" | "bottom-heavy";
    customCells?: Array<{ x: number; y: number; value: CellValue }>;
  }> = {},
): GameBoard => {
  const width = overrides.width ?? GAME_CONSTANTS.BOARD.WIDTH;
  const height = overrides.height ?? GAME_CONSTANTS.BOARD.HEIGHT;
  const fillPattern = overrides.fillPattern ?? "empty";

  // Create base empty board
  const board: GameBoard = Array(height)
    .fill(null)
    .map(() => Array(width).fill(0) as CellValue[]);

  // Apply fill pattern
  switch (fillPattern) {
    case "full":
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          board[y][x] = 1;
        }
      }
      break;
    case "random":
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          board[y][x] =
            Math.random() > 0.7 ? ((Math.floor(Math.random() * 7) + 1) as CellValue) : 0;
        }
      }
      break;
    case "bottom-heavy":
      for (let y = Math.floor(height * 0.6); y < height; y++) {
        for (let x = 0; x < width; x++) {
          board[y][x] =
            Math.random() > 0.3 ? ((Math.floor(Math.random() * 7) + 1) as CellValue) : 0;
        }
      }
      break;
  }

  // Apply custom cells
  if (overrides.customCells) {
    overrides.customCells.forEach(({ x, y, value }) => {
      if (y >= 0 && y < height && x >= 0 && x < width) {
        board[y][x] = value;
      }
    });
  }

  return board;
};

/**
 * Creates a mock TSpinState with default values
 */
export const createTSpinState = (overrides: Partial<TSpinState> = {}): TSpinState => ({
  type: "none",
  show: false,
  linesCleared: 0,
  rotationResult: null,
  ...overrides,
});

/**
 * Creates a mock ComboState with default values
 */
export const createComboState = (overrides: Partial<ComboState> = {}): ComboState => ({
  count: 0,
  isActive: false,
  lastClearType: null,
  ...overrides,
});

/**
 * Creates a mock ScoreAnimationState with default values
 */
export const createScoreAnimationState = (
  overrides: Partial<ScoreAnimationState> = {},
): ScoreAnimationState => ({
  previousScore: 0,
  scoreIncrease: 0,
  lineCount: 0,
  clearType: null,
  isTetris: false,
  animationTriggerTime: Date.now(),
  ...overrides,
});

/**
 * Creates a mock GameState with default values
 */
export const createGameState = (overrides: Partial<GameState> = {}): GameState => ({
  board: createGameBoard(),
  boardBeforeClear: null,
  currentPiece: createTetromino(),
  ghostPiece: null,
  nextPiece: "I",
  heldPiece: null,
  canHold: true,
  score: 0,
  lines: 0,
  level: 1,
  isGameOver: false,
  isPaused: false,
  placedPositions: [],
  clearingLines: [],
  animationTriggerKey: 0,
  ghostPosition: null,
  pieceBag: ["I", "O", "T", "S", "Z", "J", "L"],
  tSpinState: createTSpinState(),
  comboState: createComboState(),
  scoreAnimationState: createScoreAnimationState(),
  floatingScoreEvents: [],
  levelCelebrationState: {
    isActive: false,
    level: null,
    startTime: null,
    phase: "completed",
    userCancelled: false,
  },
  ...overrides,
});

import { createEmptyBoard } from "../../game/board";
import { createTetromino } from "../../game/tetrominos";
import type {
  AnimationTriggerKey,
  GameState,
  Position,
  Tetromino,
  TetrominoTypeName,
} from "../../types/game";

/**
 * Creates a test game state with default values and optional overrides
 */
export const createTestGameState = (overrides: Partial<GameState> = {}): GameState => {
  const defaultState: GameState = {
    board: createEmptyBoard(),
    boardBeforeClear: null,
    currentPiece: createTetromino("T"),
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
    animationTriggerKey: 0 as AnimationTriggerKey,
    ghostPosition: null,
    pieceBag: ["I", "O", "T", "S", "Z", "J", "L"],
  };

  return { ...defaultState, ...overrides };
};

/**
 * Creates a mock tetromino with specified type and optionally modify position
 */
export const createMockTetromino = (type: TetrominoTypeName, position?: Position): Tetromino => {
  const tetromino = createTetromino(type);
  if (position) {
    return { ...tetromino, position };
  }
  return tetromino;
};

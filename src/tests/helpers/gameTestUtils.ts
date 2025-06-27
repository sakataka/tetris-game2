import { createEmptyBoard } from "../../game/board";
import { createTetromino } from "../../game/tetrominos";
import type {
  AnimationTriggerKey,
  CellValue,
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

/**
 * Creates a board filled with specific pattern for testing
 */
export const createTestBoard = (pattern: CellValue[][] = []): CellValue[][] => {
  const board = createEmptyBoard();

  for (let y = 0; y < pattern.length; y++) {
    for (let x = 0; x < pattern[y].length; x++) {
      if (y < board.length && x < board[0].length) {
        board[y][x] = pattern[y][x];
      }
    }
  }

  return board;
};

/**
 * Creates a board with filled bottom rows for line clearing tests
 */
export const createBoardWithLines = (filledRows: number[]): CellValue[][] => {
  const board = createEmptyBoard();
  const boardHeight = board.length;

  filledRows.forEach((rowIndex) => {
    if (rowIndex >= 0 && rowIndex < boardHeight) {
      board[rowIndex] = Array(board[0].length).fill(1 as CellValue);
    }
  });

  return board;
};

/**
 * Utility to check if two positions are equal
 */
export const positionsEqual = (pos1: Position, pos2: Position): boolean => {
  return pos1.x === pos2.x && pos1.y === pos2.y;
};

/**
 * Creates positions array for testing
 */
export const createTestPositions = (coords: Array<[number, number]>): Position[] => {
  return coords.map(([x, y]) => ({ x, y }));
};

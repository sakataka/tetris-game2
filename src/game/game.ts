import type { BoardMatrix, GameState, Position, Tetromino, TetrominoTypeName } from "../types/game";
import {
  BASE_SCORES,
  DROP_POSITION_MAX_ITERATIONS,
  INITIAL_DROP_SPEED_MS,
  LINES_PER_LEVEL,
  MAX_ROTATION_STATE,
  MIN_DROP_SPEED_MS,
  SPEED_DECREASE_PER_LEVEL,
} from "../utils/constants";
import {
  clearLines,
  createEmptyBoard,
  forEachPieceCell,
  isValidPosition,
  placeTetromino,
} from "./board";
import { createPieceBagManager } from "./pieceBag";
import { createTetromino, getTetrominoColorIndex, rotateTetromino } from "./tetrominos";
import { tryRotateWithWallKick } from "./wallKick";

export function createInitialGameState(): GameState {
  const pieceBagManager = createPieceBagManager();
  const currentType = pieceBagManager.getNextPiece();
  const nextType = pieceBagManager.getNextPiece();

  const state = {
    board: createEmptyBoard(),
    boardBeforeClear: null,
    currentPiece: createTetromino(currentType),
    nextPiece: nextType,
    heldPiece: null as TetrominoTypeName | null,
    canHold: true,
    score: 0,
    lines: 0,
    level: 1,
    isGameOver: false,
    isPaused: false,
    placedPositions: [],
    clearingLines: [],
    animationTriggerKey: 0,
    ghostPosition: null as Position | null,
    pieceBag: pieceBagManager.getBag(),
  };

  // Calculate initial ghost position
  state.ghostPosition = calculateGhostPosition(state);
  return state;
}

export function moveTetrominoBy(state: GameState, dx: number, dy: number): GameState {
  if (!state.currentPiece || state.isGameOver || state.isPaused) return state;

  const newPosition = {
    x: state.currentPiece.position.x + dx,
    y: state.currentPiece.position.y + dy,
  };

  if (isValidPosition(state.board, state.currentPiece.shape, newPosition)) {
    return updateGhostPosition({
      ...state,
      currentPiece: {
        ...state.currentPiece,
        position: newPosition,
      },
    });
  }

  // If moving down failed, lock the piece
  if (dy > 0) {
    return lockCurrentTetromino(state);
  }

  return state;
}

export function rotateTetrominoCW(state: GameState): GameState {
  if (!state.currentPiece || state.isGameOver || state.isPaused) return state;

  const currentPiece = state.currentPiece;
  const rotatedShape = rotateTetromino(currentPiece.shape);
  const fromRotation = currentPiece.rotation;
  const toRotation = (fromRotation + 1) % (MAX_ROTATION_STATE + 1);

  // Try rotation with wall kick compensation
  const newPosition = tryRotateWithWallKick(
    state.board,
    rotatedShape,
    currentPiece.position,
    currentPiece.type,
    fromRotation,
    toRotation,
    isValidPosition,
  );

  if (newPosition) {
    return updateGhostPosition({
      ...state,
      currentPiece: {
        ...currentPiece,
        shape: rotatedShape,
        rotation: toRotation,
        position: newPosition,
      },
      animationTriggerKey: state.animationTriggerKey + 1,
    });
  }

  return state;
}

/**
 * Find the lowest valid position where a tetromino can be placed when dropped
 * This is used by both hard drop and ghost piece calculations
 */
function _findDropPosition(
  board: BoardMatrix,
  shape: number[][],
  startPosition: Position,
): Position {
  let dropPosition = startPosition;

  // Move down until we can't anymore (with safety limit to prevent infinite loop)
  let iterations = 0;

  while (iterations < DROP_POSITION_MAX_ITERATIONS) {
    const nextPosition = {
      x: dropPosition.x,
      y: dropPosition.y + 1,
    };

    if (isValidPosition(board, shape, nextPosition)) {
      dropPosition = nextPosition;
      iterations++;
    } else {
      break;
    }
  }

  return dropPosition;
}

export function hardDropTetromino(state: GameState): GameState {
  if (!state.currentPiece || state.isGameOver || state.isPaused) return state;

  const currentPiece = state.currentPiece;
  const finalPosition = _findDropPosition(state.board, currentPiece.shape, currentPiece.position);

  // Update the piece position to the final position
  const newState = {
    ...state,
    currentPiece: {
      ...currentPiece,
      position: finalPosition,
    },
  };

  // Lock the piece at the final position
  return lockCurrentTetromino(newState);
}

/**
 * Result types for piece locking operations
 */
type PieceLockResult = {
  board: BoardMatrix;
  placedPositions: Position[];
};

type LineClearResult = {
  board: BoardMatrix;
  score: number;
  lines: number;
  level: number;
  clearingLines: number[];
};

type PieceSpawnResult = {
  currentPiece: Tetromino | null;
  nextPiece: TetrominoTypeName;
  isGameOver: boolean;
  pieceBag: TetrominoTypeName[];
};

/**
 * Records the positions where a piece will be placed for animation purposes
 */
function recordPlacedPositions(currentPiece: Tetromino): Position[] {
  const positions: Position[] = [];
  forEachPieceCell(currentPiece.shape, currentPiece.position, (boardX, boardY) => {
    positions.push({ x: boardX, y: boardY });
  });
  return positions;
}

/**
 * Locks a piece onto the board and returns the updated board and piece positions
 */
function lockPieceOnBoard(state: GameState): PieceLockResult {
  if (!state.currentPiece) {
    return { board: state.board, placedPositions: [] };
  }

  const colorIndex = getTetrominoColorIndex(state.currentPiece.type);
  const placedPositions = recordPlacedPositions(state.currentPiece);
  const newBoard = placeTetromino(
    state.board,
    state.currentPiece.shape,
    state.currentPiece.position,
    colorIndex,
  );

  return { board: newBoard, placedPositions };
}

/**
 * Handles line clearing logic and score calculation
 */
function processLineClearing(
  board: BoardMatrix,
  currentScore: number,
  currentLines: number,
  currentLevel: number,
): LineClearResult {
  const { board: clearedBoard, linesCleared, clearedLineIndices } = clearLines(board);
  const newLines = currentLines + linesCleared;
  const newLevel = Math.floor(newLines / LINES_PER_LEVEL) + 1;
  const newScore = currentScore + calculateScore(linesCleared, currentLevel);

  return {
    board: clearedBoard,
    score: newScore,
    lines: newLines,
    level: newLevel,
    clearingLines: clearedLineIndices.length > 0 ? clearedLineIndices : [],
  };
}

/**
 * Spawns a new piece and checks for game over conditions
 */
function spawnNextPiece(
  board: BoardMatrix,
  nextPieceType: TetrominoTypeName,
  pieceBag: TetrominoTypeName[],
): PieceSpawnResult {
  const pieceBagManager = createPieceBagManager();
  pieceBagManager.setBag(pieceBag);

  const newPiece = createTetromino(nextPieceType);
  const isGameOver = !isValidPosition(board, newPiece.shape, newPiece.position);
  const newNextPiece = pieceBagManager.getNextPiece();

  return {
    currentPiece: isGameOver ? null : newPiece,
    nextPiece: newNextPiece,
    isGameOver,
    pieceBag: pieceBagManager.getBag(),
  };
}

/**
 * Locks the current tetromino in place, clears complete lines, and spawns the next piece.
 * This is the core game state transition when a piece can no longer move down.
 */
function lockCurrentTetromino(state: GameState): GameState {
  if (!state.currentPiece) return state;

  // Step 1: Lock the piece onto the board
  const { board: boardAfterLock, placedPositions } = lockPieceOnBoard(state);

  // Step 2: Process line clearing and scoring
  const {
    board: boardAfterClear,
    score,
    lines,
    level,
    clearingLines,
  } = processLineClearing(boardAfterLock, state.score, state.lines, state.level);

  // Step 3: Spawn the next piece
  const { currentPiece, nextPiece, isGameOver, pieceBag } = spawnNextPiece(
    boardAfterClear,
    state.nextPiece,
    state.pieceBag,
  );

  // Preserve board state before clearing for animation purposes
  const boardBeforeClear = clearingLines.length > 0 ? boardAfterLock : null;

  // Step 4: Update ghost position and return the new state
  return updateGhostPosition({
    ...state,
    board: boardAfterClear,
    boardBeforeClear,
    currentPiece,
    nextPiece,
    score,
    lines,
    level,
    isGameOver,
    placedPositions,
    clearingLines,
    canHold: true,
    pieceBag,
  });
}

/**
 * Calculates the score based on lines cleared and current level.
 * Uses the classic Tetris scoring system: 1 Line = 100, 2 Lines = 300, 3 Lines = 500, 4 Lines (Tetris) = 800
 * Score is multiplied by the current level for progressive difficulty reward.
 */
export function calculateScore(linesCleared: number, level: number): number {
  return BASE_SCORES[linesCleared] * level;
}

export function getGameSpeed(level: number): number {
  return Math.max(
    MIN_DROP_SPEED_MS,
    INITIAL_DROP_SPEED_MS - (level - 1) * SPEED_DECREASE_PER_LEVEL,
  );
}

/**
 * Calculates the ghost position where the current piece would land if dropped.
 * Returns null if the piece is already at the bottom or no valid position exists.
 */
export function calculateGhostPosition(state: GameState): Position | null {
  if (!state.currentPiece || state.isGameOver) return null;

  const ghostPosition = _findDropPosition(
    state.board,
    state.currentPiece.shape,
    state.currentPiece.position,
  );

  // If ghost position is the same as current position, don't show ghost
  if (ghostPosition.y === state.currentPiece.position.y) {
    return null;
  }

  return ghostPosition;
}

/**
 * Updates the ghost position in the game state
 */
function updateGhostPosition(state: GameState): GameState {
  return {
    ...state,
    ghostPosition: calculateGhostPosition(state),
  };
}

/**
 * Holds the current piece and either swaps it with the held piece or
 * replaces it with the next piece if no piece is currently held.
 * Only allows holding once per piece drop (canHold must be true).
 */
export function holdCurrentPiece(state: GameState): GameState {
  if (!state.currentPiece || !state.canHold || state.isGameOver || state.isPaused) {
    return state;
  }

  const currentPieceType = state.currentPiece.type;

  if (state.heldPiece === null) {
    // Initial hold: save current piece and spawn next piece
    const pieceBagManager = createPieceBagManager();
    pieceBagManager.setBag(state.pieceBag);

    const newCurrentPiece = createTetromino(state.nextPiece);
    const newNextPiece = pieceBagManager.getNextPiece();

    const newState = {
      ...state,
      currentPiece: newCurrentPiece,
      heldPiece: currentPieceType,
      nextPiece: newNextPiece,
      canHold: false,
      pieceBag: pieceBagManager.getBag(),
    };
    return updateGhostPosition(newState);
  }
  // Exchange hold: swap held piece with current piece
  const newCurrentPiece = createTetromino(state.heldPiece);
  const newState = {
    ...state,
    currentPiece: newCurrentPiece,
    heldPiece: currentPieceType,
    canHold: false,
  };
  return updateGhostPosition(newState);
}

import type { BoardMatrix, GameState, Position, Tetromino, TetrominoTypeName } from "../types/game";
import {
  BASE_SCORES,
  DROP_POSITION_MAX_ITERATIONS,
  INITIAL_DROP_SPEED_MS,
  LINES_PER_LEVEL,
  MIN_DROP_SPEED_MS,
  SPEED_DECREASE_PER_LEVEL,
} from "../utils/gameConstants";
import { normalizeRotationState } from "../utils/typeGuards";
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
  const toRotation = normalizeRotationState(fromRotation + 1);

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
      animationTriggerKey:
        typeof state.animationTriggerKey === "number" ? state.animationTriggerKey + 1 : 1,
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
 * Places a piece onto the board and returns the updated board and piece positions
 */
export function placePieceOnBoard(state: GameState): PieceLockResult {
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
export function clearCompletedLines(
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
 * Preserves the board state before clearing for animation purposes
 */
export function preserveBoardForAnimation(
  board: BoardMatrix,
  clearingLines: number[],
): BoardMatrix | null {
  return clearingLines.length > 0 ? board : null;
}

/**
 * Checks if the game is over by testing if a new piece can be placed
 */
export function checkGameOver(board: BoardMatrix, piece: Tetromino): boolean {
  return !isValidPosition(board, piece.shape, piece.position);
}

/**
 * Spawns a new piece and generates the next piece from the bag
 */
export function spawnNextPiece(
  nextPieceType: TetrominoTypeName,
  pieceBag: TetrominoTypeName[],
): { currentPiece: Tetromino; nextPiece: TetrominoTypeName; pieceBag: TetrominoTypeName[] } {
  const pieceBagManager = createPieceBagManager();
  pieceBagManager.setBag(pieceBag);

  const newPiece = createTetromino(nextPieceType);
  const newNextPiece = pieceBagManager.getNextPiece();

  return {
    currentPiece: newPiece,
    nextPiece: newNextPiece,
    pieceBag: pieceBagManager.getBag(),
  };
}

/**
 * Coordinates the piece locking process by calling specialized functions.
 * This is the main coordinator function that handles the complete flow
 * when a piece can no longer move down.
 */
function lockCurrentTetromino(state: GameState): GameState {
  if (!state.currentPiece) return state;

  const newState = state;

  // 1. Place the piece onto the board
  const { board: boardAfterLock, placedPositions } = placePieceOnBoard(newState);

  // 2. Preserve board state for animation purposes
  const {
    board: boardAfterClear,
    score,
    lines,
    level,
    clearingLines,
  } = clearCompletedLines(boardAfterLock, newState.score, newState.lines, newState.level);

  const boardBeforeClear = preserveBoardForAnimation(boardAfterLock, clearingLines);

  // 3. Spawn the next piece
  const {
    currentPiece: newPiece,
    nextPiece,
    pieceBag,
  } = spawnNextPiece(newState.nextPiece, newState.pieceBag);

  // 4. Check for game over
  const isGameOver = checkGameOver(boardAfterClear, newPiece);
  const currentPiece = isGameOver ? null : newPiece;

  // 5. Update ghost position and return the new state
  return updateGhostPosition({
    ...newState,
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

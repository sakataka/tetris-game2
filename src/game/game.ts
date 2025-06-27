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
      currentPiece: { ...state.currentPiece, position: newPosition },
    });
  }

  // If moving down failed, lock the piece
  return dy > 0 ? lockCurrentTetromino(state) : state;
}

export function rotateTetrominoCW(state: GameState): GameState {
  if (!state.currentPiece || state.isGameOver || state.isPaused) return state;

  const { currentPiece } = state;
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

  return newPosition
    ? updateGhostPosition({
        ...state,
        currentPiece: {
          ...currentPiece,
          shape: rotatedShape,
          rotation: toRotation,
          position: newPosition,
        },
        animationTriggerKey:
          typeof state.animationTriggerKey === "number" ? state.animationTriggerKey + 1 : 1,
      })
    : state;
}

/**
 * Find the lowest valid position where a tetromino can be placed when dropped
 * Used by both hard drop and ghost piece calculations
 */
function _findDropPosition(
  board: BoardMatrix,
  shape: number[][],
  startPosition: Position,
): Position {
  let dropPosition = startPosition;
  let iterations = 0;

  // Move down until collision, with safety limit to prevent infinite loop
  while (iterations < DROP_POSITION_MAX_ITERATIONS) {
    const nextPosition = { x: dropPosition.x, y: dropPosition.y + 1 };
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

  const finalPosition = _findDropPosition(
    state.board,
    state.currentPiece.shape,
    state.currentPiece.position,
  );
  return lockCurrentTetromino({
    ...state,
    currentPiece: { ...state.currentPiece, position: finalPosition },
  });
}

type PieceLockResult = { board: BoardMatrix; placedPositions: Position[] };
type LineClearResult = {
  board: BoardMatrix;
  score: number;
  lines: number;
  level: number;
  clearingLines: number[];
};

function recordPlacedPositions(currentPiece: Tetromino): Position[] {
  const positions: Position[] = [];
  forEachPieceCell(currentPiece.shape, currentPiece.position, (boardX, boardY) =>
    positions.push({ x: boardX, y: boardY }),
  );
  return positions;
}

export function placePieceOnBoard(state: GameState): PieceLockResult {
  if (!state.currentPiece) return { board: state.board, placedPositions: [] };

  const colorIndex = getTetrominoColorIndex(state.currentPiece.type);
  const placedPositions = recordPlacedPositions(state.currentPiece);
  const board = placeTetromino(
    state.board,
    state.currentPiece.shape,
    state.currentPiece.position,
    colorIndex,
  );
  return { board, placedPositions };
}

export function clearCompletedLines(
  board: BoardMatrix,
  currentScore: number,
  currentLines: number,
  currentLevel: number,
): LineClearResult {
  const { board: clearedBoard, linesCleared, clearedLineIndices } = clearLines(board);
  const lines = currentLines + linesCleared;
  return {
    board: clearedBoard,
    score: currentScore + calculateScore(linesCleared, currentLevel),
    lines,
    level: Math.floor(lines / LINES_PER_LEVEL) + 1,
    clearingLines: clearedLineIndices.length > 0 ? clearedLineIndices : [],
  };
}

export function preserveBoardForAnimation(
  board: BoardMatrix,
  clearingLines: number[],
): BoardMatrix | null {
  return clearingLines.length > 0 ? board : null;
}

export function checkGameOver(board: BoardMatrix, piece: Tetromino): boolean {
  return !isValidPosition(board, piece.shape, piece.position);
}

export function spawnNextPiece(nextPieceType: TetrominoTypeName, pieceBag: TetrominoTypeName[]) {
  const pieceBagManager = createPieceBagManager();
  pieceBagManager.setBag(pieceBag);
  return {
    currentPiece: createTetromino(nextPieceType),
    nextPiece: pieceBagManager.getNextPiece(),
    pieceBag: pieceBagManager.getBag(),
  };
}

/**
 * Coordinates the piece locking process when a piece can no longer move down
 * Handles: piece placement, line clearing, scoring, next piece spawning, game over check
 */
function lockCurrentTetromino(state: GameState): GameState {
  if (!state.currentPiece) return state;

  const { board: boardAfterLock, placedPositions } = placePieceOnBoard(state);
  const {
    board: boardAfterClear,
    score,
    lines,
    level,
    clearingLines,
  } = clearCompletedLines(boardAfterLock, state.score, state.lines, state.level);
  const boardBeforeClear = preserveBoardForAnimation(boardAfterLock, clearingLines);
  const {
    currentPiece: newPiece,
    nextPiece,
    pieceBag,
  } = spawnNextPiece(state.nextPiece, state.pieceBag);
  const isGameOver = checkGameOver(boardAfterClear, newPiece);

  return updateGhostPosition({
    ...state,
    board: boardAfterClear,
    boardBeforeClear,
    currentPiece: isGameOver ? null : newPiece,
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
 * Calculates score using classic Tetris system: 1=100, 2=300, 3=500, 4=800 points
 * Score is multiplied by current level for progressive difficulty reward
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
 * Calculates where the current piece would land if dropped
 * Returns null if piece is already at bottom (no visual ghost needed)
 */
export function calculateGhostPosition(state: GameState): Position | null {
  if (!state.currentPiece || state.isGameOver) return null;
  const ghostPosition = _findDropPosition(
    state.board,
    state.currentPiece.shape,
    state.currentPiece.position,
  );
  return ghostPosition.y === state.currentPiece.position.y ? null : ghostPosition;
}

function updateGhostPosition(state: GameState): GameState {
  return { ...state, ghostPosition: calculateGhostPosition(state) };
}

/**
 * Holds current piece (can only be used once per piece drop)
 * Initial hold: save piece and spawn next, Exchange hold: swap with held piece
 */
export function holdCurrentPiece(state: GameState): GameState {
  if (!state.currentPiece || !state.canHold || state.isGameOver || state.isPaused) return state;

  const currentPieceType = state.currentPiece.type;

  if (state.heldPiece === null) {
    // Initial hold: save current piece and spawn next piece
    const pieceBagManager = createPieceBagManager();
    pieceBagManager.setBag(state.pieceBag);
    return updateGhostPosition({
      ...state,
      currentPiece: createTetromino(state.nextPiece),
      heldPiece: currentPieceType,
      nextPiece: pieceBagManager.getNextPiece(),
      canHold: false,
      pieceBag: pieceBagManager.getBag(),
    });
  }
  // Exchange hold: swap held piece with current piece
  return updateGhostPosition({
    ...state,
    currentPiece: createTetromino(state.heldPiece),
    heldPiece: currentPieceType,
    canHold: false,
  });
}

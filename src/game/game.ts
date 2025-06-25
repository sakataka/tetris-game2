import type { GameState, Position, Tetromino, TetrominoTypeName } from "../types/game";
import {
  BASE_SCORES,
  INITIAL_DROP_SPEED_MS,
  LINES_PER_LEVEL,
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
import {
  createTetromino,
  getRandomTetrominoType,
  getTetrominoColorIndex,
  rotateTetromino,
} from "./tetrominos";

export function createInitialGameState(): GameState {
  const currentType = getRandomTetrominoType();
  const state = {
    board: createEmptyBoard(),
    boardBeforeClear: null,
    currentPiece: createTetromino(currentType),
    nextPiece: getRandomTetrominoType(),
    score: 0,
    lines: 0,
    level: 1,
    isGameOver: false,
    isPaused: false,
    placedPositions: [],
    clearingLines: [],
    animationTriggerKey: 0,
    ghostPosition: null as Position | null,
    showGhostPiece: true,
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

  const rotatedShape = rotateTetromino(state.currentPiece.shape);

  if (isValidPosition(state.board, rotatedShape, state.currentPiece.position)) {
    return updateGhostPosition({
      ...state,
      currentPiece: {
        ...state.currentPiece,
        shape: rotatedShape,
        rotation: (state.currentPiece.rotation + 1) % 4,
      },
      animationTriggerKey: state.animationTriggerKey + 1,
    });
  }

  return state;
}

export function hardDropTetromino(state: GameState): GameState {
  if (!state.currentPiece || state.isGameOver || state.isPaused) return state;

  const currentPiece = state.currentPiece;
  let finalPosition = currentPiece.position;

  // Find the lowest valid position
  while (true) {
    const nextPosition = {
      x: finalPosition.x,
      y: finalPosition.y + 1,
    };

    if (isValidPosition(state.board, currentPiece.shape, nextPosition)) {
      finalPosition = nextPosition;
    } else {
      break;
    }
  }

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

// Helper function to record placed positions for animation
function _getPlacedPositions(currentPiece: Tetromino): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  forEachPieceCell(currentPiece.shape, currentPiece.position, (boardX, boardY) => {
    positions.push({ x: boardX, y: boardY });
  });
  return positions;
}

// Helper function to handle piece locking and board update
function _lockPiece(state: GameState): Pick<GameState, "board" | "placedPositions"> {
  if (!state.currentPiece) return { board: state.board, placedPositions: [] };

  const colorIndex = getTetrominoColorIndex(state.currentPiece.type);
  const placedPositions = _getPlacedPositions(state.currentPiece);
  const newBoard = placeTetromino(
    state.board,
    state.currentPiece.shape,
    state.currentPiece.position,
    colorIndex,
  );
  return { board: newBoard, placedPositions };
}

// Helper function to handle line clearing and scoring
function _handleLineClearing(
  board: GameState["board"],
  currentScore: number,
  currentLines: number,
  currentLevel: number,
): Pick<GameState, "board" | "score" | "lines" | "level" | "clearingLines"> {
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

// Helper function to spawn a new piece and check for game over
function _spawnNewPiece(
  board: GameState["board"],
  nextPieceType: TetrominoTypeName,
): Pick<GameState, "currentPiece" | "nextPiece" | "isGameOver"> {
  const newPiece = createTetromino(nextPieceType);
  const isGameOver = !isValidPosition(board, newPiece.shape, newPiece.position);
  return {
    currentPiece: isGameOver ? null : newPiece,
    nextPiece: getRandomTetrominoType(),
    isGameOver,
  };
}

/**
 * Locks the current tetromino in place, clears complete lines, and spawns the next piece.
 * This is the core game state transition when a piece can no longer move down.
 */
function lockCurrentTetromino(state: GameState): GameState {
  if (!state.currentPiece) return state;

  const { board: boardAfterLock, placedPositions } = _lockPiece(state);

  const {
    board: boardAfterClear,
    score,
    lines,
    level,
    clearingLines,
  } = _handleLineClearing(boardAfterLock, state.score, state.lines, state.level);

  const { currentPiece, nextPiece, isGameOver } = _spawnNewPiece(boardAfterClear, state.nextPiece);

  // If there are lines to clear, preserve the board state before clearing
  const boardBeforeClear = clearingLines.length > 0 ? boardAfterLock : null;

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

  let ghostY = state.currentPiece.position.y;
  const ghostX = state.currentPiece.position.x;

  // Move down until we can't anymore
  while (
    isValidPosition(state.board, state.currentPiece.shape, {
      x: ghostX,
      y: ghostY + 1,
    })
  ) {
    ghostY++;
  }

  // If ghost position is the same as current position, don't show ghost
  if (ghostY === state.currentPiece.position.y) {
    return null;
  }

  return { x: ghostX, y: ghostY };
}

/**
 * Helper function to update ghost position in game state
 */
function updateGhostPosition(state: GameState): GameState {
  return {
    ...state,
    ghostPosition: calculateGhostPosition(state),
  };
}

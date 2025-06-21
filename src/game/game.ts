import {
  type GameState,
  getTetrominoColorIndex,
  TETROMINO_TYPES,
  type Tetromino,
  type TetrominoTypeName,
} from "../types/game";
import {
  BASE_SCORES,
  BOARD_WIDTH,
  INITIAL_DROP_SPEED_MS,
  LINES_PER_LEVEL,
  MIN_DROP_SPEED_MS,
  SPEED_DECREASE_PER_LEVEL,
} from "../utils/constants";
import { clearLines, createEmptyBoard, isValidPosition, placeTetromino } from "./board";
import { getTetrominoShape, rotateTetromino } from "./tetrominos";

function getRandomTetrominoType(): TetrominoTypeName {
  return TETROMINO_TYPES[Math.floor(Math.random() * TETROMINO_TYPES.length)];
}

function createTetromino(type: TetrominoTypeName): Tetromino {
  const shape = getTetrominoShape(type);
  return {
    type,
    position: { x: Math.floor(BOARD_WIDTH / 2) - Math.floor(shape[0].length / 2), y: 0 },
    rotation: 0,
    shape,
  };
}

export function createInitialGameState(): GameState {
  const currentType = getRandomTetrominoType();
  return {
    board: createEmptyBoard(),
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
  };
}

export function moveTetrominoBy(state: GameState, dx: number, dy: number): GameState {
  if (!state.currentPiece || state.isGameOver || state.isPaused) return state;

  const newPosition = {
    x: state.currentPiece.position.x + dx,
    y: state.currentPiece.position.y + dy,
  };

  if (isValidPosition(state.board, state.currentPiece.shape, newPosition)) {
    return {
      ...state,
      currentPiece: {
        ...state.currentPiece,
        position: newPosition,
      },
    };
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
    return {
      ...state,
      currentPiece: {
        ...state.currentPiece,
        shape: rotatedShape,
        rotation: (state.currentPiece.rotation + 1) % 4,
      },
      animationTriggerKey: state.animationTriggerKey + 1,
    };
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

/**
 * Locks the current tetromino in place, clears complete lines, and spawns the next piece.
 * This is the core game state transition when a piece can no longer move down.
 */
function lockCurrentTetromino(state: GameState): GameState {
  if (!state.currentPiece) return state;

  const colorIndex = getTetrominoColorIndex(state.currentPiece.type);

  // Record placed positions for animation
  const placedPositions: { x: number; y: number }[] = [];
  state.currentPiece.shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) {
        placedPositions.push({
          x: (state.currentPiece as NonNullable<typeof state.currentPiece>).position.x + x,
          y: (state.currentPiece as NonNullable<typeof state.currentPiece>).position.y + y,
        });
      }
    });
  });

  const newBoard = placeTetromino(
    state.board,
    state.currentPiece.shape,
    state.currentPiece.position,
    colorIndex,
  );

  const { board: clearedBoard, linesCleared, clearedLineIndices } = clearLines(newBoard);
  const newLines = state.lines + linesCleared;
  const newLevel = Math.floor(newLines / LINES_PER_LEVEL) + 1;
  const newScore = state.score + calculateScore(linesCleared, state.level);

  const newPiece = createTetromino(state.nextPiece);
  // Game over occurs when the new piece cannot be placed at its starting position
  const isGameOver = !isValidPosition(clearedBoard, newPiece.shape, newPiece.position);

  return {
    ...state,
    board: clearedBoard,
    currentPiece: isGameOver ? null : newPiece,
    nextPiece: getRandomTetrominoType(),
    score: newScore,
    lines: newLines,
    level: newLevel,
    isGameOver,
    placedPositions,
    clearingLines: clearedLineIndices.length > 0 ? clearedLineIndices : [],
  };
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

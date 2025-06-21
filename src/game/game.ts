import {
  type GameState,
  getTetrominoColorIndex,
  INITIAL_SPEED,
  TETROMINO_TYPES,
  type Tetromino,
  type TetrominoType,
} from "../types/game";
import { clearLines, createEmptyBoard, isValidPosition, placeTetromino } from "./board";
import { getTetrominoShape, rotateTetromino } from "./tetrominos";

function getRandomTetrominoType(): TetrominoType {
  return TETROMINO_TYPES[Math.floor(Math.random() * TETROMINO_TYPES.length)];
}

function createTetromino(type: TetrominoType): Tetromino {
  const shape = getTetrominoShape(type);
  return {
    type,
    position: { x: Math.floor(10 / 2) - Math.floor(shape[0].length / 2), y: 0 },
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
    rotationKey: 0,
  };
}

export function movePiece(state: GameState, dx: number, dy: number): GameState {
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
    return lockPiece(state);
  }

  return state;
}

export function rotatePiece(state: GameState): GameState {
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
      rotationKey: state.rotationKey + 1,
    };
  }

  return state;
}

export function dropPiece(state: GameState): GameState {
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
  return lockPiece(newState);
}

function lockPiece(state: GameState): GameState {
  if (!state.currentPiece) return state;

  const colorIndex = getTetrominoColorIndex(state.currentPiece.type);

  // Record placed positions for animation
  const placedPositions: { x: number; y: number }[] = [];
  state.currentPiece.shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell) {
        placedPositions.push({
          x: state.currentPiece!.position.x + x,
          y: state.currentPiece!.position.y + y,
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
  const newLevel = Math.floor(newLines / 10) + 1;
  const newScore = state.score + calculateScore(linesCleared, state.level);

  const newPiece = createTetromino(state.nextPiece);
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
    clearingLines: clearedLineIndices || [],
  };
}

export function calculateScore(linesCleared: number, level: number): number {
  const baseScores = [0, 100, 300, 500, 800];
  return baseScores[linesCleared] * level;
}

export function getGameSpeed(level: number): number {
  return Math.max(100, INITIAL_SPEED - (level - 1) * 100);
}

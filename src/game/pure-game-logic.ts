/**
 * Pure Game Logic Functions
 *
 * This module contains pure functions for game logic operations.
 * All functions are side-effect free and work with immutable data structures.
 */

import type { GameError } from "@/shared/types/errors";
import { GameErrors } from "@/shared/types/errors";
import type { Result } from "@/shared/types/result";
import { ResultUtils } from "@/shared/types/result";
import type {
  ComboState,
  FloatingScoreEvent,
  GameBoard,
  GameState,
  Position,
  ScoreAnimationState,
  Tetromino,
  TetrominoShape,
  TetrominoTypeName,
} from "@/types/game";
import type { RotationResult } from "@/types/rotation";
import { GAME_CONSTANTS } from "@/utils/gameConstants";
import { canPerformHoldAction, isGameOverState, isGamePlayable } from "@/utils/gameValidation";
import { normalizeRotationState } from "@/utils/typeGuards";
import {
  clearLines,
  createEmptyBoard,
  forEachPieceCell,
  isValidPosition,
  placeTetromino,
} from "./board";
import { createPieceBag, getBagContents, getNextPiece, setBagForTesting } from "./pieceBag";
import { calculateTSpinScore } from "./scoring";
import {
  createTetromino,
  getTetrominoColorIndex,
  rotateTetromino,
  rotateTetromino180,
} from "./tetrominos";
import { detectTSpin, type TSpinDetectionResult } from "./tSpin";
import { tryRotateWithWallKickUnified } from "./wallKick";

/**
 * Immutable game state builder pattern
 * Provides a fluent interface for creating new game states
 */
export class GameStateBuilder {
  private state: GameState;
  private originalState: GameState;

  constructor(baseState: GameState) {
    // Keep reference to original state for comparison
    this.originalState = baseState;
    // Shallow clone initially - we'll deep clone only what changes
    this.state = { ...baseState };
  }

  withBoard(board: GameBoard): GameStateBuilder {
    this.state.board = board;
    return this;
  }

  withCurrentPiece(piece: Tetromino | null): GameStateBuilder {
    this.state.currentPiece = piece;
    return this;
  }

  withNextPiece(nextPiece: TetrominoTypeName): GameStateBuilder {
    this.state.nextPiece = nextPiece;
    return this;
  }

  withHeldPiece(heldPiece: TetrominoTypeName | null): GameStateBuilder {
    this.state.heldPiece = heldPiece;
    return this;
  }

  withScore(score: number): GameStateBuilder {
    this.state.score = score;
    return this;
  }

  withLines(lines: number): GameStateBuilder {
    this.state.lines = lines;
    return this;
  }

  withLevel(level: number): GameStateBuilder {
    this.state.level = level;
    return this;
  }

  withGameOver(isGameOver: boolean): GameStateBuilder {
    this.state.isGameOver = isGameOver;
    return this;
  }

  withCanHold(canHold: boolean): GameStateBuilder {
    this.state.canHold = canHold;
    return this;
  }

  withPieceBag(pieceBag: TetrominoTypeName[]): GameStateBuilder {
    this.state.pieceBag = pieceBag;
    return this;
  }

  withTSpinState(tSpinState: Partial<GameState["tSpinState"]>): GameStateBuilder {
    if (this.state.tSpinState === this.originalState.tSpinState) {
      this.state.tSpinState = { ...this.state.tSpinState };
    }
    Object.assign(this.state.tSpinState, tSpinState);
    return this;
  }

  withComboState(comboState: Partial<ComboState>): GameStateBuilder {
    if (this.state.comboState === this.originalState.comboState) {
      this.state.comboState = { ...this.state.comboState };
    }
    Object.assign(this.state.comboState, comboState);
    return this;
  }

  withScoreAnimationState(scoreAnimationState: Partial<ScoreAnimationState>): GameStateBuilder {
    if (this.state.scoreAnimationState === this.originalState.scoreAnimationState) {
      this.state.scoreAnimationState = { ...this.state.scoreAnimationState };
    }
    Object.assign(this.state.scoreAnimationState, scoreAnimationState);
    return this;
  }

  withFloatingScoreEvents(events: FloatingScoreEvent[]): GameStateBuilder {
    this.state.floatingScoreEvents = events;
    return this;
  }

  withPlacedPositions(positions: Position[]): GameStateBuilder {
    this.state.placedPositions = positions;
    return this;
  }

  withClearingLines(lines: number[]): GameStateBuilder {
    this.state.clearingLines = lines;
    return this;
  }

  withBoardBeforeClear(board: GameBoard | null): GameStateBuilder {
    this.state.boardBeforeClear = board;
    return this;
  }

  withAnimationTriggerKey(key: number): GameStateBuilder {
    this.state.animationTriggerKey = key;
    return this;
  }

  withGhostPosition(position: Position | null): GameStateBuilder {
    this.state.ghostPosition = position;
    return this;
  }

  build(): GameState {
    // Calculate ghost position if current piece exists
    const finalState = { ...this.state };
    finalState.ghostPosition = calculateGhostPositionPure(finalState);
    return finalState;
  }
}

/**
 * Pure function to create initial game state
 */
export function createInitialGameStatePure(): GameState {
  const pieceBag = createPieceBag();
  const [currentType, pieceBagAfterFirst] = getNextPiece(pieceBag);
  const [nextType, finalPieceBag] = getNextPiece(pieceBagAfterFirst);

  const state: GameState = {
    board: createEmptyBoard(),
    boardBeforeClear: null,
    currentPiece: createTetromino(currentType),
    ghostPiece: null,
    nextPiece: nextType,
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
    pieceBag: [...getBagContents(finalPieceBag)],
    tSpinState: {
      type: "none",
      show: false,
      linesCleared: 0,
      rotationResult: null,
    },
    comboState: {
      count: 0,
      isActive: false,
      lastClearType: null,
    },
    scoreAnimationState: {
      previousScore: 0,
      scoreIncrease: 0,
      lineCount: 0,
      clearType: null,
      isTetris: false,
      animationTriggerTime: 0,
    },
    floatingScoreEvents: [],
    levelCelebrationState: {
      isActive: false,
      level: null,
      startTime: null,
      phase: "completed",
      userCancelled: false,
    },
  };

  return new GameStateBuilder(state).build();
}

/**
 * Pure function to move tetromino by specified offset
 */
export function moveTetrominoPure(
  state: GameState,
  dx: number,
  dy: number,
): Result<GameState, GameError> {
  if (!isGamePlayable(state)) {
    return ResultUtils.err(GameErrors.invalidState("Game is not in playable state"));
  }

  if (!state.currentPiece) {
    return ResultUtils.err(GameErrors.invalidPiece("No current piece to move"));
  }

  const newPosition = {
    x: state.currentPiece.position.x + dx,
    y: state.currentPiece.position.y + dy,
  };

  if (isValidPosition(state.board, state.currentPiece.shape, newPosition)) {
    const newState = new GameStateBuilder(state)
      .withCurrentPiece({ ...state.currentPiece, position: newPosition })
      .build();

    return ResultUtils.ok(newState);
  }

  // If moving down failed, lock the piece
  if (dy > 0) {
    const lockedState = lockCurrentTetrominoPure(state);
    return ResultUtils.ok(lockedState);
  }

  return ResultUtils.err(
    GameErrors.invalidPosition(
      newPosition.x,
      newPosition.y,
      "Cannot move piece to the specified position",
    ),
  );
}

/**
 * Pure function to rotate tetromino
 */
export function rotateTetrominoPure(
  state: GameState,
  rotateShapeFunction: (shape: TetrominoShape) => TetrominoShape,
  rotationSteps: number,
): Result<GameState, GameError> {
  if (!isGamePlayable(state)) {
    return ResultUtils.err(GameErrors.invalidState("Game is not in playable state"));
  }

  if (!state.currentPiece) {
    return ResultUtils.err(GameErrors.invalidPiece("No current piece to rotate"));
  }

  const { currentPiece } = state;
  const rotatedShape = rotateShapeFunction(currentPiece.shape);
  const toRotation = normalizeRotationState(currentPiece.rotation + rotationSteps);

  // Try rotation with wall kick compensation
  const rotationResult = tryRotateWithWallKickUnified(
    state.board,
    currentPiece,
    rotatedShape,
    toRotation,
    isValidPosition,
  );

  if (rotationResult.success && rotationResult.piece) {
    const newState = new GameStateBuilder(state)
      .withCurrentPiece(rotationResult.piece)
      .withTSpinState({ rotationResult })
      .withAnimationTriggerKey(
        typeof state.animationTriggerKey === "number" ? state.animationTriggerKey + 1 : 1,
      )
      .build();

    return ResultUtils.ok(newState);
  }

  return ResultUtils.err(
    GameErrors.invalidRotation(
      `rotation-${state.currentPiece?.rotation || 0}`,
      rotationResult.failureReason || "Cannot rotate piece to the specified position",
    ),
  );
}

/**
 * Pure function to rotate tetromino clockwise
 */
export function rotateTetrominoCWPure(state: GameState): Result<GameState, GameError> {
  return rotateTetrominoPure(state, rotateTetromino, 1);
}

/**
 * Pure function to rotate tetromino 180 degrees
 */
export function rotateTetromino180Pure(state: GameState): Result<GameState, GameError> {
  return rotateTetrominoPure(state, rotateTetromino180, 2);
}

/**
 * Pure function to find drop position
 */
export function findDropPositionPure(
  board: GameBoard,
  shape: TetrominoShape,
  startPosition: Position,
): Position {
  let dropPosition = startPosition;
  let iterations = 0;

  while (iterations < GAME_CONSTANTS.TETROMINO.DROP_POSITION_LIMIT) {
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

/**
 * Pure function to hard drop tetromino
 */
export function hardDropTetrominoPure(state: GameState): GameState {
  if (!isGamePlayable(state) || !state.currentPiece) return state;

  const finalPosition = findDropPositionPure(
    state.board,
    state.currentPiece.shape,
    state.currentPiece.position,
  );

  const stateWithDroppedPiece = new GameStateBuilder(state)
    .withCurrentPiece({ ...state.currentPiece, position: finalPosition })
    .build();

  return lockCurrentTetrominoPure(stateWithDroppedPiece);
}

/**
 * Pure function to calculate ghost position
 */
export function calculateGhostPositionPure(state: GameState): Position | null {
  if (!state.currentPiece || state.isGameOver) return null;

  const ghostPosition = findDropPositionPure(
    state.board,
    state.currentPiece.shape,
    state.currentPiece.position,
  );

  return ghostPosition.y === state.currentPiece.position.y ? null : ghostPosition;
}

/**
 * Pure function to process piece placement and line clearing
 */
export function processPlacementAndClearingPure(state: GameState): {
  board: GameBoard;
  boardBeforeClear: GameBoard | null;
  score: number;
  lines: number;
  level: number;
  placedPositions: Position[];
  clearingLines: number[];
  tSpinType: "none" | "mini" | "normal";
  tSpinLinesCleared: number;
  comboState: ComboState;
  scoreAnimationState: ScoreAnimationState;
  floatingScoreEvents: FloatingScoreEvent[];
} {
  if (!state.currentPiece) {
    return {
      board: state.board,
      boardBeforeClear: null,
      score: state.score,
      lines: state.lines,
      level: state.level,
      placedPositions: [],
      clearingLines: [],
      tSpinType: "none",
      tSpinLinesCleared: 0,
      comboState: state.comboState,
      scoreAnimationState: state.scoreAnimationState,
      floatingScoreEvents: state.floatingScoreEvents,
    };
  }

  // Detect T-Spin
  let tSpinDetectionResult: TSpinDetectionResult = {
    type: "none",
    cornersFilled: 0,
    usedWallKick: false,
    lastMoveWasRotation: false,
  };

  if (state.tSpinState.rotationResult && state.currentPiece) {
    tSpinDetectionResult = detectTSpin(
      state.board,
      state.currentPiece,
      state.tSpinState.rotationResult as RotationResult,
    );
  }

  const colorIndex = getTetrominoColorIndex(state.currentPiece.type);
  const placedPositions: Position[] = [];
  forEachPieceCell(state.currentPiece.shape, state.currentPiece.position, (boardX, boardY) =>
    placedPositions.push({ x: boardX, y: boardY }),
  );

  const boardAfterLockResult = placeTetromino(
    state.board,
    state.currentPiece.shape,
    state.currentPiece.position,
    colorIndex,
  );

  if (!boardAfterLockResult.ok) {
    return {
      board: state.board,
      boardBeforeClear: null,
      score: state.score,
      lines: state.lines,
      level: state.level,
      placedPositions: [],
      clearingLines: [],
      tSpinType: "none",
      tSpinLinesCleared: 0,
      comboState: state.comboState,
      scoreAnimationState: state.scoreAnimationState,
      floatingScoreEvents: state.floatingScoreEvents,
    };
  }

  const boardAfterLock = boardAfterLockResult.value;
  const { board: boardAfterClear, linesCleared, clearedLineIndices } = clearLines(boardAfterLock);
  const lines = state.lines + linesCleared;
  const boardBeforeClear = clearedLineIndices.length > 0 ? boardAfterLock : null;

  const scoreToAdd = calculateTSpinScore(linesCleared, state.level, tSpinDetectionResult.type);
  const newScore = state.score + scoreToAdd;

  const clearType: "single" | "double" | "triple" | "tetris" | "tspin" | null =
    tSpinDetectionResult.type !== "none"
      ? "tspin"
      : linesCleared === 1
        ? "single"
        : linesCleared === 2
          ? "double"
          : linesCleared === 3
            ? "triple"
            : linesCleared === 4
              ? "tetris"
              : null;

  const newComboState: ComboState = {
    count: linesCleared > 0 ? state.comboState.count + 1 : 0,
    isActive: linesCleared > 0,
    lastClearType: clearType,
  };

  const scoreAnimationState: ScoreAnimationState = {
    previousScore: state.score,
    scoreIncrease: scoreToAdd,
    lineCount: linesCleared,
    clearType,
    isTetris: linesCleared === 4,
    animationTriggerTime: performance.now(),
  };

  const newFloatingScoreEvents: FloatingScoreEvent[] =
    scoreToAdd > 0
      ? [
          ...state.floatingScoreEvents,
          {
            id: `score-${scoreAnimationState.animationTriggerTime}`,
            points: scoreToAdd,
            position: { x: 5, y: 10 },
            startTime: scoreAnimationState.animationTriggerTime,
            isActive: true,
          },
        ]
      : state.floatingScoreEvents;

  return {
    board: boardAfterClear,
    boardBeforeClear,
    score: newScore,
    lines,
    level: Math.floor(lines / GAME_CONSTANTS.SCORING.LINES_PER_LEVEL) + 1,
    placedPositions,
    clearingLines: clearedLineIndices.length > 0 ? clearedLineIndices : [],
    tSpinType: tSpinDetectionResult.type,
    tSpinLinesCleared: linesCleared,
    comboState: newComboState,
    scoreAnimationState,
    floatingScoreEvents: newFloatingScoreEvents,
  };
}

/**
 * Pure function to spawn next piece
 */
export function spawnNextPiecePure(
  nextPieceType: TetrominoTypeName,
  pieceBag: TetrominoTypeName[],
): {
  currentPiece: Tetromino;
  nextPiece: TetrominoTypeName;
  pieceBag: TetrominoTypeName[];
} {
  const currentBag = setBagForTesting(createPieceBag(), pieceBag);
  const [newNextPiece, updatedBag] = getNextPiece(currentBag);

  return {
    currentPiece: createTetromino(nextPieceType),
    nextPiece: newNextPiece,
    pieceBag: [...getBagContents(updatedBag)],
  };
}

/**
 * Pure function to process next piece and game state
 */
export function processNextPieceAndGameStatePure(
  nextPieceType: TetrominoTypeName,
  pieceBag: TetrominoTypeName[],
  board: GameBoard,
): {
  currentPiece: Tetromino | null;
  nextPiece: TetrominoTypeName;
  pieceBag: TetrominoTypeName[];
  isGameOver: boolean;
} {
  const {
    currentPiece: newPiece,
    nextPiece,
    pieceBag: updatedBag,
  } = spawnNextPiecePure(nextPieceType, pieceBag);
  const isGameOver = isGameOverState(board, newPiece);

  return {
    currentPiece: isGameOver ? null : newPiece,
    nextPiece,
    pieceBag: updatedBag,
    isGameOver,
  };
}

/**
 * Pure function to lock current tetromino
 */
export function lockCurrentTetrominoPure(state: GameState): GameState {
  if (!state.currentPiece) return state;

  const placementResult = processPlacementAndClearingPure(state);
  const nextPieceResult = processNextPieceAndGameStatePure(
    state.nextPiece,
    state.pieceBag,
    placementResult.board,
  );

  // Update T-Spin state
  const newTSpinState = {
    type: placementResult.tSpinType,
    show: placementResult.tSpinType !== "none",
    linesCleared: placementResult.tSpinLinesCleared,
    rotationResult: null,
  };

  return new GameStateBuilder(state)
    .withBoard(placementResult.board)
    .withBoardBeforeClear(placementResult.boardBeforeClear)
    .withCurrentPiece(nextPieceResult.currentPiece)
    .withNextPiece(nextPieceResult.nextPiece)
    .withScore(placementResult.score)
    .withLines(placementResult.lines)
    .withLevel(placementResult.level)
    .withGameOver(nextPieceResult.isGameOver)
    .withPlacedPositions(placementResult.placedPositions)
    .withClearingLines(placementResult.clearingLines)
    .withCanHold(true)
    .withPieceBag(nextPieceResult.pieceBag)
    .withTSpinState(newTSpinState)
    .withComboState(placementResult.comboState)
    .withScoreAnimationState(placementResult.scoreAnimationState)
    .withFloatingScoreEvents(placementResult.floatingScoreEvents)
    .build();
}

/**
 * Pure function to hold current piece
 */
export function holdCurrentPiecePure(state: GameState): Result<GameState, GameError> {
  if (!canPerformHoldAction(state)) {
    return ResultUtils.err(
      GameErrors.holdNotAllowed("Hold action is not allowed in current state"),
    );
  }

  if (!state.currentPiece) {
    return ResultUtils.err(GameErrors.invalidPiece("No current piece to hold"));
  }

  const currentPieceType = state.currentPiece.type;

  if (state.heldPiece === null) {
    // Initial hold: save current piece and spawn next piece
    const currentBag = setBagForTesting(createPieceBag(), state.pieceBag);
    const [newNextPiece, updatedBag] = getNextPiece(currentBag);

    const newState = new GameStateBuilder(state)
      .withCurrentPiece(createTetromino(state.nextPiece))
      .withHeldPiece(currentPieceType)
      .withNextPiece(newNextPiece)
      .withCanHold(false)
      .withPieceBag([...getBagContents(updatedBag)])
      .build();

    return ResultUtils.ok(newState);
  }

  // Exchange hold: swap held piece with current piece
  const newState = new GameStateBuilder(state)
    .withCurrentPiece(createTetromino(state.heldPiece))
    .withHeldPiece(currentPieceType)
    .withCanHold(false)
    .build();

  return ResultUtils.ok(newState);
}

/**
 * Pure function to get game speed based on level
 */
export function getGameSpeedPure(level: number): number {
  return Math.max(
    GAME_CONSTANTS.TIMING.MIN_DROP_SPEED_MS,
    GAME_CONSTANTS.TIMING.INITIAL_DROP_SPEED_MS -
      (level - 1) * GAME_CONSTANTS.TIMING.SPEED_DECREASE_PER_LEVEL,
  );
}

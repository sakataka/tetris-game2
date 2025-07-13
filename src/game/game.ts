import type { GameError } from "@/types/errors";
import { GameErrors } from "@/types/errors";
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
import type { Result } from "@/types/result";
import { Err, Ok, ResultUtils } from "@/types/result";
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
import { detectTSpin } from "./tSpin";
import { tryRotateWithWallKickUnified } from "./wallKick";

// Backward compatibility functions for existing code
export function moveTetrominoByLegacy(state: GameState, dx: number, dy: number): GameState {
  const result = moveTetrominoBy(state, dx, dy);
  return ResultUtils.unwrapOr(result, state);
}

export function rotateTetrominoCWLegacy(state: GameState): GameState {
  const result = rotateTetrominoCW(state);
  return ResultUtils.unwrapOr(result, state);
}

export function rotateTetromino180Legacy(state: GameState): GameState {
  const result = rotateTetromino180Degrees(state);
  return ResultUtils.unwrapOr(result, state);
}

export function holdCurrentPieceLegacy(state: GameState): GameState {
  const result = holdCurrentPiece(state);
  return ResultUtils.unwrapOr(result, state);
}

export function createInitialGameState(): GameState {
  const pieceBag = createPieceBag();
  const [currentType, pieceBagAfterFirst] = getNextPiece(pieceBag);
  const [nextType, finalPieceBag] = getNextPiece(pieceBagAfterFirst);

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
    pieceBag: [...getBagContents(finalPieceBag)], // Convert to legacy array format
    tSpinState: {
      type: "none" as const,
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
      phase: "completed" as const,
      userCancelled: false,
    },
  };

  // Calculate initial ghost position
  state.ghostPosition = calculateGhostPosition(state);
  return state;
}

export function moveTetrominoBy(
  state: GameState,
  dx: number,
  dy: number,
): Result<GameState, GameError> {
  if (!isGamePlayable(state)) {
    return Err(GameErrors.invalidState("Game is not in playable state"));
  }

  if (!state.currentPiece) {
    return Err(GameErrors.invalidPiece("No current piece to move"));
  }

  const newPosition = {
    x: state.currentPiece.position.x + dx,
    y: state.currentPiece.position.y + dy,
  };

  if (isValidPosition(state.board, state.currentPiece.shape, newPosition)) {
    return Ok(
      updateGhostPosition({
        ...state,
        currentPiece: { ...state.currentPiece, position: newPosition },
      }),
    );
  }

  // If moving down failed, lock the piece
  if (dy > 0) {
    return Ok(lockCurrentTetromino(state));
  }

  return Err(GameErrors.invalidPosition("Cannot move piece to the specified position"));
}

export function rotateTetrominoCW(state: GameState): Result<GameState, GameError> {
  if (!isGamePlayable(state)) {
    return Err(GameErrors.invalidState("Game is not in playable state"));
  }

  if (!state.currentPiece) {
    return Err(GameErrors.invalidPiece("No current piece to rotate"));
  }

  const { currentPiece } = state;
  const rotatedShape = rotateTetromino(currentPiece.shape);
  const toRotation = normalizeRotationState(currentPiece.rotation + 1);

  // Try rotation with wall kick compensation using unified result pattern
  const rotationResult = tryRotateWithWallKickUnified(
    state.board,
    currentPiece,
    rotatedShape,
    toRotation,
    isValidPosition,
  );

  if (rotationResult.success && rotationResult.piece) {
    // Update T-Spin state with rotation result for potential detection during piece lock
    const newTSpinState = {
      ...state.tSpinState,
      rotationResult,
    };

    return Ok(
      updateGhostPosition({
        ...state,
        currentPiece: rotationResult.piece,
        tSpinState: newTSpinState,
        animationTriggerKey:
          typeof state.animationTriggerKey === "number" ? state.animationTriggerKey + 1 : 1,
      }),
    );
  }

  return Err(
    GameErrors.invalidRotation(
      rotationResult.failureReason || "Cannot rotate piece to the specified position",
    ),
  );
}

export function rotateTetromino180Degrees(state: GameState): Result<GameState, GameError> {
  if (!isGamePlayable(state)) {
    return Err(GameErrors.invalidState("Game is not in playable state"));
  }

  if (!state.currentPiece) {
    return Err(GameErrors.invalidPiece("No current piece to rotate"));
  }

  const { currentPiece } = state;
  const rotatedShape = rotateTetromino180(currentPiece.shape);
  const toRotation = normalizeRotationState(currentPiece.rotation + 2);

  // Try rotation with wall kick compensation using unified result pattern
  const rotationResult = tryRotateWithWallKickUnified(
    state.board,
    currentPiece,
    rotatedShape,
    toRotation,
    isValidPosition,
  );

  if (rotationResult.success && rotationResult.piece) {
    // Update T-Spin state with rotation result for potential detection during piece lock
    const newTSpinState = {
      ...state.tSpinState,
      rotationResult,
    };

    return Ok(
      updateGhostPosition({
        ...state,
        currentPiece: rotationResult.piece,
        tSpinState: newTSpinState,
        animationTriggerKey:
          typeof state.animationTriggerKey === "number" ? state.animationTriggerKey + 1 : 1,
      }),
    );
  }

  return Err(
    GameErrors.invalidRotation(
      rotationResult.failureReason || "Cannot rotate piece to the specified position",
    ),
  );
}

/**
 * Find the lowest valid position where a tetromino can be placed when dropped
 * Used by both hard drop and ghost piece calculations
 */
function _findDropPosition(
  board: GameBoard,
  shape: TetrominoShape,
  startPosition: Position,
): Position {
  let dropPosition = startPosition;
  let iterations = 0;

  // Move down until collision, with safety limit to prevent infinite loop
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

export function hardDropTetromino(state: GameState): GameState {
  if (!isGamePlayable(state) || !state.currentPiece) return state;

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

export function processPlacementAndClearing(state: GameState): PlacementResult {
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

  // Detect T-Spin if we have a rotation result from the current piece
  let tSpinDetectionResult: {
    type: "none" | "mini" | "normal";
    cornersFilled: number;
    usedWallKick: boolean;
    lastMoveWasRotation: boolean;
  } = {
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

  // Handle Result type from placeTetromino
  if (!boardAfterLockResult.ok) {
    // Return a safe fallback state if placement fails
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

  // Calculate score using T-Spin aware scoring system
  const scoreToAdd = calculateTSpinScore(linesCleared, state.level, tSpinDetectionResult.type);
  const newScore = state.score + scoreToAdd;

  // Determine clear type for animations and combos
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

  // Update combo state
  const newComboState: ComboState = {
    count: linesCleared > 0 ? state.comboState.count + 1 : 0,
    isActive: linesCleared > 0,
    lastClearType: clearType,
  };

  // Create score animation state
  const scoreAnimationState: ScoreAnimationState = {
    previousScore: state.score,
    scoreIncrease: scoreToAdd,
    lineCount: linesCleared,
    clearType,
    isTetris: linesCleared === 4,
    animationTriggerTime: performance.now(),
  };

  // Create floating score event if score increased
  const newFloatingScoreEvents: FloatingScoreEvent[] =
    scoreToAdd > 0
      ? [
          ...state.floatingScoreEvents,
          {
            id: `score-${scoreAnimationState.animationTriggerTime}`,
            points: scoreToAdd,
            position: { x: 5, y: 10 }, // Center position on game board
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

export function checkGameOver(board: GameBoard, piece: Tetromino): boolean {
  return isGameOverState(board, piece);
}

export function spawnNextPiece(nextPieceType: TetrominoTypeName, pieceBag: TetrominoTypeName[]) {
  // Convert legacy array format to functional PieceBag
  const currentBag = setBagForTesting(createPieceBag(), pieceBag);
  const [newNextPiece, updatedBag] = getNextPiece(currentBag);

  return {
    currentPiece: createTetromino(nextPieceType),
    nextPiece: newNextPiece,
    pieceBag: [...getBagContents(updatedBag)], // Convert back to legacy array format
  };
}

type PlacementResult = {
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
};

type NextPieceResult = {
  currentPiece: Tetromino | null;
  nextPiece: TetrominoTypeName;
  pieceBag: TetrominoTypeName[];
  isGameOver: boolean;
};

/**
 * Handles next piece generation and game over validation
 * Spawns new piece and determines if game should end
 */
function processNextPieceAndGameState(
  nextPieceType: TetrominoTypeName,
  pieceBag: TetrominoTypeName[],
  board: GameBoard,
): NextPieceResult {
  const {
    currentPiece: newPiece,
    nextPiece,
    pieceBag: updatedBag,
  } = spawnNextPiece(nextPieceType, pieceBag);
  const isGameOver = checkGameOver(board, newPiece);

  return {
    currentPiece: isGameOver ? null : newPiece,
    nextPiece,
    pieceBag: updatedBag,
    isGameOver,
  };
}

/**
 * Builds the final game state by combining all processing results
 * Handles state merge and ghost position calculation
 */
function buildFinalGameState(
  baseState: GameState,
  placementResult: PlacementResult,
  nextPieceResult: NextPieceResult,
): GameState {
  // Update T-Spin state: show indicator if T-Spin was detected
  const newTSpinState = {
    type: placementResult.tSpinType as "none" | "mini" | "normal",
    show: placementResult.tSpinType !== "none",
    linesCleared: placementResult.tSpinLinesCleared,
    rotationResult: null, // Reset rotation result after piece lock
  };

  // Check for level up and update celebration state
  const levelUp = baseState.level < placementResult.level;
  const newLevelCelebrationState = levelUp
    ? {
        isActive: true,
        level: placementResult.level,
        startTime: Date.now(),
        phase: "intro" as const,
        userCancelled: false,
      }
    : baseState.levelCelebrationState;

  return updateGhostPosition({
    ...baseState,
    board: placementResult.board,
    boardBeforeClear: placementResult.boardBeforeClear,
    currentPiece: nextPieceResult.currentPiece,
    nextPiece: nextPieceResult.nextPiece,
    score: placementResult.score,
    lines: placementResult.lines,
    level: placementResult.level,
    isGameOver: nextPieceResult.isGameOver,
    placedPositions: placementResult.placedPositions,
    clearingLines: placementResult.clearingLines,
    canHold: true,
    pieceBag: nextPieceResult.pieceBag,
    tSpinState: newTSpinState,
    levelCelebrationState: newLevelCelebrationState,
  });
}

/**
 * Coordinates the piece locking process when a piece can no longer move down
 * Handles: piece placement, line clearing, scoring, next piece spawning, game over check
 */
function lockCurrentTetromino(state: GameState): GameState {
  if (!state.currentPiece) return state;

  const placementResult = processPlacementAndClearing(state);
  const nextPieceResult = processNextPieceAndGameState(
    state.nextPiece,
    state.pieceBag,
    placementResult.board,
  );

  return buildFinalGameState(state, placementResult, nextPieceResult);
}

export function getGameSpeed(level: number): number {
  return Math.max(
    GAME_CONSTANTS.TIMING.MIN_DROP_SPEED_MS,
    GAME_CONSTANTS.TIMING.INITIAL_DROP_SPEED_MS -
      (level - 1) * GAME_CONSTANTS.TIMING.SPEED_DECREASE_PER_LEVEL,
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
export function holdCurrentPiece(state: GameState): Result<GameState, GameError> {
  if (!canPerformHoldAction(state)) {
    return Err(GameErrors.holdNotAllowed("Hold action is not allowed in current state"));
  }

  if (!state.currentPiece) {
    return Err(GameErrors.invalidPiece("No current piece to hold"));
  }

  const currentPieceType = state.currentPiece.type;

  if (state.heldPiece === null) {
    // Initial hold: save current piece and spawn next piece
    const currentBag = setBagForTesting(createPieceBag(), state.pieceBag);
    const [newNextPiece, updatedBag] = getNextPiece(currentBag);

    return Ok(
      updateGhostPosition({
        ...state,
        currentPiece: createTetromino(state.nextPiece),
        heldPiece: currentPieceType,
        nextPiece: newNextPiece,
        canHold: false,
        pieceBag: [...getBagContents(updatedBag)],
      }),
    );
  }
  // Exchange hold: swap held piece with current piece
  return Ok(
    updateGhostPosition({
      ...state,
      currentPiece: createTetromino(state.heldPiece),
      heldPiece: currentPieceType,
      canHold: false,
    }),
  );
}

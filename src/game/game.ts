import type { GameError } from "@/shared/types/errors";
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
  TetrominoTypeName,
} from "@/types/game";
import { isGameOverState } from "@/utils/gameValidation";
// Import pure functions
import {
  calculateGhostPositionPure,
  createInitialGameStatePure,
  getGameSpeedPure,
  hardDropTetrominoPure,
  holdCurrentPiecePure,
  moveTetrominoPure,
  processPlacementAndClearingPure,
  rotateTetromino180Pure,
  rotateTetrominoCWPure,
  spawnNextPiecePure,
} from "./pure-game-logic";

// Backward compatibility functions for existing code
export function moveTetrominoByLegacy(state: GameState, dx: number, dy: number): GameState {
  const result = moveTetrominoBy(state, dx, dy);
  return ResultUtils.unwrapOr(result, state);
}

export function rotateTetrominoCWLegacy(state: GameState): GameState {
  const result = rotateTetrominoCW(state);
  return ResultUtils.unwrapOr(result, state);
}

export function holdCurrentPieceLegacy(state: GameState): GameState {
  const result = holdCurrentPiece(state);
  return ResultUtils.unwrapOr(result, state);
}

export function createInitialGameState(): GameState {
  return createInitialGameStatePure();
}

export function moveTetrominoBy(
  state: GameState,
  dx: number,
  dy: number,
): Result<GameState, GameError> {
  return moveTetrominoPure(state, dx, dy);
}

export function rotateTetrominoCW(state: GameState): Result<GameState, GameError> {
  return rotateTetrominoCWPure(state);
}

export function rotateTetromino180Degrees(state: GameState): Result<GameState, GameError> {
  return rotateTetromino180Pure(state);
}

export function hardDropTetromino(state: GameState): GameState {
  return hardDropTetrominoPure(state);
}

export function processPlacementAndClearing(state: GameState): PlacementResult {
  return processPlacementAndClearingPure(state);
}

export function checkGameOver(board: GameBoard, piece: Tetromino): boolean {
  return isGameOverState(board, piece);
}

export function spawnNextPiece(nextPieceType: TetrominoTypeName, pieceBag: TetrominoTypeName[]) {
  return spawnNextPiecePure(nextPieceType, pieceBag);
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

export function getGameSpeed(level: number): number {
  return getGameSpeedPure(level);
}

/**
 * Calculates where the current piece would land if dropped
 * Returns null if piece is already at bottom (no visual ghost needed)
 */
export function calculateGhostPosition(state: GameState): Position | null {
  return calculateGhostPositionPure(state);
}

/**
 * Holds current piece (can only be used once per piece drop)
 * Initial hold: save piece and spawn next, Exchange hold: swap with held piece
 */
export function holdCurrentPiece(state: GameState): Result<GameState, GameError> {
  return holdCurrentPiecePure(state);
}

import type { BoardMatrix, GameState, Position, Tetromino, TetrominoTypeName } from "../types/game";
import { TETROMINO_TYPES } from "../types/game";
import { BOARD_HEIGHT, BOARD_WIDTH } from "./constants";

/**
 * Enhanced type predicate utilities for runtime type checking
 */

/**
 * Type guard for Position objects
 */
export function isPosition(value: unknown): value is Position {
  return (
    value !== null &&
    typeof value === "object" &&
    "x" in value &&
    "y" in value &&
    typeof (value as any).x === "number" &&
    typeof (value as any).y === "number" &&
    Number.isInteger((value as any).x) &&
    Number.isInteger((value as any).y)
  );
}

/**
 * Type guard for valid board coordinates
 */
export function isValidBoardPosition(position: Position): boolean {
  return (
    position.x >= 0 && position.x < BOARD_WIDTH && position.y >= 0 && position.y < BOARD_HEIGHT
  );
}

/**
 * Type guard for TetrominoTypeName
 */
export function isTetrominoTypeName(value: unknown): value is TetrominoTypeName {
  return typeof value === "string" && TETROMINO_TYPES.includes(value as TetrominoTypeName);
}

/**
 * Type guard for valid cell values (0-7)
 */
export function isValidCellValue(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 7;
}

/**
 * Type guard for board row
 */
export function isBoardRow(value: unknown): value is number[] {
  return Array.isArray(value) && value.length === BOARD_WIDTH && value.every(isValidCellValue);
}

/**
 * Enhanced type guard for BoardMatrix
 */
export function isBoardMatrix(value: unknown): value is BoardMatrix {
  return Array.isArray(value) && value.length === BOARD_HEIGHT && value.every(isBoardRow);
}

/**
 * Type guard for Tetromino shape matrix
 */
export function isTetrominoShape(value: unknown): value is number[][] {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }

  // Check each row
  const expectedWidth = value[0]?.length;
  if (typeof expectedWidth !== "number" || expectedWidth === 0) {
    return false;
  }

  return value.every(
    (row) =>
      Array.isArray(row) &&
      row.length === expectedWidth &&
      row.every((cell) => typeof cell === "number" && (cell === 0 || cell === 1)),
  );
}

/**
 * Type guard for Tetromino object
 */
export function isTetromino(value: unknown): value is Tetromino {
  if (!value || typeof value !== "object") {
    return false;
  }

  const piece = value as any;

  return (
    isTetrominoTypeName(piece.type) &&
    isPosition(piece.position) &&
    typeof piece.rotation === "number" &&
    Number.isInteger(piece.rotation) &&
    piece.rotation >= 0 &&
    piece.rotation <= 3 &&
    isTetrominoShape(piece.shape)
  );
}

/**
 * Type guard for valid score value
 */
export function isValidScore(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/**
 * Type guard for valid level value
 */
export function isValidLevel(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

/**
 * Type guard for valid lines value
 */
export function isValidLines(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/**
 * Type guard for valid animation trigger key
 */
export function isValidAnimationTriggerKey(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/**
 * Type guard for array of positions
 */
export function isPositionArray(value: unknown): value is Position[] {
  return Array.isArray(value) && value.every(isPosition);
}

/**
 * Type guard for array of line indices
 */
export function isLineIndicesArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.every(
      (index) =>
        typeof index === "number" && Number.isInteger(index) && index >= 0 && index < BOARD_HEIGHT,
    )
  );
}

/**
 * Comprehensive type guard for GameState
 */
export function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== "object") {
    return false;
  }

  const state = value as any;

  return (
    // Board validation
    isBoardMatrix(state.board) &&
    // Current piece validation (can be null)
    (state.currentPiece === null || isTetromino(state.currentPiece)) &&
    // Next piece validation
    isTetrominoTypeName(state.nextPiece) &&
    // Score state validation
    isValidScore(state.score) &&
    isValidLines(state.lines) &&
    isValidLevel(state.level) &&
    // Boolean flags validation
    typeof state.isGameOver === "boolean" &&
    typeof state.isPaused === "boolean" &&
    // Animation state validation
    isPositionArray(state.placedPositions) &&
    isLineIndicesArray(state.clearingLines) &&
    isValidAnimationTriggerKey(state.animationTriggerKey)
  );
}

/**
 * Assertion functions that throw TypeErrors for invalid types
 */

/**
 * Asserts that value is a valid Position
 */
export function assertPosition(value: unknown, paramName = "position"): asserts value is Position {
  if (!isPosition(value)) {
    throw new TypeError(
      `${paramName} must be a valid Position object with integer x and y coordinates`,
    );
  }
}

/**
 * Asserts that value is a valid board position
 */
export function assertValidBoardPosition(position: Position, paramName = "position"): void {
  if (!isValidBoardPosition(position)) {
    throw new TypeError(
      `${paramName} must be within board bounds (0-${BOARD_WIDTH - 1}, 0-${BOARD_HEIGHT - 1}), got (${position.x}, ${position.y})`,
    );
  }
}

/**
 * Asserts that value is a valid TetrominoTypeName
 */
export function assertTetrominoTypeName(
  value: unknown,
  paramName = "type",
): asserts value is TetrominoTypeName {
  if (!isTetrominoTypeName(value)) {
    throw new TypeError(
      `${paramName} must be a valid tetromino type (${TETROMINO_TYPES.join(", ")}), got ${String(value)}`,
    );
  }
}

/**
 * Asserts that value is a valid BoardMatrix
 */
export function assertBoardMatrix(
  value: unknown,
  paramName = "board",
): asserts value is BoardMatrix {
  if (!isBoardMatrix(value)) {
    throw new TypeError(
      `${paramName} must be a valid ${BOARD_WIDTH}x${BOARD_HEIGHT} board matrix with cell values 0-7`,
    );
  }
}

/**
 * Asserts that value is a valid Tetromino
 */
export function assertTetromino(
  value: unknown,
  paramName = "tetromino",
): asserts value is Tetromino {
  if (!isTetromino(value)) {
    throw new TypeError(`${paramName} must be a valid Tetromino object`);
  }
}

/**
 * Asserts that value is a valid GameState
 */
export function assertGameState(
  value: unknown,
  paramName = "gameState",
): asserts value is GameState {
  if (!isGameState(value)) {
    throw new TypeError(`${paramName} must be a valid GameState object`);
  }
}

/**
 * Runtime type checking utilities
 */

/**
 * Safely casts unknown value to Position with validation
 */
export function safePosition(value: unknown): Position | null {
  return isPosition(value) ? value : null;
}

/**
 * Safely casts unknown value to TetrominoTypeName with validation
 */
export function safeTetrominoTypeName(value: unknown): TetrominoTypeName | null {
  return isTetrominoTypeName(value) ? value : null;
}

/**
 * Safely casts unknown value to BoardMatrix with validation
 */
export function safeBoardMatrix(value: unknown): BoardMatrix | null {
  return isBoardMatrix(value) ? value : null;
}

/**
 * Safely casts unknown value to Tetromino with validation
 */
export function safeTetromino(value: unknown): Tetromino | null {
  return isTetromino(value) ? value : null;
}

/**
 * Safely casts unknown value to GameState with validation
 */
export function safeGameState(value: unknown): GameState | null {
  return isGameState(value) ? value : null;
}

/**
 * Generic type guard creator for arrays
 */
export function createArrayTypeGuard<T>(
  itemGuard: (value: unknown) => value is T,
): (value: unknown) => value is T[] {
  return (value: unknown): value is T[] => {
    return Array.isArray(value) && value.every(itemGuard);
  };
}

/**
 * Generic type guard creator for optional values
 */
export function createOptionalTypeGuard<T>(
  typeGuard: (value: unknown) => value is T,
): (value: unknown) => value is T | null | undefined {
  return (value: unknown): value is T | null | undefined => {
    return value === null || value === undefined || typeGuard(value);
  };
}

/**
 * Advanced type narrowing utilities
 */

/**
 * Type guard for non-null current piece
 */
export function hasCurrentPiece(
  state: GameState,
): state is GameState & { currentPiece: Tetromino } {
  return state.currentPiece !== null;
}

/**
 * Type guard for game over state
 */
export function isGameOver(
  state: GameState,
): state is GameState & { isGameOver: true; currentPiece: null } {
  return state.isGameOver === true;
}

/**
 * Type guard for paused state
 */
export function isPaused(state: GameState): state is GameState & { isPaused: true } {
  return state.isPaused === true;
}

/**
 * Type guard for active game state (not game over and not paused)
 */
export function isActiveGame(
  state: GameState,
): state is GameState & { isGameOver: false; isPaused: false } {
  return !state.isGameOver && !state.isPaused;
}

/**
 * Type guard for clearing lines animation
 */
export function isClearingLines(
  state: GameState,
): state is GameState & { clearingLines: [number, ...number[]] } {
  return state.clearingLines.length > 0;
}

/**
 * Type narrowing for placed positions animation
 */
export function hasPlacedPositions(
  state: GameState,
): state is GameState & { placedPositions: [Position, ...Position[]] } {
  return state.placedPositions.length > 0;
}

import { ERROR_CODES, GameStateError } from "../types/errors";
import type { BoardMatrix, GameState, Tetromino, TetrominoTypeName } from "../types/game";
import { TETROMINO_TYPES } from "../types/game";
import { BOARD_HEIGHT, BOARD_WIDTH } from "./constants";

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Comprehensive validation options
 */
export interface ValidationOptions {
  checkBoardIntegrity: boolean;
  checkPieceValidity: boolean;
  checkScoreConsistency: boolean;
  checkAnimationState: boolean;
  strictMode: boolean;
}

/**
 * Default validation options
 */
export const DEFAULT_VALIDATION_OPTIONS: ValidationOptions = {
  checkBoardIntegrity: true,
  checkPieceValidity: true,
  checkScoreConsistency: true,
  checkAnimationState: false, // Less critical for core game logic
  strictMode: false,
};

/**
 * Validates if a board matrix has correct dimensions and valid cell values
 */
export function validateBoardMatrix(board: BoardMatrix): ValidationResult {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  // Check dimensions
  if (!board || !Array.isArray(board)) {
    result.isValid = false;
    result.errors.push("Board must be a valid array");
    return result;
  }

  if (board.length !== BOARD_HEIGHT) {
    result.isValid = false;
    result.errors.push(`Board height must be ${BOARD_HEIGHT}, got ${board.length}`);
  }

  // Check each row
  for (let y = 0; y < board.length; y++) {
    const row = board[y];
    if (!Array.isArray(row)) {
      result.isValid = false;
      result.errors.push(`Row ${y} must be an array`);
      continue;
    }

    if (row.length !== BOARD_WIDTH) {
      result.isValid = false;
      result.errors.push(`Row ${y} width must be ${BOARD_WIDTH}, got ${row.length}`);
      continue;
    }

    // Check cell values
    for (let x = 0; x < row.length; x++) {
      const cell = row[x];
      if (!Number.isInteger(cell) || cell < 0 || cell > 7) {
        result.isValid = false;
        result.errors.push(`Invalid cell value at (${x}, ${y}): ${cell}. Must be 0-7`);
      }
    }
  }

  return result;
}

/**
 * Validates a tetromino piece
 */
export function validateTetromino(piece: Tetromino | null): ValidationResult {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  if (piece === null) {
    return result; // null is valid for currentPiece
  }

  // Check type
  if (!piece.type || !TETROMINO_TYPES.includes(piece.type)) {
    result.isValid = false;
    result.errors.push(`Invalid tetromino type: ${piece.type}`);
  }

  // Check position
  if (
    !piece.position ||
    typeof piece.position.x !== "number" ||
    typeof piece.position.y !== "number"
  ) {
    result.isValid = false;
    result.errors.push("Tetromino position must have valid x and y coordinates");
  } else {
    if (!Number.isInteger(piece.position.x) || !Number.isInteger(piece.position.y)) {
      result.warnings.push("Tetromino position coordinates should be integers");
    }
  }

  // Check rotation
  if (typeof piece.rotation !== "number" || !Number.isInteger(piece.rotation)) {
    result.isValid = false;
    result.errors.push("Tetromino rotation must be an integer");
  } else if (piece.rotation < 0 || piece.rotation > 3) {
    result.isValid = false;
    result.errors.push(`Tetromino rotation must be 0-3, got ${piece.rotation}`);
  }

  // Check shape
  if (!piece.shape || !Array.isArray(piece.shape)) {
    result.isValid = false;
    result.errors.push("Tetromino shape must be a 2D array");
  } else {
    if (piece.shape.length === 0) {
      result.isValid = false;
      result.errors.push("Tetromino shape cannot be empty");
    } else {
      const expectedWidth = piece.shape[0].length;
      for (let y = 0; y < piece.shape.length; y++) {
        const row = piece.shape[y];
        if (!Array.isArray(row)) {
          result.isValid = false;
          result.errors.push(`Tetromino shape row ${y} must be an array`);
          continue;
        }
        if (row.length !== expectedWidth) {
          result.isValid = false;
          result.errors.push(`Tetromino shape row ${y} width inconsistent`);
        }
        for (let x = 0; x < row.length; x++) {
          if (typeof row[x] !== "number" || (row[x] !== 0 && row[x] !== 1)) {
            result.isValid = false;
            result.errors.push(`Invalid shape cell at (${x}, ${y}): ${row[x]}. Must be 0 or 1`);
          }
        }
      }
    }
  }

  return result;
}

/**
 * Validates next piece type
 */
export function validateNextPiece(nextPiece: TetrominoTypeName): ValidationResult {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  if (!nextPiece || !TETROMINO_TYPES.includes(nextPiece)) {
    result.isValid = false;
    result.errors.push(`Invalid next piece type: ${nextPiece}`);
  }

  return result;
}

/**
 * Validates score-related values
 */
export function validateScoreState(score: number, lines: number, level: number): ValidationResult {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  // Score validation
  if (typeof score !== "number" || !Number.isInteger(score) || score < 0) {
    result.isValid = false;
    result.errors.push(`Score must be a non-negative integer, got ${score}`);
  }

  // Lines validation
  if (typeof lines !== "number" || !Number.isInteger(lines) || lines < 0) {
    result.isValid = false;
    result.errors.push(`Lines must be a non-negative integer, got ${lines}`);
  }

  // Level validation
  if (typeof level !== "number" || !Number.isInteger(level) || level < 1) {
    result.isValid = false;
    result.errors.push(`Level must be a positive integer, got ${level}`);
  }

  // Consistency check: level should generally correlate with lines
  if (result.isValid && level > 1) {
    const expectedMinLevel = Math.floor(lines / 10) + 1;
    if (level < expectedMinLevel - 1 || level > expectedMinLevel + 1) {
      result.warnings.push(`Level ${level} seems inconsistent with lines ${lines}`);
    }
  }

  return result;
}

/**
 * Validates animation state
 */
export function validateAnimationState(state: GameState): ValidationResult {
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  // Check placed positions
  if (!Array.isArray(state.placedPositions)) {
    result.isValid = false;
    result.errors.push("placedPositions must be an array");
  } else {
    for (let i = 0; i < state.placedPositions.length; i++) {
      const pos = state.placedPositions[i];
      if (!pos || typeof pos.x !== "number" || typeof pos.y !== "number") {
        result.isValid = false;
        result.errors.push(`Invalid placed position at index ${i}`);
      }
    }
  }

  // Check clearing lines
  if (!Array.isArray(state.clearingLines)) {
    result.isValid = false;
    result.errors.push("clearingLines must be an array");
  } else {
    for (let i = 0; i < state.clearingLines.length; i++) {
      const lineIndex = state.clearingLines[i];
      if (!Number.isInteger(lineIndex) || lineIndex < 0 || lineIndex >= BOARD_HEIGHT) {
        result.isValid = false;
        result.errors.push(`Invalid clearing line index: ${lineIndex}`);
      }
    }
  }

  // Check animation trigger key
  if (
    typeof state.animationTriggerKey !== "number" ||
    !Number.isInteger(state.animationTriggerKey)
  ) {
    result.isValid = false;
    result.errors.push("animationTriggerKey must be an integer");
  }

  return result;
}

/**
 * Comprehensive game state validation
 */
export function validateGameState(
  state: GameState,
  options: Partial<ValidationOptions> = {},
): ValidationResult {
  const opts = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
  const result: ValidationResult = { isValid: true, errors: [], warnings: [] };

  // Basic state structure check
  if (!state || typeof state !== "object") {
    result.isValid = false;
    result.errors.push("Game state must be a valid object");
    return result;
  }

  // Check boolean flags
  if (typeof state.isGameOver !== "boolean") {
    result.isValid = false;
    result.errors.push("isGameOver must be a boolean");
  }

  if (typeof state.isPaused !== "boolean") {
    result.isValid = false;
    result.errors.push("isPaused must be a boolean");
  }

  // Board validation
  if (opts.checkBoardIntegrity) {
    const boardResult = validateBoardMatrix(state.board);
    result.errors.push(...boardResult.errors);
    result.warnings.push(...boardResult.warnings);
    if (!boardResult.isValid) {
      result.isValid = false;
    }
  }

  // Piece validation
  if (opts.checkPieceValidity) {
    const pieceResult = validateTetromino(state.currentPiece);
    result.errors.push(...pieceResult.errors);
    result.warnings.push(...pieceResult.warnings);
    if (!pieceResult.isValid) {
      result.isValid = false;
    }

    const nextPieceResult = validateNextPiece(state.nextPiece);
    result.errors.push(...nextPieceResult.errors);
    result.warnings.push(...nextPieceResult.warnings);
    if (!nextPieceResult.isValid) {
      result.isValid = false;
    }
  }

  // Score validation
  if (opts.checkScoreConsistency) {
    const scoreResult = validateScoreState(state.score, state.lines, state.level);
    result.errors.push(...scoreResult.errors);
    result.warnings.push(...scoreResult.warnings);
    if (!scoreResult.isValid) {
      result.isValid = false;
    }
  }

  // Animation validation
  if (opts.checkAnimationState) {
    const animationResult = validateAnimationState(state);
    result.errors.push(...animationResult.errors);
    result.warnings.push(...animationResult.warnings);
    if (!animationResult.isValid) {
      result.isValid = false;
    }
  }

  return result;
}

/**
 * Throws a GameStateError if validation fails
 * Use this for critical validations where the game should stop on invalid state
 */
export function assertValidGameState(
  state: GameState,
  options: Partial<ValidationOptions> = {},
  context?: string,
): void {
  const validationResult = validateGameState(state, options);

  if (!validationResult.isValid) {
    throw new GameStateError(
      ERROR_CODES.INVALID_GAME_STATE,
      `Game state validation failed${context ? ` in ${context}` : ""}: ${validationResult.errors.join(", ")}`,
      {
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        context,
      },
      false, // Validation failures should not be auto-recovered
    );
  }
}

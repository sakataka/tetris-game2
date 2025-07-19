import type {
  CellValue,
  ComboState,
  FloatingScoreEvent,
  GameBoard,
  GameState,
  LevelCelebrationState,
  Position,
  RotationState,
  ScoreAnimationState,
  Tetromino,
  TetrominoTypeName,
  TSpinState,
} from "@/types/game";

/**
 * Validates and normalizes rotation state to ensure it's within bounds
 */
export function normalizeRotationState(rotation: number): RotationState {
  const normalized = ((rotation % 4) + 4) % 4; // Handle negative rotations
  return normalized as RotationState;
}

/**
 * Type guard for RotationState
 */
export function isRotationState(value: unknown): value is RotationState {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 3;
}

/**
 * Type guard for TetrominoTypeName
 */
export function isTetrominoTypeName(value: unknown): value is TetrominoTypeName {
  return typeof value === "string" && ["I", "O", "T", "S", "Z", "J", "L"].includes(value);
}

/**
 * Type guard for CellValue
 */
export function isCellValue(value: unknown): value is CellValue {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 9;
}

/**
 * Type guard for Position
 */
export function isPosition(value: unknown): value is Position {
  return (
    typeof value === "object" &&
    value !== null &&
    "x" in value &&
    "y" in value &&
    typeof (value as Position).x === "number" &&
    typeof (value as Position).y === "number" &&
    Number.isInteger((value as Position).x) &&
    Number.isInteger((value as Position).y)
  );
}

/**
 * Type guard for Tetromino shape matrix
 */
export function isTetrominoShape(value: unknown): value is CellValue[][] {
  if (!Array.isArray(value)) return false;
  if (value.length === 0) return false;

  return value.every(
    (row) => Array.isArray(row) && row.length > 0 && row.every((cell) => isCellValue(cell)),
  );
}

/**
 * Type guard for Tetromino
 */
export function isTetromino(value: unknown): value is Tetromino {
  if (typeof value !== "object" || value === null) return false;

  const tetromino = value as Tetromino;
  return (
    isTetrominoTypeName(tetromino.type) &&
    isPosition(tetromino.position) &&
    isRotationState(tetromino.rotation) &&
    isTetrominoShape(tetromino.shape)
  );
}

/**
 * Type guard for GameBoard
 */
export function isGameBoard(
  value: unknown,
  expectedWidth = 10,
  expectedHeight = 20,
): value is GameBoard {
  if (!Array.isArray(value)) return false;
  if (value.length !== expectedHeight) return false;

  return value.every(
    (row) =>
      Array.isArray(row) && row.length === expectedWidth && row.every((cell) => isCellValue(cell)),
  );
}

/**
 * Type guard for TSpinState
 */
export function isTSpinState(value: unknown): value is TSpinState {
  if (typeof value !== "object" || value === null) return false;

  const tSpin = value as TSpinState;
  return (
    ["none", "mini", "normal"].includes(tSpin.type) &&
    typeof tSpin.show === "boolean" &&
    typeof tSpin.linesCleared === "number" &&
    Number.isInteger(tSpin.linesCleared) &&
    tSpin.linesCleared >= 0
  );
}

/**
 * Type guard for ComboState
 */
export function isComboState(value: unknown): value is ComboState {
  if (typeof value !== "object" || value === null) return false;

  const combo = value as ComboState;
  return (
    typeof combo.count === "number" &&
    Number.isInteger(combo.count) &&
    combo.count >= 0 &&
    typeof combo.isActive === "boolean" &&
    (combo.lastClearType === null ||
      ["single", "double", "triple", "tetris", "tspin"].includes(combo.lastClearType))
  );
}

/**
 * Type guard for ScoreAnimationState
 */
export function isScoreAnimationState(value: unknown): value is ScoreAnimationState {
  if (typeof value !== "object" || value === null) return false;

  const scoreAnim = value as ScoreAnimationState;
  return (
    typeof scoreAnim.previousScore === "number" &&
    typeof scoreAnim.scoreIncrease === "number" &&
    typeof scoreAnim.lineCount === "number" &&
    typeof scoreAnim.isTetris === "boolean" &&
    typeof scoreAnim.animationTriggerTime === "number" &&
    Number.isInteger(scoreAnim.lineCount) &&
    scoreAnim.lineCount >= 0 &&
    (scoreAnim.clearType === null ||
      ["single", "double", "triple", "tetris", "tspin"].includes(scoreAnim.clearType))
  );
}

/**
 * Type guard for FloatingScoreEvent
 */
export function isFloatingScoreEvent(value: unknown): value is FloatingScoreEvent {
  if (typeof value !== "object" || value === null) return false;

  const event = value as FloatingScoreEvent;
  return (
    typeof event.id === "string" &&
    typeof event.points === "number" &&
    isPosition(event.position) &&
    typeof event.startTime === "number" &&
    typeof event.isActive === "boolean"
  );
}

/**
 * Type guard for LevelCelebrationState
 */
export function isLevelCelebrationState(value: unknown): value is LevelCelebrationState {
  if (typeof value !== "object" || value === null) return false;

  const celebration = value as LevelCelebrationState;
  return (
    typeof celebration.isActive === "boolean" &&
    (celebration.level === null ||
      (typeof celebration.level === "number" && Number.isInteger(celebration.level))) &&
    (celebration.startTime === null || typeof celebration.startTime === "number") &&
    ["intro", "main", "outro", "completed"].includes(celebration.phase) &&
    typeof celebration.userCancelled === "boolean"
  );
}

/**
 * Comprehensive type guard for GameState
 */
export function isGameState(value: unknown): value is GameState {
  if (typeof value !== "object" || value === null) return false;

  const state = value as GameState;

  // Check required properties
  if (!isGameBoard(state.board)) return false;
  if (state.boardBeforeClear !== null && !isGameBoard(state.boardBeforeClear)) return false;
  if (state.currentPiece !== null && !isTetromino(state.currentPiece)) return false;
  if (state.ghostPiece !== null && !isTetromino(state.ghostPiece)) return false;
  if (!isTetrominoTypeName(state.nextPiece)) return false;
  if (state.heldPiece !== null && !isTetrominoTypeName(state.heldPiece)) return false;

  // Check primitive properties
  if (typeof state.canHold !== "boolean") return false;
  if (typeof state.score !== "number" || !Number.isInteger(state.score) || state.score < 0)
    return false;
  if (typeof state.lines !== "number" || !Number.isInteger(state.lines) || state.lines < 0)
    return false;
  if (typeof state.level !== "number" || !Number.isInteger(state.level) || state.level < 1)
    return false;
  if (typeof state.isGameOver !== "boolean") return false;
  if (typeof state.isPaused !== "boolean") return false;

  // Check arrays
  if (!Array.isArray(state.placedPositions) || !state.placedPositions.every(isPosition))
    return false;
  if (
    !Array.isArray(state.clearingLines) ||
    !state.clearingLines.every(
      (line) => typeof line === "number" && Number.isInteger(line) && line >= 0,
    )
  )
    return false;
  if (!Array.isArray(state.pieceBag) || !state.pieceBag.every(isTetrominoTypeName)) return false;
  if (
    !Array.isArray(state.floatingScoreEvents) ||
    !state.floatingScoreEvents.every(isFloatingScoreEvent)
  )
    return false;

  // Check complex state objects
  if (!isTSpinState(state.tSpinState)) return false;
  if (!isComboState(state.comboState)) return false;
  if (!isScoreAnimationState(state.scoreAnimationState)) return false;
  if (!isLevelCelebrationState(state.levelCelebrationState)) return false;

  // Check optional position
  if (state.ghostPosition !== null && !isPosition(state.ghostPosition)) return false;

  return true;
}

/**
 * Schema-based type guard factory for external data validation
 */
export interface ValidationSchema<T> {
  validate: (value: unknown) => value is T;
  sanitize?: (value: unknown) => T | null;
  defaultValue?: T;
}

/**
 * Creates a schema-based type guard
 */
export function createSchemaValidator<T>(schema: ValidationSchema<T>) {
  return {
    validate: schema.validate,
    validateAndSanitize: (value: unknown): T | null => {
      if (schema.validate(value)) {
        return value;
      }
      if (schema.sanitize) {
        return schema.sanitize(value);
      }
      return schema.defaultValue ?? null;
    },
    validateWithDefault: (value: unknown): T => {
      if (schema.validate(value)) {
        return value;
      }
      if (schema.sanitize) {
        const sanitized = schema.sanitize(value);
        if (sanitized !== null) {
          return sanitized;
        }
      }
      if (schema.defaultValue !== undefined) {
        return schema.defaultValue;
      }
      throw new Error("Validation failed and no default value provided");
    },
  };
}

/**
 * Predefined schemas for common game data validation
 */
export const GameDataSchemas = {
  position: createSchemaValidator<Position>({
    validate: isPosition,
    sanitize: (value: unknown): Position | null => {
      if (typeof value === "object" && value !== null && "x" in value && "y" in value) {
        const x = Number((value as { x: unknown }).x);
        const y = Number((value as { y: unknown }).y);
        if (!Number.isNaN(x) && !Number.isNaN(y) && Number.isFinite(x) && Number.isFinite(y)) {
          return { x: Math.floor(x), y: Math.floor(y) };
        }
      }
      return null;
    },
    defaultValue: { x: 0, y: 0 },
  }),

  tetromino: createSchemaValidator<Tetromino>({
    validate: isTetromino,
    sanitize: (value: unknown): Tetromino | null => {
      if (typeof value === "object" && value !== null) {
        const obj = value as Record<string, unknown>;
        const type = isTetrominoTypeName(obj.type) ? (obj.type as TetrominoTypeName) : "T";
        const position = GameDataSchemas.position.validateAndSanitize(obj.position) ?? {
          x: 4,
          y: 0,
        };
        const rotation = isRotationState(obj.rotation) ? (obj.rotation as RotationState) : 0;

        // For sanitization, we'd need to generate a proper shape based on type and rotation
        // This is a simplified version
        if (isTetrominoShape(obj.shape)) {
          return { type, position, rotation, shape: obj.shape };
        }
      }
      return null;
    },
  }),

  gameBoard: createSchemaValidator<GameBoard>({
    validate: isGameBoard,
    sanitize: (value: unknown): GameBoard | null => {
      if (Array.isArray(value)) {
        const sanitized: GameBoard = [];
        for (let y = 0; y < 20; y++) {
          const row: CellValue[] = [];
          const sourceRow = value[y];
          if (Array.isArray(sourceRow)) {
            for (let x = 0; x < 10; x++) {
              const cell = sourceRow[x];
              row.push(isCellValue(cell) ? cell : 0);
            }
          } else {
            // Fill with empty cells
            for (let x = 0; x < 10; x++) {
              row.push(0);
            }
          }
          sanitized.push(row);
        }
        return sanitized;
      }
      return null;
    },
    defaultValue: Array(20)
      .fill(null)
      .map(() => Array(10).fill(0)) as GameBoard,
  }),

  gameState: createSchemaValidator<GameState>({
    validate: isGameState,
    // GameState sanitization would be complex, so we'll skip it for now
    sanitize: undefined,
  }),
} as const;

/**
 * Utility functions for common validation patterns
 */
export const ValidationUtils = {
  /**
   * Validates that a number is within a specific range
   */
  isInRange: (value: unknown, min: number, max: number): value is number => {
    return typeof value === "number" && value >= min && value <= max;
  },

  /**
   * Validates that a value is one of the allowed values
   */
  isOneOf: <T>(value: unknown, allowedValues: readonly T[]): value is T => {
    return allowedValues.includes(value as T);
  },

  /**
   * Validates that an array contains only valid elements
   */
  isArrayOf: <T>(value: unknown, elementValidator: (item: unknown) => item is T): value is T[] => {
    return Array.isArray(value) && value.every(elementValidator);
  },

  /**
   * Validates that an object has all required properties
   */
  hasRequiredProperties: <T extends Record<string, unknown>>(
    value: unknown,
    requiredKeys: (keyof T)[],
  ): value is T => {
    if (typeof value !== "object" || value === null) return false;
    return requiredKeys.every((key) => key in value);
  },

  /**
   * Safely converts a value to a number
   */
  toSafeNumber: (value: unknown, defaultValue = 0): number => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
    return defaultValue;
  },

  /**
   * Safely converts a value to an integer
   */
  toSafeInteger: (value: unknown, defaultValue = 0): number => {
    const num = ValidationUtils.toSafeNumber(value, defaultValue);
    return Math.floor(num);
  },

  /**
   * Safely converts a value to a boolean
   */
  toSafeBoolean: (value: unknown, defaultValue = false): boolean => {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      if (lower === "true" || lower === "1") return true;
      if (lower === "false" || lower === "0") return false;
    }
    if (typeof value === "number") {
      return value !== 0;
    }
    return defaultValue;
  },
} as const;

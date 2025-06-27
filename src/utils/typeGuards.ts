import type { CellValue, RotationState, TetrominoTypeName } from "../types/game";
import { TETROMINO_TYPES } from "../types/game";

/**
 * Type guard to check if a string is a valid tetromino type
 */
export function isValidTetrominoType(type: string): type is TetrominoTypeName {
  return TETROMINO_TYPES.includes(type as TetrominoTypeName);
}

/**
 * Type guard to check if a number is a valid cell value
 */
export function isValidCellValue(value: number): value is CellValue {
  return Number.isInteger(value) && value >= 0 && value <= 7;
}

/**
 * Type guard to check if a number is a valid rotation state
 */
export function isValidRotationState(rotation: number): rotation is RotationState {
  return Number.isInteger(rotation) && rotation >= 0 && rotation <= 3;
}

/**
 * Type guard to check if a value is a valid board row
 */
export function isValidBoardRow(row: unknown[]): row is CellValue[] {
  return (
    Array.isArray(row) && row.every((cell) => typeof cell === "number" && isValidCellValue(cell))
  );
}

/**
 * Type guard to check if a value is a valid board matrix
 */
export function isValidBoardMatrix(board: unknown[][]): board is CellValue[][] {
  return Array.isArray(board) && board.every((row) => isValidBoardRow(row));
}

/**
 * Validates and normalizes rotation state to ensure it's within bounds
 */
export function normalizeRotationState(rotation: number): RotationState {
  const normalized = ((rotation % 4) + 4) % 4; // Handle negative rotations
  return normalized as RotationState;
}

/**
 * Safely gets a tetromino type name, throwing if invalid
 */
export function assertValidTetrominoType(type: string): TetrominoTypeName {
  if (!isValidTetrominoType(type)) {
    throw new Error(`Invalid tetromino type: ${type}`);
  }
  return type;
}

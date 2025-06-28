/**
 * Clean Code utilities - Uncle Bob principles applied
 * Comprehensive export of all utility functions
 */

// Position and board utilities
export {
  createPosition,
  createCellKey,
  parseCellKey,
  isValidBoardPosition,
  isPositionInBounds,
  addPositions,
  arePositionsEqual,
} from "./boardUtils";

// Game state validation utilities
export {
  isGamePlayable,
  canPerformHoldAction,
  isCellOccupied,
  canPlacePieceAt,
  isGameOverState,
} from "./gameValidation";

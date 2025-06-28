import type { GameBoard, Position, Tetromino } from "@/types/game";
import { isValidBoardPosition } from "./boardUtils";

/**
 * Clean Code utility functions for game state validation
 * Following Uncle Bob's principles: single responsibility, meaningful names, pure functions
 */

// Game state validation (eliminating duplication)
export const isGamePlayable = (state: {
  readonly currentPiece: Tetromino | null;
  readonly isGameOver: boolean;
  readonly isPaused: boolean;
}): boolean => state.currentPiece !== null && !state.isGameOver && !state.isPaused;

// Hold action validation
export const canPerformHoldAction = (state: {
  readonly currentPiece: Tetromino | null;
  readonly canHold: boolean;
  readonly isGameOver: boolean;
  readonly isPaused: boolean;
}): boolean => state.currentPiece !== null && state.canHold && !state.isGameOver && !state.isPaused;

// Board cell validation
export const isCellOccupied = (board: GameBoard, { x, y }: Position): boolean =>
  board[y]?.[x] !== 0 && board[y]?.[x] !== undefined;

// Piece placement validation
export const canPlacePieceAt = (
  board: GameBoard,
  shape: number[][],
  position: Position,
): boolean => {
  return shape.every((row, rowIndex) =>
    row.every((cell, colIndex) => {
      if (cell === 0) return true;

      const boardPosition = {
        x: position.x + colIndex,
        y: position.y + rowIndex,
      };

      return isValidBoardPosition(boardPosition) && !isCellOccupied(board, boardPosition);
    }),
  );
};

// Game over detection
export const isGameOverState = (board: GameBoard, piece: Tetromino): boolean =>
  !canPlacePieceAt(board, piece.shape, piece.position);

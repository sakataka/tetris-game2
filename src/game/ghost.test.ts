import { describe, expect, it } from "bun:test";
import type { GameState } from "@/types/game";
import { createEmptyBoard } from "./board";
import { calculateGhostPosition, createInitialGameState } from "./game";
import { createTetromino } from "./tetrominos";

describe("calculateGhostPosition", () => {
  it("returns null when there is no current piece", () => {
    const state: GameState = {
      ...createInitialGameState(),
      currentPiece: null,
    };

    const result = calculateGhostPosition(state);
    expect(result).toBeNull();
  });

  it("returns null when game is over", () => {
    const state: GameState = {
      ...createInitialGameState(),
      isGameOver: true,
    };

    const result = calculateGhostPosition(state);
    expect(result).toBeNull();
  });

  it("returns null when ghost position is same as current position", () => {
    const state: GameState = {
      ...createInitialGameState(),
      board: createEmptyBoard(),
      currentPiece: {
        ...createTetromino("I"),
        position: { x: 4, y: 19 }, // Bottom of the board
      },
    };

    const result = calculateGhostPosition(state);
    expect(result).toBeNull();
  });

  it("calculates correct ghost position for falling piece", () => {
    const state: GameState = {
      ...createInitialGameState(),
      board: createEmptyBoard(),
      currentPiece: {
        ...createTetromino("I"),
        position: { x: 4, y: 0 }, // Top of the board
      },
    };

    const result = calculateGhostPosition(state);

    // I-piece lands at y: 18 (actual effective height is 2 rows)
    expect(result).toEqual({ x: 4, y: 18 });
  });

  it("calculates ghost position correctly with obstacles on board", () => {
    const board = createEmptyBoard();
    // Add obstacle at bottom
    board[19] = [0, 0, 0, 0, 1, 1, 0, 0, 0, 0];
    board[18] = [0, 0, 0, 0, 1, 1, 0, 0, 0, 0];

    const state: GameState = {
      ...createInitialGameState(),
      board,
      currentPiece: {
        ...createTetromino("I"),
        position: { x: 4, y: 0 }, // Top of the board
      },
    };

    const result = calculateGhostPosition(state);

    // I-piece should land at y: 16 (stopped by obstacle at y: 18-19)
    expect(result).toEqual({ x: 4, y: 16 });
  });

  it("calculates ghost position correctly for T-piece", () => {
    const state: GameState = {
      ...createInitialGameState(),
      board: createEmptyBoard(),
      currentPiece: {
        ...createTetromino("T"),
        position: { x: 4, y: 0 }, // Top of the board
      },
    };

    const result = calculateGhostPosition(state);

    // T-piece should land at y: 18 (20 - 2 rows for T-piece height)
    expect(result).toEqual({ x: 4, y: 18 });
  });

  it("calculates ghost position correctly for O-piece", () => {
    const state: GameState = {
      ...createInitialGameState(),
      board: createEmptyBoard(),
      currentPiece: {
        ...createTetromino("O"),
        position: { x: 4, y: 0 }, // Top of the board
      },
    };

    const result = calculateGhostPosition(state);

    // O-piece should land at y: 18 (20 - 2 rows for O-piece height)
    expect(result).toEqual({ x: 4, y: 18 });
  });

  it("handles edge case when piece is near side wall", () => {
    const state: GameState = {
      ...createInitialGameState(),
      board: createEmptyBoard(),
      currentPiece: {
        ...createTetromino("I"),
        position: { x: 0, y: 0 }, // Left edge
      },
    };

    const result = calculateGhostPosition(state);

    expect(result).toEqual({ x: 0, y: 18 });
  });

  it("handles edge case when piece is near right wall", () => {
    const state: GameState = {
      ...createInitialGameState(),
      board: createEmptyBoard(),
      currentPiece: {
        ...createTetromino("I"),
        position: { x: 6, y: 0 }, // Near right edge for I-piece (4 units wide)
      },
    };

    const result = calculateGhostPosition(state);

    expect(result).toEqual({ x: 6, y: 18 });
  });
});

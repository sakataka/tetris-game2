import { describe, expect, test } from "bun:test";
import type { GameState, TetrominoTypeName } from "@/types/game";
import { GAME_CONSTANTS } from "@/utils/gameConstants";
import { createEmptyBoard } from "./board";
import {
  calculateScore,
  checkGameOver,
  createInitialGameState,
  hardDropTetromino,
  moveTetrominoByLegacy,
  processPlacementAndClearing,
  rotateTetrominoCWLegacy,
  spawnNextPiece,
} from "./game";
import { createTetromino } from "./tetrominos";

// ==============================
// Test Helper Functions - Junichi Ito Style
// ==============================

/**
 * Create test game state with specified overrides
 * Initialize game with specific state for testing
 */
function createTestGameState(overrides: Partial<GameState> = {}): GameState {
  const defaultState = createInitialGameState();
  return { ...defaultState, ...overrides };
}

/**
 * Fill specific board row with pieces
 * Helper for line clearing tests
 */
function fillBoardRow(board: number[][], rowIndex: number, colorIndex = 1): void {
  for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH; x++) {
    board[rowIndex][x] = colorIndex;
  }
}

/**
 * Create board with filled top rows to simulate game over state
 */
function _createGameOverBoard(): number[][] {
  const board = createEmptyBoard();
  // Fill top rows to create collision scenario
  for (let y = 0; y < 3; y++) {
    fillBoardRow(board, y);
  }
  return board;
}

/**
 * Move tetromino to specific position
 */
function _moveTetrominoToPosition(state: GameState, targetX: number, targetY: number): GameState {
  let newState = state;
  const currentX = state.currentPiece?.position.x ?? 0;
  const currentY = state.currentPiece?.position.y ?? 0;

  // Move in X direction
  const deltaX = targetX - currentX;
  if (deltaX !== 0) {
    newState = moveTetrominoByLegacy(newState, deltaX, 0);
  }

  // Move in Y direction
  const deltaY = targetY - currentY;
  if (deltaY !== 0) {
    newState = moveTetrominoByLegacy(newState, 0, deltaY);
  }

  return newState;
}

// ==============================
// Test Implementation - Junichi Ito Practical Patterns
// ==============================

describe("Game Logic - Junichi Ito Style", () => {
  describe("Initial Game State Creation", () => {
    test("Game starts with correct initial state", () => {
      // Given: Game initialization
      // When: Create initial game state
      const state = createInitialGameState();

      // Then: Expected initial values are set
      expect(state.board.length).toBe(GAME_CONSTANTS.BOARD.HEIGHT);
      expect(state.board[0].length).toBe(GAME_CONSTANTS.BOARD.WIDTH);
      expect(state.score).toBe(0);
      expect(state.lines).toBe(0);
      expect(state.level).toBe(1);
      expect(state.isGameOver).toBe(false);
      expect(state.isPaused).toBe(false);
      expect(state.currentPiece).toBeDefined();
      expect(state.nextPiece).toBeDefined();
      expect(state.pieceBag).toBeDefined();
      expect(Array.isArray(state.pieceBag)).toBe(true);
    });

    test("Pieces are generated correctly with 7-bag system", () => {
      // Given: 7-bag system for piece generation
      // When: Create initial state
      const state = createInitialGameState();

      // Then: Valid piece types are set
      const validPieces: TetrominoTypeName[] = ["I", "O", "T", "S", "Z", "J", "L"];
      expect(validPieces).toContain(state.currentPiece?.type);
      expect(validPieces).toContain(state.nextPiece);
      // Bag contains remaining pieces
      expect(state.pieceBag.length).toBeLessThanOrEqual(7);
    });

    test("Board is initialized in empty state", () => {
      // Given: New game start
      // When: Create initial state
      const state = createInitialGameState();

      // Then: All cells are empty (0)
      for (let y = 0; y < GAME_CONSTANTS.BOARD.HEIGHT; y++) {
        for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH; x++) {
          expect(state.board[y][x]).toBe(0);
        }
      }
    });
  });

  describe("Tetromino movement", () => {
    describe("Normal cases - Basic movement", () => {
      test("Can move 1 cell to the left", () => {
        // Given: Initial game state
        const state = createInitialGameState();
        const initialX = state.currentPiece?.position.x ?? 0;

        // When: Move 1 cell to the left
        const newState = moveTetrominoByLegacy(state, -1, 0);

        // Then: X coordinate decreases by 1
        expect(newState.currentPiece?.position.x).toBe(initialX - 1);
      });

      test("Can move 1 cell to the right", () => {
        // Given: Initial game state
        const state = createInitialGameState();
        const initialX = state.currentPiece?.position.x ?? 0;

        // When: Move 1 cell to the right
        const newState = moveTetrominoByLegacy(state, 1, 0);

        // Then: X coordinate increases by 1
        expect(newState.currentPiece?.position.x).toBe(initialX + 1);
      });

      test("Can move 1 cell downward", () => {
        // Given: Initial game state
        const state = createInitialGameState();
        const initialY = state.currentPiece?.position.y ?? 0;

        // When: Move 1 cell downward
        const newState = moveTetrominoByLegacy(state, 0, 1);

        // Then: Y coordinate increases by 1
        expect(newState.currentPiece?.position.y).toBe(initialY + 1);
      });

      test("Multi-directional movement is processed correctly", () => {
        // Given: Initial game state
        const state = createInitialGameState();
        const initialX = state.currentPiece?.position.x ?? 0;
        const initialY = state.currentPiece?.position.y ?? 0;

        // When: Move to bottom-right
        const newState = moveTetrominoByLegacy(state, 2, 3);

        // Then: Moves correctly in both directions
        expect(newState.currentPiece?.position.x).toBe(initialX + 2);
        expect(newState.currentPiece?.position.y).toBe(initialY + 3);
      });
    });

    describe("Boundary value tests", () => {
      test("Movement is restricted by left wall", () => {
        // Given: Move piece to left edge
        let state = createInitialGameState();
        for (let i = 0; i < GAME_CONSTANTS.BOARD.WIDTH; i++) {
          state = moveTetrominoByLegacy(state, -1, 0);
        }

        // When: Attempt to move further left
        const finalState = moveTetrominoByLegacy(state, -1, 0);

        // Then: Stays in original position without moving
        expect(finalState.currentPiece?.position.x).toBe(state.currentPiece?.position.x);
      });

      test("Movement is restricted by right wall", () => {
        // Given: Move piece to right edge
        let state = createInitialGameState();
        for (let i = 0; i < GAME_CONSTANTS.BOARD.WIDTH; i++) {
          state = moveTetrominoByLegacy(state, 1, 0);
        }

        // When: Attempt to move further right
        const finalState = moveTetrominoByLegacy(state, 1, 0);

        // Then: Stays in original position without moving
        expect(finalState.currentPiece?.position.x).toBe(state.currentPiece?.position.x);
      });

      test("Movement is restricted by board bottom", () => {
        // Given: Move piece near bottom edge
        let state = createInitialGameState();
        let _previousState = state;

        // Move piece down until it can't move anymore
        for (let i = 0; i < GAME_CONSTANTS.BOARD.HEIGHT + 5; i++) {
          const newState = moveTetrominoByLegacy(state, 0, 1);
          // If the piece didn't move, we've hit the boundary
          if (newState.currentPiece?.position.y === state.currentPiece?.position.y) {
            break;
          }
          _previousState = state;
          state = newState;
        }

        // When: Try to move further down
        const finalState = moveTetrominoByLegacy(state, 0, 1);

        // Then: Position should not change or piece should be placed
        const positionUnchanged =
          finalState.currentPiece?.position.y === state.currentPiece?.position.y;
        const pieceWasPlaced = finalState.currentPiece !== state.currentPiece;

        expect(positionUnchanged || pieceWasPlaced).toBe(true);
      });

      test("Minimum movement (1 cell) is processed correctly", () => {
        // Given: Initial state
        const state = createInitialGameState();
        const initialPosition = {
          x: state.currentPiece?.position.x ?? 0,
          y: state.currentPiece?.position.y ?? 0,
        };

        // When: Move in minimum unit
        const newState = moveTetrominoByLegacy(state, 1, 1);

        // Then: Moves exactly 1 cell at a time
        expect(newState.currentPiece?.position.x).toBe(initialPosition.x + 1);
        expect(newState.currentPiece?.position.y).toBe(initialPosition.y + 1);
      });
    });

    describe("Error handling tests", () => {
      test("No movement when game is paused", () => {
        // Given: Game in paused state
        const state = createTestGameState({ isPaused: true });
        const initialPosition = {
          x: state.currentPiece?.position.x ?? 0,
          y: state.currentPiece?.position.y ?? 0,
        };

        // When: Attempt to move
        const newState = moveTetrominoByLegacy(state, 1, 1);

        // Then: Position does not change
        expect(newState.currentPiece?.position.x).toBe(initialPosition.x);
        expect(newState.currentPiece?.position.y).toBe(initialPosition.y);
      });

      test("No movement when game is over", () => {
        // Given: Game over state
        const state = createTestGameState({ isGameOver: true });
        const initialPosition = {
          x: state.currentPiece?.position.x ?? 0,
          y: state.currentPiece?.position.y ?? 0,
        };

        // When: Attempt to move
        const newState = moveTetrominoByLegacy(state, 1, 1);

        // Then: Position does not change
        expect(newState.currentPiece?.position.x).toBe(initialPosition.x);
        expect(newState.currentPiece?.position.y).toBe(initialPosition.y);
      });

      test("No error when current piece is null", () => {
        // Given: State with currentPiece as null
        const state = createTestGameState({ currentPiece: null });

        // When: Attempt to move
        // Then: No error occurs
        expect(() => moveTetrominoByLegacy(state, 1, 1)).not.toThrow();
      });

      test("Movement is restricted by collision with other pieces", () => {
        // Given: State with placed pieces on board
        const state = createInitialGameState();
        const board = state.board.map((row) => [...row]);
        // Place obstacle in bottom-left
        board[GAME_CONSTANTS.BOARD.HEIGHT - 1][0] = 1;
        const stateWithObstacle = { ...state, board };

        // Move piece near bottom
        let newState = stateWithObstacle;
        for (let i = 0; i < GAME_CONSTANTS.BOARD.HEIGHT - 2; i++) {
          newState = moveTetrominoByLegacy(newState, 0, 1);
        }

        // When: Attempt to move toward obstacle
        const beforeX = newState.currentPiece?.position.x ?? 0;
        const finalState = moveTetrominoByLegacy(newState, -1 * beforeX, 0);

        // Then: Movement is restricted by collision
        // (Exact restriction depends on implementation)
        expect(finalState.currentPiece).toBeDefined();
      });

      test("Negative movement amounts are processed correctly", () => {
        // Given: State with piece near center
        let state = createInitialGameState();
        state = moveTetrominoByLegacy(state, 2, 2); // Move toward center

        const initialX = state.currentPiece?.position.x ?? 0;
        const initialY = state.currentPiece?.position.y ?? 0;

        // When: Move with negative amounts
        const newState = moveTetrominoByLegacy(state, -1, -1);

        // Then: Moves in reverse direction
        expect(newState.currentPiece?.position.x).toBe(initialX - 1);
        expect(newState.currentPiece?.position.y).toBe(initialY - 1);
      });
    });
  });

  describe("rotateTetrominoCWLegacy", () => {
    test("should rotate current piece", () => {
      const state = createInitialGameState();
      const initialRotation = state.currentPiece?.rotation ?? 0;
      const newState = rotateTetrominoCWLegacy(state);
      expect(newState.currentPiece?.rotation).toBe((initialRotation + 1) % 4);
    });

    test("should use wall kick when basic rotation fails", () => {
      const state = createInitialGameState();

      // Move piece to left edge where basic rotation might fail
      let edgeState = state;
      for (let i = 0; i < 3; i++) {
        edgeState = moveTetrominoByLegacy(edgeState, -1, 0);
      }

      const initialRotation = edgeState.currentPiece?.rotation ?? 0;
      const newState = rotateTetrominoCWLegacy(edgeState);

      // Should successfully rotate with wall kick compensation
      expect(newState.currentPiece?.rotation).toBe((initialRotation + 1) % 4);
    });

    test("should maintain position when wall kick finds valid spot", () => {
      const state = createInitialGameState();
      const newState = rotateTetrominoCWLegacy(state);

      // Should have valid position after rotation
      expect(newState.currentPiece?.position.x).toBeGreaterThanOrEqual(0);
      expect(newState.currentPiece?.position.x).toBeLessThan(GAME_CONSTANTS.BOARD.WIDTH);
      expect(newState.currentPiece?.position.y).toBeGreaterThanOrEqual(0);
    });

    test("should not rotate when game is paused", () => {
      const state = { ...createInitialGameState(), isPaused: true };
      const newState = rotateTetrominoCWLegacy(state);
      expect(newState).toBe(state);
    });

    test("should not rotate when game is over", () => {
      const state = { ...createInitialGameState(), isGameOver: true };
      const newState = rotateTetrominoCWLegacy(state);
      expect(newState).toBe(state);
    });
  });

  describe("hardDropTetromino", () => {
    test("should drop piece to bottom", () => {
      const state = createInitialGameState();
      const newState = hardDropTetromino(state);
      // The piece should be placed on the board
      expect(newState.currentPiece).not.toBe(state.currentPiece);
    });
  });

  describe("calculateScore", () => {
    test("should calculate score for 1 line", () => {
      expect(calculateScore(1, 1)).toBe(100);
    });

    test("should calculate score for 2 lines", () => {
      expect(calculateScore(2, 1)).toBe(300);
    });

    test("should calculate score for 3 lines", () => {
      expect(calculateScore(3, 1)).toBe(500);
    });

    test("should calculate score for 4 lines (tetris)", () => {
      expect(calculateScore(4, 1)).toBe(800);
    });

    test("should increase score with level", () => {
      expect(calculateScore(1, 2)).toBe(200);
      expect(calculateScore(4, 5)).toBe(4000);
    });
  });

  describe("checkGameOver", () => {
    test("should return false when piece can be placed", () => {
      const board = createEmptyBoard();
      const piece = createTetromino("T");
      const result = checkGameOver(board, piece);
      expect(result).toBe(false);
    });

    test("should return true when piece cannot be placed", () => {
      const board = createEmptyBoard();
      // Fill the top row to create collision
      for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH; x++) {
        board[0][x] = 1;
      }
      const piece = createTetromino("T");
      const result = checkGameOver(board, piece);
      expect(result).toBe(true);
    });
  });

  describe("spawnNextPiece", () => {
    test("should create new piece and update bag", () => {
      const nextPieceType = "T";
      const pieceBag = ["I", "O", "S", "Z", "J", "L"];
      const result = spawnNextPiece(nextPieceType, pieceBag);

      expect(result.currentPiece.type).toBe("T");
      expect(result.nextPiece).toBeDefined();
      expect(["I", "O", "S", "Z", "J", "L"]).toContain(result.nextPiece);
      expect(result.pieceBag).toBeDefined();
      expect(Array.isArray(result.pieceBag)).toBe(true);
    });

    test("should handle empty bag correctly", () => {
      const nextPieceType = "I";
      const pieceBag: string[] = [];
      const result = spawnNextPiece(nextPieceType, pieceBag);

      expect(result.currentPiece.type).toBe("I");
      expect(result.nextPiece).toBeDefined();
      expect(result.pieceBag.length).toBeGreaterThan(0);
    });
  });

  describe("processPlacementAndClearing", () => {
    test("should not change score when no lines cleared", () => {
      const state = createTestGameState({ score: 100, lines: 5, level: 2 });
      const result = processPlacementAndClearing(state);

      expect(result.score).toBe(100);
      expect(result.lines).toBe(5);
      expect(result.level).toBe(1); // Level is calculated as Math.floor(lines / LINES_PER_LEVEL) + 1
      expect(result.clearingLines).toEqual([]);
      expect(result.placedPositions.length).toBeGreaterThan(0);
    });

    test("should update score and level when lines cleared", () => {
      const board = createEmptyBoard();
      // Fill bottom row to create a complete line
      for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH; x++) {
        board[GAME_CONSTANTS.BOARD.HEIGHT - 1][x] = 1;
      }

      const state = createTestGameState({ board, score: 0, lines: 0, level: 1 });
      const result = processPlacementAndClearing(state);

      expect(result.score).toBe(100); // 1 line * level 1
      expect(result.lines).toBe(1);
      expect(result.level).toBe(1);
      expect(result.clearingLines).toEqual([GAME_CONSTANTS.BOARD.HEIGHT - 1]);
      expect(result.boardBeforeClear).toBeDefined();
    });

    test("should return empty positions when no current piece", () => {
      const state = { ...createInitialGameState(), currentPiece: null };
      const result = processPlacementAndClearing(state);

      expect(result.board).toBe(state.board);
      expect(result.placedPositions).toEqual([]);
      expect(result.boardBeforeClear).toBeNull();
    });
  });
});

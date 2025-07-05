import { beforeEach, describe, expect, test } from "bun:test";
import type { CellValue, GameBoard, Position, TetrominoShape } from "@/types/game";
import { GAME_CONSTANTS } from "@/utils/gameConstants";
import type { BoardEngine, BoardEngineType } from "./board-engine";
import {
  createBoardEngine,
  getBoardEngine,
  resetBoardEngine,
  setBoardEngine,
} from "./board-engine";

// Common test utilities and data
const createTestBoard = (): GameBoard => {
  const board = Array.from({ length: GAME_CONSTANTS.BOARD.HEIGHT }, () =>
    Array.from({ length: GAME_CONSTANTS.BOARD.WIDTH }, () => 0 as CellValue),
  );
  return board;
};

const createTestShape = (): TetrominoShape => {
  // Simple I-piece shape for testing
  return [[1, 1, 1, 1]];
};

const createLShape = (): TetrominoShape => {
  // L-piece shape for testing
  return [
    [1, 0, 0],
    [1, 1, 1],
  ];
};

const createTestPosition = (): Position => ({ x: 3, y: 0 });

// Test suite generator for board engines
const createBoardEngineTestSuite = (engineType: BoardEngineType) => {
  describe(`${engineType} Board Engine`, () => {
    let engine: BoardEngine;
    let board: GameBoard;
    let shape: TetrominoShape;
    let position: Position;

    beforeEach(() => {
      engine = createBoardEngine(engineType);
      board = createTestBoard();
      shape = createTestShape();
      position = createTestPosition();
    });

    describe("isValidPosition", () => {
      test("should return true for valid position", () => {
        const result = engine.isValidPosition(board, shape, position);
        expect(result).toBe(true);
      });

      test("should return false for position outside board boundaries", () => {
        const invalidPosition = { x: -1, y: 0 };
        const result = engine.isValidPosition(board, shape, invalidPosition);
        expect(result).toBe(false);
      });

      test("should return false for position beyond right boundary", () => {
        const invalidPosition = { x: GAME_CONSTANTS.BOARD.WIDTH - 1, y: 0 };
        const result = engine.isValidPosition(board, shape, invalidPosition);
        expect(result).toBe(false);
      });

      test("should return false for position beyond bottom boundary", () => {
        const invalidPosition = { x: 0, y: GAME_CONSTANTS.BOARD.HEIGHT };
        const result = engine.isValidPosition(board, shape, invalidPosition);
        expect(result).toBe(false);
      });

      test("should return false for collision with existing pieces", () => {
        // Place a piece on the board
        board[0][3] = 1;
        const result = engine.isValidPosition(board, shape, position);
        expect(result).toBe(false);
      });

      test("should handle empty cells in shape correctly", () => {
        const lShape = createLShape();
        const lPosition = { x: 0, y: 0 };
        const result = engine.isValidPosition(board, lShape, lPosition);
        expect(result).toBe(true);
      });
    });

    describe("placePiece", () => {
      test("should place piece on board correctly", () => {
        const colorIndex = 1 as CellValue;
        const result = engine.placePiece(board, shape, position, colorIndex);

        // Check that piece was placed
        expect(result[0][3]).toBe(colorIndex);
        expect(result[0][4]).toBe(colorIndex);
        expect(result[0][5]).toBe(colorIndex);
        expect(result[0][6]).toBe(colorIndex);

        // Check that original board is unchanged (immutability)
        expect(board[0][3]).toBe(0);
      });

      test("should handle L-shaped pieces correctly", () => {
        const lShape = createLShape();
        const lPosition = { x: 0, y: 0 };
        const colorIndex = 2 as CellValue;
        const result = engine.placePiece(board, lShape, lPosition, colorIndex);

        // Check L-piece placement
        expect(result[0][0]).toBe(colorIndex); // Top left
        expect(result[0][1]).toBe(0); // Top middle (empty)
        expect(result[0][2]).toBe(0); // Top right (empty)
        expect(result[1][0]).toBe(colorIndex); // Bottom left
        expect(result[1][1]).toBe(colorIndex); // Bottom middle
        expect(result[1][2]).toBe(colorIndex); // Bottom right
      });

      test("should preserve immutability", () => {
        const originalBoard = board.map((row) => [...row]);
        const colorIndex = 1 as CellValue;
        const result = engine.placePiece(board, shape, position, colorIndex);

        // Check that original board is unchanged
        expect(board).toEqual(originalBoard);
        expect(result).not.toBe(board);
      });
    });

    describe("clearLines", () => {
      test("should return unchanged board when no lines are full", () => {
        const result = engine.clearLines(board);

        expect(result.board).toEqual(board);
        expect(result.linesCleared).toBe(0);
        expect(result.clearedLineIndices).toEqual([]);
      });

      test("should clear single completed line", () => {
        // Fill bottom line
        const bottomRowIndex = GAME_CONSTANTS.BOARD.HEIGHT - 1;
        for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH; x++) {
          board[bottomRowIndex][x] = 1;
        }

        const result = engine.clearLines(board);

        expect(result.linesCleared).toBe(1);
        expect(result.clearedLineIndices).toEqual([bottomRowIndex]);

        // Check that bottom row is now empty
        const bottomRow = result.board[bottomRowIndex];
        expect(bottomRow.every((cell) => cell === 0)).toBe(true);

        // Check that a new empty row was added at the top
        const topRow = result.board[0];
        expect(topRow.every((cell) => cell === 0)).toBe(true);
      });

      test("should clear multiple completed lines", () => {
        // Fill bottom two lines
        const bottomRowIndex = GAME_CONSTANTS.BOARD.HEIGHT - 1;
        const secondBottomRowIndex = GAME_CONSTANTS.BOARD.HEIGHT - 2;

        for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH; x++) {
          board[bottomRowIndex][x] = 1;
          board[secondBottomRowIndex][x] = 2;
        }

        const result = engine.clearLines(board);

        expect(result.linesCleared).toBe(2);
        expect(result.clearedLineIndices).toEqual([secondBottomRowIndex, bottomRowIndex]);

        // Check that bottom two rows are now empty
        const bottomRow = result.board[bottomRowIndex];
        const secondBottomRow = result.board[secondBottomRowIndex];
        expect(bottomRow.every((cell) => cell === 0)).toBe(true);
        expect(secondBottomRow.every((cell) => cell === 0)).toBe(true);
      });

      test("should preserve board structure after clearing", () => {
        // Fill bottom line and add some pieces above
        const bottomRowIndex = GAME_CONSTANTS.BOARD.HEIGHT - 1;
        const aboveRowIndex = GAME_CONSTANTS.BOARD.HEIGHT - 2;

        for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH; x++) {
          board[bottomRowIndex][x] = 1;
        }
        board[aboveRowIndex][0] = 2;
        board[aboveRowIndex][1] = 3;

        const result = engine.clearLines(board);

        // Check that pieces from above moved down
        expect(result.board[bottomRowIndex][0]).toBe(2);
        expect(result.board[bottomRowIndex][1]).toBe(3);
        expect(result.board[bottomRowIndex][2]).toBe(0);
      });
    });

    describe("interface compliance", () => {
      test("should implement all required methods", () => {
        expect(typeof engine.isValidPosition).toBe("function");
        expect(typeof engine.placePiece).toBe("function");
        expect(typeof engine.clearLines).toBe("function");
      });

      test("should maintain consistent behavior across calls", () => {
        const colorIndex = 1 as CellValue;

        // Test multiple calls with same parameters
        const result1 = engine.placePiece(board, shape, position, colorIndex);
        const result2 = engine.placePiece(board, shape, position, colorIndex);

        expect(result1).toEqual(result2);
      });
    });
  });
};

// Run test suite for all engine types
createBoardEngineTestSuite("legacy");
createBoardEngineTestSuite("typed-array");
createBoardEngineTestSuite("bitboard");

// Factory function tests
describe("createBoardEngine", () => {
  test("should create legacy engine", () => {
    const engine = createBoardEngine("legacy");
    expect(engine).toBeDefined();
    expect(typeof engine.isValidPosition).toBe("function");
  });

  test("should create typed-array engine", () => {
    const engine = createBoardEngine("typed-array");
    expect(engine).toBeDefined();
    expect(typeof engine.isValidPosition).toBe("function");
  });

  test("should create bitboard engine", () => {
    const engine = createBoardEngine("bitboard");
    expect(engine).toBeDefined();
    expect(typeof engine.isValidPosition).toBe("function");
  });

  test("should throw error for unknown engine type", () => {
    expect(() => createBoardEngine("unknown" as BoardEngineType)).toThrow();
  });
});

// Singleton pattern tests
describe("Board Engine Singleton", () => {
  beforeEach(() => {
    resetBoardEngine();
  });

  test("should return same instance on multiple calls", () => {
    const engine1 = getBoardEngine();
    const engine2 = getBoardEngine();
    expect(engine1).toBe(engine2);
  });

  test("should allow setting custom engine", () => {
    const customEngine = createBoardEngine("typed-array");
    setBoardEngine(customEngine);

    const retrievedEngine = getBoardEngine();
    expect(retrievedEngine).toBe(customEngine);
  });

  test("should reset to default after reset", () => {
    const customEngine = createBoardEngine("bitboard");
    setBoardEngine(customEngine);

    resetBoardEngine();

    const newEngine = getBoardEngine();
    expect(newEngine).not.toBe(customEngine);
  });
});

// Cross-engine compatibility tests
describe("Cross-Engine Compatibility", () => {
  test("all engines should produce identical results", () => {
    const board = createTestBoard();
    const shape = createTestShape();
    const position = createTestPosition();
    const colorIndex = 1 as CellValue;

    const legacyEngine = createBoardEngine("legacy");
    const typedArrayEngine = createBoardEngine("typed-array");
    const bitboardEngine = createBoardEngine("bitboard");

    // Test isValidPosition
    const isValidLegacy = legacyEngine.isValidPosition(board, shape, position);
    const isValidTypedArray = typedArrayEngine.isValidPosition(board, shape, position);
    const isValidBitboard = bitboardEngine.isValidPosition(board, shape, position);

    expect(isValidLegacy).toBe(isValidTypedArray);
    expect(isValidTypedArray).toBe(isValidBitboard);

    // Test placePiece
    const placedLegacy = legacyEngine.placePiece(board, shape, position, colorIndex);
    const placedTypedArray = typedArrayEngine.placePiece(board, shape, position, colorIndex);
    const placedBitboard = bitboardEngine.placePiece(board, shape, position, colorIndex);

    expect(placedLegacy).toEqual(placedTypedArray);
    expect(placedTypedArray).toEqual(placedBitboard);

    // Test clearLines
    const clearedLegacy = legacyEngine.clearLines(board);
    const clearedTypedArray = typedArrayEngine.clearLines(board);
    const clearedBitboard = bitboardEngine.clearLines(board);

    expect(clearedLegacy).toEqual(clearedTypedArray);
    expect(clearedTypedArray).toEqual(clearedBitboard);
  });
});

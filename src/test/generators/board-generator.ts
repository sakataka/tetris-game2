import * as fc from "fast-check";
import { TETROMINOS } from "@/game/tetrominos";
import type { CellValue, GameBoard, Position, TetrominoShape } from "@/types/game";
import { GAME_CONSTANTS } from "@/utils/gameConstants";

/**
 * Fast-check generator for creating random filled boards
 * Used for comprehensive property-based testing
 */
export interface BoardGeneratorOptions {
  /** Minimum fill ratio (0.0 to 1.0) */
  minFillRatio: number;
  /** Maximum fill ratio (0.0 to 1.0) */
  maxFillRatio: number;
  /** Whether to prefer bottom-heavy filling (simulating dropped pieces) */
  bottomHeavy: boolean;
}

/**
 * Default options for board generation
 * Based on O3 analysis requirements for comprehensive testing
 */
export const DEFAULT_BOARD_OPTIONS: BoardGeneratorOptions = {
  minFillRatio: Math.fround(0.1),
  maxFillRatio: Math.fround(0.8),
  bottomHeavy: true,
};

/**
 * Generate a random filled board with specified characteristics
 * Implements the O3-recommended approach for comprehensive edge case testing
 */
export const randomFilledBoardGenerator = (
  options: BoardGeneratorOptions = DEFAULT_BOARD_OPTIONS,
) => {
  return fc.record({
    board: fc
      .float({ min: Math.fround(options.minFillRatio), max: Math.fround(options.maxFillRatio) })
      .map((fillRatio) => {
        const board: GameBoard = Array.from({ length: GAME_CONSTANTS.BOARD.HEIGHT }, () =>
          Array.from({ length: GAME_CONSTANTS.BOARD.WIDTH }, () => 0 as CellValue),
        );

        const totalCells = GAME_CONSTANTS.BOARD.WIDTH * GAME_CONSTANTS.BOARD.HEIGHT;
        const cellsToFill = Math.floor(totalCells * fillRatio);

        // Generate random cell positions to fill
        const cellPositions = Array.from({ length: totalCells }, (_, i) => {
          const y = Math.floor(i / GAME_CONSTANTS.BOARD.WIDTH);
          const x = i % GAME_CONSTANTS.BOARD.WIDTH;
          return { x, y };
        });

        // If bottom-heavy, bias toward bottom rows
        if (options.bottomHeavy) {
          cellPositions.sort((a, b) => b.y - a.y);
        } else {
          // Random shuffle (simplified for now)
          for (let i = cellPositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cellPositions[i], cellPositions[j]] = [cellPositions[j], cellPositions[i]];
          }
        }

        // Fill selected cells with random color indices
        const selectedCells = cellPositions.slice(0, cellsToFill);
        selectedCells.forEach(({ x, y }) => {
          board[y][x] = (Math.floor(Math.random() * 7) + 1) as CellValue;
        });

        return board;
      }),
    fillRatio: fc.float({
      min: Math.fround(options.minFillRatio),
      max: Math.fround(options.maxFillRatio),
    }),
  });
};

/**
 * Generate all possible tetromino shapes
 * Includes all rotations of each tetromino type
 */
export const allTetrominoShapesGenerator = () => {
  const allShapes: TetrominoShape[] = [];

  // Generate all rotations for each tetromino type
  Object.entries(TETROMINOS).forEach(([, baseShape]) => {
    let currentShape = baseShape;

    // Add all 4 rotations
    for (let rotation = 0; rotation < 4; rotation++) {
      allShapes.push(currentShape.map((row) => [...row])); // Deep copy

      // Rotate for next iteration
      currentShape = currentShape[0].map((_, i) => currentShape.map((row) => row[i]).reverse());
    }
  });

  return fc.constantFrom(...allShapes);
};

/**
 * Generate wide range of positions for comprehensive boundary testing
 * Based on O3 analysis: includes positions far outside normal bounds
 */
export const wideRangePositionGenerator = () => {
  return fc.record({
    x: fc.integer({ min: -15, max: 25 }), // Far beyond normal bounds
    y: fc.integer({ min: -15, max: 35 }), // Far beyond normal bounds
  });
};

/**
 * Generate normal game positions (for comparison testing)
 */
export const normalPositionGenerator = () => {
  return fc.record({
    x: fc.integer({ min: 0, max: GAME_CONSTANTS.BOARD.WIDTH - 1 }),
    y: fc.integer({ min: 0, max: GAME_CONSTANTS.BOARD.HEIGHT - 1 }),
  });
};

/**
 * Generate edge case positions (boundary conditions)
 */
export const edgeCasePositionGenerator = () => {
  const edgePositions: Position[] = [
    { x: -1, y: 0 },
    { x: 0, y: -1 },
    { x: GAME_CONSTANTS.BOARD.WIDTH, y: 0 },
    { x: 0, y: GAME_CONSTANTS.BOARD.HEIGHT },
    { x: GAME_CONSTANTS.BOARD.WIDTH - 1, y: GAME_CONSTANTS.BOARD.HEIGHT - 1 },
    { x: -1, y: -1 },
    { x: GAME_CONSTANTS.BOARD.WIDTH, y: GAME_CONSTANTS.BOARD.HEIGHT },
  ];

  return fc.constantFrom(...edgePositions);
};

/**
 * Generate empty board (for baseline testing)
 */
export const emptyBoardGenerator = () => {
  return fc.constant(
    Array.from({ length: GAME_CONSTANTS.BOARD.HEIGHT }, () =>
      Array.from({ length: GAME_CONSTANTS.BOARD.WIDTH }, () => 0 as CellValue),
    ),
  );
};

/**
 * Generate full board (for stress testing)
 */
export const fullBoardGenerator = () => {
  return fc.constant(
    Array.from({ length: GAME_CONSTANTS.BOARD.HEIGHT }, () =>
      Array.from({ length: GAME_CONSTANTS.BOARD.WIDTH }, () => 1 as CellValue),
    ),
  );
};

/**
 * Generate board with specific patterns for regression testing
 */
export const patternBoardGenerator = () => {
  return fc.oneof(
    // Checkerboard pattern
    fc.constant(
      Array.from({ length: GAME_CONSTANTS.BOARD.HEIGHT }, (_, y) =>
        Array.from({ length: GAME_CONSTANTS.BOARD.WIDTH }, (_, x) => ((x + y) % 2) as CellValue),
      ),
    ),
    // Vertical stripes
    fc.constant(
      Array.from({ length: GAME_CONSTANTS.BOARD.HEIGHT }, () =>
        Array.from({ length: GAME_CONSTANTS.BOARD.WIDTH }, (_, x) => (x % 2) as CellValue),
      ),
    ),
    // Horizontal stripes
    fc.constant(
      Array.from({ length: GAME_CONSTANTS.BOARD.HEIGHT }, (_, y) =>
        Array.from({ length: GAME_CONSTANTS.BOARD.WIDTH }, () => (y % 2) as CellValue),
      ),
    ),
  );
};

/**
 * Combined board generator for comprehensive testing
 * Includes all board types with appropriate weighting
 */
export const comprehensiveBoardGenerator = () => {
  return fc.oneof(
    // 50% random filled boards (main test cases)
    { arbitrary: randomFilledBoardGenerator().map((data) => data.board), weight: 5 },
    // 20% empty boards (baseline)
    { arbitrary: emptyBoardGenerator(), weight: 2 },
    // 10% full boards (stress test)
    { arbitrary: fullBoardGenerator(), weight: 1 },
    // 20% pattern boards (regression test)
    { arbitrary: patternBoardGenerator(), weight: 2 },
  );
};

/**
 * Test case generator for board engine property testing
 * Generates complete test scenarios with board, shape, and position
 */
export const boardEngineTestCaseGenerator = () => {
  return fc.record({
    board: comprehensiveBoardGenerator(),
    shape: allTetrominoShapesGenerator(),
    position: wideRangePositionGenerator(),
    colorIndex: fc.integer({ min: 1, max: 7 }) as fc.Arbitrary<CellValue>,
  });
};

/**
 * Generate test cases specifically for regression testing
 * Uses fixed seeds for reproducible test cases
 */
export const regressionTestCaseGenerator = () => {
  return fc.record({
    board: emptyBoardGenerator(),
    shape: fc.constantFrom(TETROMINOS.I, TETROMINOS.O, TETROMINOS.T),
    position: edgeCasePositionGenerator(),
    colorIndex: fc.constant(1 as CellValue),
  });
};

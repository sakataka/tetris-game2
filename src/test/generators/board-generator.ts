import * as fc from "fast-check";
import { TETROMINOS } from "@/game/tetrominos";
import type {
  CellValue,
  GameBoard,
  GameState,
  Position,
  RotationState,
  Tetromino,
  TetrominoShape,
  TetrominoTypeName,
} from "@/types/game";
import { GAME_CONSTANTS } from "@/utils/gameConstants";
import { createGameBoard, createGameState, createTetromino } from "../utils/mock-factory";

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

/**
 * Enhanced generators for comprehensive property-based testing
 */

/**
 * Generate valid tetromino type names
 */
export const tetrominoTypeGenerator = () => {
  return fc.constantFrom("I", "O", "T", "S", "Z", "J", "L") as fc.Arbitrary<TetrominoTypeName>;
};

/**
 * Generate valid rotation states
 */
export const rotationStateGenerator = () => {
  return fc.constantFrom(0, 1, 2, 3) as fc.Arbitrary<RotationState>;
};

/**
 * Generate valid cell values
 */
export const cellValueGenerator = () => {
  return fc.integer({ min: 0, max: 9 }) as fc.Arbitrary<CellValue>;
};

/**
 * Generate non-empty cell values (for filled cells)
 */
export const filledCellValueGenerator = () => {
  return fc.integer({ min: 1, max: 7 }) as fc.Arbitrary<CellValue>;
};

/**
 * Generate valid tetromino instances
 */
export const tetrominoGenerator = () => {
  return fc.record({
    type: tetrominoTypeGenerator(),
    position: normalPositionGenerator(),
    rotation: rotationStateGenerator(),
    shape: allTetrominoShapesGenerator(),
  }) as fc.Arbitrary<Tetromino>;
};

/**
 * Generate tetromino with specific constraints
 */
export const constrainedTetrominoGenerator = (constraints: {
  types?: TetrominoTypeName[];
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  rotations?: RotationState[];
}) => {
  return fc.record({
    type: constraints.types ? fc.constantFrom(...constraints.types) : tetrominoTypeGenerator(),
    position: fc.record({
      x: fc.integer({
        min: constraints.minX ?? 0,
        max: constraints.maxX ?? GAME_CONSTANTS.BOARD.WIDTH - 1,
      }),
      y: fc.integer({
        min: constraints.minY ?? 0,
        max: constraints.maxY ?? GAME_CONSTANTS.BOARD.HEIGHT - 1,
      }),
    }),
    rotation: constraints.rotations
      ? fc.constantFrom(...constraints.rotations)
      : rotationStateGenerator(),
    shape: allTetrominoShapesGenerator(),
  }) as fc.Arbitrary<Tetromino>;
};

/**
 * Generate game states with various configurations
 */
export const gameStateGenerator = () => {
  return fc
    .record({
      board: comprehensiveBoardGenerator(),
      currentPiece: fc.option(tetrominoGenerator(), { nil: null }),
      nextPiece: tetrominoTypeGenerator(),
      heldPiece: fc.option(tetrominoTypeGenerator(), { nil: null }),
      canHold: fc.boolean(),
      score: fc.integer({ min: 0, max: 999999 }),
      lines: fc.integer({ min: 0, max: 999 }),
      level: fc.integer({ min: 1, max: 30 }),
      isGameOver: fc.boolean(),
      isPaused: fc.boolean(),
      clearingLines: fc.array(fc.integer({ min: 0, max: 19 }), { maxLength: 4 }),
      placedPositions: fc.array(normalPositionGenerator(), { maxLength: 20 }),
    })
    .map((partial) => createGameState(partial)) as fc.Arbitrary<GameState>;
};

/**
 * Generate game states for specific scenarios
 */
export const scenarioGameStateGenerator = (
  scenario: "early-game" | "mid-game" | "late-game" | "near-game-over",
) => {
  switch (scenario) {
    case "early-game":
      return fc
        .record({
          score: fc.integer({ min: 0, max: 5000 }),
          lines: fc.integer({ min: 0, max: 20 }),
          level: fc.integer({ min: 1, max: 3 }),
          board: fc.oneof(
            emptyBoardGenerator(),
            randomFilledBoardGenerator({
              minFillRatio: 0.0,
              maxFillRatio: 0.2,
              bottomHeavy: true,
            }).map((d) => d.board),
          ),
        })
        .map((partial) => createGameState(partial));

    case "mid-game":
      return fc
        .record({
          score: fc.integer({ min: 5000, max: 50000 }),
          lines: fc.integer({ min: 20, max: 100 }),
          level: fc.integer({ min: 3, max: 10 }),
          board: randomFilledBoardGenerator({
            minFillRatio: 0.2,
            maxFillRatio: 0.5,
            bottomHeavy: true,
          }).map((d) => d.board),
        })
        .map((partial) => createGameState(partial));

    case "late-game":
      return fc
        .record({
          score: fc.integer({ min: 50000, max: 200000 }),
          lines: fc.integer({ min: 100, max: 300 }),
          level: fc.integer({ min: 10, max: 20 }),
          board: randomFilledBoardGenerator({
            minFillRatio: 0.4,
            maxFillRatio: 0.7,
            bottomHeavy: true,
          }).map((d) => d.board),
        })
        .map((partial) => createGameState(partial));

    case "near-game-over":
      return fc
        .record({
          score: fc.integer({ min: 100000, max: 999999 }),
          lines: fc.integer({ min: 200, max: 999 }),
          level: fc.integer({ min: 15, max: 30 }),
          board: randomFilledBoardGenerator({
            minFillRatio: 0.7,
            maxFillRatio: 0.95,
            bottomHeavy: false,
          }).map((d) => d.board),
          isGameOver: fc.boolean(),
        })
        .map((partial) => createGameState(partial));

    default:
      return gameStateGenerator();
  }
};

/**
 * Generate line clearing scenarios
 */
export const lineClearScenarioGenerator = () => {
  return fc
    .record({
      lineCount: fc.constantFrom(1, 2, 3, 4),
      clearType: fc.constantFrom("single", "double", "triple", "tetris", "tspin"),
      comboCount: fc.integer({ min: 0, max: 10 }),
      level: fc.integer({ min: 1, max: 20 }),
    })
    .map(({ lineCount, clearType, comboCount, level }) => {
      const baseScore = lineCount * 100 * level;
      const comboBonus = comboCount * 50;
      const tSpinMultiplier = clearType === "tspin" ? 3 : 1;
      const tetrisMultiplier = clearType === "tetris" ? 2 : 1;

      return {
        lineCount,
        clearType,
        comboCount,
        level,
        expectedScore: baseScore * tSpinMultiplier * tetrisMultiplier + comboBonus,
        clearingLines: Array.from({ length: lineCount }, (_, i) => 19 - i),
      };
    });
};

/**
 * Generate collision test scenarios
 */
export const collisionTestGenerator = () => {
  return fc
    .record({
      board: comprehensiveBoardGenerator(),
      tetromino: tetrominoGenerator(),
      expectedCollision: fc.boolean(),
    })
    .map(({ board, tetromino, expectedCollision }) => {
      // Adjust tetromino position to create or avoid collision based on expectedCollision
      if (expectedCollision) {
        // Force a collision by placing tetromino in an occupied area
        const occupiedCells = [];
        for (let y = 0; y < board.length; y++) {
          for (let x = 0; x < board[y].length; x++) {
            if (board[y][x] !== 0) {
              occupiedCells.push({ x, y });
            }
          }
        }
        if (occupiedCells.length > 0) {
          const randomCell = occupiedCells[Math.floor(Math.random() * occupiedCells.length)];
          tetromino.position = randomCell;
        }
      }

      return { board, tetromino, expectedCollision };
    });
};

/**
 * Generate movement test scenarios
 */
export const movementTestGenerator = () => {
  return fc
    .record({
      initialPosition: normalPositionGenerator(),
      direction: fc.constantFrom("left", "right", "down"),
      boardState: fc.constantFrom("empty", "partial", "blocked"),
      expectedResult: fc.constantFrom("success", "blocked", "out-of-bounds"),
    })
    .map(({ initialPosition, direction, boardState, expectedResult }) => {
      const board = createGameBoard();

      // Modify board based on boardState
      if (boardState === "blocked") {
        const targetX =
          direction === "left"
            ? initialPosition.x - 1
            : direction === "right"
              ? initialPosition.x + 1
              : initialPosition.x;
        const targetY = direction === "down" ? initialPosition.y + 1 : initialPosition.y;

        if (targetY >= 0 && targetY < board.length && targetX >= 0 && targetX < board[0].length) {
          board[targetY][targetX] = 1;
        }
      }

      return {
        initialPosition,
        direction,
        board,
        expectedResult,
      };
    });
};

/**
 * Generate rotation test scenarios
 */
export const rotationTestGenerator = () => {
  return fc
    .record({
      tetrominoType: tetrominoTypeGenerator(),
      initialRotation: rotationStateGenerator(),
      rotationDirection: fc.constantFrom("clockwise", "counterclockwise"),
      boardContext: fc.constantFrom("open", "wall-kick", "blocked"),
      position: normalPositionGenerator(),
    })
    .map(({ tetrominoType, initialRotation, rotationDirection, boardContext, position }) => {
      const board = createGameBoard();

      // Create board context
      if (boardContext === "wall-kick") {
        // Place blocks that would require wall kick
        if (position.x <= 2) {
          // Near left wall
          for (let y = position.y; y < Math.min(position.y + 4, board.length); y++) {
            if (position.x > 0) board[y][position.x - 1] = 1;
          }
        } else if (position.x >= board[0].length - 3) {
          // Near right wall
          for (let y = position.y; y < Math.min(position.y + 4, board.length); y++) {
            if (position.x < board[0].length - 1) board[y][position.x + 1] = 1;
          }
        }
      } else if (boardContext === "blocked") {
        // Completely block rotation
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const x = position.x + dx;
            const y = position.y + dy;
            if (
              y >= 0 &&
              y < board.length &&
              x >= 0 &&
              x < board[0].length &&
              (dx !== 0 || dy !== 0)
            ) {
              board[y][x] = 1;
            }
          }
        }
      }

      const expectedRotation =
        rotationDirection === "clockwise"
          ? (((initialRotation + 1) % 4) as RotationState)
          : (((initialRotation + 3) % 4) as RotationState);

      return {
        tetrominoType,
        initialRotation,
        rotationDirection,
        board,
        position,
        expectedRotation,
        shouldSucceed: boardContext !== "blocked",
      };
    });
};

/**
 * Generate performance test scenarios
 */
export const performanceTestGenerator = () => {
  return fc
    .record({
      operationCount: fc.integer({ min: 100, max: 10000 }),
      operationType: fc.constantFrom("move", "rotate", "drop", "line-clear"),
      boardComplexity: fc.constantFrom("simple", "complex", "extreme"),
      concurrentOperations: fc.integer({ min: 1, max: 10 }),
    })
    .map(({ operationCount, operationType, boardComplexity, concurrentOperations }) => {
      let board: GameBoard;

      switch (boardComplexity) {
        case "simple":
          board = createGameBoard({ fillPattern: "empty" });
          break;
        case "complex":
          board = createGameBoard({ fillPattern: "random" });
          break;
        case "extreme":
          board = createGameBoard({ fillPattern: "bottom-heavy" });
          // Add more complexity
          for (let i = 0; i < 50; i++) {
            const x = Math.floor(Math.random() * board[0].length);
            const y = Math.floor(Math.random() * board.length);
            board[y][x] = (Math.floor(Math.random() * 7) + 1) as CellValue;
          }
          break;
      }

      return {
        operationCount,
        operationType,
        board,
        concurrentOperations,
        expectedMaxDuration: operationCount * (boardComplexity === "extreme" ? 0.1 : 0.01), // ms per operation
      };
    });
};

/**
 * Generate edge case scenarios for comprehensive testing
 */
export const edgeCaseScenarioGenerator = () => {
  return fc.oneof(
    // Boundary positions
    fc.record({
      type: fc.constant("boundary"),
      position: edgeCasePositionGenerator(),
      tetromino: tetrominoGenerator(),
    }),

    // Extreme scores/levels
    fc.record({
      type: fc.constant("extreme-values"),
      score: fc.integer({ min: 999990, max: 999999 }),
      level: fc.integer({ min: 29, max: 30 }),
      lines: fc.integer({ min: 990, max: 999 }),
    }),

    // Rapid state changes
    fc.record({
      type: fc.constant("rapid-changes"),
      stateChanges: fc.array(
        fc.record({
          action: fc.constantFrom("move", "rotate", "drop", "hold", "pause"),
          timestamp: fc.integer({ min: 0, max: 1000 }),
        }),
        { minLength: 10, maxLength: 100 },
      ),
    }),

    // Memory pressure scenarios
    fc.record({
      type: fc.constant("memory-pressure"),
      largeDataStructures: fc.array(fc.array(fc.integer(), { minLength: 1000, maxLength: 10000 }), {
        minLength: 10,
        maxLength: 100,
      }),
    }),
  );
};

/**
 * Generate regression test scenarios based on known issues
 */
export const regressionScenarioGenerator = () => {
  return fc.constantFrom(
    // Known issue: I-piece rotation near walls
    {
      type: "i-piece-wall-rotation",
      tetromino: createTetromino({ type: "I", position: { x: 0, y: 10 }, rotation: 0 }),
      board: createGameBoard({ fillPattern: "empty" }),
      action: "rotate-clockwise",
    },

    // Known issue: T-spin detection edge cases
    {
      type: "t-spin-detection",
      tetromino: createTetromino({ type: "T", position: { x: 3, y: 17 }, rotation: 2 }),
      board: createGameBoard({
        customCells: [
          { x: 2, y: 18, value: 1 },
          { x: 4, y: 18, value: 1 },
          { x: 2, y: 19, value: 1 },
          { x: 3, y: 19, value: 1 },
          { x: 4, y: 19, value: 1 },
        ],
      }),
      action: "rotate-clockwise",
    },

    // Known issue: Line clear animation timing
    {
      type: "line-clear-timing",
      board: createGameBoard({
        customCells: Array.from({ length: 10 }, (_, x) => ({ x, y: 19, value: 1 as CellValue })),
      }),
      tetromino: createTetromino({ type: "I", position: { x: 0, y: 15 }, rotation: 1 }),
      action: "hard-drop",
    },

    // Known issue: Hold piece state consistency
    {
      type: "hold-state-consistency",
      gameState: createGameState({
        currentPiece: createTetromino({ type: "T" }),
        heldPiece: "I",
        canHold: false,
      }),
      action: "hold",
    },
  );
};

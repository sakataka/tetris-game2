import { describe, test } from "bun:test";
import type { CellValue, GameBoard, Position, TetrominoShape } from "@/types/game";
import { GAME_CONSTANTS } from "@/utils/gameConstants";
import { createBoardEngine } from "../game/board-engine";

// Benchmark utilities
const createTestBoard = (): GameBoard => {
  const board = Array.from({ length: GAME_CONSTANTS.BOARD.HEIGHT }, () =>
    Array.from({ length: GAME_CONSTANTS.BOARD.WIDTH }, () => 0 as CellValue),
  );
  return board;
};

const createTestBoardWithSomeFilledCells = (): GameBoard => {
  const board = createTestBoard();
  // Fill some cells randomly to simulate a real game state
  for (let y = GAME_CONSTANTS.BOARD.HEIGHT - 5; y < GAME_CONSTANTS.BOARD.HEIGHT; y++) {
    for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH; x++) {
      if (Math.random() < 0.3) {
        // 30% chance to fill
        board[y][x] = (Math.floor(Math.random() * 7) + 1) as CellValue;
      }
    }
  }
  return board;
};

const createTestShapes = (): TetrominoShape[] => {
  return [
    // I-piece
    [[1, 1, 1, 1]],
    // O-piece
    [
      [1, 1],
      [1, 1],
    ],
    // T-piece
    [
      [0, 1, 0],
      [1, 1, 1],
    ],
    // S-piece
    [
      [0, 1, 1],
      [1, 1, 0],
    ],
    // Z-piece
    [
      [1, 1, 0],
      [0, 1, 1],
    ],
    // J-piece
    [
      [1, 0, 0],
      [1, 1, 1],
    ],
    // L-piece
    [
      [0, 0, 1],
      [1, 1, 1],
    ],
  ];
};

const createTestPositions = (): Position[] => {
  const positions: Position[] = [];
  for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH - 3; x++) {
    for (let y = 0; y < GAME_CONSTANTS.BOARD.HEIGHT - 3; y++) {
      positions.push({ x, y });
    }
  }
  return positions;
};

// Benchmark function
const benchmark = (name: string, fn: () => void, iterations = 10000): void => {
  // Warm up
  for (let i = 0; i < Math.min(iterations / 10, 1000); i++) {
    fn();
  }

  // Measure
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();

  const duration = end - start;
  const opsPerSecond = iterations / (duration / 1000);

  console.log(`${name}: ${duration.toFixed(2)}ms (${opsPerSecond.toFixed(0)} ops/sec)`);
};

describe("Board Engine Performance Benchmarks", () => {
  test("isValidPosition performance comparison", () => {
    const typedArrayEngine = createBoardEngine("typed-array");
    const bitboardEngine = createBoardEngine("bitboard");

    const board = createTestBoardWithSomeFilledCells();
    const shapes = createTestShapes();
    const positions = createTestPositions();

    let shapeIndex = 0;
    let positionIndex = 0;

    const getNextTest = () => {
      const shape = shapes[shapeIndex];
      const position = positions[positionIndex];

      shapeIndex = (shapeIndex + 1) % shapes.length;
      positionIndex = (positionIndex + 1) % positions.length;

      return { shape, position };
    };

    console.log("\\n=== isValidPosition Performance Test ===");

    benchmark(
      "TypedArray Engine",
      () => {
        const { shape, position } = getNextTest();
        typedArrayEngine.isValidPosition(board, shape, position);
      },
      50000,
    );

    // Reset counters
    shapeIndex = 0;
    positionIndex = 0;

    benchmark(
      "Bitboard Engine",
      () => {
        const { shape, position } = getNextTest();
        bitboardEngine.isValidPosition(board, shape, position);
      },
      50000,
    );
  });

  test("placePiece performance comparison", () => {
    const typedArrayEngine = createBoardEngine("typed-array");
    const bitboardEngine = createBoardEngine("bitboard");

    const board = createTestBoard();
    const shapes = createTestShapes();
    const positions = createTestPositions();
    const colorIndex = 1 as CellValue;

    let shapeIndex = 0;
    let positionIndex = 0;

    const getNextTest = () => {
      const shape = shapes[shapeIndex];
      const position = positions[positionIndex];

      shapeIndex = (shapeIndex + 1) % shapes.length;
      positionIndex = (positionIndex + 1) % positions.length;

      return { shape, position };
    };

    console.log("\\n=== placePiece Performance Test ===");

    benchmark(
      "TypedArray Engine",
      () => {
        const { shape, position } = getNextTest();
        typedArrayEngine.placePiece(board, shape, position, colorIndex);
      },
      20000,
    );

    // Reset counters
    shapeIndex = 0;
    positionIndex = 0;

    benchmark(
      "Bitboard Engine",
      () => {
        const { shape, position } = getNextTest();
        bitboardEngine.placePiece(board, shape, position, colorIndex);
      },
      20000,
    );
  });

  test("clearLines performance comparison", () => {
    const typedArrayEngine = createBoardEngine("typed-array");
    const bitboardEngine = createBoardEngine("bitboard");

    // Create a board with some completed lines
    const createBoardWithCompletedLines = () => {
      const board = createTestBoardWithSomeFilledCells();

      // Fill bottom two lines completely
      for (let y = GAME_CONSTANTS.BOARD.HEIGHT - 2; y < GAME_CONSTANTS.BOARD.HEIGHT; y++) {
        for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH; x++) {
          board[y][x] = (Math.floor(Math.random() * 7) + 1) as CellValue;
        }
      }

      return board;
    };

    console.log("\\n=== clearLines Performance Test ===");

    benchmark(
      "TypedArray Engine",
      () => {
        const board = createBoardWithCompletedLines();
        typedArrayEngine.clearLines(board);
      },
      10000,
    );

    benchmark(
      "Bitboard Engine",
      () => {
        const board = createBoardWithCompletedLines();
        bitboardEngine.clearLines(board);
      },
      10000,
    );
  });

  test("comprehensive performance comparison", () => {
    const typedArrayEngine = createBoardEngine("typed-array");
    const bitboardEngine = createBoardEngine("bitboard");

    const board = createTestBoardWithSomeFilledCells();
    const shapes = createTestShapes();
    const positions = createTestPositions();
    const colorIndex = 1 as CellValue;

    let shapeIndex = 0;
    let positionIndex = 0;

    const getNextTest = () => {
      const shape = shapes[shapeIndex];
      const position = positions[positionIndex];

      shapeIndex = (shapeIndex + 1) % shapes.length;
      positionIndex = (positionIndex + 1) % positions.length;

      return { shape, position };
    };

    console.log("\\n=== Comprehensive Performance Test ===");

    benchmark(
      "TypedArray Engine (Mixed Operations)",
      () => {
        const { shape, position } = getNextTest();

        // Mix of operations that would happen in a real game
        const isValid = typedArrayEngine.isValidPosition(board, shape, position);
        if (isValid) {
          const newBoard = typedArrayEngine.placePiece(board, shape, position, colorIndex);
          typedArrayEngine.clearLines(newBoard);
        }
      },
      5000,
    );

    // Reset counters
    shapeIndex = 0;
    positionIndex = 0;

    benchmark(
      "Bitboard Engine (Mixed Operations)",
      () => {
        const { shape, position } = getNextTest();

        // Mix of operations that would happen in a real game
        const isValid = bitboardEngine.isValidPosition(board, shape, position);
        if (isValid) {
          const newBoard = bitboardEngine.placePiece(board, shape, position, colorIndex);
          bitboardEngine.clearLines(newBoard);
        }
      },
      5000,
    );
  });
});

import type { CellValue, GameBoard, TetrominoTypeName } from "@/types/game";

export type DebugPreset = {
  name: string;
  description: string;
  board: GameBoard;
  nextPieces?: TetrominoTypeName[];
  score?: number;
  level?: number;
  lines?: number;
};

// Helper function to create board with filled pattern
function createBoardPattern(pattern: number[][]): GameBoard {
  const board: GameBoard = Array(20)
    .fill(null)
    .map(() => Array(10).fill(0) as CellValue[]);

  pattern.forEach((row, i) => {
    if (i < 20) {
      board[i] = row.map((cell) => cell as CellValue);
    }
  });

  return board;
}

// Empty board
const emptyBoard = (): GameBoard =>
  Array(20)
    .fill(null)
    .map(() => Array(10).fill(0) as CellValue[]);

export const DEBUG_PRESETS: Record<string, DebugPreset> = {
  // Single line clear
  singleLine: {
    name: "Single Line Clear",
    description: "Board state ready for single line clear",
    board: createBoardPattern([
      ...Array(19).fill([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0], // Bottom row with one empty cell
    ]),
    nextPieces: ["I"], // I piece to complete the line
    score: 0,
    level: 1,
    lines: 0,
  },

  // Double line clear
  doubleLine: {
    name: "Double Line Clear",
    description: "Board state ready for double line clear",
    board: createBoardPattern([
      ...Array(18).fill([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 0], // Two empty cells
      [1, 1, 1, 1, 1, 1, 1, 1, 0, 0], // Two empty cells
    ]),
    nextPieces: ["O"], // O piece to complete both lines
    score: 0,
    level: 1,
    lines: 0,
  },

  // Triple line clear
  tripleLine: {
    name: "Triple Line Clear",
    description: "Board state ready for triple line clear",
    board: createBoardPattern([
      ...Array(17).fill([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      [1, 1, 1, 1, 1, 1, 1, 0, 0, 0], // Three empty cells
      [1, 1, 1, 1, 1, 1, 1, 0, 0, 0], // Three empty cells
      [1, 1, 1, 1, 1, 1, 1, 0, 0, 0], // Three empty cells
    ]),
    nextPieces: ["L"], // L piece to complete three lines
    score: 0,
    level: 1,
    lines: 0,
  },

  // Tetris (4 line clear)
  tetris: {
    name: "Tetris (4 Line Clear)",
    description: "Board state ready for tetris",
    board: createBoardPattern([
      ...Array(16).fill([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1], // Four rows with left column empty
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]),
    nextPieces: ["I"], // I piece for tetris
    score: 0,
    level: 1,
    lines: 0,
  },

  // Near game over
  nearGameOver: {
    name: "Near Game Over",
    description: "Board filled to near the top",
    board: createBoardPattern([
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 0, 0, 0, 0], // Some blocks near top
      [0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
      [1, 1, 1, 1, 0, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 0, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 0, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 0, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
      [1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]),
    nextPieces: ["T", "S", "Z"], // Difficult pieces
    score: 15000,
    level: 5,
    lines: 45,
  },

  // High score scenario
  nearHighScore: {
    name: "Near High Score",
    description: "Close to beating high score",
    board: createBoardPattern([
      ...Array(15).fill([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
      [1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]),
    nextPieces: ["I", "O", "T"], // Good pieces for scoring
    score: 99900, // Assuming high score is 100000
    level: 10,
    lines: 95,
  },

  // T-Spin setup
  tSpinSetup: {
    name: "T-Spin Setup",
    description: "Board ready for T-Spin",
    board: createBoardPattern([
      ...Array(16).fill([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 0, 0, 0, 1, 1, 1, 1],
      [1, 1, 1, 1, 0, 1, 1, 1, 1, 1],
    ]),
    nextPieces: ["T"], // T piece for T-Spin
    score: 5000,
    level: 3,
    lines: 10,
  },

  // Complex board state
  complexBoard: {
    name: "Complex Board",
    description: "Challenging board with gaps",
    board: createBoardPattern([
      ...Array(10).fill([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 0, 1, 1, 0, 1, 1, 0],
      [1, 1, 1, 0, 1, 1, 0, 1, 1, 1],
      [1, 1, 1, 0, 1, 1, 0, 1, 1, 1],
      [1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 1, 1, 1, 0, 0, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ]),
    nextPieces: ["I", "L", "J", "S", "Z"],
    score: 25000,
    level: 7,
    lines: 65,
  },

  // Empty board for testing
  empty: {
    name: "Empty Board",
    description: "Clean slate for testing",
    board: emptyBoard(),
    nextPieces: ["I", "O", "T", "S", "Z", "J", "L"],
    score: 0,
    level: 1,
    lines: 0,
  },
};

// Get preset by name
export function getDebugPreset(name: string): DebugPreset | undefined {
  return DEBUG_PRESETS[name];
}

// Get all preset names
export function getPresetNames(): string[] {
  return Object.keys(DEBUG_PRESETS);
}

import { describe, expect, mock, test } from "bun:test";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import type React from "react";
import { createEmptyBoard, placeTetromino } from "../../game/board";
import { createTetromino, getTetrominoColorIndex } from "../../game/tetrominos";
import type { GameBoard, GameState, Position, TetrominoTypeName } from "../../types/game";
import { GAME_CONSTANTS } from "../../utils/gameConstants";
import { Board } from "./Board";

// ==============================
// MOCKS - t_wada style: Mock只外部依存関係
// ==============================

// Create a mutable mock data holder
let mockBoardData = {
  displayBoard: createEmptyBoard(),
  currentPiecePositions: new Set<string>(),
  ghostPiecePositions: new Set<string>(),
  placedPositionsSet: new Set<string>(),
  clearingLines: [],
  animationTriggerKey: 0,
};

// Mock all hooks to isolate Board component
mock.module("../../hooks/selectors/useBoardSelectors", () => ({
  useBoardData: () => mockBoardData,
}));

mock.module("../../hooks/ui/useAnimationCompletionHandler", () => ({
  useAnimationCompletionHandler: () => ({
    handleAnimationComplete: () => {},
  }),
}));

mock.module("../../hooks/ui/useResponsiveBoard", () => ({
  useResponsiveBoard: () => ({
    cellSize: GAME_CONSTANTS.BOARD.CELL_SIZE,
  }),
}));

// Mock BoardCell for focused testing
mock.module("./BoardCell", () => ({
  BoardCell: (props: {
    cellValue: number;
    x: number;
    y: number;
    isCurrentPiece: boolean;
    isGhostPiece: boolean;
    isPlacedPiece: boolean;
    isClearingLine: boolean;
  }) => (
    <div
      data-testid={`board-cell-${props.x}-${props.y}`}
      data-cell-value={props.cellValue}
      data-is-current-piece={props.isCurrentPiece}
      data-is-ghost-piece={props.isGhostPiece}
      data-is-placed-piece={props.isPlacedPiece}
      data-is-clearing-line={props.isClearingLine}
    />
  ),
}));

// Mock Card component
mock.module("../ui/card", () => ({
  Card: (props: { children: React.ReactNode; className?: string }) => (
    <div data-testid="board-container" className={props.className}>
      {props.children}
    </div>
  ),
}));

// Mock utility functions
mock.module("@/lib/utils", () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(" "),
}));

// ==============================
// TEST HELPERS - t_wada style: テストのためのヘルパー関数
// ==============================

/**
 * Create board with specific tetromino placed at position
 * アサーションファースト: 期待する配置状態から逆算して作成
 */
function createBoardWithTetromino(
  type: TetrominoTypeName,
  position: Position,
): { board: GameBoard; piecePositions: Set<string> } {
  const tetromino = createTetromino(type);
  const colorIndex = getTetrominoColorIndex(type);
  const board = placeTetromino(createEmptyBoard(), tetromino.shape, position, colorIndex);

  // Calculate expected piece positions for assertions
  const piecePositions = new Set<string>();
  tetromino.shape.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell !== 0) {
        piecePositions.add(`${position.x + colIndex},${position.y + rowIndex}`);
      }
    });
  });

  return { board, piecePositions };
}

/**
 * Set up mock for useBoardData hook with specific game state
 */
function setupBoardDataMock(gameState: Partial<GameState>) {
  mockBoardData = {
    displayBoard: gameState.board || createEmptyBoard(),
    currentPiecePositions: gameState.currentPiecePositions || new Set<string>(),
    ghostPiecePositions: gameState.ghostPiecePositions || new Set<string>(),
    placedPositionsSet: gameState.placedPositionsSet || new Set<string>(),
    clearingLines: gameState.clearingLines || [],
    animationTriggerKey: gameState.animationTriggerKey || 0,
  };
}

/**
 * Get rendered cell element by board coordinates
 */
function getCellAt(container: HTMLElement, x: number, y: number): HTMLElement {
  const cell = container.querySelector(`[data-testid="board-cell-${x}-${y}"]`);
  if (!cell) {
    throw new Error(`Cell at position (${x}, ${y}) not found`);
  }
  return cell as HTMLElement;
}

/**
 * Assert cell has expected tetromino properties
 * アサーションファースト: 期待する色と状態を明確に定義
 */
function expectCellToBeTetrominoType(
  cell: HTMLElement,
  expectedValue: number,
  isCurrentPiece = false,
  isGhostPiece = false,
) {
  if (cell.getAttribute("data-cell-value") !== expectedValue.toString()) {
    throw new Error(
      `Expected cell value ${expectedValue}, got ${cell.getAttribute("data-cell-value")}`,
    );
  }
  if (cell.getAttribute("data-is-current-piece") !== isCurrentPiece.toString()) {
    throw new Error(
      `Expected isCurrentPiece ${isCurrentPiece}, got ${cell.getAttribute("data-is-current-piece")}`,
    );
  }
  if (cell.getAttribute("data-is-ghost-piece") !== isGhostPiece.toString()) {
    throw new Error(
      `Expected isGhostPiece ${isGhostPiece}, got ${cell.getAttribute("data-is-ghost-piece")}`,
    );
  }
}

// ==============================
// TESTS - t_wada style: アサーションファースト & 三角測量
// ==============================

describe("Board.tsx - t_wada TDD Style", () => {
  // ==============================
  // 基本レンダリングテスト
  // ==============================

  describe("Basic Rendering", () => {
    test("should render board container with correct structure", () => {
      // Arrange: 空のボード状態を準備
      setupBoardDataMock({});

      // Act: Boardコンポーネントをレンダリング
      const { getByTestId } = render(<Board />);

      // Assert: 期待する構造が描画されていることを確認
      const container = getByTestId("board-container");
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass("bg-gray-900/50");
    });

    test("should render all 200 cells (10x20 board)", () => {
      // Arrange: 標準ボードサイズの設定
      setupBoardDataMock({});

      // Act: レンダリング
      const { container } = render(<Board />);

      // Assert: 200個（10×20）のセルが存在することを確認
      const cells = container.querySelectorAll("[data-testid^='board-cell-']");
      expect(cells).toHaveLength(GAME_CONSTANTS.BOARD.WIDTH * GAME_CONSTANTS.BOARD.HEIGHT);
    });
  });

  // ==============================
  // 三角測量: 全7種類のテトロミノ表示テスト
  // ==============================

  describe("Tetromino Display - Triangulation", () => {
    test.each([
      ["I-piece", "I" as TetrominoTypeName, 1, { x: 3, y: 0 }],
      ["O-piece", "O" as TetrominoTypeName, 2, { x: 4, y: 0 }],
      ["T-piece", "T" as TetrominoTypeName, 3, { x: 4, y: 0 }],
      ["S-piece", "S" as TetrominoTypeName, 4, { x: 4, y: 0 }],
      ["Z-piece", "Z" as TetrominoTypeName, 5, { x: 4, y: 0 }],
      ["J-piece", "J" as TetrominoTypeName, 6, { x: 4, y: 0 }],
      ["L-piece", "L" as TetrominoTypeName, 7, { x: 4, y: 0 }],
    ])(
      "should render %s with correct color index %d",
      (_description, type, expectedColorIndex, position) => {
        // Arrange: アサーションファースト - 期待する表示状態を定義
        const { board, piecePositions } = createBoardWithTetromino(type, position);
        setupBoardDataMock({
          board,
          currentPiecePositions: piecePositions,
        });

        // Act: レンダリング
        const { container } = render(<Board />);

        // Assert: 三角測量 - 各ピースが正しい色で表示されることを確認
        for (const positionKey of piecePositions) {
          const [x, y] = positionKey.split(",").map(Number);
          const cell = getCellAt(container, x, y);
          expectCellToBeTetrominoType(cell, expectedColorIndex, true);
        }
      },
    );
  });

  // ==============================
  // 境界値テスト - ボード境界での表示
  // ==============================

  describe("Boundary Value Testing", () => {
    test.each([
      ["top-left corner", { x: 0, y: 0 }],
      ["top-right corner", { x: 7, y: 0 }], // O-piece needs 2x2 space
      ["bottom-left corner", { x: 0, y: 18 }],
      ["bottom-right corner", { x: 8, y: 18 }],
      ["center position", { x: 4, y: 10 }],
    ])("should render O-piece at %s boundary", (_description, position) => {
      // Arrange: 境界値での配置状態を準備
      const { board, piecePositions } = createBoardWithTetromino("O", position);
      setupBoardDataMock({
        board,
        currentPiecePositions: piecePositions,
      });

      // Act: レンダリング
      const { container } = render(<Board />);

      // Assert: 境界位置でも正しく表示されることを確認
      for (const positionKey of piecePositions) {
        const [x, y] = positionKey.split(",").map(Number);
        const cell = getCellAt(container, x, y);
        expectCellToBeTetrominoType(cell, 2, true); // O-piece color index is 2
      }
    });

    test("should handle positions near board edges correctly", () => {
      // Arrange: エッジケースの配置
      const board = createEmptyBoard();
      board[19][9] = 1; // Place I-piece color at edge

      setupBoardDataMock({
        board,
        currentPiecePositions: new Set(["9,19"]),
      });

      // Act: レンダリング
      const { container } = render(<Board />);

      // Assert: エッジ位置の1セルが正しく表示
      const cell = getCellAt(container, 9, 19);
      expectCellToBeTetrominoType(cell, 1, true);
    });
  });

  // ==============================
  // ゴーストピース表示テスト
  // ==============================

  describe("Ghost Piece Display", () => {
    test("should render ghost piece with transparent appearance", () => {
      // Arrange: ゴーストピース表示状態を準備
      const currentPosition = { x: 4, y: 5 };
      const ghostPosition = { x: 4, y: 17 };
      const { board: currentBoard, piecePositions: currentPositions } = createBoardWithTetromino(
        "T",
        currentPosition,
      );
      const { piecePositions: ghostPositions } = createBoardWithTetromino("T", ghostPosition);

      setupBoardDataMock({
        board: currentBoard,
        currentPiecePositions: currentPositions,
        ghostPiecePositions: ghostPositions,
      });

      // Act: レンダリング
      const { container } = render(<Board />);

      // Assert: 現在のピースとゴーストピースが区別されて表示
      // Current piece cells
      for (const positionKey of currentPositions) {
        const [x, y] = positionKey.split(",").map(Number);
        const cell = getCellAt(container, x, y);
        expectCellToBeTetrominoType(cell, 3, true, false);
      }

      // Ghost piece cells
      for (const positionKey of ghostPositions) {
        const [x, y] = positionKey.split(",").map(Number);
        const cell = getCellAt(container, x, y);
        expectCellToBeTetrominoType(cell, 0, false, true);
      }
    });

    test("should not show ghost piece where current piece exists", () => {
      // Arrange: 現在のピースとゴーストピースが重複する位置
      const position = { x: 4, y: 10 };
      const { board, piecePositions } = createBoardWithTetromino("I", position);

      setupBoardDataMock({
        board,
        currentPiecePositions: piecePositions,
        ghostPiecePositions: piecePositions, // Same positions
      });

      // Act: レンダリング
      const { container } = render(<Board />);

      // Assert: 現在のピースのみ表示され、ゴーストは表示されない
      for (const positionKey of piecePositions) {
        const [x, y] = positionKey.split(",").map(Number);
        const cell = getCellAt(container, x, y);
        expectCellToBeTetrominoType(cell, 1, true, false);
      }
    });
  });

  // ==============================
  // ゲーム状態別表示テスト
  // ==============================

  describe("Game State Display", () => {
    test("should render line clearing animation state", () => {
      // Arrange: ライン消去アニメーション状態を準備
      const board = createEmptyBoard();
      // Fill bottom line for clearing
      for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH; x++) {
        board[19][x] = 1;
      }

      setupBoardDataMock({
        board,
        clearingLines: [19],
      });

      // Act: レンダリング
      const { container } = render(<Board />);

      // Assert: 消去ラインのセルが特別なプロパティを持つ
      for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH; x++) {
        const cell = getCellAt(container, x, 19);
        expect(cell).toHaveAttribute("data-is-clearing-line", "true");
      }
    });

    test("should render placed pieces correctly", () => {
      // Arrange: 配置済みピース状態を準備
      const board = createEmptyBoard();
      board[18][4] = 3; // T-piece color
      board[18][5] = 3;
      const placedPositions = new Set(["4,18", "5,18"]);

      setupBoardDataMock({
        board,
        placedPositionsSet: placedPositions,
      });

      // Act: レンダリング
      const { container } = render(<Board />);

      // Assert: 配置済みピースが正しく表示
      const cell1 = getCellAt(container, 4, 18);
      const cell2 = getCellAt(container, 5, 18);

      expect(cell1).toHaveAttribute("data-is-placed-piece", "true");
      expect(cell2).toHaveAttribute("data-is-placed-piece", "true");
      expectCellToBeTetrominoType(cell1, 3, false, false);
      expectCellToBeTetrominoType(cell2, 3, false, false);
    });

    test("should handle empty board correctly", () => {
      // Arrange: 完全に空のボード
      setupBoardDataMock({
        board: createEmptyBoard(),
      });

      // Act: レンダリング
      const { container } = render(<Board />);

      // Assert: 全セルが空状態で表示
      for (let y = 0; y < GAME_CONSTANTS.BOARD.HEIGHT; y++) {
        for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH; x++) {
          const cell = getCellAt(container, x, y);
          expectCellToBeTetrominoType(cell, 0, false, false);
        }
      }
    });
  });

  // ==============================
  // 複合状態テスト - 実際のゲームプレイに近い状態
  // ==============================

  describe("Complex Game State", () => {
    test("should render multiple game elements simultaneously", () => {
      // Arrange: 複合状態 - 現在のピース、ゴースト、配置済み、消去ライン
      const board = createEmptyBoard();

      // Place some pieces on the board (these are background/placed pieces)
      board[18][0] = 1; // I-piece
      board[18][1] = 2; // O-piece
      board[19][0] = 3; // T-piece (clearing line)
      board[19][1] = 4; // S-piece (clearing line)

      // Add current T-piece at top (this will modify the board with color)
      const currentPosition = { x: 4, y: 0 };
      const { board: boardWithCurrent, piecePositions: currentPositions } =
        createBoardWithTetromino("T", currentPosition);

      // Merge the background pieces with current piece board
      const finalBoard = boardWithCurrent.map((row, y) =>
        row.map((cell, x) => {
          // Preserve background pieces
          if (board[y][x] !== 0) return board[y][x];
          // Use current piece rendering
          return cell;
        }),
      );

      // Ghost piece at bottom (only positions, not on board)
      const { piecePositions: ghostPositions } = createBoardWithTetromino("T", { x: 4, y: 16 });

      setupBoardDataMock({
        board: finalBoard,
        currentPiecePositions: currentPositions,
        ghostPiecePositions: ghostPositions,
        placedPositionsSet: new Set(["0,18", "1,18"]),
        clearingLines: [19],
      });

      // Act: レンダリング
      const { container } = render(<Board />);

      // Assert: 各要素が正しく表示される
      // Current piece - should have T-piece color (3)
      for (const positionKey of currentPositions) {
        const [x, y] = positionKey.split(",").map(Number);
        const cell = getCellAt(container, x, y);
        expectCellToBeTetrominoType(cell, 3, true, false);
      }

      // Ghost piece - should be empty (0) but marked as ghost
      for (const positionKey of ghostPositions) {
        const [x, y] = positionKey.split(",").map(Number);
        const cell = getCellAt(container, x, y);
        expectCellToBeTetrominoType(cell, 0, false, true);
      }

      // Placed pieces
      const placedCell1 = getCellAt(container, 0, 18);
      const placedCell2 = getCellAt(container, 1, 18);
      expect(placedCell1).toHaveAttribute("data-is-placed-piece", "true");
      expect(placedCell2).toHaveAttribute("data-is-placed-piece", "true");

      // Clearing line
      const clearingCell1 = getCellAt(container, 0, 19);
      const clearingCell2 = getCellAt(container, 1, 19);
      expect(clearingCell1).toHaveAttribute("data-is-clearing-line", "true");
      expect(clearingCell2).toHaveAttribute("data-is-clearing-line", "true");
    });
  });

  // ==============================
  // パフォーマンステスト - 大量データでの動作確認
  // ==============================

  describe("Performance Testing", () => {
    test("should handle board with many placed pieces efficiently", () => {
      // Arrange: 大量の配置済みピースがあるボード
      const board = createEmptyBoard();
      const placedPositions = new Set<string>();

      // Fill half the board with pieces
      for (let y = 10; y < GAME_CONSTANTS.BOARD.HEIGHT; y++) {
        for (let x = 0; x < GAME_CONSTANTS.BOARD.WIDTH; x++) {
          board[y][x] = ((x + y) % 7) + 1; // Various colors
          placedPositions.add(`${x},${y}`);
        }
      }

      setupBoardDataMock({
        board,
        placedPositionsSet: placedPositions,
      });

      // Act: レンダリング（パフォーマンス測定）
      const startTime = performance.now();
      const { container } = render(<Board />);
      const endTime = performance.now();

      // Assert: レンダリング時間が合理的範囲内 & 正しく表示
      expect(endTime - startTime).toBeLessThan(100); // 100ms以内

      // Verify a few cells are rendered correctly
      const cell = getCellAt(container, 0, 10);
      expectCellToBeTetrominoType(cell, ((0 + 10) % 7) + 1, false, false);
    });
  });
});

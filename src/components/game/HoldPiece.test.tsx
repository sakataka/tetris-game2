import { describe, expect, mock, test } from "bun:test";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import type React from "react";
import type { TetrominoTypeName } from "../../types/game";
import { HoldPiece } from "./HoldPiece";

// ==============================
// MOCKS - t_wada style: Mock only external dependencies
// ==============================

// Create a mutable mock state holder for game store
let mockGameState = {
  heldPiece: null as TetrominoTypeName | null,
  canHold: true,
};

// Mock Zustand game store
mock.module("../../store/gameStore", () => ({
  useGameStore: (selector: (state: typeof mockGameState) => unknown) => {
    return selector(mockGameState);
  },
}));

// Mock react-i18next for internationalization
mock.module("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "game.hold": "HOLD",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock TetrominoGrid component for focused testing
mock.module("./TetrominoGrid", () => ({
  TetrominoGrid: (props: {
    shape: number[][] | null;
    tetrominoColor: string;
    gridSize: number;
    keyPrefix: string;
    disabled?: boolean;
  }) => (
    <div
      data-testid="tetromino-grid"
      data-shape={props.shape ? JSON.stringify(props.shape) : "null"}
      data-tetromino-color={props.tetrominoColor}
      data-grid-size={props.gridSize}
      data-key-prefix={props.keyPrefix}
      data-disabled={props.disabled}
    />
  ),
}));

// Mock Card components
mock.module("../ui/card", () => ({
  Card: (props: { children: React.ReactNode; className?: string }) => (
    <div data-testid="hold-piece-container" className={props.className}>
      {props.children}
    </div>
  ),
  CardHeader: (props: { children: React.ReactNode }) => (
    <div data-testid="card-header">{props.children}</div>
  ),
  CardTitle: (props: { children: React.ReactNode; className?: string }) => (
    <h3 data-testid="card-title" className={props.className}>
      {props.children}
    </h3>
  ),
  CardContent: (props: { children: React.ReactNode }) => (
    <div data-testid="card-content">{props.children}</div>
  ),
}));

// Mock utility functions
mock.module("@/lib/utils", () => ({
  cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(" "),
}));

mock.module("../../game/tetrominos", () => ({
  getTetrominoShape: (type: TetrominoTypeName) => {
    const shapes: Record<TetrominoTypeName, number[][]> = {
      I: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      O: [
        [1, 1],
        [1, 1],
      ],
      T: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      S: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
      ],
      Z: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
      ],
      J: [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0],
      ],
      L: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0],
      ],
    };
    return shapes[type];
  },
}));

mock.module("../../utils/colors", () => ({
  getTetrominoColor: (type: TetrominoTypeName) => {
    const colors: Record<TetrominoTypeName, string> = {
      I: "bg-tetris-i",
      O: "bg-tetris-o",
      T: "bg-tetris-t",
      S: "bg-tetris-s",
      Z: "bg-tetris-z",
      J: "bg-tetris-j",
      L: "bg-tetris-l",
    };
    return colors[type];
  },
}));

mock.module("../../utils/gameConstants", () => ({
  GAME_CONSTANTS: {
    TETROMINO: {
      NEXT_PIECE_GRID_SIZE: 4,
    },
  },
}));

mock.module("../../utils/styles", () => ({
  CARD_STYLES: {
    base: "rounded-xl border bg-card text-card-foreground",
    hover: "transition-shadow duration-300",
  },
}));

// ==============================
// TEST HELPERS - t_wada style: Helper functions for testing
// ==============================

/**
 * Set up mock game state for testing
 * Assertion First: Create by working backwards from expected state
 */
function setupGameStateMock(state: { heldPiece?: TetrominoTypeName | null; canHold?: boolean }) {
  mockGameState = {
    heldPiece: state.heldPiece ?? null,
    canHold: state.canHold ?? true,
  };
}

/**
 * Get expected tetromino shape for test assertions
 */
function getExpectedTetrominoShape(type: TetrominoTypeName): number[][] {
  const shapes: Record<TetrominoTypeName, number[][]> = {
    I: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    O: [
      [1, 1],
      [1, 1],
    ],
    T: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    S: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    Z: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    J: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    L: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
  };
  return shapes[type];
}

/**
 * Get TetrominoGrid component from rendered HoldPiece
 */
function getTetrominoGrid(container: HTMLElement): HTMLElement {
  const grid = container.querySelector("[data-testid='tetromino-grid']");
  if (!grid) {
    throw new Error("TetrominoGrid not found");
  }
  return grid as HTMLElement;
}

/**
 * Assert TetrominoGrid has expected properties
 * Assertion First: Clearly define expected grid state
 */
function expectTetrominoGridToBe(
  grid: HTMLElement,
  expectedProps: {
    shape: number[][] | null;
    tetrominoColor: string;
    gridSize: number;
    keyPrefix: string;
    disabled?: boolean;
  },
) {
  expect(grid.getAttribute("data-shape")).toBe(
    expectedProps.shape ? JSON.stringify(expectedProps.shape) : "null",
  );
  expect(grid.getAttribute("data-tetromino-color")).toBe(expectedProps.tetrominoColor);
  expect(grid.getAttribute("data-grid-size")).toBe(expectedProps.gridSize.toString());
  expect(grid.getAttribute("data-key-prefix")).toBe(expectedProps.keyPrefix);
  expect(grid.getAttribute("data-disabled")).toBe((expectedProps.disabled ?? false).toString());
}

// ==============================
// TESTS - t_wada style: Assertion First & Triangulation
// ==============================

describe("HoldPiece.tsx - t_wada TDD Style", () => {
  // ==============================
  // Basic Structure Test
  // ==============================

  describe("Basic Structure", () => {
    test("should render hold piece container with correct structure", () => {
      // Arrange: Prepare empty hold state
      setupGameStateMock({});

      // Act: Render HoldPiece component
      const { getByTestId } = render(<HoldPiece />);

      // Assert: Verify expected structure is rendered
      const container = getByTestId("hold-piece-container");
      const header = getByTestId("card-header");
      const title = getByTestId("card-title");
      const content = getByTestId("card-content");

      expect(container).toBeInTheDocument();
      expect(header).toBeInTheDocument();
      expect(title).toBeInTheDocument();
      expect(content).toBeInTheDocument();
    });

    test("should display 'HOLD' title text", () => {
      // Arrange: Set up basic state
      setupGameStateMock({});

      // Act: Render
      const { getByTestId } = render(<HoldPiece />);

      // Assert: Title displays correct text
      const title = getByTestId("card-title");
      expect(title).toHaveTextContent("HOLD");
    });

    test("should always render TetrominoGrid component", () => {
      // Arrange: Empty hold state
      setupGameStateMock({});

      // Act: Render
      const { container } = render(<HoldPiece />);

      // Assert: TetrominoGrid is always present
      const grid = getTetrominoGrid(container);
      expect(grid).toBeInTheDocument();
    });
  });

  // ==============================
  // Triangulation: All 7 tetromino types hold display
  // ==============================

  describe("Tetromino Hold Display - Triangulation", () => {
    test.each([
      ["I-piece", "I" as TetrominoTypeName, "bg-tetris-i"],
      ["O-piece", "O" as TetrominoTypeName, "bg-tetris-o"],
      ["T-piece", "T" as TetrominoTypeName, "bg-tetris-t"],
      ["S-piece", "S" as TetrominoTypeName, "bg-tetris-s"],
      ["Z-piece", "Z" as TetrominoTypeName, "bg-tetris-z"],
      ["J-piece", "J" as TetrominoTypeName, "bg-tetris-j"],
      ["L-piece", "L" as TetrominoTypeName, "bg-tetris-l"],
    ])("should display held %s with correct color %s", (_description, type, expectedColor) => {
      // Arrange: Assertion First - Define expected hold display state
      setupGameStateMock({
        heldPiece: type,
        canHold: true,
      });

      // Act: Render
      const { container } = render(<HoldPiece />);

      // Assert: Triangulation - Verify each piece displays with correct properties
      const grid = getTetrominoGrid(container);
      expectTetrominoGridToBe(grid, {
        shape: getExpectedTetrominoShape(type),
        tetrominoColor: expectedColor,
        gridSize: 4,
        keyPrefix: "hold",
        disabled: false,
      });
    });
  });

  // ==============================
  // Hold State Management Test
  // ==============================

  describe("Hold State Management", () => {
    test("should display normally when hold is available", () => {
      // Arrange: Hold available state
      setupGameStateMock({
        heldPiece: "T",
        canHold: true,
      });

      // Act: Render
      const { container } = render(<HoldPiece />);

      // Assert: TetrominoGrid is not disabled
      const grid = getTetrominoGrid(container);
      expectTetrominoGridToBe(grid, {
        shape: getExpectedTetrominoShape("T"),
        tetrominoColor: "bg-tetris-t",
        gridSize: 4,
        keyPrefix: "hold",
        disabled: false,
      });
    });

    test("should display with disabled state when hold is not available", () => {
      // Arrange: Hold unavailable state
      setupGameStateMock({
        heldPiece: "I",
        canHold: false,
      });

      // Act: Render
      const { container } = render(<HoldPiece />);

      // Assert: TetrominoGrid is disabled (visual feedback)
      const grid = getTetrominoGrid(container);
      expectTetrominoGridToBe(grid, {
        shape: getExpectedTetrominoShape("I"),
        tetrominoColor: "bg-tetris-i",
        gridSize: 4,
        keyPrefix: "hold",
        disabled: true,
      });
    });

    test("should handle empty hold state correctly", () => {
      // Arrange: No piece held
      setupGameStateMock({
        heldPiece: null,
        canHold: true,
      });

      // Act: Render
      const { container } = render(<HoldPiece />);

      // Assert: Empty state display
      const grid = getTetrominoGrid(container);
      expectTetrominoGridToBe(grid, {
        shape: null,
        tetrominoColor: "",
        gridSize: 4,
        keyPrefix: "hold",
        disabled: false,
      });
    });

    test("should handle empty hold state when hold is unavailable", () => {
      // Arrange: No piece held and hold unavailable
      setupGameStateMock({
        heldPiece: null,
        canHold: false,
      });

      // Act: Render
      const { container } = render(<HoldPiece />);

      // Assert: Empty disabled state
      const grid = getTetrominoGrid(container);
      expectTetrominoGridToBe(grid, {
        shape: null,
        tetrominoColor: "",
        gridSize: 4,
        keyPrefix: "hold",
        disabled: true,
      });
    });
  });

  // ==============================
  // Internationalization Test
  // ==============================

  describe("Internationalization", () => {
    test("should display translated 'HOLD' title", () => {
      // Arrange: Standard hold state
      setupGameStateMock({
        heldPiece: "O",
        canHold: true,
      });

      // Act: Render
      const { getByTestId } = render(<HoldPiece />);

      // Assert: Title shows translated text
      const title = getByTestId("card-title");
      expect(title).toHaveTextContent("HOLD");
    });
  });

  // ==============================
  // Grid Configuration Test
  // ==============================

  describe("Grid Configuration", () => {
    test("should always configure TetrominoGrid with correct parameters", () => {
      // Arrange: Any valid hold state
      setupGameStateMock({
        heldPiece: "L",
        canHold: true,
      });

      // Act: Render
      const { container } = render(<HoldPiece />);

      // Assert: Grid configuration is consistent
      const grid = getTetrominoGrid(container);
      expect(grid.getAttribute("data-grid-size")).toBe("4");
      expect(grid.getAttribute("data-key-prefix")).toBe("hold");
    });

    test("should pass correct grid configuration for empty state", () => {
      // Arrange: Empty hold state
      setupGameStateMock({
        heldPiece: null,
        canHold: true,
      });

      // Act: Render
      const { container } = render(<HoldPiece />);

      // Assert: Grid parameters remain consistent even when empty
      const grid = getTetrominoGrid(container);
      expect(grid.getAttribute("data-grid-size")).toBe("4");
      expect(grid.getAttribute("data-key-prefix")).toBe("hold");
    });
  });

  // ==============================
  // Edge Cases & Boundary Testing
  // ==============================

  describe("Edge Cases", () => {
    test("should handle state transitions correctly", () => {
      // Arrange: Start with empty state
      setupGameStateMock({
        heldPiece: null,
        canHold: true,
      });

      // Act: Initial render
      const { container, rerender } = render(<HoldPiece />);

      // Assert: Initially empty
      let grid = getTetrominoGrid(container);
      expectTetrominoGridToBe(grid, {
        shape: null,
        tetrominoColor: "",
        gridSize: 4,
        keyPrefix: "hold",
        disabled: false,
      });

      // Arrange: Change to held piece
      setupGameStateMock({
        heldPiece: "Z",
        canHold: false,
      });

      // Act: Re-render with new state
      rerender(<HoldPiece />);

      // Assert: Now shows held piece
      grid = getTetrominoGrid(container);
      expectTetrominoGridToBe(grid, {
        shape: getExpectedTetrominoShape("Z"),
        tetrominoColor: "bg-tetris-z",
        gridSize: 4,
        keyPrefix: "hold",
        disabled: true,
      });
    });
  });
});

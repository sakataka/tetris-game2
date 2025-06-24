import { describe, expect, mock, test } from "bun:test";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import type React from "react";
import { BoardCell } from "./BoardCell";

// Simple, focused mocks
mock.module("../../hooks/useCellAnimation", () => ({
  useCellAnimation: () => ({
    initialAnimation: {},
    animateProps: {},
    transitionProps: {},
  }),
}));

mock.module("../../hooks/useAnimationCompletionHandler", () => ({
  useAnimationCompletionHandler: () => ({
    handleAnimationComplete: () => {},
  }),
}));

mock.module("../../utils/colors", () => ({
  getCellColor: () => "bg-gray-200",
}));

mock.module("../../utils/constants", () => ({
  BOARD_WIDTH: 10,
}));

mock.module("../../utils/styles", () => ({
  BOARD_STYLES: {
    cell: "cell-base",
    cellBorder: "cell-border",
    emptyCellBorder: "empty-border",
    activePiece: "active-piece",
    clearingLine: "clearing-line",
    ghostPiece: "ghost-piece",
  },
}));

mock.module("@/lib/utils", () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(" "),
}));

mock.module("framer-motion", () => ({
  motion: {
    div: (props: { className?: string; children?: React.ReactNode }) => (
      <div data-testid="board-cell" className={props.className}>
        {props.children}
      </div>
    ),
  },
}));

describe("BoardCell", () => {
  const defaultProps = {
    cellValue: 0,
    x: 0,
    y: 0,
    isCurrentPiece: false,
    isGhostPiece: false,
    isPlacedPiece: false,
    isClearingLine: false,
    animationTriggerKey: "test-key",
  };

  test("should render without errors", () => {
    const { getByTestId } = render(<BoardCell {...defaultProps} />);

    expect(getByTestId("board-cell")).toBeInTheDocument();
  });

  test("should apply basic cell classes", () => {
    const { getByTestId } = render(<BoardCell {...defaultProps} />);
    const cell = getByTestId("board-cell");

    expect(cell.className).toContain("cell-base");
    expect(cell.className).toContain("bg-gray-200");
  });

  test("should apply empty cell border for empty cells", () => {
    const { getByTestId } = render(<BoardCell {...defaultProps} cellValue={0} />);
    const cell = getByTestId("board-cell");

    expect(cell.className).toContain("empty-border");
    expect(cell.className).not.toContain("cell-border");
  });

  test("should apply cell border for filled cells", () => {
    const { getByTestId } = render(<BoardCell {...defaultProps} cellValue={1} />);
    const cell = getByTestId("board-cell");

    expect(cell.className).toContain("cell-border");
    expect(cell.className).not.toContain("empty-border");
  });

  test("should apply active piece styles when isCurrentPiece is true", () => {
    const { getByTestId } = render(<BoardCell {...defaultProps} isCurrentPiece={true} />);
    const cell = getByTestId("board-cell");

    expect(cell.className).toContain("active-piece");
  });

  test("should apply clearing line styles when isClearingLine is true", () => {
    const { getByTestId } = render(<BoardCell {...defaultProps} isClearingLine={true} />);
    const cell = getByTestId("board-cell");

    expect(cell.className).toContain("clearing-line");
  });

  test("should render with different cell values", () => {
    const { rerender, getByTestId } = render(<BoardCell {...defaultProps} cellValue={0} />);
    expect(getByTestId("board-cell")).toBeInTheDocument();

    rerender(<BoardCell {...defaultProps} cellValue={5} />);
    expect(getByTestId("board-cell")).toBeInTheDocument();
  });

  test("should combine multiple conditional classes", () => {
    const { getByTestId } = render(
      <BoardCell {...defaultProps} cellValue={3} isCurrentPiece={true} isClearingLine={true} />,
    );
    const cell = getByTestId("board-cell");

    expect(cell.className).toContain("cell-base");
    expect(cell.className).toContain("cell-border");
    expect(cell.className).toContain("active-piece");
    expect(cell.className).toContain("clearing-line");
  });

  test("should render with animation handler", () => {
    const { getByTestId } = render(<BoardCell {...defaultProps} />);

    expect(getByTestId("board-cell")).toBeInTheDocument();
  });
});

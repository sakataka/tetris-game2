import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BoardCell } from "./BoardCell";

// Mock all dependencies at module level
vi.mock("../../hooks/useCellAnimation", () => ({
  useCellAnimation: vi.fn(() => ({
    shouldAnimate: true,
    initialAnimation: { opacity: 0 },
    animateProps: { opacity: 1 },
    transitionProps: { duration: 0.3 },
  })),
}));

vi.mock("../../utils/colors", () => ({
  getCellColor: vi.fn(() => "bg-gray-200"),
}));

vi.mock("../../utils/constants", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    BOARD_WIDTH: 10, // Keep this specific mock if needed for tests
    // TETROMINO_TYPES will be taken from the actual module
  };
});

vi.mock("../../utils/styles", () => ({
  BOARD_STYLES: {
    cell: "cell-base",
    cellBorder: "cell-border",
    emptyCellBorder: "empty-border",
    activePiece: "active-piece",
    clearingLine: "clearing-line",
  },
}));

vi.mock("@/lib/utils", () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(" ")),
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: vi.fn().mockImplementation((props) => (
      <div data-testid="board-cell" className={props.className}>
        {props.children}
      </div>
    )),
  },
}));

describe("BoardCell", () => {
  const defaultProps = {
    cellValue: 0,
    x: 0,
    y: 0,
    isCurrentPiece: false,
    isPlacedPiece: false,
    isClearingLine: false,
    animationTriggerKey: "test-key",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render without errors", () => {
    const { getByTestId } = render(<BoardCell {...defaultProps} />);

    expect(getByTestId("board-cell")).toBeInTheDocument();
  });

  it("should apply basic cell classes", () => {
    const { getByTestId } = render(<BoardCell {...defaultProps} />);
    const cell = getByTestId("board-cell");

    expect(cell.className).toContain("cell-base");
    expect(cell.className).toContain("bg-gray-200");
  });

  it("should apply empty cell border for empty cells", () => {
    const { getByTestId } = render(<BoardCell {...defaultProps} cellValue={0} />);
    const cell = getByTestId("board-cell");

    expect(cell.className).toContain("empty-border");
    expect(cell.className).not.toContain("cell-border");
  });

  it("should apply cell border for filled cells", () => {
    const { getByTestId } = render(<BoardCell {...defaultProps} cellValue={1} />);
    const cell = getByTestId("board-cell");

    expect(cell.className).toContain("cell-border");
    expect(cell.className).not.toContain("empty-border");
  });

  it("should apply active piece styles when isCurrentPiece is true", () => {
    const { getByTestId } = render(<BoardCell {...defaultProps} isCurrentPiece={true} />);
    const cell = getByTestId("board-cell");

    expect(cell.className).toContain("active-piece");
  });

  it("should apply clearing line styles when isClearingLine is true", () => {
    const { getByTestId } = render(<BoardCell {...defaultProps} isClearingLine={true} />);
    const cell = getByTestId("board-cell");

    expect(cell.className).toContain("clearing-line");
  });

  it("should render with different cell values", () => {
    const { rerender, getByTestId } = render(<BoardCell {...defaultProps} cellValue={0} />);
    expect(getByTestId("board-cell")).toBeInTheDocument();

    rerender(<BoardCell {...defaultProps} cellValue={5} />);
    expect(getByTestId("board-cell")).toBeInTheDocument();
  });

  it("should combine multiple conditional classes", () => {
    const { getByTestId } = render(
      <BoardCell {...defaultProps} cellValue={3} isCurrentPiece={true} isClearingLine={true} />,
    );
    const cell = getByTestId("board-cell");

    expect(cell.className).toContain("cell-base");
    expect(cell.className).toContain("cell-border");
    expect(cell.className).toContain("active-piece");
    expect(cell.className).toContain("clearing-line");
  });

  it("should render with animation callback", () => {
    const onAnimationComplete = vi.fn();
    const { getByTestId } = render(
      <BoardCell {...defaultProps} onAnimationComplete={onAnimationComplete} />,
    );

    expect(getByTestId("board-cell")).toBeInTheDocument();
  });
});

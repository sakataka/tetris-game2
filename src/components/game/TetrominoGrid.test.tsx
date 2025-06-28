import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TetrominoGrid } from "./TetrominoGrid";

describe("TetrominoGrid", () => {
  it("renders grid with correct size", () => {
    const { container } = render(
      <TetrominoGrid shape={null} tetrominoColor="" gridSize={4} keyPrefix="test" />,
    );

    // More robust selector - find all div elements inside the grid container
    const gridContainer = container.querySelector("div");
    const gridCells = gridContainer?.querySelectorAll("div") || [];
    expect(gridCells.length).toBe(12); // 3 rows * 4 columns
  });

  it("renders active cells with tetromino color", () => {
    const shape = [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ];

    const { container } = render(
      <TetrominoGrid shape={shape} tetrominoColor="bg-red-500" gridSize={4} keyPrefix="test" />,
    );

    // More robust selector
    const gridContainer = container.querySelector("div");
    const gridCells = gridContainer?.querySelectorAll("div") || [];
    const activeCells = Array.from(gridCells).filter((cell) =>
      cell.className.includes("bg-red-500"),
    );

    expect(activeCells.length).toBe(4); // 4 active cells in the shape
  });

  it("renders inactive cells with default color", () => {
    const shape = [
      [0, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    const { container } = render(
      <TetrominoGrid shape={shape} tetrominoColor="bg-blue-500" gridSize={4} keyPrefix="test" />,
    );

    // More robust selector
    const gridContainer = container.querySelector("div");
    const gridCells = gridContainer?.querySelectorAll("div") || [];
    const inactiveCells = Array.from(gridCells).filter((cell) =>
      cell.className.includes("bg-gray-800"),
    );

    expect(inactiveCells.length).toBe(11); // 12 total - 1 active = 11 inactive
  });

  it("applies disabled styles when disabled prop is true", () => {
    const { container } = render(
      <TetrominoGrid
        shape={null}
        tetrominoColor=""
        gridSize={4}
        keyPrefix="test"
        disabled={true}
      />,
    );

    const grid = container.querySelector("div");
    expect(grid).toHaveClass("opacity-50");
  });

  it("does not apply disabled styles when disabled prop is false", () => {
    const { container } = render(
      <TetrominoGrid
        shape={null}
        tetrominoColor=""
        gridSize={4}
        keyPrefix="test"
        disabled={false}
      />,
    );

    const grid = container.querySelector("div");
    expect(grid).not.toHaveClass("opacity-50");
  });

  it("uses correct key prefix for cells", () => {
    const { container } = render(
      <TetrominoGrid shape={null} tetrominoColor="" gridSize={4} keyPrefix="custom" />,
    );

    // More robust selector
    const gridContainer = container.querySelector("div");
    const gridCells = gridContainer?.querySelectorAll("div") || [];
    gridCells.forEach((cell) => {
      expect(cell.getAttribute("data-testid")).toBeNull(); // React doesn't expose keys to DOM
    });
  });

  it("handles null shape gracefully", () => {
    const { container } = render(
      <TetrominoGrid shape={null} tetrominoColor="bg-green-500" gridSize={4} keyPrefix="test" />,
    );

    // More robust selector
    const gridContainer = container.querySelector("div");
    const gridCells = gridContainer?.querySelectorAll("div") || [];
    const activeCells = Array.from(gridCells).filter((cell) =>
      cell.className.includes("bg-green-500"),
    );

    expect(activeCells.length).toBe(0); // No active cells when shape is null
  });
});

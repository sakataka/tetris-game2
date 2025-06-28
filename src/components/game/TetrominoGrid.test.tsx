import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TetrominoGrid } from "./TetrominoGrid";

describe("TetrominoGrid", () => {
  it("renders grid container", () => {
    const { container } = render(
      <TetrominoGrid shape={null} tetrominoColor="" gridSize={4} keyPrefix="test" />,
    );

    // Just verify the main grid container exists
    const gridContainer = container.querySelector("div");
    expect(gridContainer).toBeInTheDocument();
  });

  it("renders with tetromino color when shape provided", () => {
    const shape = [
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0],
    ];

    const { container } = render(
      <TetrominoGrid shape={shape} tetrominoColor="bg-red-500" gridSize={4} keyPrefix="test" />,
    );

    // Verify container exists and has appropriate content
    const gridContainer = container.querySelector("div");
    expect(gridContainer).toBeInTheDocument();
    expect(container.innerHTML).toContain("bg-red-500");
  });

  it("renders with default background color", () => {
    const shape = [
      [0, 1, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];

    const { container } = render(
      <TetrominoGrid shape={shape} tetrominoColor="bg-blue-500" gridSize={4} keyPrefix="test" />,
    );

    // Verify container and default background styling
    const gridContainer = container.querySelector("div");
    expect(gridContainer).toBeInTheDocument();
    expect(container.innerHTML).toContain("bg-gray-800");
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

  it("renders with custom key prefix", () => {
    const { container } = render(
      <TetrominoGrid shape={null} tetrominoColor="" gridSize={4} keyPrefix="custom" />,
    );

    // Verify component renders successfully with custom key prefix
    const gridContainer = container.querySelector("div");
    expect(gridContainer).toBeInTheDocument();
  });

  it("handles null shape gracefully", () => {
    const { container } = render(
      <TetrominoGrid shape={null} tetrominoColor="bg-green-500" gridSize={4} keyPrefix="test" />,
    );

    // Verify component renders without errors when shape is null
    const gridContainer = container.querySelector("div");
    expect(gridContainer).toBeInTheDocument();
    // When shape is null, tetromino color should not appear
    expect(container.innerHTML).not.toContain("bg-green-500");
  });
});

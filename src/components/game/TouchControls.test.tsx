import { beforeEach, describe, expect, it, mock } from "bun:test";
import { render } from "@testing-library/react";
import { TouchControls } from "./TouchControls";

// Mock react-i18next using shared mock
mock.module("react-i18next", () => import("../../test/__mocks__/react-i18next"));

// Mock UI components
mock.module("../ui/button", () => ({
  Button: mock(({ children, className, disabled, onTouchStart, onClick, ...props }) => (
    <button
      className={className}
      disabled={disabled}
      onTouchStart={onTouchStart}
      onClick={onClick}
      data-testid="button"
      {...props}
    >
      {children}
    </button>
  )),
}));

// Mock the game store
const mockGameStore = {
  moveLeft: mock(() => {}),
  moveRight: mock(() => {}),
  moveDown: mock(() => {}),
  rotate: mock(() => {}),
  drop: mock(() => {}),
  isPaused: false,
  isGameOver: false,
};

mock.module("../../store/gameStore", () => ({
  useGameStore: () => mockGameStore,
}));

describe("TouchControls", () => {
  beforeEach(() => {
    // Reset mock store state before each test
    mockGameStore.isPaused = false;
    mockGameStore.isGameOver = false;
    mockGameStore.moveLeft.mockClear();
    mockGameStore.moveRight.mockClear();
    mockGameStore.moveDown.mockClear();
    mockGameStore.rotate.mockClear();
    mockGameStore.drop.mockClear();
  });
  it("renders all control buttons", () => {
    const { container } = render(<TouchControls />);

    expect(container.querySelector('[aria-label="Rotate piece"]')).toBeTruthy();
    expect(container.querySelector('[aria-label="Hard drop"]')).toBeTruthy();
    expect(container.querySelector('[aria-label="Soft drop"]')).toBeTruthy();
    expect(container.querySelector('[aria-label="Move left"]')).toBeTruthy();
    expect(container.querySelector('[aria-label="Move right"]')).toBeTruthy();
  });

  it("disables buttons when game is paused", () => {
    mockGameStore.isPaused = true;

    const { container } = render(<TouchControls />);

    expect(container.querySelector('[aria-label="Rotate piece"]')).toHaveProperty("disabled", true);
    expect(container.querySelector('[aria-label="Hard drop"]')).toHaveProperty("disabled", true);
    expect(container.querySelector('[aria-label="Soft drop"]')).toHaveProperty("disabled", true);
    expect(container.querySelector('[aria-label="Move left"]')).toHaveProperty("disabled", true);
    expect(container.querySelector('[aria-label="Move right"]')).toHaveProperty("disabled", true);
  });

  it("disables buttons when game is over", () => {
    mockGameStore.isPaused = false;
    mockGameStore.isGameOver = true;

    const { container } = render(<TouchControls />);

    expect(container.querySelector('[aria-label="Rotate piece"]')).toHaveProperty("disabled", true);
    expect(container.querySelector('[aria-label="Hard drop"]')).toHaveProperty("disabled", true);
    expect(container.querySelector('[aria-label="Soft drop"]')).toHaveProperty("disabled", true);
    expect(container.querySelector('[aria-label="Move left"]')).toHaveProperty("disabled", true);
    expect(container.querySelector('[aria-label="Move right"]')).toHaveProperty("disabled", true);
  });

  it("applies custom className", () => {
    const { container } = render(<TouchControls className="custom-class" />);

    expect(container.firstChild).toHaveClass("custom-class");
  });
});

import { describe, expect, it, mock } from "bun:test";
import { render } from "@testing-library/react";
import type React from "react";
import { TouchControls } from "./TouchControls";

// Mock react-i18next
mock.module("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock UI components
mock.module("../ui/button", () => ({
  Button: ({
    children,
    className,
    disabled,
    onTouchStart,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    className?: string;
    disabled?: boolean;
    onTouchStart?: () => void;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
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
  ),
}));

// Simple mock for game store
mock.module("../../store/gameStore", () => ({
  useGameStore: () => ({
    moveLeft: () => {},
    moveRight: () => {},
    moveDown: () => {},
    rotate: () => {},
    drop: () => {},
    isPaused: false,
    isGameOver: false,
  }),
}));

describe("TouchControls", () => {
  it("renders all control buttons", () => {
    const { container } = render(<TouchControls />);

    expect(container.querySelector('[aria-label="Rotate piece"]')).toBeTruthy();
    expect(container.querySelector('[aria-label="Hard drop"]')).toBeTruthy();
    expect(container.querySelector('[aria-label="Soft drop"]')).toBeTruthy();
    expect(container.querySelector('[aria-label="Move left"]')).toBeTruthy();
    expect(container.querySelector('[aria-label="Move right"]')).toBeTruthy();
  });

  it("applies custom className", () => {
    const { container } = render(<TouchControls className="custom-class" />);

    expect(container.firstChild).toHaveClass("custom-class");
  });
});

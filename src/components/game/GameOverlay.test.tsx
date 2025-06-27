import { describe, expect, mock, test } from "bun:test";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import type React from "react";
import { GameOverlay } from "./GameOverlay";

// Simple mocks
mock.module("../../store/gameStore", () => ({
  useGameStore: (
    selector: (state: {
      isGameOver: boolean;
      isPaused: boolean;
      resetGame: () => void;
      togglePause: () => void;
    }) => unknown,
  ) => {
    const mockState = {
      isGameOver: false,
      isPaused: false,
      resetGame: mock(() => {}),
      togglePause: mock(() => {}),
    };
    return selector(mockState);
  },
}));

mock.module("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "game.gameOver": "GAME OVER",
        "game.paused": "PAUSED",
        "game.newGame": "NEW GAME",
        "game.resume": "RESUME",
        "game.resumeHint": "Press P to resume",
      };
      return translations[key] || key;
    },
  }),
}));

mock.module("../ui/button", () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} data-testid="game-button" {...props}>
      {children}
    </button>
  ),
}));

mock.module("../ui/AnimatedButton", () => ({
  AnimatedButton: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} data-testid="animated-button" {...props}>
      {children}
    </button>
  ),
}));

mock.module("../ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => (
    <div data-testid="dialog" data-open={open}>
      {open && children}
    </div>
  ),
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-content">{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2 data-testid="dialog-title">{children}</h2>
  ),
}));

mock.module("framer-motion", () => ({
  motion: {
    div: ({
      children,
      whileHover,
      whileTap,
      transition,
      ...props
    }: {
      children: React.ReactNode;
      whileHover?: unknown;
      whileTap?: unknown;
      transition?: unknown;
      [key: string]: unknown;
    }) => (
      <div data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
  },
}));

describe("GameOverlay", () => {
  test("should render basic component", () => {
    const { getByTestId } = render(<GameOverlay />);
    expect(getByTestId("dialog")).toBeInTheDocument();
  });
});

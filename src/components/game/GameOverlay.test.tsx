import { describe, expect, mock, test } from "bun:test";
import { fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { GameOverlay } from "./GameOverlay";

// Simple mocks
mock.module("../../store/gameStore", () => ({
  useGameStore: () => ({
    isGameOver: false,
    isPaused: false,
    resetGame: () => {},
    togglePause: () => {},
  }),
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
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} data-testid="game-button" {...props}>
      {children}
    </button>
  ),
}));

mock.module("../ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (
    <div data-testid="dialog" data-open={open}>
      {open && children}
    </div>
  ),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
}));

mock.module("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => (
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

import { fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGameStore } from "../../store/gameStore";
import { GameOverlay } from "./GameOverlay";

// Mock dependencies
vi.mock("../../store/gameStore");
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "game.gameOver": "GAME OVER",
        "game.paused": "PAUSED",
        "game.newGame": "NEW GAME",
        "game.resume": "RESUME",
        "game.resumeHint": "Press P to resume or click the button below",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock UI components
vi.mock("../ui/button", () => ({
  Button: vi.fn(({ children, onClick, className, ...props }) => (
    <button onClick={onClick} className={className} data-testid="game-button" {...props}>
      {children}
    </button>
  )),
}));

vi.mock("../ui/dialog", () => ({
  Dialog: vi.fn(({ children, open }) => (
    <div data-testid="dialog" data-open={open}>
      {open && children}
    </div>
  )),
  DialogContent: vi.fn(({ children, className }) => (
    <div data-testid="dialog-content" className={className}>
      {children}
    </div>
  )),
  DialogHeader: vi.fn(({ children, className }) => (
    <div data-testid="dialog-header" className={className}>
      {children}
    </div>
  )),
  DialogTitle: vi.fn(({ children, className }) => (
    <h2 data-testid="dialog-title" className={className}>
      {children}
    </h2>
  )),
}));

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: vi.fn(({ children, ...props }) => (
      <div data-testid="motion-div" {...props}>
        {children}
      </div>
    )),
  },
}));

describe("GameOverlay", () => {
  const mockGameStore = {
    isGameOver: false,
    isPaused: false,
    resetGame: vi.fn(),
    togglePause: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useGameStore).mockReturnValue(mockGameStore);
  });

  it("should not render dialog when game is not over and not paused", () => {
    const { getByTestId } = render(<GameOverlay />);

    expect(getByTestId("dialog")).toHaveAttribute("data-open", "false");
  });

  describe("game over state", () => {
    beforeEach(() => {
      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameStore,
        isGameOver: true,
      });
    });

    it("should render game over dialog", () => {
      const { getByTestId } = render(<GameOverlay />);

      expect(getByTestId("dialog")).toHaveAttribute("data-open", "true");
      expect(getByTestId("dialog-title")).toHaveTextContent("GAME OVER");
    });

    it("should render new game button", () => {
      const { getByText } = render(<GameOverlay />);

      expect(getByText("NEW GAME")).toBeInTheDocument();
    });

    it("should call resetGame when new game button is clicked", () => {
      const { getByText } = render(<GameOverlay />);

      fireEvent.click(getByText("NEW GAME"));

      expect(mockGameStore.resetGame).toHaveBeenCalledTimes(1);
    });

    it("should not render pause controls", () => {
      const { queryByText } = render(<GameOverlay />);

      expect(queryByText("Press P to resume or click the button below")).not.toBeInTheDocument();
      expect(queryByText("RESUME")).not.toBeInTheDocument();
    });

    it("should apply game over button styling", () => {
      const { getByTestId } = render(<GameOverlay />);

      const button = getByTestId("game-button");
      expect(button).toHaveClass("bg-red-600 hover:bg-red-700 text-white");
    });
  });

  describe("paused state", () => {
    beforeEach(() => {
      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameStore,
        isPaused: true,
      });
    });

    it("should render paused dialog", () => {
      const { getByTestId } = render(<GameOverlay />);

      expect(getByTestId("dialog")).toHaveAttribute("data-open", "true");
      expect(getByTestId("dialog-title")).toHaveTextContent("PAUSED");
    });

    it("should render resume hint text", () => {
      const { getByText } = render(<GameOverlay />);

      expect(getByText("Press P to resume or click the button below")).toBeInTheDocument();
    });

    it("should render resume button", () => {
      const { getByText } = render(<GameOverlay />);

      expect(getByText("RESUME")).toBeInTheDocument();
    });

    it("should call togglePause when resume button is clicked", () => {
      const { getByText } = render(<GameOverlay />);

      fireEvent.click(getByText("RESUME"));

      expect(mockGameStore.togglePause).toHaveBeenCalledTimes(1);
    });

    it("should not render game over controls", () => {
      const { queryByText } = render(<GameOverlay />);

      expect(queryByText("NEW GAME")).not.toBeInTheDocument();
    });

    it("should apply paused button styling", () => {
      const { getByTestId } = render(<GameOverlay />);

      const button = getByTestId("game-button");
      expect(button).toHaveClass("bg-blue-600 hover:bg-blue-700 text-white");
    });
  });

  describe("dialog properties", () => {
    it("should render with correct dialog content styling", () => {
      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameStore,
        isGameOver: true,
      });

      const { getByTestId } = render(<GameOverlay />);

      const dialogContent = getByTestId("dialog-content");
      expect(dialogContent).toHaveClass(
        "sm:max-w-md bg-gray-900/95 border-gray-700 backdrop-blur-sm",
      );
    });

    it("should render with correct header styling", () => {
      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameStore,
        isGameOver: true,
      });

      const { getByTestId } = render(<GameOverlay />);

      const dialogHeader = getByTestId("dialog-header");
      expect(dialogHeader).toHaveClass("text-center");
    });

    it("should render with correct title styling", () => {
      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameStore,
        isGameOver: true,
      });

      const { getByTestId } = render(<GameOverlay />);

      const dialogTitle = getByTestId("dialog-title");
      expect(dialogTitle).toHaveClass("text-3xl font-bold text-white mb-4 text-center");
    });
  });

  describe("game over title styling", () => {
    it("should apply red color to game over text", () => {
      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameStore,
        isGameOver: true,
      });

      const { container } = render(<GameOverlay />);

      const gameOverSpan = container.querySelector(".text-red-400");
      expect(gameOverSpan).toBeInTheDocument();
      expect(gameOverSpan).toHaveTextContent("GAME OVER");
    });

    it("should not apply red color to paused text", () => {
      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameStore,
        isPaused: true,
      });

      const { container } = render(<GameOverlay />);

      const redSpan = container.querySelector(".text-red-400");
      expect(redSpan).not.toBeInTheDocument();
    });
  });

  describe("motion animations", () => {
    it("should wrap buttons in motion divs", () => {
      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameStore,
        isGameOver: true,
      });

      const { getByTestId } = render(<GameOverlay />);

      expect(getByTestId("motion-div")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("should handle both isGameOver and isPaused being true", () => {
      vi.mocked(useGameStore).mockReturnValue({
        ...mockGameStore,
        isGameOver: true,
        isPaused: true,
      });

      const { getByTestId, getByText } = render(<GameOverlay />);

      expect(getByTestId("dialog")).toHaveAttribute("data-open", "true");
      expect(getByTestId("dialog-title")).toHaveTextContent("GAME OVER");
      expect(getByText("NEW GAME")).toBeInTheDocument();
      // Both states are shown when both flags are true
      expect(getByText("RESUME")).toBeInTheDocument();
    });
  });
});

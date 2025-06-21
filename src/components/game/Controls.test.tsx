import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Controls } from "./Controls";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "game.controls.title": "Controls",
        "game.controls.move": "Move",
        "game.controls.softDrop": "Soft Drop",
        "game.controls.rotate": "Rotate",
        "game.controls.hardDrop": "Hard Drop",
        "game.controls.pause": "Pause",
      };
      return translations[key] || key;
    },
  }),
}));

// Mock UI components
vi.mock("../ui/badge", () => ({
  Badge: vi.fn(({ children, className, variant }) => (
    <span data-testid="badge" className={className} data-variant={variant}>
      {children}
    </span>
  )),
}));

vi.mock("../ui/card", () => ({
  Card: vi.fn(({ children, className }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  )),
  CardContent: vi.fn(({ children }) => <div data-testid="card-content">{children}</div>),
  CardHeader: vi.fn(({ children, className }) => (
    <div data-testid="card-header" className={className}>
      {children}
    </div>
  )),
  CardTitle: vi.fn(({ children, className }) => (
    <h3 data-testid="card-title" className={className}>
      {children}
    </h3>
  )),
}));

describe("Controls", () => {
  it("should render controls card", () => {
    const { getByTestId } = render(<Controls />);

    expect(getByTestId("card")).toBeInTheDocument();
    expect(getByTestId("card-header")).toBeInTheDocument();
    expect(getByTestId("card-content")).toBeInTheDocument();
  });

  it("should render title", () => {
    const { getByTestId } = render(<Controls />);

    const title = getByTestId("card-title");
    expect(title).toHaveTextContent("Controls");
  });

  it("should render all control items", () => {
    const { getAllByTestId, getByText } = render(<Controls />);

    const badges = getAllByTestId("badge");
    expect(badges).toHaveLength(5);

    // Check all control keys
    expect(getByText("← →")).toBeInTheDocument();
    expect(getByText("↓")).toBeInTheDocument();
    expect(getByText("↑")).toBeInTheDocument();
    expect(getByText("Space")).toBeInTheDocument();
    expect(getByText("P")).toBeInTheDocument();
  });

  it("should render all control actions", () => {
    const { getByText } = render(<Controls />);

    expect(getByText("Move")).toBeInTheDocument();
    expect(getByText("Soft Drop")).toBeInTheDocument();
    expect(getByText("Rotate")).toBeInTheDocument();
    expect(getByText("Hard Drop")).toBeInTheDocument();
    expect(getByText("Pause")).toBeInTheDocument();
  });

  it("should apply correct styling to card", () => {
    const { getByTestId } = render(<Controls />);

    const card = getByTestId("card");
    expect(card).toHaveClass(
      "bg-gray-900/50 backdrop-blur-sm border-gray-700 shadow-xl hover:bg-gray-900/60 hover:border-gray-600 transition-all duration-300 hover:shadow-2xl",
    );
  });

  it("should apply correct styling to card header", () => {
    const { getByTestId } = render(<Controls />);

    const header = getByTestId("card-header");
    expect(header).toHaveClass("pb-3");
  });

  it("should apply correct styling to card title", () => {
    const { getByTestId } = render(<Controls />);

    const title = getByTestId("card-title");
    expect(title).toHaveClass("text-lg font-bold text-gray-300 text-center");
  });

  it("should apply correct styling to badges", () => {
    const { getAllByTestId } = render(<Controls />);

    const badges = getAllByTestId("badge");
    badges.forEach((badge) => {
      expect(badge).toHaveClass("font-mono text-xs border-gray-600 text-gray-300");
      expect(badge).toHaveAttribute("data-variant", "outline");
    });
  });

  it("should render control items with correct structure", () => {
    const { container } = render(<Controls />);

    const controlItems = container.querySelectorAll(".space-y-2 > div");
    expect(controlItems).toHaveLength(5);

    controlItems.forEach((item) => {
      expect(item).toHaveClass(
        "flex items-center justify-between py-2 px-3 bg-gray-800/30 rounded-md transition-colors hover:bg-gray-700/30",
      );
    });
  });

  it("should render action text with correct styling", () => {
    const { container } = render(<Controls />);

    const actionSpans = container.querySelectorAll(".text-sm.text-gray-300");
    expect(actionSpans).toHaveLength(5);
  });

  describe("control items mapping", () => {
    it("should map arrow keys to move action", () => {
      const { container } = render(<Controls />);

      const moveControl = Array.from(container.querySelectorAll(".flex.items-center")).find(
        (item) => item.textContent?.includes("← →"),
      );

      expect(moveControl).toBeInTheDocument();
      expect(moveControl).toHaveTextContent("Move");
    });

    it("should map down arrow to soft drop action", () => {
      const { container } = render(<Controls />);

      const softDropControl = Array.from(container.querySelectorAll(".flex.items-center")).find(
        (item) => item.textContent?.includes("↓"),
      );

      expect(softDropControl).toBeInTheDocument();
      expect(softDropControl).toHaveTextContent("Soft Drop");
    });

    it("should map up arrow to rotate action", () => {
      const { container } = render(<Controls />);

      const rotateControl = Array.from(container.querySelectorAll(".flex.items-center")).find(
        (item) => item.textContent?.includes("↑"),
      );

      expect(rotateControl).toBeInTheDocument();
      expect(rotateControl).toHaveTextContent("Rotate");
    });

    it("should map space to hard drop action", () => {
      const { container } = render(<Controls />);

      const hardDropControl = Array.from(container.querySelectorAll(".flex.items-center")).find(
        (item) => item.textContent?.includes("Space"),
      );

      expect(hardDropControl).toBeInTheDocument();
      expect(hardDropControl).toHaveTextContent("Hard Drop");
    });

    it("should map P to pause action", () => {
      const { container } = render(<Controls />);

      const pauseControl = Array.from(container.querySelectorAll(".flex.items-center")).find(
        (item) => item.textContent?.includes("P"),
      );

      expect(pauseControl).toBeInTheDocument();
      expect(pauseControl).toHaveTextContent("Pause");
    });
  });

  it("should render content wrapper with correct styling", () => {
    const { container } = render(<Controls />);

    const spaceWrapper = container.querySelector(".space-y-2");
    expect(spaceWrapper).toBeInTheDocument();
  });
});

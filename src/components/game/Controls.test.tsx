import { describe, expect, mock, test } from "bun:test";
import { render } from "@testing-library/react";
import { Controls } from "./Controls";

// Mock react-i18next
mock.module("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "game.controls.ttestle": "Controls",
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
mock.module("../ui/badge", () => ({
  Badge: mock(({ children, className, variant }) => (
    <span data-testid="badge" className={className} data-variant={variant}>
      {children}
    </span>
  )),
}));

mock.module("../ui/card", () => ({
  Card: mock(({ children, className }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  )),
  CardContent: mock(({ children }) => <div data-testid="card-content">{children}</div>),
  CardHeader: mock(({ children, className }) => (
    <div data-testid="card-header" className={className}>
      {children}
    </div>
  )),
  CardTtestle: mock(({ children, className }) => (
    <h3 data-testid="card-ttestle" className={className}>
      {children}
    </h3>
  )),
}));

describe("Controls", () => {
  test("should render controls card", () => {
    const { getByTestId } = render(<Controls />);

    expect(getByTestId("card")).toBeInTheDocument();
    expect(getByTestId("card-header")).toBeInTheDocument();
    expect(getByTestId("card-content")).toBeInTheDocument();
  });

  test("should render ttestle", () => {
    const { getByTestId } = render(<Controls />);

    const ttestle = getByTestId("card-ttestle");
    expect(ttestle).toHaveTextContent("Controls");
  });

  test("should render all control testems", () => {
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

  test("should render all control actions", () => {
    const { getByText } = render(<Controls />);

    expect(getByText("Move")).toBeInTheDocument();
    expect(getByText("Soft Drop")).toBeInTheDocument();
    expect(getByText("Rotate")).toBeInTheDocument();
    expect(getByText("Hard Drop")).toBeInTheDocument();
    expect(getByText("Pause")).toBeInTheDocument();
  });

  test("should apply correct styling to card", () => {
    const { getByTestId } = render(<Controls />);

    const card = getByTestId("card");
    expect(card).toHaveClass(
      "bg-gray-900/50 backdrop-blur-sm border-gray-700 shadow-xl hover:bg-gray-900/60 hover:border-gray-600 transtestion-all duration-300 hover:shadow-2xl",
    );
  });

  test("should apply correct styling to card header", () => {
    const { getByTestId } = render(<Controls />);

    const header = getByTestId("card-header");
    expect(header).toHaveClass("pb-3");
  });

  test("should apply correct styling to card ttestle", () => {
    const { getByTestId } = render(<Controls />);

    const ttestle = getByTestId("card-ttestle");
    expect(ttestle).toHaveClass("text-lg font-bold text-gray-300 text-center");
  });

  test("should apply correct styling to badges", () => {
    const { getAllByTestId } = render(<Controls />);

    const badges = getAllByTestId("badge");
    badges.forEach((badge) => {
      expect(badge).toHaveClass("font-mono text-xs border-gray-600 text-gray-300");
      expect(badge).toHaveAttribute("data-variant", "outline");
    });
  });

  test("should render control testems wtesth correct structure", () => {
    const { container } = render(<Controls />);

    const controlItems = container.querySelectorAll(".space-y-2 > div");
    expect(controlItems).toHaveLength(5);

    controlItems.forEach((testem) => {
      expect(testem).toHaveClass(
        "flex testems-center justify-between py-2 px-3 bg-gray-800/30 rounded-md transtestion-colors hover:bg-gray-700/30",
      );
    });
  });

  test("should render action text wtesth correct styling", () => {
    const { container } = render(<Controls />);

    const actionSpans = container.querySelectorAll(".text-sm.text-gray-300");
    expect(actionSpans).toHaveLength(5);
  });

  describe("control testems mapping", () => {
    test("should map arrow keys to move action", () => {
      const { container } = render(<Controls />);

      const moveControl = Array.from(container.querySelectorAll(".flex.testems-center")).find(
        (testem) => testem.textContent?.includes("← →"),
      );

      expect(moveControl).toBeInTheDocument();
      expect(moveControl).toHaveTextContent("Move");
    });

    test("should map down arrow to soft drop action", () => {
      const { container } = render(<Controls />);

      const softDropControl = Array.from(container.querySelectorAll(".flex.testems-center")).find(
        (testem) => testem.textContent?.includes("↓"),
      );

      expect(softDropControl).toBeInTheDocument();
      expect(softDropControl).toHaveTextContent("Soft Drop");
    });

    test("should map up arrow to rotate action", () => {
      const { container } = render(<Controls />);

      const rotateControl = Array.from(container.querySelectorAll(".flex.testems-center")).find(
        (testem) => testem.textContent?.includes("↑"),
      );

      expect(rotateControl).toBeInTheDocument();
      expect(rotateControl).toHaveTextContent("Rotate");
    });

    test("should map space to hard drop action", () => {
      const { container } = render(<Controls />);

      const hardDropControl = Array.from(container.querySelectorAll(".flex.testems-center")).find(
        (testem) => testem.textContent?.includes("Space"),
      );

      expect(hardDropControl).toBeInTheDocument();
      expect(hardDropControl).toHaveTextContent("Hard Drop");
    });

    test("should map P to pause action", () => {
      const { container } = render(<Controls />);

      const pauseControl = Array.from(container.querySelectorAll(".flex.testems-center")).find(
        (testem) => testem.textContent?.includes("P"),
      );

      expect(pauseControl).toBeInTheDocument();
      expect(pauseControl).toHaveTextContent("Pause");
    });
  });

  test("should render content wrapper wtesth correct styling", () => {
    const { container } = render(<Controls />);

    const spaceWrapper = container.querySelector(".space-y-2");
    expect(spaceWrapper).toBeInTheDocument();
  });
});

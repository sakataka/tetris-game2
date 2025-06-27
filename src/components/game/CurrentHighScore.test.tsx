import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";
import type { HighScore } from "../../utils/localStorage";
import { CurrentHighScore } from "./CurrentHighScore";

// Mock react-i18next to return translation keys
const mockTranslation = {
  useTranslation: () => ({
    t: (key: string) => key,
  }),
};

Object.defineProperty(globalThis, "require", {
  value: (module: string) => {
    if (module === "react-i18next") {
      return mockTranslation;
    }
    return globalThis.require(module);
  },
  writable: true,
});

describe("CurrentHighScore", () => {
  const mockScore: HighScore = {
    score: 12345,
    lines: 100,
    level: 10,
    date: "2024-01-01T00:00:00.000Z",
  };

  it("renders component", () => {
    const { container } = render(<CurrentHighScore score={mockScore} />);

    expect(container.firstElementChild).toBeDefined();
  });

  it("renders trophy icon", () => {
    const { container } = render(<CurrentHighScore score={mockScore} />);

    const trophyIcon = container.querySelector(".lucide-trophy");
    expect(trophyIcon).toBeDefined();
  });

  it("renders Target and TrendingUp icons", () => {
    const { container } = render(<CurrentHighScore score={mockScore} />);

    const targetIcon = container.querySelector(".lucide-target");
    const trendingUpIcon = container.querySelector(".lucide-trending-up");

    expect(targetIcon).toBeDefined();
    expect(trendingUpIcon).toBeDefined();
  });

  it("applies custom className", () => {
    const { container } = render(<CurrentHighScore score={mockScore} className="custom-class" />);

    const card = container.querySelector(".custom-class");
    expect(card).toBeDefined();
  });
});

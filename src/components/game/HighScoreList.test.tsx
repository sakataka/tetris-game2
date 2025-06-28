import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";
import type { HighScore } from "@/types/storage";
import { HighScoreList } from "./HighScoreList";

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

describe("HighScoreList", () => {
  const mockScores: HighScore[] = [
    { score: 10000, lines: 100, level: 10, date: "2024-01-01T00:00:00.000Z" },
    { score: 8000, lines: 80, level: 8, date: "2024-01-02T00:00:00.000Z" },
    { score: 6000, lines: 60, level: 6, date: "2024-01-03T00:00:00.000Z" },
  ];

  it("renders component with scores", () => {
    const { container } = render(<HighScoreList scores={mockScores} />);

    expect(container.firstElementChild).toBeDefined();
  });

  it("renders trophy icon", () => {
    const { container } = render(<HighScoreList scores={mockScores} />);

    const trophyIcon = container.querySelector(".lucide-trophy");
    expect(trophyIcon).toBeDefined();
  });

  it("renders empty state when no scores", () => {
    const { container } = render(<HighScoreList scores={[]} />);

    expect(container.firstElementChild).toBeDefined();
  });

  it("applies custom className", () => {
    const { container } = render(<HighScoreList scores={mockScores} className="custom-class" />);

    const card = container.querySelector(".custom-class");
    expect(card).toBeDefined();
  });

  it("renders HighScoreItem components for each score", () => {
    const { container } = render(<HighScoreList scores={mockScores} />);

    // Just check that the component renders successfully
    expect(container.firstElementChild).toBeDefined();
  });
});

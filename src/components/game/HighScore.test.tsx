import { describe, expect, it, mock } from "bun:test";
import { render } from "@testing-library/react";

// Mock the components
mock.module("./NoHighScore", () => ({
  NoHighScore: ({ className }: { className?: string }) => (
    <div data-testid="no-high-score" className={className}>
      No High Score
    </div>
  ),
}));

mock.module("./CurrentHighScore", () => ({
  CurrentHighScore: ({ score, className }: { score: { score: number }; className?: string }) => (
    <div data-testid="current-high-score" className={className}>
      Current High Score: {score.score}
    </div>
  ),
}));

mock.module("./HighScoreList", () => ({
  HighScoreList: ({ scores, className }: { scores: { length: number }; className?: string }) => (
    <div data-testid="high-score-list" className={className}>
      High Score List: {scores.length} scores
    </div>
  ),
}));

// Mock useHighScore hook
const mockHighScoreData = {
  currentHighScore: null,
  highScoresList: [],
};

mock.module("../../hooks/useHighScore", () => ({
  useHighScore: () => mockHighScoreData,
}));

import { HighScore } from "./HighScore";

describe("HighScore", () => {
  it("renders NoHighScore when no current score and not showing full list", () => {
    mockHighScoreData.currentHighScore = null;
    mockHighScoreData.highScoresList = [];

    const { getByTestId } = render(<HighScore />);

    expect(getByTestId("no-high-score")).toBeDefined();
  });

  it("renders CurrentHighScore when there is a current score and not showing full list", () => {
    mockHighScoreData.currentHighScore = {
      score: 12345,
      lines: 100,
      level: 10,
      date: "2024-01-01T00:00:00.000Z",
    };
    mockHighScoreData.highScoresList = [];

    const { getByTestId } = render(<HighScore />);

    expect(getByTestId("current-high-score")).toBeDefined();
    expect(getByTestId("current-high-score").textContent).toContain("12345");
  });

  it("renders HighScoreList when showFullList is true", () => {
    mockHighScoreData.currentHighScore = {
      score: 12345,
      lines: 100,
      level: 10,
      date: "2024-01-01T00:00:00.000Z",
    };
    mockHighScoreData.highScoresList = [
      { score: 10000, lines: 100, level: 10, date: "2024-01-01T00:00:00.000Z" },
      { score: 8000, lines: 80, level: 8, date: "2024-01-02T00:00:00.000Z" },
    ];

    const { getByTestId } = render(<HighScore showFullList={true} />);

    expect(getByTestId("high-score-list")).toBeDefined();
    expect(getByTestId("high-score-list").textContent).toContain("2 scores");
  });

  it("passes className prop to child components", () => {
    mockHighScoreData.currentHighScore = null;
    mockHighScoreData.highScoresList = [];

    const { getByTestId } = render(<HighScore className="custom-class" />);

    expect(getByTestId("no-high-score").className).toContain("custom-class");
  });

  it("prioritizes showFullList over currentHighScore", () => {
    mockHighScoreData.currentHighScore = {
      score: 12345,
      lines: 100,
      level: 10,
      date: "2024-01-01T00:00:00.000Z",
    };
    mockHighScoreData.highScoresList = [];

    const { getByTestId } = render(<HighScore showFullList={true} />);

    expect(getByTestId("high-score-list")).toBeDefined();
  });
});

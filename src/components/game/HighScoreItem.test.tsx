import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";
import type { HighScore } from "../../utils/localStorage";
import { HighScoreItem } from "./HighScoreItem";

describe("HighScoreItem", () => {
  const mockScore: HighScore = {
    score: 54321,
    lines: 150,
    level: 15,
    date: "2024-02-15T10:30:00.000Z",
  };

  it("renders component", () => {
    const { container } = render(<HighScoreItem score={mockScore} rank={1} />);

    expect(container.firstElementChild).toBeDefined();
  });

  it("applies special styling for rank 1", () => {
    const { container } = render(<HighScoreItem score={mockScore} rank={1} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("bg-yellow-500/10");
    expect(wrapper.className).toContain("border-yellow-500/30");
  });

  it("applies normal styling for other ranks", () => {
    const { container } = render(<HighScoreItem score={mockScore} rank={2} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).not.toContain("bg-yellow-500/10");
  });

  it("renders icons for lines, level, and date", () => {
    const { container } = render(<HighScoreItem score={mockScore} rank={1} />);

    const targetIcon = container.querySelector(".lucide-target");
    const trendingUpIcon = container.querySelector(".lucide-trending-up");
    const calendarIcon = container.querySelector(".lucide-calendar");

    expect(targetIcon).toBeDefined();
    expect(trendingUpIcon).toBeDefined();
    expect(calendarIcon).toBeDefined();
  });
});

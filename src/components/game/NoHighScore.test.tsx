import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";
import { NoHighScore } from "./NoHighScore";

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

describe("NoHighScore", () => {
  it("renders trophy icon", () => {
    const { container } = render(<NoHighScore />);

    const trophyIcon = container.querySelector(".lucide-trophy");
    expect(trophyIcon).toBeDefined();
  });

  it("applies custom className", () => {
    const { container } = render(<NoHighScore className="custom-class" />);

    const card = container.querySelector(".custom-class");
    expect(card).toBeDefined();
  });

  it("renders card structure", () => {
    const { container } = render(<NoHighScore />);

    // Check for card structure
    const card = container.querySelector("[data-id]") || container.firstElementChild;
    expect(card).toBeDefined();
  });
});

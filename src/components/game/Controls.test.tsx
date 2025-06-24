import { describe, expect, mock, test } from "bun:test";
import { render } from "@testing-library/react";
import { Controls } from "./Controls";

// Simple inline mock for react-i18next
mock.module("react-i18next", () => ({
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

// Simple mock for UI components
mock.module("../ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="badge">{children}</span>
  ),
}));

mock.module("../ui/card", () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-content">{children}</div>
  ),
  CardHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children }: { children: React.ReactNode }) => (
    <h3 data-testid="card-title">{children}</h3>
  ),
}));

describe("Controls", () => {
  test("should render", () => {
    const { getByTestId } = render(<Controls />);
    expect(getByTestId("card")).toBeInTheDocument();
  });
});

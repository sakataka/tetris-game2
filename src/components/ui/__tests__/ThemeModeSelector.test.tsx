import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ThemeModeSelector } from "../ThemeModeSelector";

// Mock useAdaptivePerformance hook
const mockUseAdaptivePerformance = mock(() => ({
  animationsEnabled: true,
  performanceMode: "full",
}));

mock.module("@/hooks/core/useAdaptivePerformance", () => ({
  useAdaptivePerformance: mockUseAdaptivePerformance,
}));

const renderWithThemeProvider = (
  component: React.ReactElement,
  { defaultMode = "normal", enableFeatureFlag = true } = {},
) => {
  return render(
    <ThemeProvider defaultMode={defaultMode} enableFeatureFlag={enableFeatureFlag}>
      {component}
    </ThemeProvider>,
  );
};

describe("ThemeModeSelector", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.cssText = "";
    document.body.className = "";
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.style.cssText = "";
    document.body.className = "";
  });

  describe("Basic rendering", () => {
    it("should render with default normal mode", () => {
      renderWithThemeProvider(<ThemeModeSelector />);

      const trigger = screen.getByTestId("theme-mode-selector");
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent("Normal");
    });

    it("should render with custom default mode", () => {
      renderWithThemeProvider(<ThemeModeSelector />, { defaultMode: "compact" });

      const trigger = screen.getByTestId("theme-mode-selector");
      expect(trigger).toHaveTextContent("Compact");
    });

    it("should display correct icon for current mode", () => {
      renderWithThemeProvider(<ThemeModeSelector />, { defaultMode: "gaming" });

      const trigger = screen.getByTestId("theme-mode-selector");
      const icon = trigger.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      renderWithThemeProvider(<ThemeModeSelector className="custom-class" />);

      const container = screen.getByTestId("theme-mode-selector").closest("div");
      expect(container).toHaveClass("custom-class");
    });
  });

  describe("Dropdown functionality", () => {
    it("should open dropdown when trigger is clicked", async () => {
      renderWithThemeProvider(<ThemeModeSelector />);

      const trigger = screen.getByTestId("theme-mode-selector");
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByTestId("theme-mode-compact")).toBeInTheDocument();
        expect(screen.getByTestId("theme-mode-normal")).toBeInTheDocument();
        expect(screen.getByTestId("theme-mode-gaming")).toBeInTheDocument();
      });
    });

    it("should show all available modes in dropdown", async () => {
      renderWithThemeProvider(<ThemeModeSelector />);

      const trigger = screen.getByTestId("theme-mode-selector");
      fireEvent.click(trigger);

      await waitFor(() => {
        const compactItem = screen.getByTestId("theme-mode-compact");
        const normalItem = screen.getByTestId("theme-mode-normal");
        const gamingItem = screen.getByTestId("theme-mode-gaming");

        expect(compactItem).toHaveTextContent("Compact");
        expect(normalItem).toHaveTextContent("Normal");
        expect(gamingItem).toHaveTextContent("Gaming");
      });
    });

    it("should show descriptions when showDescription is true", async () => {
      renderWithThemeProvider(<ThemeModeSelector showDescription={true} />);

      const trigger = screen.getByTestId("theme-mode-selector");
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Maximum space efficiency")).toBeInTheDocument();
        expect(screen.getByText("Balanced layout")).toBeInTheDocument();
        expect(screen.getByText("Enhanced visual effects")).toBeInTheDocument();
      });
    });

    it("should not show descriptions by default", async () => {
      renderWithThemeProvider(<ThemeModeSelector />);

      const trigger = screen.getByTestId("theme-mode-selector");
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.queryByText("Maximum space efficiency")).not.toBeInTheDocument();
        expect(screen.queryByText("Balanced layout")).not.toBeInTheDocument();
        expect(screen.queryByText("Enhanced visual effects")).not.toBeInTheDocument();
      });
    });
  });

  describe("Theme switching", () => {
    it("should switch to compact mode when selected", async () => {
      renderWithThemeProvider(<ThemeModeSelector />);

      const trigger = screen.getByTestId("theme-mode-selector");
      fireEvent.click(trigger);

      await waitFor(() => {
        const compactItem = screen.getByTestId("theme-mode-compact");
        fireEvent.click(compactItem);
      });

      await waitFor(() => {
        expect(trigger).toHaveTextContent("Compact");
        expect(document.body.classList.contains("theme-compact")).toBe(true);
      });
    });

    it("should switch to gaming mode when selected", async () => {
      renderWithThemeProvider(<ThemeModeSelector />);

      const trigger = screen.getByTestId("theme-mode-selector");
      fireEvent.click(trigger);

      await waitFor(() => {
        const gamingItem = screen.getByTestId("theme-mode-gaming");
        fireEvent.click(gamingItem);
      });

      await waitFor(() => {
        expect(trigger).toHaveTextContent("Gaming");
        expect(document.body.classList.contains("theme-gaming")).toBe(true);
      });
    });

    it("should persist theme selection in localStorage", async () => {
      renderWithThemeProvider(<ThemeModeSelector />);

      const trigger = screen.getByTestId("theme-mode-selector");
      fireEvent.click(trigger);

      await waitFor(() => {
        const compactItem = screen.getByTestId("theme-mode-compact");
        fireEvent.click(compactItem);
      });

      await waitFor(() => {
        expect(localStorage.getItem("tetris-theme-mode")).toBe("compact");
      });
    });
  });

  describe("Transition handling", () => {
    it("should show loading spinner during transition", async () => {
      renderWithThemeProvider(<ThemeModeSelector />);

      const trigger = screen.getByTestId("theme-mode-selector");
      fireEvent.click(trigger);

      await waitFor(() => {
        const gamingItem = screen.getByTestId("theme-mode-gaming");
        fireEvent.click(gamingItem);
      });

      // Should show spinner briefly during transition
      const spinner = trigger.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("should disable selector during transition", async () => {
      renderWithThemeProvider(<ThemeModeSelector />);

      const trigger = screen.getByTestId("theme-mode-selector");
      fireEvent.click(trigger);

      await waitFor(() => {
        const gamingItem = screen.getByTestId("theme-mode-gaming");
        fireEvent.click(gamingItem);
      });

      // Trigger should be disabled during transition
      expect(trigger).toHaveAttribute("aria-disabled", "true");
    });
  });

  describe("Feature flag integration", () => {
    it("should only show normal mode when feature flag is disabled", async () => {
      renderWithThemeProvider(<ThemeModeSelector />, { enableFeatureFlag: false });

      const trigger = screen.getByTestId("theme-mode-selector");
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByTestId("theme-mode-normal")).toBeInTheDocument();
        expect(screen.queryByTestId("theme-mode-compact")).not.toBeInTheDocument();
        expect(screen.queryByTestId("theme-mode-gaming")).not.toBeInTheDocument();
      });
    });

    it("should show all modes when feature flag is enabled", async () => {
      renderWithThemeProvider(<ThemeModeSelector />, { enableFeatureFlag: true });

      const trigger = screen.getByTestId("theme-mode-selector");
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByTestId("theme-mode-compact")).toBeInTheDocument();
        expect(screen.getByTestId("theme-mode-normal")).toBeInTheDocument();
        expect(screen.getByTestId("theme-mode-gaming")).toBeInTheDocument();
      });
    });
  });

  describe("Performance mode integration", () => {
    it("should restrict gaming mode on reduced performance", async () => {
      // Mock reduced performance mode
      mockUseAdaptivePerformance.mockReturnValue({
        animationsEnabled: false,
        performanceMode: "reduced",
      });

      renderWithThemeProvider(<ThemeModeSelector />);

      const trigger = screen.getByTestId("theme-mode-selector");
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByTestId("theme-mode-compact")).toBeInTheDocument();
        expect(screen.getByTestId("theme-mode-normal")).toBeInTheDocument();
        expect(screen.queryByTestId("theme-mode-gaming")).not.toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      renderWithThemeProvider(<ThemeModeSelector />);

      const trigger = screen.getByTestId("theme-mode-selector");
      expect(trigger).toHaveAttribute(
        "aria-label",
        expect.stringContaining("Current theme: Normal"),
      );
    });

    it("should update ARIA label when theme changes", async () => {
      renderWithThemeProvider(<ThemeModeSelector />);

      const trigger = screen.getByTestId("theme-mode-selector");
      fireEvent.click(trigger);

      await waitFor(() => {
        const compactItem = screen.getByTestId("theme-mode-compact");
        fireEvent.click(compactItem);
      });

      await waitFor(() => {
        expect(trigger).toHaveAttribute(
          "aria-label",
          expect.stringContaining("Current theme: Compact"),
        );
      });
    });

    it("should be keyboard navigable", async () => {
      renderWithThemeProvider(<ThemeModeSelector />);

      const trigger = screen.getByTestId("theme-mode-selector");

      // Focus the trigger
      trigger.focus();
      expect(trigger).toHaveFocus();

      // Open with Enter key
      fireEvent.keyDown(trigger, { key: "Enter" });

      await waitFor(() => {
        expect(screen.getByTestId("theme-mode-compact")).toBeInTheDocument();
      });
    });
  });

  describe("Error handling", () => {
    it("should handle invalid mode values gracefully", async () => {
      renderWithThemeProvider(<ThemeModeSelector />);

      const trigger = screen.getByTestId("theme-mode-selector");

      // Simulate invalid mode selection (this shouldn't happen in normal usage)
      const component = trigger.closest('[data-testid="theme-mode-selector"]');
      if (component) {
        // Trigger change with invalid value
        fireEvent.change(component, { target: { value: "invalid-mode" } });
      }

      // Should remain in current mode
      expect(trigger).toHaveTextContent("Normal");
    });
  });
});

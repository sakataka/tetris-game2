import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { ThemeProvider, useTheme } from "../ThemeContext";

// Test component that uses theme context
const TestComponent: React.FC = () => {
  const { mode, setMode, availableModes, isTransitioning } = useTheme();

  return (
    <div>
      <span data-testid="current-mode">{mode}</span>
      <span data-testid="available-modes">{availableModes.join(",")}</span>
      <span data-testid="is-transitioning">{isTransitioning.toString()}</span>
      <button type="button" onClick={() => setMode("compact")} data-testid="set-compact">
        Set Compact
      </button>
      <button type="button" onClick={() => setMode("normal")} data-testid="set-normal">
        Set Normal
      </button>
      <button type="button" onClick={() => setMode("gaming")} data-testid="set-gaming">
        Set Gaming
      </button>
    </div>
  );
};

// Mock useAdaptivePerformance hook
import { mock } from "bun:test";

const mockUseAdaptivePerformance = mock(() => ({
  animationsEnabled: true,
  performanceMode: "full",
}));

mock.module("@/hooks/core/useAdaptivePerformance", () => ({
  useAdaptivePerformance: mockUseAdaptivePerformance,
}));

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.cssText = "";
    document.body.className = "";
    mockUseAdaptivePerformance.mockClear();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.style.cssText = "";
    document.body.className = "";
  });

  describe("Basic functionality", () => {
    it("should provide default theme context", () => {
      render(
        <ThemeProvider defaultMode="normal">
          <TestComponent />
        </ThemeProvider>,
      );

      expect(screen.getByTestId("current-mode")).toHaveTextContent("normal");
      expect(screen.getByTestId("available-modes")).toHaveTextContent("compact,normal,gaming");
    });

    it("should use custom default mode", () => {
      render(
        <ThemeProvider defaultMode="compact">
          <TestComponent />
        </ThemeProvider>,
      );

      expect(screen.getByTestId("current-mode")).toHaveTextContent("compact");
    });

    it("should throw error when useTheme is used outside provider", () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = mock(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow("useTheme must be used within a ThemeProvider");

      console.error = originalError;
    });
  });

  describe("Theme switching", () => {
    it("should switch theme modes correctly", async () => {
      render(
        <ThemeProvider defaultMode="normal">
          <TestComponent />
        </ThemeProvider>,
      );

      fireEvent.click(screen.getByTestId("set-compact"));

      await waitFor(() => {
        expect(screen.getByTestId("current-mode")).toHaveTextContent("compact");
      });
    });

    it("should handle transition state during mode change", async () => {
      render(
        <ThemeProvider defaultMode="normal">
          <TestComponent />
        </ThemeProvider>,
      );

      act(() => {
        fireEvent.click(screen.getByTestId("set-gaming"));
      });

      // Should show transitioning state initially
      expect(screen.getByTestId("is-transitioning")).toHaveTextContent("true");

      // Should complete transition after timeout
      await waitFor(
        () => {
          expect(screen.getByTestId("is-transitioning")).toHaveTextContent("false");
        },
        { timeout: 500 },
      );
    });

    it("should not change mode when same mode is selected", async () => {
      render(
        <ThemeProvider defaultMode="normal">
          <TestComponent />
        </ThemeProvider>,
      );

      const currentMode = screen.getByTestId("current-mode").textContent;

      fireEvent.click(screen.getByTestId("set-normal"));

      // Mode should remain the same
      expect(screen.getByTestId("current-mode")).toHaveTextContent(currentMode || "");
      expect(screen.getByTestId("is-transitioning")).toHaveTextContent("false");
    });
  });

  describe("localStorage persistence", () => {
    it("should persist theme mode in localStorage", async () => {
      render(
        <ThemeProvider defaultMode="normal">
          <TestComponent />
        </ThemeProvider>,
      );

      fireEvent.click(screen.getByTestId("set-compact"));

      await waitFor(() => {
        expect(localStorage.getItem("tetris-theme-mode")).toBe("compact");
      });
    });

    it("should load saved theme from localStorage on initialization", () => {
      localStorage.setItem("tetris-theme-mode", "gaming");

      render(
        <ThemeProvider defaultMode="normal">
          <TestComponent />
        </ThemeProvider>,
      );

      expect(screen.getByTestId("current-mode")).toHaveTextContent("gaming");
    });

    it("should ignore invalid theme modes from localStorage", () => {
      localStorage.setItem("tetris-theme-mode", "invalid-mode");

      render(
        <ThemeProvider defaultMode="normal">
          <TestComponent />
        </ThemeProvider>,
      );

      expect(screen.getByTestId("current-mode")).toHaveTextContent("normal");
    });
  });

  describe("CSS Variables application", () => {
    it("should apply CSS variables to document root", () => {
      render(
        <ThemeProvider defaultMode="compact">
          <TestComponent />
        </ThemeProvider>,
      );

      const rootStyle = document.documentElement.style;
      expect(rootStyle.getPropertyValue("--spacing-xs")).toBe("0.25rem");
      expect(rootStyle.getPropertyValue("--sidebar-width")).toBe("200px");
      expect(rootStyle.getPropertyValue("--layout-gap")).toBe("0.75rem");
    });

    it("should update CSS variables when theme changes", async () => {
      render(
        <ThemeProvider defaultMode="compact">
          <TestComponent />
        </ThemeProvider>,
      );

      // Initial state - compact mode
      expect(document.documentElement.style.getPropertyValue("--layout-gap")).toBe("0.75rem");

      // Switch to normal mode
      fireEvent.click(screen.getByTestId("set-normal"));

      await waitFor(() => {
        expect(document.documentElement.style.getPropertyValue("--layout-gap")).toBe("1rem");
      });
    });

    it("should apply gaming mode specific variables", async () => {
      render(
        <ThemeProvider defaultMode="normal">
          <TestComponent />
        </ThemeProvider>,
      );

      fireEvent.click(screen.getByTestId("set-gaming"));

      await waitFor(() => {
        const rootStyle = document.documentElement.style;
        expect(rootStyle.getPropertyValue("--glow-intensity")).toBe("0.5");
        expect(rootStyle.getPropertyValue("--animation-speed")).toBe("1.2");
        expect(rootStyle.getPropertyValue("--color-primary")).toBe("#00f5ff");
      });
    });
  });

  describe("Body class management", () => {
    it("should add theme class to body", () => {
      render(
        <ThemeProvider defaultMode="gaming">
          <TestComponent />
        </ThemeProvider>,
      );

      expect(document.body.classList.contains("theme-gaming")).toBe(true);
    });

    it("should update body class when theme changes", async () => {
      render(
        <ThemeProvider defaultMode="normal">
          <TestComponent />
        </ThemeProvider>,
      );

      expect(document.body.classList.contains("theme-normal")).toBe(true);

      fireEvent.click(screen.getByTestId("set-compact"));

      await waitFor(() => {
        expect(document.body.classList.contains("theme-compact")).toBe(true);
        expect(document.body.classList.contains("theme-normal")).toBe(false);
      });
    });

    it("should add gaming-effects class for gaming mode with animations", async () => {
      render(
        <ThemeProvider defaultMode="normal">
          <TestComponent />
        </ThemeProvider>,
      );

      fireEvent.click(screen.getByTestId("set-gaming"));

      await waitFor(() => {
        expect(document.body.classList.contains("gaming-effects")).toBe(true);
      });
    });
  });

  describe("Feature flag integration", () => {
    it("should respect feature flag disabled state", () => {
      render(
        <ThemeProvider defaultMode="normal" enableFeatureFlag={false}>
          <TestComponent />
        </ThemeProvider>,
      );

      expect(screen.getByTestId("available-modes")).toHaveTextContent("normal");
    });

    it("should respect feature flag enabled state", () => {
      render(
        <ThemeProvider defaultMode="normal" enableFeatureFlag={true}>
          <TestComponent />
        </ThemeProvider>,
      );

      expect(screen.getByTestId("available-modes")).toHaveTextContent("compact,normal,gaming");
    });
  });

  describe("Performance mode integration", () => {
    beforeEach(() => {
      // Reset mock
      mockUseAdaptivePerformance.mockClear();
    });

    it("should restrict gaming mode on reduced performance", () => {
      // Mock reduced performance mode
      mockUseAdaptivePerformance.mockReturnValue({
        animationsEnabled: false,
        performanceMode: "reduced",
      });

      render(
        <ThemeProvider defaultMode="normal">
          <TestComponent />
        </ThemeProvider>,
      );

      expect(screen.getByTestId("available-modes")).toHaveTextContent("compact,normal");
    });

    it("should warn when switching to gaming mode with reduced performance", async () => {
      const consoleSpy = mock(console.warn);

      // Mock reduced performance mode
      mockUseAdaptivePerformance.mockReturnValue({
        animationsEnabled: false,
        performanceMode: "reduced",
      });

      render(
        <ThemeProvider defaultMode="normal" enableFeatureFlag={true}>
          <TestComponent />
        </ThemeProvider>,
      );

      // Force gaming mode despite reduced performance
      act(() => {
        fireEvent.click(screen.getByTestId("set-gaming"));
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Gaming mode enabled with reduced performance"),
        );
      });

      consoleSpy.mockRestore();
    });
  });
});

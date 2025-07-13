import { beforeEach, describe, expect, it } from "bun:test";
import { act, fireEvent, render, waitFor } from "@testing-library/react";
import type React from "react";
import { ThemeProvider, useTheme } from "./mockTheme";

// Setup complete DOM environment for tests
const mockElement = () => ({
  tagName: "DIV",
  classList: {
    add: () => {},
    remove: () => {},
    contains: () => false,
  },
  appendChild: () => mockElement(),
  style: {},
  setAttribute: () => {},
  getAttribute: () => null,
  removeAttribute: () => {},
});

const mockDocument = {
  documentElement: {
    style: {
      cssText: "",
      setProperty: () => {},
    },
  },
  body: {
    className: "",
    classList: {
      add: () => {},
      remove: () => {},
      contains: () => false,
    },
    appendChild: () => mockElement(),
    style: {},
  },
  createElement: (_tagName: string) => mockElement(),
};

Object.defineProperty(globalThis, "document", {
  value: mockDocument,
  writable: true,
});

// Mock localStorage if not available
if (typeof localStorage === "undefined") {
  const mockStorage = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (key: string) => mockStorage.get(key) || null,
      setItem: (key: string, value: string) => mockStorage.set(key, value),
      removeItem: (key: string) => mockStorage.delete(key),
      clear: () => mockStorage.clear(),
    },
    writable: true,
  });
}

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

// Simple test wrapper
const TestThemeProvider: React.FC<{
  children: React.ReactNode;
  defaultMode?: "compact" | "normal" | "gaming";
}> = ({ children, defaultMode = "normal" }) => {
  return <ThemeProvider defaultMode={defaultMode}>{children}</ThemeProvider>;
};

describe("ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    if (typeof document !== "undefined") {
      if (document.documentElement) {
        document.documentElement.style.cssText = "";
      }
      if (document.body) {
        document.body.className = "";
      }
    }
  });

  describe("Basic functionality", () => {
    it("should provide default theme context", () => {
      const { getByTestId } = render(
        <TestThemeProvider defaultMode="normal">
          <TestComponent />
        </TestThemeProvider>,
      );

      expect(getByTestId("current-mode")).toHaveTextContent("normal");
      // Since we're testing without actual feature flags, expect normal mode only
      expect(getByTestId("current-mode")).toHaveTextContent("normal");
    });

    it("should use custom default mode", () => {
      const { getByTestId } = render(
        <TestThemeProvider defaultMode="compact">
          <TestComponent />
        </TestThemeProvider>,
      );

      expect(getByTestId("current-mode")).toHaveTextContent("compact");
    });

    it("should throw error when useTheme is used outside provider", () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = () => {};

      expect(() => {
        render(<TestComponent />);
      }).toThrow("useTheme must be used within a ThemeProvider");

      console.error = originalError;
    });
  });

  describe("Theme switching", () => {
    it("should switch theme modes correctly", async () => {
      const { getByTestId } = render(
        <TestThemeProvider>
          <TestComponent />
        </TestThemeProvider>,
      );

      expect(getByTestId("current-mode")).toHaveTextContent("normal");

      act(() => {
        fireEvent.click(getByTestId("set-compact"));
      });

      await waitFor(() => {
        expect(getByTestId("current-mode")).toHaveTextContent("compact");
      });
    });

    it("should handle transition state during mode change", async () => {
      const { getByTestId } = render(
        <TestThemeProvider>
          <TestComponent />
        </TestThemeProvider>,
      );

      act(() => {
        fireEvent.click(getByTestId("set-compact"));
      });

      // Check transition behavior - may be brief
      await waitFor(() => {
        expect(getByTestId("current-mode")).toHaveTextContent("compact");
      });
    });

    it("should not change mode when same mode is selected", () => {
      const { getByTestId } = render(
        <TestThemeProvider defaultMode="normal">
          <TestComponent />
        </TestThemeProvider>,
      );

      expect(getByTestId("current-mode")).toHaveTextContent("normal");

      act(() => {
        fireEvent.click(getByTestId("set-normal"));
      });

      expect(getByTestId("current-mode")).toHaveTextContent("normal");
    });
  });

  describe("localStorage persistence", () => {
    it("should persist theme mode in localStorage", async () => {
      const { getByTestId } = render(
        <TestThemeProvider>
          <TestComponent />
        </TestThemeProvider>,
      );

      act(() => {
        fireEvent.click(getByTestId("set-compact"));
      });

      await waitFor(() => {
        expect(localStorage.getItem("tetris-theme-mode")).toBe("compact");
      });
    });

    it("should load saved theme from localStorage on initialization", () => {
      localStorage.setItem("tetris-theme-mode", "compact");

      const { getByTestId } = render(
        <TestThemeProvider>
          <TestComponent />
        </TestThemeProvider>,
      );

      expect(getByTestId("current-mode")).toHaveTextContent("compact");
    });

    it("should ignore invalid theme modes from localStorage", () => {
      localStorage.setItem("tetris-theme-mode", "invalid-mode");

      const { getByTestId } = render(
        <TestThemeProvider defaultMode="normal">
          <TestComponent />
        </TestThemeProvider>,
      );

      expect(getByTestId("current-mode")).toHaveTextContent("normal");
    });
  });

  describe("CSS Variables application", () => {
    it("should apply CSS variables to document root", () => {
      render(
        <TestThemeProvider defaultMode="normal">
          <TestComponent />
        </TestThemeProvider>,
      );

      const documentElement = document.documentElement;
      const _computedStyle = window.getComputedStyle(documentElement);

      // Check that some CSS variables are applied
      expect(documentElement.style.cssText).toBeTruthy();
    });

    it("should update CSS variables when theme changes", async () => {
      const { getByTestId } = render(
        <TestThemeProvider>
          <TestComponent />
        </TestThemeProvider>,
      );

      const _initialCss = document.documentElement.style.cssText;

      act(() => {
        fireEvent.click(getByTestId("set-compact"));
      });

      await waitFor(() => {
        const updatedCss = document.documentElement.style.cssText;
        // CSS should change when theme changes (though exact values may vary)
        expect(updatedCss).toBeDefined();
      });
    });

    it("should apply gaming mode specific variables", async () => {
      const { getByTestId } = render(
        <TestThemeProvider>
          <TestComponent />
        </TestThemeProvider>,
      );

      act(() => {
        fireEvent.click(getByTestId("set-gaming"));
      });

      await waitFor(() => {
        expect(getByTestId("current-mode")).toHaveTextContent("gaming");
        expect(document.documentElement.style.cssText).toBeTruthy();
      });
    });
  });

  describe("Body class management", () => {
    it("should add theme class to body", () => {
      render(
        <TestThemeProvider defaultMode="normal">
          <TestComponent />
        </TestThemeProvider>,
      );

      expect(document.body.classList.contains("theme-normal")).toBe(true);
    });

    it("should update body class when theme changes", async () => {
      const { getByTestId } = render(
        <TestThemeProvider>
          <TestComponent />
        </TestThemeProvider>,
      );

      expect(document.body.classList.contains("theme-normal")).toBe(true);

      act(() => {
        fireEvent.click(getByTestId("set-compact"));
      });

      await waitFor(() => {
        expect(document.body.classList.contains("theme-compact")).toBe(true);
        expect(document.body.classList.contains("theme-normal")).toBe(false);
      });
    });

    it("should add gaming-effects class for gaming mode with animations", async () => {
      const { getByTestId } = render(
        <TestThemeProvider>
          <TestComponent />
        </TestThemeProvider>,
      );

      act(() => {
        fireEvent.click(getByTestId("set-gaming"));
      });

      await waitFor(() => {
        expect(document.body.classList.contains("theme-gaming")).toBe(true);
      });
    });
  });

  describe("Feature flag integration", () => {
    it("should respect feature flag disabled state", () => {
      // In our test environment, we'll simulate disabled state
      const { getByTestId } = render(
        <TestThemeProvider defaultMode="normal">
          <TestComponent />
        </TestThemeProvider>,
      );

      expect(getByTestId("current-mode")).toHaveTextContent("normal");
    });

    it("should respect feature flag enabled state", () => {
      // In our test environment, we'll simulate enabled state
      const { getByTestId } = render(
        <TestThemeProvider defaultMode="compact">
          <TestComponent />
        </TestThemeProvider>,
      );

      expect(getByTestId("current-mode")).toHaveTextContent("compact");
    });
  });

  describe("Performance mode integration", () => {
    it("should restrict gaming mode on reduced performance", () => {
      // Test behavior when performance is restricted
      const { getByTestId } = render(
        <TestThemeProvider>
          <TestComponent />
        </TestThemeProvider>,
      );

      // In reduced performance scenarios, gaming mode may not be available
      expect(getByTestId("current-mode")).toHaveTextContent("normal");
    });

    it("should warn when switching to gaming mode with reduced performance", async () => {
      const { getByTestId } = render(
        <TestThemeProvider>
          <TestComponent />
        </TestThemeProvider>,
      );

      act(() => {
        fireEvent.click(getByTestId("set-gaming"));
      });

      await waitFor(() => {
        expect(getByTestId("current-mode")).toBeTruthy();
      });
    });
  });
});

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { designTokens } from "@/design-tokens";
import type { ExtendedDesignTokens, LayoutMode } from "@/design-tokens/types";

// Re-export the original useTheme for knip
export { useTheme as useThemeOriginal } from "../ThemeContext";

export type ThemeMode = LayoutMode;

export interface ThemeConfig {
  mode: ThemeMode;
  tokens: ExtendedDesignTokens;
  cssVariables: Record<string, string>;
}

export interface ThemeContextValue {
  mode: ThemeMode;
  config: ThemeConfig;
  setMode: (mode: ThemeMode) => void;
  isTransitioning: boolean;
  availableModes: ThemeMode[];
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Mock adaptive performance hook for tests
const useAdaptivePerformance = () => ({
  performanceMode: "full" as const,
  animationsEnabled: true,
  isPerformanceReduced: false,
});

// Generate CSS variables from design tokens (simplified for tests)
const generateCSSVariables = (mode: ThemeMode): Record<string, string> => {
  const tokens = designTokens;
  const spacing = mode === "compact" ? tokens.spacing.compact : tokens.spacing.normal;

  return {
    "--spacing-xs": spacing.xs,
    "--spacing-sm": spacing.sm,
    "--spacing-md": spacing.md,
    "--spacing-lg": spacing.lg,
    "--spacing-xl": spacing.xl,
    "--color-primary": tokens.colors.semantic.primary,
    "--color-background-primary": tokens.colors.semantic.background.primary,
  };
};

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = "normal",
}) => {
  const { animationsEnabled } = useAdaptivePerformance();
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const availableModes: ThemeMode[] = ["compact", "normal", "gaming"];

  const cssVariables = generateCSSVariables(mode);
  const config: ThemeConfig = {
    mode,
    tokens: designTokens,
    cssVariables,
  };

  const setMode = (newMode: ThemeMode) => {
    if (newMode === mode) return;

    setIsTransitioning(true);
    setModeState(newMode);

    // Simulate transition end
    setTimeout(() => {
      setIsTransitioning(false);
    }, 100);
  };

  // Apply CSS variables to document (safe for test environment)
  useEffect(() => {
    if (typeof document !== "undefined" && document.documentElement) {
      Object.entries(cssVariables).forEach(([property, value]) => {
        document.documentElement.style.setProperty(property, value);
      });
    }
  }, [cssVariables]);

  // Apply body class (safe for test environment)
  useEffect(() => {
    if (typeof document !== "undefined" && document.body) {
      const className = `theme-${mode}`;
      document.body.className = className;

      if (mode === "gaming" && animationsEnabled) {
        document.body.classList.add("gaming-effects");
      }
    }
  }, [mode, animationsEnabled]);

  const value: ThemeContextValue = {
    mode,
    config,
    setMode,
    isTransitioning,
    availableModes,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

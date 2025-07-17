import type React from "react";
import { createContext, useEffect, useState } from "react";
import { designTokens } from "@/design-tokens";
import type { ExtendedDesignTokens } from "@/design-tokens/types";

export type ThemeMode = "normal"; // Only normal mode is supported

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

// Generate CSS variables from design tokens (normal mode only)
const generateCSSVariables = (_mode: ThemeMode): Record<string, string> => {
  const tokens = designTokens;
  const spacing = tokens.spacing.normal; // Always use normal spacing
  const sidebarWidth = tokens.layout.sidebar.width.normal; // Always use normal sidebar width

  return {
    // Spacing variables
    "--spacing-xs": spacing.xs,
    "--spacing-sm": spacing.sm,
    "--spacing-md": spacing.md,
    "--spacing-lg": spacing.lg,
    "--spacing-xl": spacing.xl,

    // Layout variables
    "--sidebar-width": sidebarWidth,
    "--layout-gap": "1rem", // Always use normal layout gap

    // Color variables (standard mode only)
    "--color-primary": tokens.colors.semantic.primary,
    "--color-background-primary": tokens.colors.semantic.background.primary,
    "--color-background-secondary": tokens.colors.semantic.background.secondary,
    "--color-background-tertiary": tokens.colors.semantic.background.tertiary,
    "--color-text-primary": tokens.colors.semantic.text.primary,
    "--color-text-secondary": tokens.colors.semantic.text.secondary,
    "--color-text-muted": tokens.colors.semantic.text.muted,

    // Typography
    "--font-size-base": tokens.typography.fontSize.md,
    "--font-family-primary": tokens.typography.fontFamily.sans,
    "--font-family-mono": tokens.typography.fontFamily.mono,
    "--font-family-display": tokens.typography.fontFamily.display,

    // Animation timing
    "--animation-fast": tokens.animation.timing.fast,
    "--animation-normal": tokens.animation.timing.normal,
    "--animation-slow": tokens.animation.timing.slow,
  };
};

// Create theme configuration
const createThemeConfig = (mode: ThemeMode): ThemeConfig => ({
  mode,
  tokens: designTokens,
  cssVariables: generateCSSVariables(mode),
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [mode, setModeState] = useState<ThemeMode>("normal"); // Always use normal mode
  const [isTransitioning] = useState(false);

  // Remove localStorage theme loading - always use normal mode
  useEffect(() => {
    setModeState("normal");
  }, []);

  // Apply CSS variables to document root
  useEffect(() => {
    const config = createThemeConfig(mode);
    const root = document.documentElement;

    // Apply CSS variables
    Object.entries(config.cssVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Add theme class to body (always normal)
    document.body.className = document.body.className.replace(/theme-\w+/, "");
    document.body.classList.add("theme-normal");

    // Remove gaming effects (no longer supported)
    document.body.classList.remove("gaming-effects");
  }, [mode]);

  // Theme switching - no-op since only normal mode is supported
  const setMode = async (_newMode: ThemeMode) => {
    // Always use normal mode, ignore any attempts to change
    return;
  };

  // Only normal mode is available
  const availableModes: ThemeMode[] = ["normal"];

  const config = createThemeConfig(mode);

  const value: ThemeContextValue = {
    mode,
    config,
    setMode,
    isTransitioning,
    availableModes,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

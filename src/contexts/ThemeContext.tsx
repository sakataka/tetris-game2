import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { designTokens } from "@/design-tokens";
import type { ExtendedDesignTokens, LayoutMode } from "@/design-tokens/types";
import { useAdaptivePerformance } from "@/hooks/core/useAdaptivePerformance";

export type ThemeMode = LayoutMode; // 'compact' | 'normal' | 'gaming'

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

// Generate CSS variables from design tokens
const generateCSSVariables = (mode: ThemeMode): Record<string, string> => {
  const tokens = designTokens;
  const spacing = mode === "compact" ? tokens.spacing.compact : tokens.spacing.normal;
  const sidebarWidth = tokens.layout.sidebar.width[mode === "compact" ? "compact" : "normal"];

  return {
    // Spacing variables
    "--spacing-xs": spacing.xs,
    "--spacing-sm": spacing.sm,
    "--spacing-md": spacing.md,
    "--spacing-lg": spacing.lg,
    "--spacing-xl": spacing.xl,

    // Layout variables
    "--sidebar-width": sidebarWidth,
    "--layout-gap": mode === "compact" ? "0.75rem" : "1rem",

    // Color variables (enhanced for gaming mode)
    "--color-primary":
      mode === "gaming" ? tokens.colors.brand.gaming.neon : tokens.colors.semantic.primary,
    "--color-background-primary": tokens.colors.semantic.background.primary,
    "--color-background-secondary": tokens.colors.semantic.background.secondary,
    "--color-background-tertiary": tokens.colors.semantic.background.tertiary,
    "--color-text-primary": tokens.colors.semantic.text.primary,
    "--color-text-secondary": tokens.colors.semantic.text.secondary,
    "--color-text-muted": tokens.colors.semantic.text.muted,

    // Gaming mode enhancements
    ...(mode === "gaming" && {
      "--glow-intensity": "0.5",
      "--animation-speed": "1.2",
      "--border-glow": `0 0 10px ${tokens.colors.brand.gaming.neon}`,
      "--color-accent": tokens.colors.brand.gaming.electric,
      "--color-cyberpunk": tokens.colors.brand.gaming.cyberpunk,
    }),

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
  defaultMode?: ThemeMode;
  enableFeatureFlag?: boolean;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = "normal",
  enableFeatureFlag = true,
}) => {
  const [mode, setModeState] = useState<ThemeMode>(defaultMode);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { animationsEnabled, performanceMode } = useAdaptivePerformance();

  // Load saved theme from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem("tetris-theme-mode") as ThemeMode;
    if (savedMode && ["compact", "normal", "gaming"].includes(savedMode)) {
      setModeState(savedMode);
    }
  }, []);

  // Apply CSS variables to document root
  useEffect(() => {
    const config = createThemeConfig(mode);
    const root = document.documentElement;

    // Apply CSS variables
    Object.entries(config.cssVariables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Add theme class to body
    document.body.className = document.body.className.replace(/theme-\w+/, "");
    document.body.classList.add(`theme-${mode}`);

    // Add gaming mode specific effects
    if (mode === "gaming" && animationsEnabled) {
      document.body.classList.add("gaming-effects");
    } else {
      document.body.classList.remove("gaming-effects");
    }
  }, [mode, animationsEnabled]);

  // Theme switching with transition handling
  const setMode = async (newMode: ThemeMode) => {
    if (newMode === mode) return;

    // Handle transition state
    if (animationsEnabled) {
      setIsTransitioning(true);

      // Wait for transition to complete
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }

    // Update theme mode
    setModeState(newMode);

    // Save to localStorage
    localStorage.setItem("tetris-theme-mode", newMode);

    // Trigger re-evaluation of performance if switching to gaming mode
    if (newMode === "gaming" && performanceMode === "reduced") {
      console.warn(
        "Gaming mode enabled with reduced performance. Consider upgrading device or switching to normal mode.",
      );
    }
  };

  // Determine available modes based on feature flag and performance
  const availableModes: ThemeMode[] = enableFeatureFlag
    ? performanceMode === "reduced"
      ? ["compact", "normal"] // No gaming mode on low performance
      : ["compact", "normal", "gaming"]
    : ["normal"]; // Only normal mode if feature flag disabled

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

// Custom hook for consuming theme context
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

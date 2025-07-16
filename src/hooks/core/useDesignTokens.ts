import { useMemo } from "react";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { designTokens } from "@/design-tokens";
import type { ExtendedDesignTokens, LayoutMode } from "@/design-tokens/types";

interface DesignTokensState {
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
}

interface DesignTokensHook {
  tokens: ExtendedDesignTokens;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  colors: ExtendedDesignTokens["colors"];
  typography: ExtendedDesignTokens["typography"];
  spacing: ExtendedDesignTokens["spacing"];
  layout: ExtendedDesignTokens["layout"];
  animation: ExtendedDesignTokens["animation"];
}

// Global design tokens store to prevent multiple instances
const useDesignTokensStore = create<DesignTokensState>()(
  devtools(
    (set) => ({
      layoutMode: "normal",
      setLayoutMode: (mode: LayoutMode) => {
        if (import.meta.env.DEV) {
          console.log(`[useDesignTokens] Layout mode changing to ${mode}`);
        }
        set({ layoutMode: mode });
      },
    }),
    {
      name: "design-tokens-store",
    },
  ),
);

/**
 * Hook for accessing design tokens with layout mode management
 *
 * Provides centralized access to design tokens and layout mode state.
 * Supports switching between compact and normal layout modes.
 *
 * @returns Design tokens and layout mode management
 */
export const useDesignTokens = (): DesignTokensHook => {
  const layoutMode = useDesignTokensStore((state) => state.layoutMode);
  const setLayoutMode = useDesignTokensStore((state) => state.setLayoutMode);

  // Create static references to design tokens (they don't change)
  const tokens = useMemo(() => {
    const currentLayoutTokens = {
      ...designTokens.layout,
      mode: layoutMode,
    };

    return {
      ...designTokens,
      layout: currentLayoutTokens,
    };
  }, [layoutMode]);

  // Return a simplified object structure
  return {
    tokens,
    layoutMode,
    setLayoutMode,
    colors: designTokens.colors,
    typography: designTokens.typography,
    spacing: designTokens.spacing,
    layout: tokens.layout,
    animation: designTokens.animation,
  };
};

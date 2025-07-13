import { useCallback, useEffect, useState } from "react";
import { designTokens } from "@/design-tokens";
import type { ExtendedDesignTokens, LayoutMode } from "@/design-tokens/types";

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

/**
 * Hook for accessing design tokens with layout mode management
 *
 * Provides centralized access to design tokens and layout mode state.
 * Supports switching between compact and normal layout modes.
 *
 * @returns Design tokens and layout mode management
 */
export const useDesignTokens = (): DesignTokensHook => {
  const [layoutMode, setLayoutModeState] = useState<LayoutMode>("normal");

  // Debug logging for layout mode changes
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(`[useDesignTokens] Layout mode state is now: ${layoutMode}`);
    }
  }, [layoutMode]);

  const setLayoutMode = useCallback(
    (mode: LayoutMode) => {
      if (import.meta.env.DEV) {
        console.log(`[useDesignTokens] Layout mode changing from ${layoutMode} to ${mode}`);
      }
      setLayoutModeState(mode);
    },
    [layoutMode],
  );

  // Create layout tokens with current mode
  const currentLayoutTokens = {
    ...designTokens.layout,
    mode: layoutMode,
  };

  return {
    tokens: {
      ...designTokens,
      layout: currentLayoutTokens,
    },
    layoutMode,
    setLayoutMode,
    colors: designTokens.colors,
    typography: designTokens.typography,
    spacing: designTokens.spacing,
    layout: currentLayoutTokens,
    animation: designTokens.animation,
  };
};

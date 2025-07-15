import { useCallback, useEffect, useMemo, useState } from "react";
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

  // Debug logging for layout mode changes (reduce frequency)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(`[useDesignTokens] Layout mode state is now: ${layoutMode}`);
    }
  }, [layoutMode]);

  const setLayoutMode = useCallback((mode: LayoutMode) => {
    if (import.meta.env.DEV) {
      console.log(`[useDesignTokens] Layout mode changing to ${mode}`);
    }
    setLayoutModeState(mode);
  }, []);

  // Memoize layout tokens to prevent unnecessary re-renders
  const currentLayoutTokens = useMemo(
    () => ({
      ...designTokens.layout,
      mode: layoutMode,
    }),
    [layoutMode],
  );

  // Memoize the entire tokens object
  const tokens = useMemo(
    () => ({
      ...designTokens,
      layout: currentLayoutTokens,
    }),
    [currentLayoutTokens],
  );

  // Memoize the return object to prevent infinite re-renders
  return useMemo(
    () => ({
      tokens,
      layoutMode,
      setLayoutMode,
      colors: designTokens.colors,
      typography: designTokens.typography,
      spacing: designTokens.spacing,
      layout: currentLayoutTokens,
      animation: designTokens.animation,
    }),
    [tokens, layoutMode, setLayoutMode, currentLayoutTokens],
  );
};

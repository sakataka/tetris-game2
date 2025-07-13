/**
 * Extended Design Tokens System Types
 *
 * Provides comprehensive type definitions for the design token system,
 * supporting semantic colors, typography, spacing, and layout configurations.
 */

// Tetris piece types for type safety
export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

// Device performance tiers
export type DeviceTier = "low" | "mid" | "high";

// Layout mode types
export type LayoutMode = "compact" | "normal" | "gaming";

// Main design tokens interface
export interface ExtendedDesignTokens {
  colors: {
    semantic: {
      primary: string;
      success: string;
      warning: string;
      error: string;
      background: {
        primary: string;
        secondary: string;
        tertiary: string;
      };
      text: {
        primary: string;
        secondary: string;
        muted: string;
      };
    };
    brand: {
      tetris: Record<PieceType, string>;
      gaming: {
        neon: string;
        electric: string;
        cyberpunk: string;
      };
    };
  };
  typography: {
    fontFamily: {
      mono: string;
      sans: string;
      display: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    fontWeight: {
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeight: {
      tight: string;
      normal: string;
      relaxed: string;
    };
  };
  spacing: {
    compact: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    normal: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
  };
  layout: {
    mode: LayoutMode;
    sidebar: {
      width: {
        compact: string;
        normal: string;
      };
      maxHeight: string;
    };
    breakpoints: {
      mobile: string;
      tablet: string;
      desktop: string;
    };
  };
  animation: {
    enabled: boolean;
    performanceThreshold: {
      fps: number;
      longTask: number;
    };
    timing: {
      fast: string;
      normal: string;
      slow: string;
    };
  };
  version: string;
}

// Helper types for type-safe access
export type SemanticColors = ExtendedDesignTokens["colors"]["semantic"];
export type BrandColors = ExtendedDesignTokens["colors"]["brand"];
export type Typography = ExtendedDesignTokens["typography"];
export type Spacing = ExtendedDesignTokens["spacing"];
export type Layout = ExtendedDesignTokens["layout"];
export type Animation = ExtendedDesignTokens["animation"];

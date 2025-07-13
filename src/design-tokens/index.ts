/**
 * Extended Design Tokens Implementation
 *
 * Comprehensive design token system providing semantic colors, typography,
 * spacing, layout, and animation tokens for consistent design implementation.
 */

import type { ExtendedDesignTokens } from "./types";

export const designTokens: ExtendedDesignTokens = {
  colors: {
    semantic: {
      primary: "#00f5ff", // Cyber cyan
      success: "#10b981", // Green
      warning: "#f59e0b", // Amber
      error: "#ef4444", // Red
      background: {
        primary: "#0a0a0f", // Deep dark
        secondary: "#1a1a2e", // Card background
        tertiary: "#16213e", // Accent areas
      },
      text: {
        primary: "#ffffff", // Primary text (maintains excellent contrast)
        secondary: "#e5e7eb", // Secondary text (improved contrast ~7.5:1)
        muted: "#d1d5db", // Muted text (improved contrast ~5.5:1)
      },
    },
    brand: {
      tetris: {
        I: "#22d3ee", // Cyan (existing)
        O: "#facc15", // Yellow (existing)
        T: "#a855f7", // Purple (existing)
        S: "#22c55e", // Green (existing, updated to match current)
        Z: "#ef4444", // Red (existing)
        J: "#3b82f6", // Blue (existing)
        L: "#f97316", // Orange (existing)
      },
      gaming: {
        neon: "#00f5ff", // Neon cyan
        electric: "#8a2be2", // Electric purple
        cyberpunk: "#ff0080", // Cyberpunk pink
      },
    },
  },
  typography: {
    fontFamily: {
      mono: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace',
      sans: '"Inter", "SF Pro Display", "-apple-system", "BlinkMacSystemFont", sans-serif',
      display: '"Inter", "SF Pro Display", "-apple-system", "BlinkMacSystemFont", sans-serif',
    },
    fontSize: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      md: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      xxl: "1.5rem", // 24px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: "1.25",
      normal: "1.5",
      relaxed: "1.75",
    },
  },
  spacing: {
    compact: {
      xs: "0.25rem", // 4px
      sm: "0.5rem", // 8px
      md: "0.75rem", // 12px
      lg: "1rem", // 16px
      xl: "1.5rem", // 24px
    },
    normal: {
      xs: "0.5rem", // 8px
      sm: "1rem", // 16px
      md: "1.5rem", // 24px
      lg: "2rem", // 32px
      xl: "3rem", // 48px
    },
  },
  layout: {
    mode: "normal",
    sidebar: {
      width: {
        compact: "200px",
        normal: "240px",
      },
      maxHeight: "calc(100vh - 2rem)",
    },
    breakpoints: {
      mobile: "375px",
      tablet: "768px",
      desktop: "1280px",
    },
  },
  animation: {
    enabled: true,
    performanceThreshold: {
      fps: 55,
      longTask: 50,
    },
    timing: {
      fast: "150ms",
      normal: "300ms",
      slow: "500ms",
    },
  },
  version: "2025-Q1",
};

// Export individual token categories for convenience
export const colors = designTokens.colors;
export const typography = designTokens.typography;
export const spacing = designTokens.spacing;
export const layout = designTokens.layout;
export const animation = designTokens.animation;

// Export types for external use
export type {
  Animation,
  BrandColors,
  DeviceTier,
  ExtendedDesignTokens,
  Layout,
  LayoutMode,
  PieceType,
  SemanticColors,
  Spacing,
  Typography,
} from "./types";

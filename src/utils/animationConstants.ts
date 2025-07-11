/**
 * Centralized Animation Configuration
 *
 * This file contains all Framer Motion animation presets, transitions, and configurations
 * to ensure consistent visual effects and user experience across the entire application.
 */

/**
 * Core animation presets for game elements
 */
export const ANIMATION_PRESETS = {
  // Game piece animations
  pieceSpawn: {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
    mass: 0.8,
  },

  // Line effects
  lineFall: {
    type: "spring" as const,
    stiffness: 400,
    damping: 30,
    mass: 0.8,
  },

  // Score and UI updates
  scoreUpdate: {
    type: "spring" as const,
    stiffness: 400,
    damping: 15,
    mass: 0.9,
  },
  levelUp: {
    type: "spring" as const,
    stiffness: 600,
    damping: 20,
    mass: 0.8,
  },

  // Button interactions
  buttonHover: {
    type: "spring" as const,
    stiffness: 500,
    damping: 35,
    mass: 0.3,
  },

  // Cell animations
  cellPlace: {
    type: "spring" as const,
    stiffness: 500,
    damping: 30,
    mass: 0.4,
  },
  cellSpawn: {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
    mass: 0.6,
  },
} as const;

/**
 * Animation duration presets
 */
export const ANIMATION_DURATIONS = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8,
} as const;

/**
 * Complete animation configurations for specific use cases
 */
export const COMPLETE_ANIMATIONS = {
  // Score animations
  scoreIncrease: {
    initial: { scale: 1.3, opacity: 0.7 },
    animate: { scale: 1, opacity: 1 },
    transition: ANIMATION_PRESETS.scoreUpdate,
  },

  // Level up animation
  levelIncrease: {
    initial: { scale: 1.5, opacity: 0.5, rotate: -10 },
    animate: { scale: 1, opacity: 1, rotate: 0 },
    transition: ANIMATION_PRESETS.levelUp,
  },

  // Lines cleared animation
  linesCleared: {
    initial: { scale: 1.2, opacity: 0.8, y: -10 },
    animate: { scale: 1, opacity: 1, y: 0 },
    transition: ANIMATION_PRESETS.scoreUpdate,
  },
} as const;

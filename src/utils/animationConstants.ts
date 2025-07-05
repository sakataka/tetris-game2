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
  pieceDrop: {
    type: "spring" as const,
    stiffness: 600,
    damping: 30,
    mass: 0.5,
  },
  pieceRotation: {
    type: "spring" as const,
    stiffness: 400,
    damping: 25,
    mass: 0.6,
  },

  // Line clear effects
  lineClear: {
    type: "spring" as const,
    stiffness: 500,
    damping: 25,
    mass: 0.7,
  },
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

  // Modal and dialog animations
  modalEnter: {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
    mass: 1.0,
  },
  modalExit: {
    type: "spring" as const,
    stiffness: 400,
    damping: 40,
    mass: 0.8,
  },

  // Button interactions
  buttonHover: {
    type: "spring" as const,
    stiffness: 500,
    damping: 35,
    mass: 0.3,
  },
  buttonPress: {
    type: "spring" as const,
    stiffness: 800,
    damping: 40,
    mass: 0.2,
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

  // Piece spawn animation
  pieceSpawnAnimation: {
    initial: { y: -8, opacity: 0.9 },
    animate: { y: 0, opacity: 1 },
    transition: ANIMATION_PRESETS.pieceSpawn,
  },

  // Piece placement animation
  piecePlaceAnimation: {
    initial: { scale: 0.9 },
    animate: { scale: 1 },
    transition: ANIMATION_PRESETS.cellPlace,
  },

  // Line clearing visual effect
  lineClearAnimation: {
    initial: { opacity: 1, scale: 1 },
    animate: { opacity: [1, 0, 1, 0], scale: [1, 1.1, 1, 0.9] },
    transition: { duration: ANIMATION_DURATIONS.normal, repeat: 0 },
  },

  // Line fall gravity animation
  lineFallAnimation: {
    initial: { y: 0 },
    animate: { y: 0 },
    transition: ANIMATION_PRESETS.lineFall,
  },

  // Button hover effect
  buttonHoverAnimation: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: ANIMATION_PRESETS.buttonHover,
  },
} as const;

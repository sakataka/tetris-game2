import type { Transition } from "framer-motion";
import { ANIMATION_DURATION } from "./constants";

/**
 * Animation configurations for different game elements
 */
export const ANIMATION_CONFIGS = {
  /**
   * Piece drop animation when spawning
   */
  pieceDrop: {
    initial: { y: -8, opacity: 0.9 },
    animate: { y: 0, opacity: 1 },
    transition: {
      type: "spring" as const,
      stiffness: 500,
      damping: 30,
      duration: ANIMATION_DURATION.PIECE_DROP / 1000,
    },
  },

  /**
   * Piece placement animation
   */
  piecePlacement: {
    initial: { scale: 0.9 },
    animate: { scale: 1 },
    transition: {
      duration: ANIMATION_DURATION.CELL_PLACEMENT / 1000,
    },
  },

  /**
   * Line clearing animation with flash effect
   */
  lineClear: {
    initial: false,
    animate: {
      opacity: [1, 0.3, 1, 0.3, 1],
      scale: [1, 1.1, 1],
    },
    transition: {
      duration: ANIMATION_DURATION.LINE_CLEAR / 1000,
      repeat: 2,
    },
  },

  /**
   * Score update animation
   */
  scoreUpdate: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.1, 1] },
    transition: {
      duration: ANIMATION_DURATION.SCORE_UPDATE / 1000,
      ease: "easeInOut" as const,
    },
  },
} as const;

/**
 * Create a spring transition with custom parameters
 */
export function createSpringTransition(
  stiffness = 300,
  damping = 20,
  duration?: number,
): Transition {
  return {
    type: "spring",
    stiffness,
    damping,
    ...(duration && { duration }),
  };
}

/**
 * Create a tween transition with custom parameters
 */
export function createTweenTransition(
  duration: number,
  ease = "easeInOut",
  repeat = 0,
): Transition {
  return {
    duration,
    ease: ease as any,
    ...(repeat > 0 && { repeat }),
  };
}

/**
 * Generate a unique animation key for triggering re-animations
 */
export function generateAnimationKey(prefix = "anim"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Common animation variants for UI elements
 */
export const UI_ANIMATIONS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },

  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
    transition: { duration: 0.3 },
  },

  scaleIn: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
    transition: { duration: 0.2 },
  },

  modalBackdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.15 },
  },

  modal: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
    transition: { duration: 0.2 },
  },
} as const;

/**
 * Animation helper for staggered children animations
 */
export function createStaggerAnimation(staggerDelay = 0.1) {
  return {
    animate: {
      transition: {
        staggerChildren: staggerDelay,
      },
    },
  };
}

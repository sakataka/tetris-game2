import { type MotionProps, motion } from "framer-motion";
import { forwardRef } from "react";
import { ANIMATION_PRESETS } from "@/utils/animationConstants";
import { Button, type ButtonProps } from "./button";

interface AnimatedButtonProps extends ButtonProps {
  /**
   * Animation state for hover interactions
   */
  whileHover?: MotionProps["whileHover"];
  /**
   * Animation state for tap/click interactions
   */
  whileTap?: MotionProps["whileTap"];
  /**
   * Transition configuration for animations
   */
  transition?: MotionProps["transition"];
  /**
   * Disable all animations and render a standard Button
   */
  animationDisabled?: boolean;
}

/**
 * AnimatedButton component that wraps Button with consistent Framer Motion animations
 *
 * Provides standardized hover and tap animations while allowing customization.
 * Can be disabled to render a standard Button without animation wrapper.
 *
 * @example
 * ```tsx
 * <AnimatedButton onClick={handleClick} variant="destructive" size="lg">
 *   Click me
 * </AnimatedButton>
 * ```
 *
 * @example Custom animation
 * ```tsx
 * <AnimatedButton
 *   whileHover={{ scale: 1.1, rotate: 5 }}
 *   whileTap={{ scale: 0.9 }}
 *   transition={{ type: "spring", stiffness: 300 }}
 * >
 *   Custom animation
 * </AnimatedButton>
 * ```
 */
export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      children,
      whileHover = { scale: 1.05 },
      whileTap = { scale: 0.95 },
      transition = ANIMATION_PRESETS.buttonHover,
      animationDisabled = false,
      ...buttonProps
    },
    ref,
  ) => {
    // If animations are disabled, render standard Button
    if (animationDisabled) {
      return (
        <Button ref={ref} {...buttonProps}>
          {children}
        </Button>
      );
    }

    // Render animated Button wrapped in motion.div
    return (
      <motion.div whileHover={whileHover} whileTap={whileTap} transition={transition}>
        <Button ref={ref} {...buttonProps}>
          {children}
        </Button>
      </motion.div>
    );
  },
);

AnimatedButton.displayName = "AnimatedButton";

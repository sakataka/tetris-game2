import { type MotionProps, motion } from "motion/react";
import { forwardRef, useCallback, useState } from "react";
import { useAnimationContext } from "@/contexts/AnimationContext";
import { usePerformanceMonitor } from "@/hooks/ui/usePerformanceMonitor";
import { ANIMATION_PRESETS } from "@/utils/animationConstants";
import { getOptimizedAnimationCSS } from "@/utils/browserCompat";
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
  /**
   * Enable ultra-responsive mode (60ms target)
   */
  ultraResponsive?: boolean;
}

/**
 * AnimatedButton component with ultra-responsive micro-interactions
 *
 * Features:
 * - 60ms target response time for hover interactions
 * - Performance monitoring and optimization
 * - Adaptive animation quality based on device capabilities
 * - Cross-browser compatibility with fallbacks
 * - Motion.js integration for complex animations
 *
 * @example Ultra-responsive mode
 * ```tsx
 * <AnimatedButton ultraResponsive onClick={handleClick}>
 *   Ultra-fast response
 * </AnimatedButton>
 * ```
 *
 * @example Custom Motion.js animation
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
      ultraResponsive = false,
      className,
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
      onClick,
      ...buttonProps
    },
    ref,
  ) => {
    const { commonTimings, prefersReducedMotion } = useAnimationContext();
    const { measureButtonResponse } = usePerformanceMonitor();

    // State for ultra-responsive mode
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    // Ultra-responsive event handlers with immediate visual feedback
    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (ultraResponsive) {
          measureButtonResponse("hover");
          setIsHovered(true);
        }
        onMouseEnter?.(e);
      },
      [ultraResponsive, measureButtonResponse, onMouseEnter],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (ultraResponsive) {
          setIsHovered(false);
          setIsPressed(false);
        }
        onMouseLeave?.(e);
      },
      [ultraResponsive, onMouseLeave],
    );

    const handleMouseDown = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (ultraResponsive) {
          measureButtonResponse("press");
          setIsPressed(true);
        }
        onMouseDown?.(e);
      },
      [ultraResponsive, measureButtonResponse, onMouseDown],
    );

    const handleMouseUp = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (ultraResponsive) {
          setIsPressed(false);
        }
        onMouseUp?.(e);
      },
      [ultraResponsive, onMouseUp],
    );

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (ultraResponsive) {
          measureButtonResponse("click");
        }
        onClick?.(e);
      },
      [ultraResponsive, measureButtonResponse, onClick],
    );

    // If animations are disabled, render standard Button
    if (animationDisabled || prefersReducedMotion) {
      return (
        <Button ref={ref} className={className} onClick={handleClick} {...buttonProps}>
          {children}
        </Button>
      );
    }

    // Ultra-responsive mode using CSS-in-JS for immediate feedback
    if (ultraResponsive) {
      const transform = isPressed ? "scale(0.95)" : isHovered ? "scale(1.02)" : "scale(1)";

      const buttonStyle = getOptimizedAnimationCSS(transform, commonTimings.quick, "ease-out");

      return (
        <Button
          ref={ref}
          className={className}
          style={buttonStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
          {...buttonProps}
        >
          {children}
        </Button>
      );
    }

    // Standard Motion.js mode for complex animations
    return (
      <motion.div whileHover={whileHover} whileTap={whileTap} transition={transition}>
        <Button ref={ref} className={className} onClick={handleClick} {...buttonProps}>
          {children}
        </Button>
      </motion.div>
    );
  },
);

AnimatedButton.displayName = "AnimatedButton";

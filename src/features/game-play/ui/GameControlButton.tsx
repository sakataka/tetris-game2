import { AnimatedButton } from "@shared/ui/AnimatedButton";
import type { ButtonProps } from "@shared/ui/button";
import { useCallback } from "react";
import { useHapticFeedback } from "@/hooks/common/useHapticFeedback";
import { usePerformanceMonitor } from "@/hooks/ui/usePerformanceMonitor";

export type GameAction =
  | "move-left"
  | "move-right"
  | "move-down"
  | "rotate"
  | "hard-drop"
  | "hold"
  | "pause"
  | "reset";

interface GameControlButtonProps extends Omit<ButtonProps, "onClick"> {
  action: GameAction;
  onClick?: (action: GameAction, event: React.MouseEvent<HTMLButtonElement>) => void;
  enableHaptic?: boolean;
  hapticIntensity?: "light" | "medium" | "heavy";
  ultraResponsive?: boolean;
  children: React.ReactNode;
}

/**
 * Enhanced game control button with immediate feedback and performance monitoring
 *
 * Features:
 * - Ultra-responsive 60ms target response time
 * - Haptic feedback for mobile devices
 * - Game action-specific performance tracking
 * - Immediate visual feedback with optimized animations
 * - Cross-browser compatibility
 *
 * @example Basic usage
 * ```tsx
 * <GameControlButton
 *   action="move-left"
 *   onClick={handleMoveLeft}
 *   ultraResponsive
 * >
 *   <ChevronLeft />
 * </GameControlButton>
 * ```
 *
 * @example With haptic feedback
 * ```tsx
 * <GameControlButton
 *   action="hard-drop"
 *   onClick={handleDrop}
 *   enableHaptic
 *   hapticIntensity="heavy"
 *   ultraResponsive
 * >
 *   <ChevronsDown />
 * </GameControlButton>
 * ```
 */
export const GameControlButton = ({
  action,
  onClick,
  enableHaptic = true,
  hapticIntensity = "light",
  ultraResponsive = true,
  children,
  className,
  ...buttonProps
}: GameControlButtonProps) => {
  const { measureResponseTime } = usePerformanceMonitor();
  const { lightImpact, mediumImpact, heavyImpact } = useHapticFeedback();

  const handleAction = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // Start performance measurement
      const startTime = measureResponseTime(`game-control-${action}`);

      // Provide immediate haptic feedback if enabled
      if (enableHaptic) {
        const hapticFunction =
          hapticIntensity === "light"
            ? lightImpact
            : hapticIntensity === "medium"
              ? mediumImpact
              : heavyImpact;
        hapticFunction();
      }

      // Execute game action callback
      onClick?.(action, e);

      // Additional performance tracking for critical game actions
      if (["move-left", "move-right", "hard-drop"].includes(action)) {
        requestAnimationFrame(() => {
          const responseTime = performance.now() - startTime;

          // Log critical action response times in development
          if (import.meta.env.DEV && responseTime > 30) {
            console.warn(
              `🎮 Game control response: ${action} took ${responseTime.toFixed(2)}ms (target: <30ms)`,
            );
          }
        });
      }
    },
    [
      action,
      measureResponseTime,
      enableHaptic,
      lightImpact,
      mediumImpact,
      heavyImpact,
      hapticIntensity,
      onClick,
    ],
  );

  // Determine button styling based on action type
  const getActionVariant = (action: GameAction): ButtonProps["variant"] => {
    switch (action) {
      case "hard-drop":
        return "destructive";
      case "pause":
      case "reset":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getActionSize = (action: GameAction): ButtonProps["size"] => {
    switch (action) {
      case "move-left":
      case "move-right":
        return "lg";
      case "hard-drop":
        return "lg";
      default:
        return "default";
    }
  };

  return (
    <AnimatedButton
      {...buttonProps}
      variant={getActionVariant(action)}
      size={getActionSize(action)}
      onClick={handleAction}
      ultraResponsive={ultraResponsive}
      className={`game-control-button game-control-${action} touch-manipulation ${className || ""}`}
      aria-label={`Game control: ${action.replace("-", " ")}`}
      data-testid={`game-control-${action}`}
    >
      {children}
    </AnimatedButton>
  );
};

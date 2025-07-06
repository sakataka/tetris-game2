import { motion } from "motion/react";
import { COMPLETE_ANIMATIONS } from "@/utils/animationConstants";

interface AnimatedScoreItemProps {
  label: string;
  value: string | number;
  animationKey: string | number;
  className?: string;
  animation?: "score" | "lines" | "level";
  "data-testid"?: string;
}

/**
 * Animated score item component with configurable animation presets
 */
export function AnimatedScoreItem({
  label,
  value,
  animationKey,
  className = "text-xl font-bold text-tetris-cyan",
  animation = "score",
  "data-testid": dataTestId,
}: AnimatedScoreItemProps) {
  const getAnimationPreset = () => {
    switch (animation) {
      case "score":
        return COMPLETE_ANIMATIONS.scoreIncrease;
      case "lines":
        return COMPLETE_ANIMATIONS.linesCleared;
      case "level":
        return COMPLETE_ANIMATIONS.levelIncrease;
      default:
        return COMPLETE_ANIMATIONS.scoreIncrease;
    }
  };

  const animationProps = getAnimationPreset();

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-gray-400">{label}</p>
      <motion.p
        key={animationKey}
        initial={animationProps.initial}
        animate={animationProps.animate}
        transition={animationProps.transition}
        className={className}
        data-testid={dataTestId}
      >
        {typeof value === "number" && animation === "score" ? value.toLocaleString() : value}
      </motion.p>
    </div>
  );
}

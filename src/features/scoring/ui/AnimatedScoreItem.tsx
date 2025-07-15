import { motion } from "motion/react";

interface AnimatedScoreItemProps {
  value: string | number;
  className?: string;
  animation?: "score" | "lines" | "level";
  "data-testid"?: string;
  showAnimation?: boolean;
}

// Local animation presets (simplified from @/utils/animationConstants)
const ANIMATION_PRESETS = {
  scoreIncrease: {
    initial: { scale: 1, opacity: 0.8 },
    animate: { scale: [1, 1.1, 1], opacity: 1 },
    transition: { duration: 0.5 },
  },
  linesCleared: {
    initial: { scale: 1, y: 0 },
    animate: { scale: [1, 1.05, 1], y: [0, -2, 0] },
    transition: { duration: 0.4 },
  },
  levelIncrease: {
    initial: { scale: 1, rotate: 0 },
    animate: { scale: [1, 1.2, 1], rotate: [0, 5, 0] },
    transition: { duration: 0.6 },
  },
};

/**
 * Animated score item component with configurable animation presets
 */
export function AnimatedScoreItem({
  value,
  className = "text-xl font-bold text-tetris-cyan",
  animation = "score",
  "data-testid": dataTestId,
  showAnimation = true,
}: AnimatedScoreItemProps) {
  const getAnimationPreset = () => {
    switch (animation) {
      case "score":
        return ANIMATION_PRESETS.scoreIncrease;
      case "lines":
        return ANIMATION_PRESETS.linesCleared;
      case "level":
        return ANIMATION_PRESETS.levelIncrease;
      default:
        return ANIMATION_PRESETS.scoreIncrease;
    }
  };

  const animationProps = showAnimation
    ? getAnimationPreset()
    : {
        initial: {},
        animate: {},
        transition: undefined,
      };

  return (
    <motion.span
      initial={animationProps.initial}
      animate={animationProps.animate}
      transition={animationProps.transition}
      className={className}
      data-testid={dataTestId}
    >
      {typeof value === "number" && animation === "score" ? value.toLocaleString() : value}
    </motion.span>
  );
}

import { motion } from "framer-motion";

interface AnimatedScoreItemProps {
  label: string;
  value: string | number;
  animationKey: string | number;
  className?: string;
  animation?: "score" | "lines" | "level";
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
}: AnimatedScoreItemProps) {
  const getAnimationPreset = () => {
    switch (animation) {
      case "score":
        return {
          initial: { scale: 1.3, opacity: 0.7 },
          animate: { scale: 1, opacity: 1 },
          transition: { type: "spring" as const, stiffness: 300, damping: 15 },
        };
      case "lines":
        return {
          initial: { scale: 1.2, opacity: 0.8, y: -10 },
          animate: { scale: 1, opacity: 1, y: 0 },
          transition: { type: "spring" as const, stiffness: 400, damping: 20 },
        };
      case "level":
        return {
          initial: { scale: 1.5, opacity: 0.5, rotate: -10 },
          animate: { scale: 1, opacity: 1, rotate: 0 },
          transition: { type: "spring" as const, stiffness: 250, damping: 12 },
        };
      default:
        return {
          initial: { scale: 1.3, opacity: 0.7 },
          animate: { scale: 1, opacity: 1 },
          transition: { type: "spring" as const, stiffness: 300, damping: 15 },
        };
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
      >
        {typeof value === "number" && animation === "score" ? value.toLocaleString() : value}
      </motion.p>
    </div>
  );
}

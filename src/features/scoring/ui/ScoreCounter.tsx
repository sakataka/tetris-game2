import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface ScoreCounterProps {
  score: number;
  previousScore: number;
  className?: string;
  "data-testid"?: string;
  showAnimation?: boolean;
}

/**
 * Score counter with 1-second maximum count-up animation
 * Meets Issue #137 requirement: Score Counter Animation (1秒以内カウントアップ)
 */
export function ScoreCounter({
  score,
  previousScore,
  className = "text-xl font-bold text-tetris-cyan",
  "data-testid": dataTestId,
  showAnimation = true,
}: ScoreCounterProps) {
  const [displayScore, setDisplayScore] = useState(previousScore);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | null>(null);

  const animateScoreChange = useCallback(
    (from: number, to: number) => {
      if (from === to || !showAnimation) {
        setDisplayScore(to);
        return;
      }

      setIsAnimating(true);
      const startTime = performance.now();
      const duration = Math.min(1000, Math.abs(to - from) * 2); // 🎯 1秒以内

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for score counting (ease-out cubic)
        const easedProgress = 1 - (1 - progress) ** 3;
        const currentScore = Math.round(from + (to - from) * easedProgress);

        setDisplayScore(currentScore);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    },
    [showAnimation],
  );

  useEffect(() => {
    if (score !== previousScore) {
      animateScoreChange(previousScore, score);
    }
  }, [score, previousScore, animateScoreChange]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <motion.span
      className={`${className} ${isAnimating ? "counting" : ""}`}
      data-testid={dataTestId}
      initial={{ scale: 1 }}
      animate={{ scale: showAnimation && isAnimating ? [1, 1.05, 1] : 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {displayScore.toLocaleString()}
    </motion.span>
  );
}

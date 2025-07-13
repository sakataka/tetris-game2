/**
 * Level Celebration Component
 * 3-second celebration with user cancellation support and asset-free animations
 */

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CelebrationEffects } from "./CelebrationEffects";

export interface LevelCelebrationProps {
  level: number;
  isVisible: boolean;
  onComplete: () => void;
  onCancel?: () => void;
}

type CelebrationPhase = "intro" | "main" | "outro" | "completed";

export const LevelCelebration: React.FC<LevelCelebrationProps> = ({
  level,
  isVisible,
  onComplete,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<CelebrationPhase>("intro");
  const [timeRemaining, setTimeRemaining] = useState(3);

  const cancelCelebration = useCallback(() => {
    setPhase("completed");
    onCancel?.();
    onComplete();
  }, [onComplete, onCancel]);

  // Main celebration animation logic
  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const startTime = performance.now();
    const totalDuration = 3000; // 3 seconds total

    const phases = [
      { name: "intro" as const, duration: 500 }, // 0.5s
      { name: "main" as const, duration: 2000 }, // 2.0s
      { name: "outro" as const, duration: 500 }, // 0.5s
    ];

    let currentPhaseIndex = 0;
    let phaseStartTime = startTime;
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      const totalElapsed = currentTime - startTime;
      const remaining = Math.max(0, (totalDuration - totalElapsed) / 1000);
      setTimeRemaining(Math.ceil(remaining));

      // Check if we should complete
      if (totalElapsed >= totalDuration || phase === "completed") {
        setPhase("completed");
        onComplete();
        return;
      }

      // Phase progression
      const phaseElapsed = currentTime - phaseStartTime;
      const currentPhase = phases[currentPhaseIndex];

      if (phaseElapsed >= currentPhase.duration && currentPhaseIndex < phases.length - 1) {
        currentPhaseIndex++;
        phaseStartTime = currentTime;
        setPhase(phases[currentPhaseIndex].name);
      }

      // Continue animation
      animationFrameId = requestAnimationFrame(animate);
    };

    // Start animation
    setPhase("intro");
    animationFrameId = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isVisible, onComplete, phase]);

  // Keyboard and mouse cancellation
  useEffect(() => {
    const handleCancel = (e: KeyboardEvent | MouseEvent) => {
      if (e.type === "keydown" || e.type === "click") {
        e.preventDefault();
        e.stopPropagation();
        cancelCelebration();
      }
    };

    if (isVisible && phase !== "completed") {
      document.addEventListener("keydown", handleCancel, { capture: true });
      document.addEventListener("click", handleCancel, { capture: true });

      return () => {
        document.removeEventListener("keydown", handleCancel, { capture: true });
        document.removeEventListener("click", handleCancel, { capture: true });
      };
    }
  }, [isVisible, phase, cancelCelebration]);

  // Don't render if not visible or completed
  if (!isVisible || phase === "completed") {
    return null;
  }

  return (
    <div className="level-celebration-overlay">
      <div
        className={`celebration-content phase-${phase}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="level-celebration-title"
        aria-describedby="level-celebration-description"
      >
        <h1 id="level-celebration-title" className="level-title">
          {t("game.levelUp", { level })}
        </h1>

        <div id="level-celebration-description" className="skip-hint" aria-live="polite">
          {t("game.celebration.skipHint", { timeRemaining })}
        </div>

        <CelebrationEffects phase={phase} />
      </div>
    </div>
  );
};

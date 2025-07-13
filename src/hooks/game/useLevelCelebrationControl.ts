/**
 * Level Celebration Control Hook
 * Manages level-up celebration animations with highest priority (10) control
 */

import { useCallback, useState } from "react";
import { useAnimationOrchestrator } from "@/hooks/animations/useAnimationOrchestrator";

export interface LevelCelebrationConfig {
  level: number;
  duration: number;
  priority: number;
  cancellable: boolean;
}

export interface LevelCelebrationController {
  isCelebrating: boolean;
  startCelebration: (level: number) => Promise<void>;
  cancelCelebration: () => void;
  getCurrentLevel: () => number | null;
}

/**
 * Hook for controlling level celebration animations with priority management
 */
export const useLevelCelebrationControl = (): LevelCelebrationController => {
  const orchestrator = useAnimationOrchestrator();
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<number | null>(null);

  const startCelebration = useCallback(
    async (level: number): Promise<void> => {
      // Don't start if already celebrating
      if (isCelebrating) {
        return;
      }

      setIsCelebrating(true);
      setCurrentLevel(level);

      // Cancel all lower priority animations (priority < 10)
      try {
        // Note: This would need to be implemented in the orchestrator
        // For now, we'll just register with highest priority

        const celebrationConfig = {
          duration: 3000, // 3 seconds maximum
          easing: "ease-out",
          priority: 10, // Highest priority
          cancellable: true,
        };

        // Register and execute the level celebration animation
        orchestrator.register("level-celebration", celebrationConfig, 10);

        await orchestrator.execute("level-celebration");

        // Animation completed successfully
        setIsCelebrating(false);
        setCurrentLevel(null);
      } catch (error) {
        // Animation was cancelled or failed
        console.log(`Level celebration cancelled or failed: ${error}`);
        setIsCelebrating(false);
        setCurrentLevel(null);
      }
    },
    [orchestrator, isCelebrating],
  );

  const cancelCelebration = useCallback(() => {
    if (isCelebrating) {
      const cancelled = orchestrator.cancel("level-celebration");
      if (cancelled) {
        setIsCelebrating(false);
        setCurrentLevel(null);
      }
    }
  }, [orchestrator, isCelebrating]);

  const getCurrentLevel = useCallback(() => {
    return currentLevel;
  }, [currentLevel]);

  return {
    isCelebrating,
    startCelebration,
    cancelCelebration,
    getCurrentLevel,
  };
};

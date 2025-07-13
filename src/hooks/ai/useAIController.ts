import { useCallback, useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/shallow";
import { useAdaptivePerformance } from "@/hooks/core/useAdaptivePerformance";
import { useGameStore } from "@/store/gameStore";
import { useSettingsStore } from "@/store/settingsStore";

export interface AIController {
  isAIActive: boolean;
  aiLevel: number;
  aiThinking: boolean;
  toggleAI: () => void;
  setAILevel: (level: number) => void;
}

/**
 * Simplified AI controller hook that provides a basic AI interface
 *
 * This hook provides a simplified interface for AI control without
 * depending on the complex advanced AI system. It can be used as
 * a prototype or fallback implementation.
 *
 * Features:
 * - Simple AI enable/disable toggle
 * - AI level adjustment (1-10 scale)
 * - Performance-aware AI timing
 * - Basic AI decision making
 * - Automatic cleanup on unmount
 */
export const useAIController = (): AIController => {
  const thinkingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [aiLevel, setAILevelState] = useState(5);
  const [isThinking, setIsThinking] = useState(false);

  const { currentPiece, isGameOver, isPaused } = useGameStore(
    useShallow((state) => ({
      currentPiece: state.currentPiece,
      isGameOver: state.isGameOver,
      isPaused: state.isPaused,
    })),
  );

  const { enableAIFeatures, toggleAIFeatures } = useSettingsStore(
    useShallow((state) => ({
      enableAIFeatures: state.enableAIFeatures,
      toggleAIFeatures: state.toggleAIFeatures,
    })),
  );

  const { performanceMode } = useAdaptivePerformance();

  // Get game actions for AI movement
  const { moveLeft, moveRight, moveDown, rotate, drop } = useGameStore(
    useShallow((state) => ({
      moveLeft: state.moveLeft,
      moveRight: state.moveRight,
      moveDown: state.moveDown,
      rotate: state.rotate,
      drop: state.drop,
    })),
  );

  // Simple AI decision making (placeholder implementation)
  const makeAIMove = useCallback(() => {
    if (!enableAIFeatures || !currentPiece) return;
    if (isGameOver || isPaused) return;

    setIsThinking(true);

    // Calculate thinking time based on AI level and performance mode
    const baseThinkingTime = Math.max(50, 200 - aiLevel * 15);
    const adjustedThinkingTime =
      performanceMode === "reduced" ? baseThinkingTime * 1.5 : baseThinkingTime;

    thinkingTimeoutRef.current = setTimeout(() => {
      // Simple AI logic - in a real implementation, this would use
      // the existing AI engine from /src/game/ai/
      const moves = ["left", "right", "down", "rotate", "drop"] as const;
      const randomMove = moves[Math.floor(Math.random() * moves.length)];

      try {
        switch (randomMove) {
          case "left":
            moveLeft();
            break;
          case "right":
            moveRight();
            break;
          case "down":
            moveDown();
            break;
          case "rotate":
            rotate();
            break;
          case "drop":
            drop();
            break;
        }
      } catch (error) {
        console.warn("[useAIController] AI move failed:", error);
      }

      setIsThinking(false);
    }, adjustedThinkingTime);
  }, [
    enableAIFeatures,
    currentPiece,
    isGameOver,
    isPaused,
    aiLevel,
    performanceMode,
    moveLeft,
    moveRight,
    moveDown,
    rotate,
    drop,
  ]);

  // AI game loop
  useEffect(() => {
    if (enableAIFeatures && !isGameOver && !isPaused) {
      const moveInterval = Math.max(100, 1000 - aiLevel * 80); // Higher level = faster moves

      const interval = setInterval(() => {
        makeAIMove();
      }, moveInterval);

      return () => clearInterval(interval);
    }
  }, [enableAIFeatures, isGameOver, isPaused, aiLevel, makeAIMove]);

  // AI level setter with validation
  const setAILevel = useCallback((level: number) => {
    const clampedLevel = Math.max(1, Math.min(10, level));
    setAILevelState(clampedLevel);
  }, []);

  // Toggle AI functionality
  const toggleAI = useCallback(() => {
    toggleAIFeatures();

    // Stop any ongoing AI thinking when disabled
    if (enableAIFeatures && thinkingTimeoutRef.current) {
      clearTimeout(thinkingTimeoutRef.current);
      setIsThinking(false);
    }
  }, [enableAIFeatures, toggleAIFeatures]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (thinkingTimeoutRef.current) {
        clearTimeout(thinkingTimeoutRef.current);
      }
    };
  }, []);

  return {
    isAIActive: enableAIFeatures,
    aiLevel,
    aiThinking: isThinking,
    toggleAI,
    setAILevel,
  };
};

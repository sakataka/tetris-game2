import { useCallback, useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import type { AdvancedAIDecision, AdvancedAIStats } from "@/game/ai";
import { aiWorkerManager } from "../api/aiWorkerAdapter";
import { useAIStore } from "../model/aiSlice";
import type { AISettings, AIState } from "../ui/AIControlPanel";

export interface UseAIControlReturn {
  // AI State
  aiState: AIState;
  settings: AISettings;

  // AI Actions
  toggleAI: () => Promise<void>;
  pauseAI: () => void;
  stepAI: () => Promise<void>;
  updateSettings: (settings: AISettings) => void;

  // AI Events
  onAIDecision: (decision: AdvancedAIDecision) => void;
  onAIError: (error: Error) => void;

  // Utility
  isAIAvailable: boolean;
  canUseAI: boolean;
}

export const useAIControl = (): UseAIControlReturn => {
  const workerRef = useRef<Worker | null>(null);

  // Get AI state using shallow comparison
  const aiState = useAIStore(
    useShallow((state) => ({
      isEnabled: state.isEnabled,
      isPaused: state.isPaused,
      isThinking: state.isThinking,
      lastDecision: state.lastDecision,
      stats: state.stats,
    })),
  );

  // Get AI settings
  const settings = useAIStore(
    useShallow((state) => ({
      aiLevel: state.aiLevel,
      beamWidth: state.beamWidth,
      thinkingTimeLimit: state.thinkingTimeLimit,
      useHold: state.useHold,
      enableVisualization: state.enableVisualization,
      playbackSpeed: state.playbackSpeed,
    })),
  );

  // Get actions
  const actions = useAIStore(
    useShallow((state) => ({
      setEnabled: state.setEnabled,
      setPaused: state.setPaused,
      setThinking: state.setThinking,
      setLastDecision: state.setLastDecision,
      updateStats: state.updateStats,
      updateSettings: state.updateSettings,
    })),
  );

  // Check if AI is available
  const isAIAvailable = typeof Worker !== "undefined" && aiWorkerManager.isSupported();
  const canUseAI = isAIAvailable && !aiState.isThinking;

  // Toggle AI enable/disable
  const toggleAI = useCallback(async () => {
    if (aiState.isEnabled) {
      // Stop AI
      await aiWorkerManager.stopAI();
      actions.setEnabled(false);
      actions.setPaused(false);
      actions.setThinking(false);
    } else {
      // Start AI
      if (!isAIAvailable) {
        console.error("[useAIControl] AI Worker not available");
        return;
      }

      try {
        await aiWorkerManager.startAI(settings);
        actions.setEnabled(true);
        actions.setPaused(false);
      } catch (error) {
        console.error("[useAIControl] Failed to start AI:", error);
        onAIError(error as Error);
      }
    }
  }, [aiState.isEnabled, isAIAvailable, settings, actions]);

  // Pause/Resume AI
  const pauseAI = useCallback(() => {
    if (!aiState.isEnabled) return;

    if (aiState.isPaused) {
      aiWorkerManager.resumeAI();
      actions.setPaused(false);
    } else {
      aiWorkerManager.pauseAI();
      actions.setPaused(true);
    }
  }, [aiState.isEnabled, aiState.isPaused, actions]);

  // Step AI (single move when paused)
  const stepAI = useCallback(async () => {
    if (!aiState.isEnabled || !aiState.isPaused) return;

    try {
      actions.setThinking(true);
      const decision = await aiWorkerManager.stepAI();
      actions.setLastDecision(decision);
      onAIDecision(decision);
    } catch (error) {
      console.error("[useAIControl] Failed to step AI:", error);
      onAIError(error as Error);
    } finally {
      actions.setThinking(false);
    }
  }, [aiState.isEnabled, aiState.isPaused, actions]);

  // Update AI settings
  const updateSettings = useCallback(
    (newSettings: AISettings) => {
      actions.updateSettings(newSettings);

      // If AI is running, update worker settings
      if (aiState.isEnabled) {
        aiWorkerManager.updateSettings(newSettings);
      }
    },
    [aiState.isEnabled, actions],
  );

  // Handle AI decision
  const onAIDecision = useCallback(
    (decision: AdvancedAIDecision) => {
      actions.setLastDecision(decision);

      // Update statistics
      const currentStats = aiState.stats || {
        totalMoves: 0,
        averageThinkingTime: 0,
        averageNodesExplored: 0,
        efficiency: 0,
      };

      const newStats: AdvancedAIStats = {
        totalMoves: currentStats.totalMoves + 1,
        averageThinkingTime:
          (currentStats.averageThinkingTime * currentStats.totalMoves + decision.thinkingTime) /
          (currentStats.totalMoves + 1),
        averageNodesExplored:
          (currentStats.averageNodesExplored * currentStats.totalMoves + decision.nodesExplored) /
          (currentStats.totalMoves + 1),
        efficiency:
          decision.score > 0
            ? Math.min(
                100,
                (currentStats.efficiency * currentStats.totalMoves + decision.score) /
                  (currentStats.totalMoves + 1),
              )
            : currentStats.efficiency,
      };

      actions.updateStats(newStats);
    },
    [aiState.stats, actions],
  );

  // Handle AI error
  const onAIError = useCallback(
    (error: Error) => {
      console.error("[useAIControl] AI Error:", error);

      // Reset AI state on error
      actions.setEnabled(false);
      actions.setPaused(false);
      actions.setThinking(false);

      // TODO: Show error notification to user
    },
    [actions],
  );

  // Set up AI worker event listeners
  useEffect(() => {
    if (!isAIAvailable) return;

    const handleDecision = (decision: AdvancedAIDecision) => {
      actions.setThinking(false);
      onAIDecision(decision);
    };

    const handleError = (error: Error) => {
      actions.setThinking(false);
      onAIError(error);
    };

    const handleThinkingStart = () => {
      actions.setThinking(true);
    };

    aiWorkerManager.on("decision", handleDecision);
    aiWorkerManager.on("error", handleError);
    aiWorkerManager.on("thinking-start", handleThinkingStart);

    return () => {
      aiWorkerManager.off("decision", handleDecision);
      aiWorkerManager.off("error", handleError);
      aiWorkerManager.off("thinking-start", handleThinkingStart);
    };
  }, [isAIAvailable, actions, onAIDecision, onAIError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (aiState.isEnabled) {
        aiWorkerManager.stopAI();
      }
    };
  }, []);

  return {
    aiState,
    settings,
    toggleAI,
    pauseAI,
    stepAI,
    updateSettings,
    onAIDecision,
    onAIError,
    isAIAvailable,
    canUseAI,
  };
};

/**
 * Hook for AI state only (read-only)
 */
export const useAIState = () => {
  return useAIStore(
    useShallow((state) => ({
      isEnabled: state.isEnabled,
      isPaused: state.isPaused,
      isThinking: state.isThinking,
      lastDecision: state.lastDecision,
      stats: state.stats,
    })),
  );
};

/**
 * Hook for AI settings only (read-only)
 */
export const useAISettings = () => {
  return useAIStore(
    useShallow((state) => ({
      aiLevel: state.aiLevel,
      beamWidth: state.beamWidth,
      thinkingTimeLimit: state.thinkingTimeLimit,
      useHold: state.useHold,
      enableVisualization: state.enableVisualization,
      playbackSpeed: state.playbackSpeed,
    })),
  );
};

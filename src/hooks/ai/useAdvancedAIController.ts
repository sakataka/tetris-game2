import { useCallback, useEffect, useRef, useState } from "react";
import type { AISettings, AIState } from "@/components/game/AdvancedAIControls";
import {
  type AdvancedAIDecision,
  AdvancedAIEngine,
  type AdvancedAIStats,
  DEFAULT_ADVANCED_CONFIG,
} from "@/game/ai/core/advanced-ai-engine";
import type { GameAction } from "@/game/ai/core/move-generator";
import { useGameStore } from "@/store/gameStore";
import type { GameState } from "@/types/game";

/**
 * Advanced AI controller hook for enhanced AI functionality
 * Supports advanced features, visualization, and detailed analytics
 */
export function useAdvancedAIController() {
  const [aiSettings, setAiSettings] = useState<AISettings>({
    aiLevel: "advanced",
    beamWidth: 12,
    thinkingTimeLimit: 50,
    useHold: true,
    enableVisualization: true,
    playbackSpeed: 1.0,
  });

  const [aiState, setAiState] = useState<AIState>({
    isEnabled: false,
    isPaused: false,
    isThinking: false,
  });

  const [lastDecision, setLastDecision] = useState<AdvancedAIDecision | null>(null);
  const [replayData, setReplayData] = useState<{
    moves: unknown[];
    decisions: AdvancedAIDecision[];
    gameStates: GameState[];
    metadata: {
      startTime: number;
      endTime: number;
      finalScore: number;
      aiSettings: AISettings;
    };
  } | null>(null);

  // Refs to prevent useEffect re-runs
  const aiEnabledRef = useRef(false);
  const isThinkingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(false);
  const aiThinkAndMoveRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // Advanced AI engine instance
  const [aiEngine] = useState(() => {
    const config = {
      ...DEFAULT_ADVANCED_CONFIG,
      thinkingTimeLimit: aiSettings.thinkingTimeLimit,
      beamSearchConfig: {
        ...DEFAULT_ADVANCED_CONFIG.beamSearchConfig,
        beamWidth: aiSettings.beamWidth,
      },
      holdSearchOptions: {
        ...DEFAULT_ADVANCED_CONFIG.holdSearchOptions,
        allowHoldUsage: aiSettings.useHold,
      },
    };
    return new AdvancedAIEngine(config);
  });

  // Game actions
  const moveLeft = useGameStore((state) => state.moveLeft);
  const moveRight = useGameStore((state) => state.moveRight);
  const rotate = useGameStore((state) => state.rotate);
  const drop = useGameStore((state) => state.drop);

  // Find best move using advanced AI
  const findBestMoveWithAI = useCallback(
    async (gameState: GameState) => {
      try {
        const decision = await aiEngine.findBestMove(gameState);
        return decision;
      } catch (error) {
        console.error("💥 [AdvancedAI] Engine error:", error);
        return null;
      }
    },
    [aiEngine],
  );

  // Execute action sequence
  const executeActionSequence = useCallback(
    async (actions: GameAction[]) => {
      for (const action of actions) {
        if (!isActiveRef.current || !aiEnabledRef.current) {
          return;
        }

        await delay(Math.floor(200 / aiSettings.playbackSpeed));

        switch (action.type) {
          case "MOVE_LEFT":
            moveLeft();
            break;
          case "MOVE_RIGHT":
            moveRight();
            break;
          case "ROTATE_CW":
            rotate();
            break;
          case "ROTATE_180":
            rotate();
            await delay(50);
            rotate();
            break;
          case "HARD_DROP":
            drop();
            break;
          case "HOLD":
            // TODO: Implement hold action
            break;
          default:
            break;
        }
      }
    },
    [moveLeft, moveRight, rotate, drop, aiSettings.playbackSpeed],
  );

  // Main AI thinking loop
  const aiThinkAndMove = useCallback(async () => {
    const gameState = useGameStore.getState();
    const { currentPiece, isGameOver, isPaused } = gameState;

    if (
      !aiEnabledRef.current ||
      isGameOver ||
      isPaused ||
      !currentPiece ||
      isThinkingRef.current ||
      !isActiveRef.current ||
      aiState.isPaused
    ) {
      return;
    }

    isThinkingRef.current = true;
    setAiState((prev) => ({ ...prev, isThinking: true }));

    try {
      const decision = await findBestMoveWithAI(gameState);

      if (decision?.bestPath && decision.bestPath.length > 0 && isActiveRef.current) {
        setLastDecision(decision);

        // Record for replay if enabled
        if (replayData) {
          setReplayData((prev) => ({
            ...prev!,
            decisions: [...prev?.decisions, decision],
            gameStates: [...prev?.gameStates, gameState],
          }));
        }

        // Execute the first move from the best path
        if (decision.bestPath[0].sequence) {
          await executeActionSequence(decision.bestPath[0].sequence);
        }
      }
    } catch (error) {
      console.error("💥 [AdvancedAI] Thinking error:", error);
    } finally {
      if (isActiveRef.current) {
        isThinkingRef.current = false;
        setAiState((prev) => ({ ...prev, isThinking: false }));

        // Schedule next AI move
        timeoutRef.current = setTimeout(
          () => {
            if (isActiveRef.current && aiEnabledRef.current && !aiState.isPaused) {
              aiThinkAndMoveRef.current();
            }
          },
          Math.floor(200 / aiSettings.playbackSpeed),
        );
      }
    }
  }, [
    findBestMoveWithAI,
    executeActionSequence,
    aiState.isPaused,
    aiSettings.playbackSpeed,
    replayData,
  ]);

  // Update ref when aiThinkAndMove changes
  useEffect(() => {
    aiThinkAndMoveRef.current = aiThinkAndMove;
  }, [aiThinkAndMove]);

  // Start/stop AI effect
  useEffect(() => {
    aiEnabledRef.current = aiState.isEnabled;

    if (aiState.isEnabled && !aiState.isPaused) {
      const gameState = useGameStore.getState();
      if (!gameState.isGameOver && !gameState.isPaused) {
        isActiveRef.current = true;
        // Start recording for replay
        setReplayData({
          moves: [],
          decisions: [],
          gameStates: [],
          metadata: {
            startTime: Date.now(),
            endTime: 0,
            finalScore: 0,
            aiSettings,
          },
        });
        aiThinkAndMoveRef.current();
      }
    } else {
      isActiveRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      isThinkingRef.current = false;
      setAiState((prev) => ({ ...prev, isThinking: false }));

      // Finalize replay data
      if (replayData && aiState.isEnabled === false) {
        const finalGameState = useGameStore.getState();
        setReplayData((prev) => ({
          ...prev!,
          metadata: {
            ...prev?.metadata,
            endTime: Date.now(),
            finalScore: finalGameState.score,
          },
        }));
      }
    }

    return () => {
      isActiveRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [aiState.isEnabled, aiState.isPaused, aiSettings, replayData]);

  // Update AI engine configuration when settings change
  useEffect(() => {
    const config = {
      ...DEFAULT_ADVANCED_CONFIG,
      thinkingTimeLimit: aiSettings.thinkingTimeLimit,
      beamSearchConfig: {
        ...DEFAULT_ADVANCED_CONFIG.beamSearchConfig,
        beamWidth: aiSettings.beamWidth,
      },
      holdSearchOptions: {
        ...DEFAULT_ADVANCED_CONFIG.holdSearchOptions,
        allowHoldUsage: aiSettings.useHold,
      },
    };
    aiEngine.updateAdvancedConfig(config);
  }, [aiSettings, aiEngine]);

  // Action handlers
  const toggleAI = useCallback(() => {
    setAiState((prev) => ({
      ...prev,
      isEnabled: !prev.isEnabled,
      isPaused: false,
    }));

    if (!aiState.isEnabled) {
      const _gameState = useGameStore.getState();
      setLastDecision(null);
    } else {
      aiEngine.abortThinking();
    }
  }, [aiState.isEnabled, aiEngine]);

  const pauseAI = useCallback(() => {
    setAiState((prev) => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  }, []);

  const stepAI = useCallback(() => {
    if (aiState.isPaused && aiState.isEnabled) {
      aiThinkAndMoveRef.current();
    }
  }, [aiState.isPaused, aiState.isEnabled]);

  const handleSettingsChange = useCallback((newSettings: AISettings) => {
    setAiSettings(newSettings);
  }, []);

  // Get AI stats
  const aiStats: AdvancedAIStats | undefined = aiEngine.getAdvancedStats();

  return {
    aiState: {
      ...aiState,
      lastDecision,
      stats: aiStats,
    },
    aiSettings,
    lastDecision,
    replayData,
    onToggleAI: toggleAI,
    onPause: pauseAI,
    onStep: stepAI,
    onSettingsChange: handleSettingsChange,
  };
}

/**
 * Simple delay utility
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

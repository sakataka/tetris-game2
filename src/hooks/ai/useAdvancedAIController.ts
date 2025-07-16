import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AISettings, AIState } from "@/components/game/AdvancedAIControls";
import { useAIStore } from "@/features/ai-control/model/aiSlice";
import { useGamePlayStore } from "@/features/game-play/model/gamePlaySlice";
import { useScoringStore } from "@/features/scoring/model/scoringSlice";
import {
  type AdvancedAIDecision,
  AdvancedAIEngine,
  type AdvancedAIStats,
  DEFAULT_ADVANCED_CONFIG,
} from "@/game/ai/core/advanced-ai-engine";
import type { GameAction, Move } from "@/game/ai/core/move-generator";
import type { GameState } from "@/types/game";

/**
 * Advanced AI controller hook for enhanced AI functionality
 * Supports advanced features, visualization, and detailed analytics
 */
export function useAdvancedAIController() {
  // Use the new AI store for state management
  const aiStore = useAIStore();
  const {
    isEnabled,
    isPaused,
    isThinking,
    aiLevel,
    beamWidth,
    thinkingTimeLimit,
    useHold,
    enableVisualization,
    playbackSpeed,
    lastDecision,
    stats,
  } = aiStore;

  // Stable wrapper for setThinking to prevent useEffect dependency issues
  const setThinkingRef = useRef(aiStore.setThinking);
  setThinkingRef.current = aiStore.setThinking;

  const setThinking = useCallback(
    (thinking: boolean) => {
      setThinkingRef.current(thinking);
    },
    [], // Empty dependency array to prevent re-creation
  );

  // Stable refs for other store methods
  const aiStoreRef = useRef(aiStore);
  aiStoreRef.current = aiStore;

  // Create AI settings object for compatibility
  const aiSettings: AISettings = useMemo(
    () => ({
      aiLevel,
      beamWidth,
      thinkingTimeLimit,
      useHold,
      enableVisualization,
      playbackSpeed,
    }),
    [aiLevel, beamWidth, thinkingTimeLimit, useHold, enableVisualization, playbackSpeed],
  );

  // Create AI state object for compatibility
  const aiState: AIState = useMemo(
    () => ({
      isEnabled,
      isPaused,
      isThinking,
    }),
    [isEnabled, isPaused, isThinking],
  );

  const [replayData, setReplayData] = useState<{
    moves: Move[];
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
  const aiPausedRef = useRef(false);
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

  // Game actions from the new gamePlay store
  const moveLeft = useGamePlayStore((state) => state.moveLeft);
  const moveRight = useGamePlayStore((state) => state.moveRight);
  const rotate = useGamePlayStore((state) => state.rotateClockwise);
  const drop = useGamePlayStore((state) => state.hardDrop);
  const holdPiece = useGamePlayStore((state) => state.holdPiece);

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
        // Check if AI is still active and game is playable before each action
        const currentState = useGamePlayStore.getState();
        if (
          !isActiveRef.current ||
          !aiEnabledRef.current ||
          currentState.isGameOver ||
          currentState.isPaused ||
          !currentState.currentPiece ||
          currentState.animationState !== "idle"
        ) {
          return;
        }

        await delay(Math.floor(150 / aiSettings.playbackSpeed)); // Faster execution

        // Double-check state after delay
        const stateAfterDelay = useGamePlayStore.getState();
        if (
          !isActiveRef.current ||
          !aiEnabledRef.current ||
          stateAfterDelay.isGameOver ||
          stateAfterDelay.isPaused ||
          !stateAfterDelay.currentPiece ||
          stateAfterDelay.animationState !== "idle"
        ) {
          return;
        }

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
            // After hard drop, the piece locks and new piece spawns
            // Wait a bit to ensure the new piece is properly spawned
            await delay(100);
            break;
          case "HOLD":
            holdPiece();
            await delay(100);
            break;
          default:
            break;
        }
      }
    },
    [moveLeft, moveRight, rotate, drop, holdPiece, aiSettings.playbackSpeed],
  );

  // Main AI thinking loop
  const aiThinkAndMove = useCallback(async () => {
    // Get fresh game state at the start of each iteration
    const gamePlayState = useGamePlayStore.getState();
    const scoringState = useScoringStore.getState();

    // Create compatible game state for AI
    const gameState = {
      ...gamePlayState,
      ...scoringState,
      nextPiece: gamePlayState.nextPieces[0] || null,
      floatingScoreEvents: gamePlayState.floatingScoreEvents, // Use gamePlay store's floatingScoreEvents
    };

    const { currentPiece, isGameOver, isPaused } = gamePlayState;

    if (
      !aiEnabledRef.current ||
      aiPausedRef.current ||
      isGameOver ||
      isPaused ||
      !currentPiece ||
      isThinkingRef.current ||
      !isActiveRef.current
    ) {
      return;
    }

    // Check if animations are running (AI should not act during animations)
    if (gameState.animationState !== "idle") {
      // Schedule retry after animation might be complete
      timeoutRef.current = setTimeout(
        () => {
          if (isActiveRef.current && aiEnabledRef.current && !aiPausedRef.current) {
            aiThinkAndMoveRef.current();
          }
        },
        50, // Short delay to check animation state again
      );
      return;
    }

    isThinkingRef.current = true;
    setThinking(true);

    try {
      const decision = await findBestMoveWithAI(gameState);

      // Re-check game state after AI thinking (state might have changed)
      const currentGameState = useGamePlayStore.getState();
      if (
        !isActiveRef.current ||
        currentGameState.isGameOver ||
        currentGameState.isPaused ||
        !currentGameState.currentPiece ||
        currentGameState.animationState !== "idle"
      ) {
        return;
      }

      if (decision) {
        console.log("🧠 [AdvancedAI] Decision made:", {
          bestPath: decision.bestPath?.length || 0,
          bestScore: decision.bestScore,
          nodesExplored: decision.nodesExplored,
          hasSequence: decision.bestPath?.[0]?.sequence?.length || 0,
        });

        aiStoreRef.current.setLastDecision(decision);

        // Record for replay if enabled (use callback to avoid dependency issues)
        setReplayData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            decisions: [...(prev.decisions || []), decision],
            gameStates: [...(prev.gameStates || []), gameState],
          };
        });

        // Execute the first move from the best path if available
        if (decision.bestPath && decision.bestPath.length > 0 && decision.bestPath[0].sequence) {
          console.log("🎯 [AdvancedAI] Executing move:", decision.bestPath[0].sequence);
          await executeActionSequence(decision.bestPath[0].sequence);
        } else {
          console.warn("⚠️ [AdvancedAI] No moves to execute");
        }
      } else {
        console.warn("⚠️ [AdvancedAI] No decision returned");
      }
    } catch (error) {
      console.error("💥 [AdvancedAI] Thinking error:", error);
    } finally {
      if (isActiveRef.current) {
        isThinkingRef.current = false;
        setThinking(false);

        // Schedule next AI move with fresh state check
        timeoutRef.current = setTimeout(
          () => {
            const nextGameState = useGamePlayStore.getState();
            if (
              isActiveRef.current &&
              aiEnabledRef.current &&
              !aiPausedRef.current &&
              !nextGameState.isGameOver &&
              !nextGameState.isPaused &&
              nextGameState.currentPiece &&
              nextGameState.animationState === "idle"
            ) {
              aiThinkAndMoveRef.current();
            }
          },
          Math.floor(120 / aiSettings.playbackSpeed), // Faster AI thinking cycle
        );
      }
    }
  }, [findBestMoveWithAI, executeActionSequence, aiSettings.playbackSpeed, setThinking]);

  // Update ref when aiThinkAndMove changes
  useEffect(() => {
    aiThinkAndMoveRef.current = aiThinkAndMove;
  }, [aiThinkAndMove]);

  // Sync AI state to refs for stable references
  useEffect(() => {
    aiEnabledRef.current = isEnabled;
    aiPausedRef.current = isPaused;
  }, [isEnabled, isPaused]);

  // Handle AI activation (when enabled and not paused)
  useEffect(() => {
    if (isEnabled && !isPaused) {
      const gameState = useGamePlayStore.getState();

      if (!gameState.isGameOver && !gameState.isPaused && gameState.animationState === "idle") {
        isActiveRef.current = true;

        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        // Reset thinking state
        isThinkingRef.current = false;
        setThinking(false);

        // Use setTimeout to ensure aiThinkAndMoveRef is properly set
        setTimeout(() => {
          // Double-check state before starting AI loop
          const currentState = useGamePlayStore.getState();
          if (
            aiEnabledRef.current &&
            !aiPausedRef.current &&
            !currentState.isGameOver &&
            !currentState.isPaused &&
            currentState.animationState === "idle" &&
            isActiveRef.current
          ) {
            aiThinkAndMoveRef.current();
          }
        }, 100);
      }
    }
  }, [isEnabled, isPaused, setThinking]);

  // Handle AI deactivation (when disabled or paused)
  useEffect(() => {
    if (!isEnabled || isPaused) {
      isActiveRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      isThinkingRef.current = false;
      setThinking(false);
    }
  }, [isEnabled, isPaused, setThinking]);

  // Handle replay data recording lifecycle
  useEffect(() => {
    if (isEnabled && !isPaused) {
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
    } else if (!isEnabled) {
      // Finalize replay data when AI is disabled
      const finalGameState = useGamePlayStore.getState();
      setReplayData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          metadata: {
            ...prev.metadata,
            endTime: Date.now(),
            finalScore: finalGameState.score,
          },
        };
      });
    }
  }, [isEnabled, isPaused, aiSettings]);

  // Global cleanup effect
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      isThinkingRef.current = false;
    };
  }, []);

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
    aiStoreRef.current.setEnabled(!isEnabled);
    aiStoreRef.current.setPaused(false);

    if (!isEnabled) {
      aiStoreRef.current.setLastDecision(null);
    } else {
      aiEngine.abortThinking();
    }
  }, [isEnabled, aiEngine]);

  const pauseAI = useCallback(() => {
    aiStoreRef.current.setPaused(!isPaused);
  }, [isPaused]);

  const stepAI = useCallback(() => {
    if (isPaused && isEnabled) {
      aiThinkAndMoveRef.current();
    }
  }, [isPaused, isEnabled]);

  const handleSettingsChange = useCallback((newSettings: AISettings) => {
    aiStoreRef.current.updateSettings(newSettings);
  }, []);

  // Get AI stats
  const aiStats: AdvancedAIStats | undefined = aiEngine.getAdvancedStats();

  return {
    aiState: {
      ...aiState,
      lastDecision: lastDecision,
      stats: aiStats || stats,
    },
    aiSettings,
    lastDecision: lastDecision,
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

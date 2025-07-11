import { useCallback, useEffect, useRef, useState } from "react";
import type { AISettings, AIState } from "@/components/game/AdvancedAIControls";
import {
  type AdvancedAIDecision,
  AdvancedAIEngine,
  type AdvancedAIStats,
  DEFAULT_ADVANCED_CONFIG,
} from "@/game/ai/core/advanced-ai-engine";
import type { GameAction, Move } from "@/game/ai/core/move-generator";
import { useGameStore } from "@/store/gameStore";
import type { GameState } from "@/types/game";

/**
 * Advanced AI controller hook for enhanced AI functionality
 * Supports advanced features, visualization, and detailed analytics
 */
export function useAdvancedAIController() {
  const [aiSettings, setAiSettings] = useState<AISettings>({
    aiLevel: "advanced",
    beamWidth: 16, // Increased for better line clearing opportunities
    thinkingTimeLimit: 80, // Increased for deeper search
    useHold: true,
    enableVisualization: true,
    playbackSpeed: 1.2, // Slightly faster for more aggressive gameplay
  });

  const [aiState, setAiState] = useState<AIState>({
    isEnabled: false,
    isPaused: false,
    isThinking: false,
  });

  const [lastDecision, setLastDecision] = useState<AdvancedAIDecision | null>(null);
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

  // Game actions
  const moveLeft = useGameStore((state) => state.moveLeft);
  const moveRight = useGameStore((state) => state.moveRight);
  const rotate = useGameStore((state) => state.rotate);
  const drop = useGameStore((state) => state.drop);
  const holdPiece = useGameStore((state) => state.holdPiece);

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
        const currentState = useGameStore.getState();
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
        const stateAfterDelay = useGameStore.getState();
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
    const gameState = useGameStore.getState();
    const { currentPiece, isGameOver, isPaused } = gameState;

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
    setAiState((prev) => ({ ...prev, isThinking: true }));

    try {
      const decision = await findBestMoveWithAI(gameState);

      // Re-check game state after AI thinking (state might have changed)
      const currentGameState = useGameStore.getState();
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

        setLastDecision(decision);

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
        setAiState((prev) => ({ ...prev, isThinking: false }));

        // Schedule next AI move with fresh state check
        timeoutRef.current = setTimeout(
          () => {
            const nextGameState = useGameStore.getState();
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
  }, [findBestMoveWithAI, executeActionSequence, aiSettings.playbackSpeed]);

  // Update ref when aiThinkAndMove changes
  useEffect(() => {
    aiThinkAndMoveRef.current = aiThinkAndMove;
  }, [aiThinkAndMove]);

  // Sync AI state to refs for stable references
  useEffect(() => {
    aiEnabledRef.current = aiState.isEnabled;
    aiPausedRef.current = aiState.isPaused;
  }, [aiState.isEnabled, aiState.isPaused]);

  // Handle AI activation (when enabled and not paused)
  useEffect(() => {
    if (aiState.isEnabled && !aiState.isPaused) {
      const gameState = useGameStore.getState();

      if (!gameState.isGameOver && !gameState.isPaused && gameState.animationState === "idle") {
        isActiveRef.current = true;

        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        // Reset thinking state
        isThinkingRef.current = false;
        setAiState((prev) => ({ ...prev, isThinking: false }));

        // Use setTimeout to ensure aiThinkAndMoveRef is properly set
        setTimeout(() => {
          // Double-check state before starting AI loop
          const currentState = useGameStore.getState();
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
  }, [aiState.isEnabled, aiState.isPaused]);

  // Handle AI deactivation (when disabled or paused)
  useEffect(() => {
    if (!aiState.isEnabled || aiState.isPaused) {
      isActiveRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      isThinkingRef.current = false;
      setAiState((prev) => ({ ...prev, isThinking: false }));
    }
  }, [aiState.isEnabled, aiState.isPaused]);

  // Handle replay data recording lifecycle
  useEffect(() => {
    if (aiState.isEnabled && !aiState.isPaused) {
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
    } else if (!aiState.isEnabled) {
      // Finalize replay data when AI is disabled
      const finalGameState = useGameStore.getState();
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
  }, [aiState.isEnabled, aiState.isPaused, aiSettings]);

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
    setAiState((prev) => ({
      ...prev,
      isEnabled: !prev.isEnabled,
      isPaused: false,
    }));

    if (!aiState.isEnabled) {
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

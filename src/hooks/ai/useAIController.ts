import { useCallback, useEffect, useRef, useState } from "react";
import { AIEngine } from "@/game/ai/core/ai-engine";
import type { GameAction } from "@/game/ai/core/move-generator";
import { useGameStore } from "@/store/gameStore";
import type { GameState } from "@/types/game";

export interface AIStats {
  movesPlayed: number;
  avgThinkTime: number;
  lastScore: number;
  timeoutCount: number;
  evaluationCount: number;
  bestMoveScore: number;
}

/**
 * Custom hook for AI controller that manages continuous AI gameplay
 * Isolated from React render cycles to prevent useEffect dependency issues
 */
export function useAIController() {
  const [aiEnabled, setAiEnabled] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [aiStats, setAiStats] = useState<AIStats>({
    movesPlayed: 0,
    avgThinkTime: 0,
    lastScore: 0,
    timeoutCount: 0,
    evaluationCount: 0,
    bestMoveScore: Number.NEGATIVE_INFINITY,
  });

  // Refs to prevent useEffect re-runs
  const aiEnabledRef = useRef(false);
  const isThinkingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(false);
  const aiThinkAndMoveRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // AI system instances (stable references)
  const [aiEngine] = useState(
    () =>
      new AIEngine({
        thinkingTimeLimit: 200,
        evaluator: "dellacherie",
        enableLogging: false, // Disable verbose logging for production
        fallbackOnTimeout: true,
        useDynamicWeights: true,
      }),
  );

  // Game actions
  const moveLeft = useGameStore((state) => state.moveLeft);
  const moveRight = useGameStore((state) => state.moveRight);
  const rotate = useGameStore((state) => state.rotate);
  const drop = useGameStore((state) => state.drop);

  // AI decision making using comprehensive AI engine
  const findBestMoveWithAI = useCallback(
    async (gameState: GameState) => {
      try {
        const decision = await aiEngine.findBestMove(gameState);
        return decision;
      } catch (error) {
        console.error("💥 [AI] Engine error:", error);
        return null;
      }
    },
    [aiEngine],
  );

  // Execute action sequence from AI decision
  const executeActionSequence = useCallback(
    async (actions: GameAction[]) => {
      for (const action of actions) {
        // Check if AI is still active before each action
        if (!isActiveRef.current || !aiEnabledRef.current) {
          return;
        }

        await delay(50); // Small delay between actions for visual feedback

        switch (action.type) {
          case "MOVE_LEFT":
            moveLeft();
            break;
          case "MOVE_RIGHT":
            moveRight();
            break;
          case "MOVE_DOWN":
            // Note: moveDown not used in optimal play, only for manual input
            break;
          case "ROTATE_CW":
            rotate();
            break;
          case "ROTATE_180":
            // Note: rotate180 not implemented in move generator yet
            rotate();
            await delay(50);
            rotate();
            break;
          case "HARD_DROP":
            drop();
            break;
          case "HOLD":
            // Note: Hold not enabled in Phase 1
            break;
          default:
            break;
        }
      }
    },
    [moveLeft, moveRight, rotate, drop],
  );

  // Main AI thinking loop - completely isolated from React dependencies
  const aiThinkAndMove = useCallback(async () => {
    // Always get fresh state directly from store
    const gameState = useGameStore.getState();
    const { currentPiece, isGameOver, isPaused, score } = gameState;

    if (
      !aiEnabledRef.current ||
      isGameOver ||
      isPaused ||
      !currentPiece ||
      isThinkingRef.current ||
      !isActiveRef.current
    ) {
      return;
    }

    isThinkingRef.current = true;
    setIsThinking(true);
    const thinkStartTime = performance.now();

    try {
      // Use comprehensive AI engine for decision making
      const decision = await findBestMoveWithAI(gameState);

      if (decision?.bestMove && isActiveRef.current) {
        await executeActionSequence(decision.bestMove.sequence);

        // Update AI stats with detailed metrics
        const thinkTime = performance.now() - thinkStartTime;
        setAiStats((prev) => ({
          movesPlayed: prev.movesPlayed + 1,
          avgThinkTime: (prev.avgThinkTime * prev.movesPlayed + thinkTime) / (prev.movesPlayed + 1),
          lastScore: score,
          timeoutCount: prev.timeoutCount + (decision.timedOut ? 1 : 0),
          evaluationCount: prev.evaluationCount + decision.evaluationCount,
          bestMoveScore: Math.max(
            prev.bestMoveScore,
            decision.bestMove?.evaluationScore || Number.NEGATIVE_INFINITY,
          ),
        }));
      }
    } catch (error) {
      console.error("💥 [AI] Thinking error:", error);
    } finally {
      if (isActiveRef.current) {
        isThinkingRef.current = false;
        setIsThinking(false);

        // Schedule next AI move
        timeoutRef.current = setTimeout(() => {
          if (isActiveRef.current && aiEnabledRef.current) {
            aiThinkAndMoveRef.current();
          }
        }, 200);
      }
    }
  }, [findBestMoveWithAI, executeActionSequence]);

  // Update ref when aiThinkAndMove changes
  useEffect(() => {
    aiThinkAndMoveRef.current = aiThinkAndMove;
  }, [aiThinkAndMove]);

  // Start/stop AI effect - minimal dependencies
  useEffect(() => {
    aiEnabledRef.current = aiEnabled;

    if (aiEnabled) {
      const gameState = useGameStore.getState();
      if (!gameState.isGameOver && !gameState.isPaused) {
        isActiveRef.current = true;
        // Use ref to call latest version of aiThinkAndMove
        aiThinkAndMoveRef.current();
      }
    } else {
      isActiveRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      isThinkingRef.current = false;
      setIsThinking(false);
    }

    return () => {
      isActiveRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [aiEnabled]); // Removed aiThinkAndMove from dependencies

  const toggleAI = useCallback(() => {
    const gameState = useGameStore.getState();
    setAiEnabled((prev) => {
      const newEnabled = !prev;
      if (newEnabled) {
        // Reset AI stats when enabling
        setAiStats({
          movesPlayed: 0,
          avgThinkTime: 0,
          lastScore: gameState.score,
          timeoutCount: 0,
          evaluationCount: 0,
          bestMoveScore: Number.NEGATIVE_INFINITY,
        });
        // Reset AI engine stats as well
        aiEngine.resetStats();
      } else {
        // Abort any ongoing thinking when disabling
        aiEngine.abortThinking();
      }
      return newEnabled;
    });
  }, [aiEngine]);

  return {
    aiEnabled,
    isThinking,
    aiStats,
    toggleAI,
  };
}

/**
 * Simple delay utility for move execution timing
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

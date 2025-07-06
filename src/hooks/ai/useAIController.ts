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

  // AI system instances (stable references)
  const [aiEngine] = useState(
    () =>
      new AIEngine({
        thinkingTimeLimit: 200,
        evaluator: "dellacherie",
        enableLogging: true,
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
      console.log("🤖 [AI] Executing action sequence:", actions);

      for (const action of actions) {
        // Check if AI is still active before each action
        if (!isActiveRef.current || !aiEnabledRef.current) {
          console.log("⏹️ [AI] Action sequence aborted - AI disabled");
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
            console.warn("[AI] Hold action not supported in Phase 1");
            break;
          default:
            console.warn("[AI] Unknown action type:", action.type);
        }
      }

      console.log("✅ [AI] Action sequence completed!");
    },
    [moveLeft, moveRight, rotate, drop],
  );

  // Main AI thinking loop - completely isolated from React dependencies
  const aiThinkAndMove = useCallback(async () => {
    // Always get fresh state directly from store
    const gameState = useGameStore.getState();
    const { currentPiece, isGameOver, isPaused, score } = gameState;

    console.log("🔄 [AI] Loop check:", {
      aiEnabled: aiEnabledRef.current,
      isGameOver,
      isPaused,
      currentPiece: currentPiece?.type,
      isThinking: isThinkingRef.current,
    });

    if (
      !aiEnabledRef.current ||
      isGameOver ||
      isPaused ||
      !currentPiece ||
      isThinkingRef.current ||
      !isActiveRef.current
    ) {
      console.log("❌ [AI] Loop stopped due to condition check");
      return;
    }

    isThinkingRef.current = true;
    setIsThinking(true);
    const thinkStartTime = performance.now();

    try {
      console.log("🧠 [AI] Starting to think...", {
        currentPiece: currentPiece.type,
        position: currentPiece.position,
        rotation: currentPiece.rotation,
      });

      // Use comprehensive AI engine for decision making
      console.log("🔍 [AI] Finding best move with AI engine...");
      const decision = await findBestMoveWithAI(gameState);
      console.log("🎯 [AI] AI decision:", decision);

      if (decision?.bestMove && isActiveRef.current) {
        console.log("▶️ [AI] Executing best move sequence...");
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
        console.log("📊 [AI] Stats updated:", {
          thinkTime: `${thinkTime}ms`,
          timedOut: decision.timedOut,
          evaluations: decision.evaluationCount,
          score: decision.bestMove?.evaluationScore?.toFixed(2),
        });
      } else {
        console.log("❌ [AI] No valid move found or AI inactive");
      }
    } catch (error) {
      console.error("💥 [AI] Thinking error:", error);
    } finally {
      if (isActiveRef.current) {
        isThinkingRef.current = false;
        setIsThinking(false);

        // Schedule next AI move
        console.log("⏰ [AI] Scheduling next move in 200ms...");
        timeoutRef.current = setTimeout(() => {
          console.log("⏰ [AI] Timeout triggered, checking conditions:", {
            isActive: isActiveRef.current,
            aiEnabled: aiEnabledRef.current,
          });
          if (isActiveRef.current && aiEnabledRef.current) {
            console.log("▶️ [AI] Starting next iteration...");
            aiThinkAndMove();
          } else {
            console.log("⏹️ [AI] Timeout conditions failed, stopping");
          }
        }, 200);
      }
    }
  }, [findBestMoveWithAI, executeActionSequence]);

  // Start/stop AI effect - minimal dependencies
  useEffect(() => {
    aiEnabledRef.current = aiEnabled;

    if (aiEnabled) {
      const gameState = useGameStore.getState();
      if (!gameState.isGameOver && !gameState.isPaused) {
        isActiveRef.current = true;
        console.log("🚀 [AI] Starting AI controller...");
        aiThinkAndMove();
      }
    } else {
      isActiveRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      isThinkingRef.current = false;
      setIsThinking(false);
      console.log("🛑 [AI] Stopping AI controller...");
    }

    return () => {
      isActiveRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [aiEnabled, aiThinkAndMove]);

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

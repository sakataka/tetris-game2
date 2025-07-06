import { useCallback, useEffect, useRef, useState } from "react";
import { BitBoard } from "@/game/ai/core/bitboard";
import {
  createMove,
  DellacherieEvaluator,
  findDropPosition,
} from "@/game/ai/evaluators/dellacherie";
import { DynamicWeights } from "@/game/ai/evaluators/weights";
import { useGameStore } from "@/store/gameStore";
import type { RotationState, TetrominoTypeName } from "@/types/game";

export interface AIStats {
  movesPlayed: number;
  avgThinkTime: number;
  lastScore: number;
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
  });

  // Refs to prevent useEffect re-runs
  const aiEnabledRef = useRef(false);
  const isThinkingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(false);

  // AI system instances (stable references)
  const [evaluator] = useState(() => new DellacherieEvaluator());
  const [dynamicWeights] = useState(() => new DynamicWeights());

  // Game actions
  const moveLeft = useGameStore((state) => state.moveLeft);
  const moveRight = useGameStore((state) => state.moveRight);
  const rotate = useGameStore((state) => state.rotate);
  const drop = useGameStore((state) => state.drop);

  // Simple move generation
  const findBestMove = useCallback(
    async (bitBoard: BitBoard, piece: TetrominoTypeName) => {
      let bestScore = Number.NEGATIVE_INFINITY;
      let bestMove = null;

      for (let rotation = 0; rotation < 4; rotation++) {
        for (let x = 0; x < 8; x++) {
          const dropY = findDropPosition(bitBoard, piece, rotation as RotationState, x);

          if (dropY >= 0) {
            const move = createMove(piece, rotation as RotationState, x, dropY);
            const score = evaluator.evaluate(bitBoard, move);

            if (score > bestScore) {
              bestScore = score;
              bestMove = {
                piece,
                rotation: rotation as RotationState,
                x,
                y: dropY,
                score,
              };
            }
          }
        }
      }

      return bestMove;
    },
    [evaluator],
  );

  // Execute move sequence
  const executeMoveSequence = useCallback(
    async (targetMove: {
      piece: TetrominoTypeName;
      rotation: RotationState;
      x: number;
      y: number;
      score: number;
    }) => {
      const gameState = useGameStore.getState();
      const currentPiece = gameState.currentPiece;
      if (!currentPiece) return;

      const currentX = currentPiece.position.x;
      const currentRotation = currentPiece.rotation;

      console.log("🤖 [AI] Executing move:", {
        from: { x: currentX, rotation: currentRotation },
        to: { x: targetMove.x, rotation: targetMove.rotation },
        piece: targetMove.piece,
        score: targetMove.score,
      });

      // Rotate to target rotation
      let rotationsNeeded = (targetMove.rotation - currentRotation + 4) % 4;
      while (rotationsNeeded > 0) {
        await delay(50);
        rotate();
        rotationsNeeded--;
      }

      // Move to target X position
      const moveSteps = targetMove.x - currentX;
      if (moveSteps > 0) {
        for (let i = 0; i < moveSteps; i++) {
          await delay(50);
          moveRight();
        }
      } else if (moveSteps < 0) {
        for (let i = 0; i < Math.abs(moveSteps); i++) {
          await delay(50);
          moveLeft();
        }
      }

      // Hard drop to target position
      await delay(50);
      drop();
      console.log("✅ [AI] Move sequence completed!");
    },
    [rotate, moveLeft, moveRight, drop],
  );

  // Main AI thinking loop - completely isolated from React dependencies
  const aiThinkAndMove = useCallback(async () => {
    // Always get fresh state directly from store
    const gameState = useGameStore.getState();
    const { currentPiece, board, lines, level, score, isGameOver, isPaused } = gameState;

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

      // Convert current board to BitBoard for AI evaluation
      const bitBoard = new BitBoard(board);
      console.log("📋 [AI] BitBoard created successfully");

      // Analyze current situation for dynamic weights
      const situation = dynamicWeights.analyzeSituation(bitBoard, lines, level);
      const adjustedWeights = dynamicWeights.adjustWeights(situation);
      evaluator.updateWeights(adjustedWeights);
      console.log("⚖️ [AI] Weights adjusted:", adjustedWeights);

      // Generate and evaluate all possible moves
      console.log("🔍 [AI] Finding best move...");
      const bestMove = await findBestMove(bitBoard, currentPiece.type);
      console.log("🎯 [AI] Best move found:", bestMove);

      if (bestMove && isActiveRef.current) {
        console.log("▶️ [AI] Executing best move...");
        await executeMoveSequence(bestMove);

        // Update AI stats
        const thinkTime = performance.now() - thinkStartTime;
        setAiStats((prev) => ({
          movesPlayed: prev.movesPlayed + 1,
          avgThinkTime: (prev.avgThinkTime * prev.movesPlayed + thinkTime) / (prev.movesPlayed + 1),
          lastScore: score,
        }));
        console.log("📊 [AI] Stats updated, think time:", `${thinkTime}ms`);
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
  }, [findBestMove, executeMoveSequence, evaluator, dynamicWeights]);

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
        setAiStats({ movesPlayed: 0, avgThinkTime: 0, lastScore: gameState.score });
      }
      return newEnabled;
    });
  }, []);

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

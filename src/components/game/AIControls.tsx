import { Brain, Pause, Play, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BitBoard } from "@/game/ai/core/bitboard";
import {
  createMove,
  DellacherieEvaluator,
  findDropPosition,
} from "@/game/ai/evaluators/dellacherie";
import { DynamicWeights } from "@/game/ai/evaluators/weights";
import { useGameStore } from "@/store/gameStore";
import type { RotationState, TetrominoTypeName } from "@/types/game";
import { CARD_STYLES } from "@/utils/styles";

/**
 * AI Controls component for enabling/disabling AI gameplay
 * Provides minimal UI integration for Week 2 browser demonstration
 */
export function AIControls() {
  const { t } = useTranslation();
  const [aiEnabled, setAiEnabled] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [aiStats, setAiStats] = useState({
    movesPlayed: 0,
    avgThinkTime: 0,
    lastScore: 0,
  });

  // Game state selectors (using individual selectors for Zustand v5 compliance)
  const isGameOver = useGameStore((state) => state.isGameOver);
  const isPaused = useGameStore((state) => state.isPaused);
  const board = useGameStore((state) => state.board);
  const currentPiece = useGameStore((state) => state.currentPiece);
  const score = useGameStore((state) => state.score);
  const level = useGameStore((state) => state.level);
  const lines = useGameStore((state) => state.lines);

  // Game actions
  const moveLeft = useGameStore((state) => state.moveLeft);
  const moveRight = useGameStore((state) => state.moveRight);
  const rotate = useGameStore((state) => state.rotate);
  const drop = useGameStore((state) => state.drop);

  // AI system instances
  const [evaluator] = useState(() => new DellacherieEvaluator());
  const [dynamicWeights] = useState(() => new DynamicWeights());

  // Simple move generation for Phase 1 (will be enhanced in Issue #3)
  const findBestMove = useCallback(
    async (bitBoard: BitBoard, piece: TetrominoTypeName) => {
      let bestScore = Number.NEGATIVE_INFINITY;
      let bestMove = null;

      // Try all 4 rotations
      for (let rotation = 0; rotation < 4; rotation++) {
        // Try all possible X positions
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

  // Execute move sequence to reach target position
  const executeMoveSequence = useCallback(
    async (targetMove: {
      piece: TetrominoTypeName;
      rotation: RotationState;
      x: number;
      y: number;
      score: number;
    }) => {
      const currentX = currentPiece?.position.x ?? 0;
      const currentRotation = currentPiece?.rotation ?? 0;

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
    },
    [currentPiece, rotate, moveLeft, moveRight, drop],
  );

  // AI thinking loop with proper cleanup
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let isActive = true;

    async function aiThinkAndMove() {
      if (!aiEnabled || isGameOver || isPaused || !currentPiece || isThinking) {
        return;
      }

      setIsThinking(true);
      const thinkStartTime = performance.now();

      try {
        // Convert current board to BitBoard for AI evaluation
        const bitBoard = new BitBoard(board);

        // Analyze current situation for dynamic weights
        const situation = dynamicWeights.analyzeSituation(bitBoard, lines, level);
        const adjustedWeights = dynamicWeights.adjustWeights(situation);
        evaluator.updateWeights(adjustedWeights);

        // Generate and evaluate all possible moves (simplified for Phase 1)
        const bestMove = await findBestMove(bitBoard, currentPiece.type);

        if (bestMove && isActive) {
          // Execute the best move found
          await executeMoveSequence(bestMove);

          // Update AI stats
          const thinkTime = performance.now() - thinkStartTime;
          setAiStats((prev) => ({
            movesPlayed: prev.movesPlayed + 1,
            avgThinkTime:
              (prev.avgThinkTime * prev.movesPlayed + thinkTime) / (prev.movesPlayed + 1),
            lastScore: score,
          }));
        }
      } catch (error) {
        console.error("AI thinking error:", error);
      } finally {
        if (isActive) {
          setIsThinking(false);

          // Schedule next AI move with delay for demonstration purposes
          timeoutId = setTimeout(() => {
            if (isActive && aiEnabled) {
              aiThinkAndMove();
            }
          }, 200); // 200ms delay for visible AI decision-making
        }
      }
    }

    if (aiEnabled && !isGameOver && !isPaused) {
      aiThinkAndMove();
    }

    return () => {
      isActive = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [
    aiEnabled,
    isGameOver,
    isPaused,
    currentPiece,
    board,
    isThinking,
    lines,
    level,
    score,
    evaluator,
    dynamicWeights,
    findBestMove,
    executeMoveSequence,
  ]);

  const toggleAI = useCallback(() => {
    setAiEnabled((prev) => !prev);

    if (!aiEnabled) {
      setAiStats({ movesPlayed: 0, avgThinkTime: 0, lastScore: score });
    }
  }, [aiEnabled, score]);

  const canRunAI = !isGameOver && !isPaused && currentPiece;

  return (
    <Card className={`${CARD_STYLES.base} ${CARD_STYLES.hover} ${CARD_STYLES.interactive}`}>
      <CardHeader>
        <CardTitle className="text-base font-bold text-gray-300 text-center flex items-center justify-center gap-2">
          <Brain className="w-4 h-4" />
          {t("game.ai.title", "AI Controls")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* AI Toggle Button */}
        <Button
          onClick={toggleAI}
          disabled={!canRunAI && !aiEnabled}
          variant={aiEnabled ? "destructive" : "default"}
          className="w-full text-sm"
        >
          {aiEnabled ? (
            <>
              <Pause className="w-4 h-4 mr-2" />
              {t("game.ai.stop", "Stop AI")}
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              {t("game.ai.start", "Start AI")}
            </>
          )}
        </Button>

        {/* AI Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">{t("game.ai.status", "Status")}:</span>
          <Badge
            variant={aiEnabled ? "default" : "outline"}
            className={aiEnabled ? "bg-green-600 text-white" : "border-gray-600 text-gray-400"}
          >
            {isThinking ? (
              <>
                <Zap className="w-3 h-3 mr-1 animate-pulse" />
                {t("game.ai.thinking", "Thinking")}
              </>
            ) : aiEnabled ? (
              t("game.ai.active", "Active")
            ) : (
              t("game.ai.inactive", "Inactive")
            )}
          </Badge>
        </div>

        {/* AI Statistics (only show when AI has been active) */}
        {aiStats.movesPlayed > 0 && (
          <div className="space-y-2 pt-2 border-t border-gray-700">
            <div className="text-xs text-gray-400 text-center">
              {t("game.ai.stats", "AI Statistics")}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-gray-400">{t("game.ai.moves", "Moves")}:</div>
              <div className="text-right text-gray-300">{aiStats.movesPlayed}</div>
              <div className="text-gray-400">{t("game.ai.avgTime", "Avg Time")}:</div>
              <div className="text-right text-gray-300">{aiStats.avgThinkTime.toFixed(1)}ms</div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-700">
          {aiEnabled
            ? t("game.ai.helpActive", "AI is playing automatically")
            : t("game.ai.helpInactive", "Click to enable AI auto-play")}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Simple delay utility for move execution timing
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

import { useCallback, useEffect, useRef } from "react";
import { gameEngineAdapter } from "@/features/game-play/api/gameEngineAdapter";
import { useGamePlayStore } from "@/features/game-play/model/gamePlaySlice";
import type { GameState } from "@/game/ai";
import { createSimpleAI, type SimpleAI } from "@/game/ai";
import { aiLogger } from "@/shared/utils/debugLogger";
import { useSimpleAIStore } from "../model/simpleAISlice";

/**
 * シンプルAIコントローラー
 */
export function useSimpleAI() {
  const aiRef = useRef<SimpleAI>(createSimpleAI());
  const { isEnabled } = useSimpleAIStore();
  const { board, currentPiece, isPlaying, isGameOver } = useGamePlayStore();

  const makeAIMove = useCallback(() => {
    if (!isEnabled || !isPlaying || isGameOver || !currentPiece) {
      return;
    }

    // AIには最小限の情報だけを渡す
    const simpleGameState = {
      board,
      currentPiece,
      nextPiece: "I" as const,
      heldPiece: null,
      isGameOver,
      score: 0,
      lines: 0,
      level: 1,
    };

    const bestMove = aiRef.current.findBestMove(simpleGameState as GameState);

    aiLogger.log("AI決定:", bestMove);

    if (bestMove) {
      aiLogger.log("AI実行開始:", {
        rotation: bestMove.rotation,
        targetX: bestMove.x,
        currentX: currentPiece.position.x,
      });

      // 回転を適用
      for (let i = 0; i < bestMove.rotation; i++) {
        aiLogger.log(`回転実行: ${i + 1}/${bestMove.rotation}`);
        gameEngineAdapter.rotateClockwise();
      }

      // 横移動
      const currentX = currentPiece.position.x;
      const deltaX = bestMove.x - currentX;

      aiLogger.log(`横移動: ${currentX} -> ${bestMove.x} (delta: ${deltaX})`);

      for (let i = 0; i < Math.abs(deltaX); i++) {
        if (deltaX > 0) {
          aiLogger.log(`右移動: ${i + 1}/${Math.abs(deltaX)}`);
          gameEngineAdapter.moveRight();
        } else {
          aiLogger.log(`左移動: ${i + 1}/${Math.abs(deltaX)}`);
          gameEngineAdapter.moveLeft();
        }
      }

      // ハードドロップ
      aiLogger.log("ハードドロップ実行");
      gameEngineAdapter.hardDrop();
      aiLogger.log("AI実行完了");
    } else {
      aiLogger.warn("有効な手が見つかりませんでした");
    }
  }, [isEnabled, isPlaying, isGameOver, currentPiece, board]);

  // AIが有効な時に自動で手を打つ
  useEffect(() => {
    if (isEnabled && isPlaying && !isGameOver && currentPiece) {
      aiLogger.log("AI実行準備完了 - 500ms後に実行");
      const timeout = setTimeout(makeAIMove, 500); // 500msに変更してデバッグしやすく
      return () => clearTimeout(timeout);
    }
  }, [makeAIMove, isEnabled, isPlaying, isGameOver, currentPiece]);

  return {
    isEnabled,
    makeAIMove,
  };
}

import { useAnimate } from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { useResponsiveBoard } from "@/hooks/ui/useResponsiveBoard";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/gameStore";
import type { LineClearAnimationData } from "@/types/game";
import { GAME_CONSTANTS } from "@/utils/gameConstants";
import { BOARD_STYLES, CARD_STYLES } from "@/utils/styles";
import { BoardCell } from "./BoardCell";

export function Board() {
  const { cellSize } = useResponsiveBoard();
  const [scope, animate] = useAnimate();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get animation state from store
  const { animationState, lineClearData, completeLineClearAnimation } = useGameStore((state) => ({
    animationState: state.animationState,
    lineClearData: state.lineClearData,
    completeLineClearAnimation: state.completeLineClearAnimation,
  }));

  // Execute line clear animation with AbortController
  const executeLineClearAnimation = useCallback(
    async (data: LineClearAnimationData, signal: AbortSignal) => {
      try {
        // Get all line selector elements
        const lineSelectors = data.clearedLineIndices.map((index) => `[data-line="${index}"]`);

        // 1. Flash effect (visual feedback)
        await animate(
          lineSelectors.join(", "),
          {
            backgroundColor: ["#ffffff", "#ff6b6b", "#ffffff"],
            scale: [1, 1.02, 1],
          },
          { duration: 0.15, repeat: 2 },
        );

        if (signal.aborted) return;

        // 2. Clear effect (line removal visualization)
        await animate(
          lineSelectors.join(", "),
          {
            opacity: [1, 0.7, 0],
            scale: [1, 0.95, 0.8],
            filter: ["blur(0px)", "blur(1px)", "blur(2px)"],
          },
          { duration: 0.2, ease: "easeOut" },
        );

        if (signal.aborted) return;
        completeLineClearAnimation();
      } catch (error) {
        console.error("Line clear animation failed:", error);
      } finally {
        // Ensure reliable state recovery
        const { animationState: currentState } = useGameStore.getState();
        if (currentState === "line-clearing") {
          completeLineClearAnimation();
        }
      }
    },
    [animate, completeLineClearAnimation],
  );

  // Effect for managing line clear animation
  useEffect(() => {
    if (animationState === "line-clearing" && lineClearData) {
      // Cancel any existing animation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      // Execute animation
      executeLineClearAnimation(lineClearData, abortControllerRef.current.signal);
    }

    // Cleanup on unmount or tab switch
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [animationState, lineClearData, executeLineClearAnimation]);

  // Generate all cell positions (20 rows x 10 columns)
  const cellPositions = Array.from({ length: GAME_CONSTANTS.BOARD.HEIGHT }, (_, row) =>
    Array.from({ length: GAME_CONSTANTS.BOARD.WIDTH }, (_, col) => ({ row, col })),
  ).flat();

  return (
    <Card className={cn(CARD_STYLES.base, CARD_STYLES.hover, "p-3 md:p-6")}>
      <div
        ref={scope}
        className={BOARD_STYLES.container}
        aria-label="Tetris game board"
        role="img"
        style={{
          gridTemplateColumns: `repeat(${GAME_CONSTANTS.BOARD.WIDTH}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${GAME_CONSTANTS.BOARD.HEIGHT}, ${cellSize}px)`,
        }}
      >
        {cellPositions.map(({ row, col }) => (
          <BoardCell
            key={`cell-${row * GAME_CONSTANTS.BOARD.WIDTH + col}`}
            row={row}
            col={col}
            cellSize={cellSize}
          />
        ))}
      </div>
    </Card>
  );
}

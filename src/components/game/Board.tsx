import { useAnimate } from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { useDesignTokens } from "@/hooks/core/useDesignTokens";
import { cn } from "@/lib/utils";
import { useGameStore } from "@/store/gameStore";
import type { LineClearAnimationData } from "@/types/game";
import { ANIMATION_PRESETS } from "@/utils/animationConstants";
import { GAME_CONSTANTS } from "@/utils/gameConstants";
import { BOARD_STYLES, CARD_STYLES } from "@/utils/styles";
import { BoardCell } from "./BoardCell";

export function Board() {
  const { layoutMode } = useDesignTokens(); // Add layout mode dependency to trigger re-renders

  // Calculate cell size directly based on layout mode for immediate updates
  const baseCellSize = GAME_CONSTANTS.BOARD.CELL_SIZE;
  const cellSize = layoutMode === "compact" ? Math.floor(baseCellSize * 1.06) : baseCellSize;

  // Debug logging
  if (import.meta.env.DEV) {
    console.log(`[Board] Layout mode: ${layoutMode}, Cell size: ${cellSize}`);
  }
  const [scope, animate] = useAnimate();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Get animation state from store with stable selectors
  const animationState = useGameStore((state) => state.animationState);
  const lineClearData = useGameStore((state) => state.lineClearData);

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
        useGameStore.getState().completeLineClearAnimation();
      } catch (error) {
        console.error("Line clear animation failed:", error);
      } finally {
        // Ensure reliable state recovery
        const { animationState: currentState } = useGameStore.getState();
        if (currentState === "line-clearing") {
          useGameStore.getState().completeLineClearAnimation();
        }
      }
    },
    [animate],
  );

  // Calculate affected rows for non-continuous line clearing
  const calculateAffectedRows = useCallback((clearedLineIndices: readonly number[]) => {
    if (clearedLineIndices.length === 0) return [];

    const maxClearedIndex = Math.max(...clearedLineIndices);
    const affectedRows = [];

    // All rows above the highest cleared line are affected
    for (let row = 0; row < maxClearedIndex; row++) {
      if (!clearedLineIndices.includes(row)) {
        affectedRows.push(row);
      }
    }

    return affectedRows;
  }, []);

  // Execute line fall animation with physics-based gravity
  const executeLineFallAnimation = useCallback(
    async (signal: AbortSignal) => {
      if (!lineClearData) return;

      try {
        // Calculate affected rows for non-continuous line clearing
        const affectedRows = calculateAffectedRows(lineClearData.clearedLineIndices);
        if (affectedRows.length === 0) {
          useGameStore.getState().completeLineFallAnimation();
          return;
        }

        // Calculate fall distance based on number of cleared lines
        const fallDistance =
          lineClearData.clearedLineIndices.length * GAME_CONSTANTS.BOARD.CELL_SIZE;

        // Create selectors for affected rows
        const rowSelectors = affectedRows.map((row) => `[data-line="${row}"]`);

        // Physics-based gravity animation with spring parameters from issue
        await animate(
          rowSelectors.join(", "),
          {
            y: `${fallDistance}px`,
          },
          ANIMATION_PRESETS.lineFall,
        );

        if (signal.aborted) return;
        useGameStore.getState().completeLineFallAnimation();
      } catch (error) {
        console.error("Line fall animation failed:", error);
      } finally {
        // Ensure reliable state recovery
        const { animationState: currentState } = useGameStore.getState();
        if (currentState === "line-falling") {
          useGameStore.getState().completeLineFallAnimation();
        }
      }
    },
    [lineClearData, animate, calculateAffectedRows],
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

  // Effect for managing line fall animation
  useEffect(() => {
    if (animationState === "line-falling" && lineClearData) {
      // Cancel any existing animation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      // Execute line fall animation
      executeLineFallAnimation(abortControllerRef.current.signal);
    }
  }, [animationState, lineClearData, executeLineFallAnimation]);

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
        data-testid="game-board"
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

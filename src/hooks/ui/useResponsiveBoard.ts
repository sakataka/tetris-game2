import { useEffect, useState } from "react";
import { useDesignTokens } from "@/hooks/core/useDesignTokens";
import { GAME_CONSTANTS } from "@/utils/gameConstants";

interface ResponsiveBoardSize {
  cellSize: number;
  boardWidth: number;
  boardHeight: number;
  containerWidth: number;
  containerHeight: number;
}

export function useResponsiveBoard(
  explicitLayoutMode?: "compact" | "normal" | "gaming",
): ResponsiveBoardSize {
  const { layoutMode: hookLayoutMode } = useDesignTokens();
  const layoutMode = explicitLayoutMode ?? hookLayoutMode;

  const [boardSize, setBoardSize] = useState<ResponsiveBoardSize>(() => {
    return calculateBoardSize(layoutMode);
  });

  useEffect(() => {
    function handleResize() {
      setBoardSize(calculateBoardSize(layoutMode));
    }

    // Initial calculation
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [layoutMode]);

  return boardSize;
}

function calculateBoardSize(layoutMode: "compact" | "normal" | "gaming"): ResponsiveBoardSize {
  // Get viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Check if mobile (viewport width < 768px, matching Tailwind's md breakpoint)
  const isMobile = viewportWidth < 768;

  if (!isMobile) {
    // Desktop: calculate enhanced cell size based on layout mode
    const baseCellSize = GAME_CONSTANTS.BOARD.CELL_SIZE;

    // In compact mode, increase cell size to take advantage of extra space
    // Normal mode: 240px sidebar leaves ~936px for main area
    // Compact mode: 200px sidebar leaves ~988px for main area
    // This is approximately 5.5% more space, so we can increase cell size accordingly
    let cellSize: number = baseCellSize;
    if (layoutMode === "compact") {
      // Increase cell size by ~6% in compact mode for better space utilization
      cellSize = Math.floor(baseCellSize * 1.06);
    }

    // Debug logging
    if (import.meta.env.DEV) {
      console.log(
        `[useResponsiveBoard] Layout mode: ${layoutMode}, Base cell size: ${baseCellSize}, Final cell size: ${cellSize}`,
      );
    }

    return {
      cellSize,
      boardWidth: GAME_CONSTANTS.BOARD.WIDTH * cellSize,
      boardHeight: GAME_CONSTANTS.BOARD.HEIGHT * cellSize,
      containerWidth: GAME_CONSTANTS.BOARD.WIDTH * cellSize,
      containerHeight: GAME_CONSTANTS.BOARD.HEIGHT * cellSize,
    };
  }

  // Mobile: calculate responsive sizes
  // Reserve space for UI elements
  const topUIHeight = 60; // MobileHeader - more compact
  const bottomControlsHeight = 120; // Touch controls - more compact
  const horizontalPadding = 32; // 16px on each side
  const verticalPadding = 16; // Additional vertical padding

  // Available space for the board
  const availableWidth = viewportWidth - horizontalPadding;
  const availableHeight = viewportHeight - topUIHeight - bottomControlsHeight - verticalPadding;

  // Calculate maximum cell size while maintaining aspect ratio
  const maxCellSizeByWidth = Math.floor(availableWidth / GAME_CONSTANTS.BOARD.WIDTH);
  const maxCellSizeByHeight = Math.floor(availableHeight / GAME_CONSTANTS.BOARD.HEIGHT);

  // Use the smaller of the two to ensure board fits in both dimensions
  const cellSize = Math.min(
    maxCellSizeByWidth,
    maxCellSizeByHeight,
    GAME_CONSTANTS.BOARD.CELL_SIZE,
  );

  // Ensure minimum playable size
  const minCellSize = 15;
  const finalCellSize = Math.max(cellSize, minCellSize);

  const boardWidth = GAME_CONSTANTS.BOARD.WIDTH * finalCellSize;
  const boardHeight = GAME_CONSTANTS.BOARD.HEIGHT * finalCellSize;

  return {
    cellSize: finalCellSize,
    boardWidth,
    boardHeight,
    containerWidth: boardWidth,
    containerHeight: boardHeight,
  };
}

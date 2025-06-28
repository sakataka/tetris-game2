import { useEffect, useState } from "react";
import { GAME_CONSTANTS } from "@/utils/gameConstants";

interface ResponsiveBoardSize {
  cellSize: number;
  boardWidth: number;
  boardHeight: number;
  containerWidth: number;
  containerHeight: number;
}

export function useResponsiveBoard(): ResponsiveBoardSize {
  const [boardSize, setBoardSize] = useState<ResponsiveBoardSize>(() => {
    return calculateBoardSize();
  });

  useEffect(() => {
    function handleResize() {
      setBoardSize(calculateBoardSize());
    }

    // Initial calculation
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return boardSize;
}

function calculateBoardSize(): ResponsiveBoardSize {
  // Get viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Check if mobile (viewport width < 768px, matching Tailwind's md breakpoint)
  const isMobile = viewportWidth < 768;

  if (!isMobile) {
    // Desktop: use default sizes
    const cellSize = GAME_CONSTANTS.BOARD.CELL_SIZE;
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

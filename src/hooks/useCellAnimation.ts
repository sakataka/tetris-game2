import { useMemo } from "react";
import { GAME_CONSTANTS, SPRING_CONFIGS } from "../utils/gameConstants";

interface CellAnimationState {
  isCurrentPiece: boolean;
  isPlacedPiece: boolean;
  isClearingLine: boolean;
  cellValue: number;
}

/**
 * Custom hook for managing board cell animation logic
 * Determines animation state and provides animation configuration
 */
export function useCellAnimation({
  isCurrentPiece,
  isPlacedPiece,
  isClearingLine,
  cellValue,
}: CellAnimationState) {
  const shouldAnimate = useMemo(
    () =>
      (isCurrentPiece && cellValue !== 0) ||
      (isPlacedPiece && cellValue !== 0) ||
      (isClearingLine && cellValue !== 0),
    [isCurrentPiece, isPlacedPiece, isClearingLine, cellValue],
  );

  const initialAnimation = useMemo(() => {
    if (!shouldAnimate) return false;
    if (isCurrentPiece) return { y: -8, opacity: 0.9 };
    if (isPlacedPiece) return { scale: 0.9 };
    return false;
  }, [shouldAnimate, isCurrentPiece, isPlacedPiece]);

  const animateProps = useMemo(() => {
    if (!shouldAnimate) return {};
    if (isCurrentPiece) return { y: 0, opacity: 1 };
    if (isPlacedPiece) return { scale: 1 };
    if (isClearingLine) return { opacity: [1, 0, 1, 0], scale: [1, 1.1, 1, 0.9] };
    return {};
  }, [shouldAnimate, isCurrentPiece, isPlacedPiece, isClearingLine]);

  const transitionProps = useMemo(() => {
    if (!shouldAnimate) return {};
    if (isCurrentPiece) {
      return {
        type: "spring" as const,
        ...SPRING_CONFIGS.CELL,
        duration: GAME_CONSTANTS.ANIMATION.CELL.DURATION,
      };
    }
    return {
      duration: isClearingLine
        ? GAME_CONSTANTS.ANIMATION.LINE_CLEAR_DURATION
        : GAME_CONSTANTS.ANIMATION.PIECE_PLACE_DURATION,
      repeat: isClearingLine ? 0 : 0,
    };
  }, [shouldAnimate, isCurrentPiece, isClearingLine]);

  return {
    shouldAnimate,
    initialAnimation,
    animateProps,
    transitionProps,
  };
}

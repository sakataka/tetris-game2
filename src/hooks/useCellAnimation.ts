import { useMemo } from "react";

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
    if (isClearingLine) return { opacity: [1, 0.3, 1, 0.3, 1], scale: [1, 1.1, 1] };
    return {};
  }, [shouldAnimate, isCurrentPiece, isPlacedPiece, isClearingLine]);

  const transitionProps = useMemo(() => {
    if (!shouldAnimate) return {};
    if (isCurrentPiece) {
      return {
        type: "spring" as const,
        stiffness: 500,
        damping: 30,
        duration: 0.25,
      };
    }
    return {
      duration: isClearingLine ? 0.6 : 0.15,
      repeat: isClearingLine ? 2 : 0,
    };
  }, [shouldAnimate, isCurrentPiece, isClearingLine]);

  return {
    shouldAnimate,
    initialAnimation,
    animateProps,
    transitionProps,
  };
}

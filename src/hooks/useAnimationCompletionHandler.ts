import { useCallback } from "react";
import { useGameActions } from "./useGameSelectors";

export function useAnimationCompletionHandler() {
  const { clearAnimationStates } = useGameActions();

  const handleAnimationComplete = useCallback(
    (isClearingLine: boolean, isPlacedPiece: boolean) => {
      if (isClearingLine) {
        // ラインクリアアニメーションの場合、即座に状態をクリア
        clearAnimationStates();
      } else if (isPlacedPiece) {
        // ピース配置アニメーションの場合、次のフレームで状態をクリア
        // これにより、複数のセルが同時にアニメーションを完了した場合の
        // clearAnimationStates の連続呼び出しを避ける試み
        requestAnimationFrame(() => {
          clearAnimationStates();
        });
      }
    },
    [clearAnimationStates],
  );

  return { handleAnimationComplete };
}

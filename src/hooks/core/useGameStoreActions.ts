import { useShallow } from "zustand/shallow";
import { useGameStore } from "@/store/gameStore";

export const useGameStoreActions = () =>
  useGameStore(
    useShallow((state) => ({
      moveLeft: state.moveLeft,
      moveRight: state.moveRight,
      moveDown: state.moveDown,
      rotate: state.rotate,
      rotate180: state.rotate180,
      drop: state.drop,
      holdPiece: state.holdPiece,
      togglePause: state.togglePause,
      resetGame: state.resetGame,
      showResetDialog: state.showResetDialog,
      hideResetDialog: state.hideResetDialog,
      confirmReset: state.confirmReset,
      clearAnimationData: state.clearAnimationData,
      applyDebugPreset: state.applyDebugPreset,
      setDebugQueue: state.setDebugQueue,
    })),
  );

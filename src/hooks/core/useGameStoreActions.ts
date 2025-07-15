import { useShallow } from "zustand/shallow";
import { useGamePlayStore } from "@/features/game-play/model/gamePlaySlice";

export const useGameStoreActions = () =>
  useGamePlayStore(
    useShallow((state) => ({
      moveLeft: state.moveLeft,
      moveRight: state.moveRight,
      moveDown: state.softDrop, // renamed from moveDown to softDrop
      rotate: state.rotateClockwise, // renamed from rotate to rotateClockwise
      rotate180: state.rotate180,
      drop: state.hardDrop, // renamed from drop to hardDrop
      holdPiece: state.holdPiece,
      togglePause: state.pauseGame, // renamed from togglePause to pauseGame
      resetGame: state.resetGame,
      showResetDialog: state.showResetDialog,
      hideResetDialog: state.hideResetDialog,
      confirmReset: state.confirmReset,
      clearAnimationData: state.clearAnimationData,
      applyDebugPreset: state.applyDebugPreset,
      setDebugQueue: state.setDebugQueue,
    })),
  );

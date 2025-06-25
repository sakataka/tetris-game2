import { useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { updateSettings } from "../utils/localStorage";

/**
 * Custom hook that handles settings persistence as a side effect
 * Monitors showGhostPiece state changes and saves to localStorage
 */
export function useSettingsSideEffect() {
  const showGhostPiece = useGameStore((state) => state.showGhostPiece);

  useEffect(() => {
    updateSettings({ showGhostPiece });
  }, [showGhostPiece]);
}

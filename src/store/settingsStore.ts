import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GameSettings } from "../types/storage";
import { GAME_CONSTANTS } from "../utils/gameConstants";

interface SettingsStore extends GameSettings {
  setLanguage: (language: "ja" | "en") => void;
  toggleShowGhostPiece: () => void;
  setVolume: (volume: number) => void;
}

const DEFAULT_SETTINGS: GameSettings = {
  language: "en",
  volume: GAME_CONSTANTS.UI.DEFAULT_VOLUME,
  showGhostPiece: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setLanguage: (language) => set({ language }),

      toggleShowGhostPiece: () => set((state) => ({ showGhostPiece: !state.showGhostPiece })),

      setVolume: (volume) => set({ volume }),
    }),
    {
      name: "tetris-settings",
    },
  ),
);

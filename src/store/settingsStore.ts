import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
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

// Log default settings for debugging
console.log("[SettingsStore] Default settings:", DEFAULT_SETTINGS);

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set) => ({
        ...DEFAULT_SETTINGS,

        setLanguage: (language) => {
          console.log("[SettingsStore] Setting language to:", language);
          set({ language });
        },

        toggleShowGhostPiece: () => set((state) => ({ showGhostPiece: !state.showGhostPiece })),

        setVolume: (volume) => set({ volume }),
      }),
      {
        name: "tetris-settings",
        onRehydrateStorage: () => (state) => {
          console.log("[SettingsStore] Rehydrated from localStorage:", state);
          if (state?.language) {
            console.log("[SettingsStore] Language restored as:", state.language);
          }
        },
      },
    ),
    { name: "settings-store" },
  ),
);

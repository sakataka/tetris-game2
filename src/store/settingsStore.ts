import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { GameSettings } from "@/types/storage";
import { GAME_CONSTANTS } from "@/utils/gameConstants";

interface SettingsStore extends GameSettings {
  setLanguage: (language: "ja" | "en") => void;
  toggleShowGhostPiece: () => void;
  setVolume: (volume: number) => void;
  toggleTSpinDetection: () => void;
  toggleAIFeatures: () => void;
}

const DEFAULT_SETTINGS: GameSettings = {
  language: "en",
  volume: GAME_CONSTANTS.UI.DEFAULT_VOLUME,
  showGhostPiece: true,
  enableTSpinDetection: true,
  enableAIFeatures: false,
};

// Log default settings for debugging in development only
if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
  console.log("[SettingsStore] Default settings:", DEFAULT_SETTINGS);
}

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      immer((set) => ({
        ...DEFAULT_SETTINGS,

        setLanguage: (language) => {
          if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
            console.log("[SettingsStore] Setting language to:", language);
          }
          set((state) => {
            state.language = language;
          });
        },

        toggleShowGhostPiece: () =>
          set((state) => {
            state.showGhostPiece = !state.showGhostPiece;
          }),

        setVolume: (volume) =>
          set((state) => {
            state.volume = volume;
          }),

        toggleTSpinDetection: () =>
          set((state) => {
            state.enableTSpinDetection = !state.enableTSpinDetection;
          }),

        toggleAIFeatures: () =>
          set((state) => {
            state.enableAIFeatures = !state.enableAIFeatures;
          }),
      })),
      {
        name: "tetris-settings",
        onRehydrateStorage: () => (state) => {
          if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
            console.log("[SettingsStore] Rehydrated from localStorage:", state);
            if (state?.language) {
              console.log("[SettingsStore] Language restored as:", state.language);
            }
          }
        },
      },
    ),
    { name: "settings-store" },
  ),
);

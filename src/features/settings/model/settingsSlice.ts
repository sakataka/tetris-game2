import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { GameSettings } from "../ui/SettingsPanel";

interface SettingsState extends GameSettings {
  // Metadata
  isDirty: boolean;
  isLoading: boolean;
  lastSaved: number;
  version: string;

  // Visual settings actions
  setShowGhostPiece: (show: boolean) => void;
  setShowGrid: (show: boolean) => void;
  setEnableAnimations: (enable: boolean) => void;

  // Gameplay settings actions
  setEnableTSpinDetection: (enable: boolean) => void;
  setEnableAIFeatures: (enable: boolean) => void;
  setAutoRepeatDelay: (delay: number) => void;
  setAutoRepeatRate: (rate: number) => void;

  setColorScheme: (scheme: "dark" | "light" | "auto") => void;

  // Audio settings actions
  setEnableSound: (enable: boolean) => void;
  setSoundVolume: (volume: number) => void;
  setEnableHaptics: (enable: boolean) => void;

  // Language settings actions
  setLanguage: (language: string) => void;

  // Performance settings actions
  setTargetFPS: (fps: number) => void;
  setEnablePerformanceMode: (enable: boolean) => void;

  // Metadata actions
  setDirty: (dirty: boolean) => void;
  setLoading: (loading: boolean) => void;
  setLastSaved: (timestamp: number) => void;

  // Utility actions
  reset: () => void;
  loadFromStorage: (settings: Partial<GameSettings>) => void;
  validateSettings: () => boolean;
}

// Default settings
const DEFAULT_SETTINGS: GameSettings = {
  // Visual settings
  showGhostPiece: true,
  showGrid: true,
  enableAnimations: true,

  // Gameplay settings
  enableTSpinDetection: true,
  enableAIFeatures: false,
  autoRepeatDelay: 170, // ms
  autoRepeatRate: 50, // ms

  colorScheme: "dark",

  // Audio settings
  enableSound: false, // Default to false to avoid unexpected audio
  soundVolume: 0.5,
  enableHaptics: false,

  // Language settings
  language: "en",

  // Performance settings
  targetFPS: 60,
  enablePerformanceMode: false,
};

export const useSettingsStore = create<SettingsState>()(
  devtools(
    (set, get) => ({
      // Initial state from defaults
      ...DEFAULT_SETTINGS,

      // Metadata
      isDirty: false,
      isLoading: false,
      lastSaved: 0,
      version: "1.0.0",

      // Visual settings actions
      setShowGhostPiece: (show) =>
        set(() => ({
          showGhostPiece: show,
          isDirty: true,
        })),

      setShowGrid: (show) =>
        set(() => ({
          showGrid: show,
          isDirty: true,
        })),

      setEnableAnimations: (enable) =>
        set(() => ({
          enableAnimations: enable,
          isDirty: true,
        })),

      // Gameplay settings actions
      setEnableTSpinDetection: (enable) =>
        set(() => ({
          enableTSpinDetection: enable,
          isDirty: true,
        })),

      setEnableAIFeatures: (enable) =>
        set(() => ({
          enableAIFeatures: enable,
          isDirty: true,
        })),

      setAutoRepeatDelay: (delay) =>
        set(() => ({
          autoRepeatDelay: Math.max(50, Math.min(300, delay)),
          isDirty: true,
        })),

      setAutoRepeatRate: (rate) =>
        set(() => ({
          autoRepeatRate: Math.max(20, Math.min(100, rate)),
          isDirty: true,
        })),

      setColorScheme: (scheme) =>
        set(() => ({
          colorScheme: scheme,
          isDirty: true,
        })),

      // Audio settings actions
      setEnableSound: (enable) =>
        set(() => ({
          enableSound: enable,
          isDirty: true,
        })),

      setSoundVolume: (volume) =>
        set(() => ({
          soundVolume: Math.max(0, Math.min(1, volume)),
          isDirty: true,
        })),

      setEnableHaptics: (enable) =>
        set(() => ({
          enableHaptics: enable,
          isDirty: true,
        })),

      // Language settings actions
      setLanguage: (language) =>
        set(() => ({
          language,
          isDirty: true,
        })),

      // Performance settings actions
      setTargetFPS: (fps) =>
        set(() => ({
          targetFPS: Math.max(30, Math.min(120, fps)),
          isDirty: true,
        })),

      setEnablePerformanceMode: (enable) =>
        set(() => ({
          enablePerformanceMode: enable,
          isDirty: true,
        })),

      // Metadata actions
      setDirty: (dirty) => set(() => ({ isDirty: dirty })),
      setLoading: (loading) => set(() => ({ isLoading: loading })),
      setLastSaved: (timestamp) => set(() => ({ lastSaved: timestamp })),

      // Utility actions
      reset: () =>
        set(() => ({
          ...DEFAULT_SETTINGS,
          isDirty: false,
          lastSaved: 0,
        })),

      loadFromStorage: (settings) =>
        set((_state) => {
          // Validate and merge settings
          const validatedSettings = get().validateSettings()
            ? validateSettingsData({ ...DEFAULT_SETTINGS, ...settings })
            : { ...DEFAULT_SETTINGS, ...settings };

          return {
            ...validatedSettings,
            isDirty: false,
            isLoading: false,
            lastSaved: Date.now(),
          };
        }),

      validateSettings: () => {
        const state = get();

        // Validate ranges
        if (state.soundVolume < 0 || state.soundVolume > 1) return false;
        if (state.autoRepeatDelay < 50 || state.autoRepeatDelay > 300) return false;
        if (state.autoRepeatRate < 20 || state.autoRepeatRate > 100) return false;
        if (state.targetFPS < 30 || state.targetFPS > 120) return false;

        // Validate enums
        if (!["dark", "light", "auto"].includes(state.colorScheme)) return false;

        return true;
      },
    }),
    { name: "settings-store" },
  ),
);

/**
 * Validate settings data from external sources
 */
function validateSettingsData(settings: Partial<GameSettings>): GameSettings {
  const validated: GameSettings = { ...DEFAULT_SETTINGS };

  // Validate booleans
  if (typeof settings.showGhostPiece === "boolean") {
    validated.showGhostPiece = settings.showGhostPiece;
  }
  if (typeof settings.showGrid === "boolean") {
    validated.showGrid = settings.showGrid;
  }
  if (typeof settings.enableAnimations === "boolean") {
    validated.enableAnimations = settings.enableAnimations;
  }
  if (typeof settings.enableTSpinDetection === "boolean") {
    validated.enableTSpinDetection = settings.enableTSpinDetection;
  }
  if (typeof settings.enableAIFeatures === "boolean") {
    validated.enableAIFeatures = settings.enableAIFeatures;
  }
  if (typeof settings.enableSound === "boolean") {
    validated.enableSound = settings.enableSound;
  }
  if (typeof settings.enableHaptics === "boolean") {
    validated.enableHaptics = settings.enableHaptics;
  }
  if (typeof settings.enablePerformanceMode === "boolean") {
    validated.enablePerformanceMode = settings.enablePerformanceMode;
  }

  // Validate numbers with ranges
  if (
    typeof settings.soundVolume === "number" &&
    settings.soundVolume >= 0 &&
    settings.soundVolume <= 1
  ) {
    validated.soundVolume = settings.soundVolume;
  }
  if (
    typeof settings.autoRepeatDelay === "number" &&
    settings.autoRepeatDelay >= 50 &&
    settings.autoRepeatDelay <= 300
  ) {
    validated.autoRepeatDelay = settings.autoRepeatDelay;
  }
  if (
    typeof settings.autoRepeatRate === "number" &&
    settings.autoRepeatRate >= 20 &&
    settings.autoRepeatRate <= 100
  ) {
    validated.autoRepeatRate = settings.autoRepeatRate;
  }
  if (
    typeof settings.targetFPS === "number" &&
    settings.targetFPS >= 30 &&
    settings.targetFPS <= 120
  ) {
    validated.targetFPS = settings.targetFPS;
  }

  // Validate enums
  if (settings.colorScheme && ["dark", "light", "auto"].includes(settings.colorScheme)) {
    validated.colorScheme = settings.colorScheme as "dark" | "light" | "auto";
  }

  // Validate strings
  if (typeof settings.language === "string" && settings.language.length === 2) {
    validated.language = settings.language;
  }

  return validated;
}

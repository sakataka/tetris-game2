import { useCallback, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { settingsStorage } from "../api/settingsStorage";
import { useSettingsStore } from "../model/settingsSlice";
import type { GameSettings } from "../ui/SettingsPanel";

export interface UseSettingsReturn {
  // Settings state
  settings: GameSettings;

  // Individual setting getters
  showGhostPiece: boolean;
  showGrid: boolean;
  enableAnimations: boolean;
  enableTSpinDetection: boolean;
  enableAIFeatures: boolean;
  theme: "compact" | "normal" | "gaming";
  colorScheme: "dark" | "light" | "auto";
  enableSound: boolean;
  soundVolume: number;
  enableHaptics: boolean;
  language: string;
  targetFPS: number;
  enablePerformanceMode: boolean;

  // Actions
  updateSettings: (settings: Partial<GameSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  exportSettings: () => Promise<string>;
  importSettings: (jsonData: string) => Promise<void>;

  // Individual setting actions
  setShowGhostPiece: (show: boolean) => void;
  setShowGrid: (show: boolean) => void;
  setEnableAnimations: (enable: boolean) => void;
  setEnableTSpinDetection: (enable: boolean) => void;
  setEnableAIFeatures: (enable: boolean) => void;
  setTheme: (theme: "compact" | "normal" | "gaming") => void;
  setColorScheme: (scheme: "dark" | "light" | "auto") => void;
  setEnableSound: (enable: boolean) => void;
  setSoundVolume: (volume: number) => void;
  setEnableHaptics: (enable: boolean) => void;
  setLanguage: (language: string) => Promise<void>;
  setTargetFPS: (fps: number) => void;
  setEnablePerformanceMode: (enable: boolean) => void;

  // Utility
  isDirty: boolean;
  isLoading: boolean;
}

export const useSettings = (): UseSettingsReturn => {
  // Get all settings using shallow comparison
  const settings = useSettingsStore(
    useShallow((state) => ({
      showGhostPiece: state.showGhostPiece,
      showGrid: state.showGrid,
      enableAnimations: state.enableAnimations,
      enableTSpinDetection: state.enableTSpinDetection,
      enableAIFeatures: state.enableAIFeatures,
      autoRepeatDelay: state.autoRepeatDelay,
      autoRepeatRate: state.autoRepeatRate,
      theme: state.theme,
      colorScheme: state.colorScheme,
      enableSound: state.enableSound,
      soundVolume: state.soundVolume,
      enableHaptics: state.enableHaptics,
      language: state.language,
      targetFPS: state.targetFPS,
      enablePerformanceMode: state.enablePerformanceMode,
    })),
  );

  // Get utility state
  const isDirty = useSettingsStore((state) => state.isDirty);
  const isLoading = useSettingsStore((state) => state.isLoading);

  // Get actions
  const actions = useSettingsStore(
    useShallow((state) => ({
      setShowGhostPiece: state.setShowGhostPiece,
      setShowGrid: state.setShowGrid,
      setEnableAnimations: state.setEnableAnimations,
      setEnableTSpinDetection: state.setEnableTSpinDetection,
      setEnableAIFeatures: state.setEnableAIFeatures,
      setAutoRepeatDelay: state.setAutoRepeatDelay,
      setAutoRepeatRate: state.setAutoRepeatRate,
      setTheme: state.setTheme,
      setColorScheme: state.setColorScheme,
      setEnableSound: state.setEnableSound,
      setSoundVolume: state.setSoundVolume,
      setEnableHaptics: state.setEnableHaptics,
      setLanguage: state.setLanguage,
      setTargetFPS: state.setTargetFPS,
      setEnablePerformanceMode: state.setEnablePerformanceMode,
      setLoading: state.setLoading,
      setDirty: state.setDirty,
      reset: state.reset,
      loadFromStorage: state.loadFromStorage,
    })),
  );

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        actions.setLoading(true);
        const savedSettings = await settingsStorage.loadSettings();
        if (savedSettings) {
          actions.loadFromStorage(savedSettings);
        }
      } catch (error) {
        console.error("[useSettings] Failed to load settings:", error);
      } finally {
        actions.setLoading(false);
      }
    };

    loadSettings();
  }, [actions]);

  // Auto-save settings when they change
  useEffect(() => {
    if (isDirty && !isLoading) {
      const saveSettings = async () => {
        try {
          await settingsStorage.saveSettings(settings);
          actions.setDirty(false);
          console.log("[useSettings] Settings auto-saved");
        } catch (error) {
          console.error("[useSettings] Failed to auto-save settings:", error);
        }
      };

      // Debounce auto-save
      const timeoutId = setTimeout(saveSettings, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [settings, isDirty, isLoading, actions]);

  // Update multiple settings at once
  const updateSettings = useCallback(
    async (updates: Partial<GameSettings>) => {
      try {
        // Apply updates to store
        Object.entries(updates).forEach(([key, value]) => {
          const actionName =
            `set${key.charAt(0).toUpperCase()}${key.slice(1)}` as keyof typeof actions;
          const action = actions[actionName];
          if (typeof action === "function") {
            (action as (value: any) => void)(value);
          }
        });

        // Save immediately for bulk updates
        const newSettings = { ...settings, ...updates };
        await settingsStorage.saveSettings(newSettings);
        actions.setDirty(false);

        console.log("[useSettings] Settings updated:", updates);
      } catch (error) {
        console.error("[useSettings] Failed to update settings:", error);
        throw error;
      }
    },
    [settings, actions],
  );

  // Reset settings to defaults
  const resetSettings = useCallback(async () => {
    try {
      actions.reset();
      await settingsStorage.clearSettings();
      console.log("[useSettings] Settings reset to defaults");
    } catch (error) {
      console.error("[useSettings] Failed to reset settings:", error);
      throw error;
    }
  }, [actions]);

  // Export settings as JSON
  const exportSettings = useCallback(async (): Promise<string> => {
    try {
      return await settingsStorage.exportSettings();
    } catch (error) {
      console.error("[useSettings] Failed to export settings:", error);
      throw error;
    }
  }, []);

  // Import settings from JSON
  const importSettings = useCallback(
    async (jsonData: string) => {
      try {
        actions.setLoading(true);
        const importedSettings = await settingsStorage.importSettings(jsonData);
        actions.loadFromStorage(importedSettings);
        await settingsStorage.saveSettings(importedSettings);
        console.log("[useSettings] Settings imported successfully");
      } catch (error) {
        console.error("[useSettings] Failed to import settings:", error);
        throw error;
      } finally {
        actions.setLoading(false);
      }
    },
    [actions],
  );

  // Enhanced language setter with i18n integration
  const setLanguage = useCallback(
    async (language: string) => {
      try {
        actions.setLanguage(language);

        // Integration with i18next would happen here
        // For now, just save the setting
        await settingsStorage.saveSettings({ ...settings, language });
        actions.setDirty(false);

        console.log("[useSettings] Language changed to:", language);
      } catch (error) {
        console.error("[useSettings] Failed to change language:", error);
        throw error;
      }
    },
    [settings, actions],
  );

  return {
    // Settings state
    settings,

    // Individual setting getters
    showGhostPiece: settings.showGhostPiece,
    showGrid: settings.showGrid,
    enableAnimations: settings.enableAnimations,
    enableTSpinDetection: settings.enableTSpinDetection,
    enableAIFeatures: settings.enableAIFeatures,
    theme: settings.theme,
    colorScheme: settings.colorScheme,
    enableSound: settings.enableSound,
    soundVolume: settings.soundVolume,
    enableHaptics: settings.enableHaptics,
    language: settings.language,
    targetFPS: settings.targetFPS,
    enablePerformanceMode: settings.enablePerformanceMode,

    // Actions
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,

    // Individual setting actions
    setShowGhostPiece: actions.setShowGhostPiece,
    setShowGrid: actions.setShowGrid,
    setEnableAnimations: actions.setEnableAnimations,
    setEnableTSpinDetection: actions.setEnableTSpinDetection,
    setEnableAIFeatures: actions.setEnableAIFeatures,
    setTheme: actions.setTheme,
    setColorScheme: actions.setColorScheme,
    setEnableSound: actions.setEnableSound,
    setSoundVolume: actions.setSoundVolume,
    setEnableHaptics: actions.setEnableHaptics,
    setLanguage,
    setTargetFPS: actions.setTargetFPS,
    setEnablePerformanceMode: actions.setEnablePerformanceMode,

    // Utility
    isDirty,
    isLoading,
  };
};

/**
 * Hook for settings data only (read-only)
 */
export const useSettingsData = () => {
  return useSettingsStore(
    useShallow((state) => ({
      showGhostPiece: state.showGhostPiece,
      showGrid: state.showGrid,
      enableAnimations: state.enableAnimations,
      enableTSpinDetection: state.enableTSpinDetection,
      enableAIFeatures: state.enableAIFeatures,
      theme: state.theme,
      colorScheme: state.colorScheme,
      enableSound: state.enableSound,
      soundVolume: state.soundVolume,
      enableHaptics: state.enableHaptics,
      language: state.language,
      targetFPS: state.targetFPS,
      enablePerformanceMode: state.enablePerformanceMode,
    })),
  );
};

/**
 * Hook for theme-related settings only
 */
export const useThemeSettings = () => {
  return useSettingsStore(
    useShallow((state) => ({
      theme: state.theme,
      colorScheme: state.colorScheme,
      enableAnimations: state.enableAnimations,
      enablePerformanceMode: state.enablePerformanceMode,
    })),
  );
};

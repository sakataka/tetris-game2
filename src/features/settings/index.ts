// UI Components

// API
export type {
  SettingsExportData,
  SettingsStorageAdapter as SettingsStorageAdapterType,
} from "./api/settingsStorage";
export {
  createSettingsStorageAdapter,
  createSettingsStorageAdapter as SettingsStorageAdapter,
  settingsStorage,
} from "./api/settingsStorage";
export type { UseSettingsReturn } from "./lib/useSettings";
// Hooks
export { useSettings, useSettingsData, useThemeSettings } from "./lib/useSettings";

// Store
export { useSettingsStore } from "./model/settingsSlice";
export { GameSettings as GameSettingsComponent } from "./ui/GameSettings";
export type { GameSettings, SettingsPanelProps } from "./ui/SettingsPanel";
export { SettingsPanel } from "./ui/SettingsPanel";

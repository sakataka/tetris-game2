import type { GameSettings } from "../ui/SettingsPanel";

export interface SettingsExportData {
  settings: GameSettings;
  metadata: {
    exportDate: string;
    version: string;
    userAgent: string;
  };
}

export interface SettingsStorageAdapter {
  saveSettings(settings: GameSettings): Promise<void>;
  loadSettings(): Promise<GameSettings | null>;
  clearSettings(): Promise<void>;
  exportSettings(): Promise<string>;
  importSettings(jsonData: string): Promise<GameSettings>;
  getStorageStats(): Promise<{
    used: number;
    available: number;
    settingsSize: number;
  }>;
  hasSettings(): Promise<boolean>;
}

/**
 * Local storage adapter for settings persistence
 */
export function createSettingsStorageAdapter(): SettingsStorageAdapter {
  const SETTINGS_KEY = "tetris-game-settings";
  const BACKUP_KEY = "tetris-game-settings-backup";
  const VERSION = "1.0.0";

  /**
   * Create backup of current settings
   */
  const createBackup = async (): Promise<void> => {
    try {
      const current = localStorage.getItem(SETTINGS_KEY);
      if (current) {
        localStorage.setItem(BACKUP_KEY, current);
      }
    } catch (error) {
      console.warn("[SettingsStorage] Failed to create backup:", error);
    }
  };

  /**
   * Restore settings from backup
   */
  const restoreFromBackup = async (): Promise<GameSettings | null> => {
    try {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (!backup) return null;

      const data = JSON.parse(backup);
      return validateSettings(data.settings);
    } catch (error) {
      console.error("[SettingsStorage] Failed to restore from backup:", error);
      return null;
    }
  };

  /**
   * Handle storage quota exceeded error
   */
  const handleStorageQuotaExceeded = async (): Promise<void> => {
    try {
      // Remove backup to free up space
      localStorage.removeItem(BACKUP_KEY);

      // Could also remove other non-essential data here
      console.log("[SettingsStorage] Freed up storage space");
    } catch (error) {
      console.error("[SettingsStorage] Failed to free up storage space:", error);
    }
  };

  /**
   * Validate settings object
   */
  const validateSettings = (settings: unknown): GameSettings | null => {
    if (!settings || typeof settings !== "object") {
      return null;
    }

    const s = settings as Record<string, unknown>;

    // Check required boolean fields
    const booleanFields = [
      "showGhostPiece",
      "showGrid",
      "enableAnimations",
      "enableTSpinDetection",
      "enableAIFeatures",
      "enableSound",
      "enableHaptics",
      "enablePerformanceMode",
    ];

    for (const field of booleanFields) {
      if (typeof s[field] !== "boolean") {
        console.warn(`[SettingsStorage] Invalid ${field}: ${s[field]}`);
        return null;
      }
    }

    // Check number fields with ranges
    if (typeof s.soundVolume !== "number" || s.soundVolume < 0 || s.soundVolume > 1) {
      console.warn(`[SettingsStorage] Invalid soundVolume: ${s.soundVolume}`);
      return null;
    }

    if (
      typeof s.autoRepeatDelay !== "number" ||
      s.autoRepeatDelay < 50 ||
      s.autoRepeatDelay > 300
    ) {
      console.warn(`[SettingsStorage] Invalid autoRepeatDelay: ${s.autoRepeatDelay}`);
      return null;
    }

    if (typeof s.autoRepeatRate !== "number" || s.autoRepeatRate < 20 || s.autoRepeatRate > 100) {
      console.warn(`[SettingsStorage] Invalid autoRepeatRate: ${s.autoRepeatRate}`);
      return null;
    }

    if (typeof s.targetFPS !== "number" || s.targetFPS < 30 || s.targetFPS > 120) {
      console.warn(`[SettingsStorage] Invalid targetFPS: ${s.targetFPS}`);
      return null;
    }

    // Check enum fields
    if (!["compact", "normal", "gaming"].includes(s.theme as string)) {
      console.warn(`[SettingsStorage] Invalid theme: ${s.theme}`);
      return null;
    }

    if (!["dark", "light", "auto"].includes(s.colorScheme as string)) {
      console.warn(`[SettingsStorage] Invalid colorScheme: ${s.colorScheme}`);
      return null;
    }

    // Check string fields
    if (typeof s.language !== "string" || s.language.length !== 2) {
      console.warn(`[SettingsStorage] Invalid language: ${s.language}`);
      return null;
    }

    return s as unknown as GameSettings;
  };

  return {
    /**
     * Save settings to localStorage
     */
    async saveSettings(settings: GameSettings): Promise<void> {
      try {
        // Create backup of current settings before saving new ones
        await createBackup();

        const settingsData = {
          settings,
          metadata: {
            version: VERSION,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
          },
        };

        const serialized = JSON.stringify(settingsData);
        localStorage.setItem(SETTINGS_KEY, serialized);

        console.log("[SettingsStorage] Settings saved successfully");
      } catch (error) {
        if (error instanceof DOMException && error.code === 22) {
          // Storage quota exceeded
          console.warn("[SettingsStorage] Storage quota exceeded");
          await handleStorageQuotaExceeded();

          // Retry save after cleanup
          const settingsData = {
            settings,
            metadata: {
              version: VERSION,
              timestamp: Date.now(),
              userAgent: navigator.userAgent,
            },
          };

          localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsData));
        } else {
          console.error("[SettingsStorage] Failed to save settings:", error);
          throw error;
        }
      }
    },

    /**
     * Load settings from localStorage
     */
    async loadSettings(): Promise<GameSettings | null> {
      try {
        const item = localStorage.getItem(SETTINGS_KEY);
        if (!item) {
          console.log("[SettingsStorage] No saved settings found");
          return null;
        }

        const data = JSON.parse(item);

        // Validate data structure
        if (!data.settings || !data.metadata) {
          console.warn("[SettingsStorage] Invalid settings data structure");
          return null;
        }

        // Check version compatibility
        if (data.metadata.version !== VERSION) {
          console.log(
            `[SettingsStorage] Settings version mismatch: ${data.metadata.version} vs ${VERSION}`,
          );
          // Could implement migration logic here
        }

        // Validate settings structure
        const settings = validateSettings(data.settings);
        if (!settings) {
          console.warn("[SettingsStorage] Settings validation failed");
          return null;
        }

        console.log("[SettingsStorage] Settings loaded successfully");
        return settings;
      } catch (error) {
        console.error("[SettingsStorage] Failed to load settings:", error);

        // Try to load from backup
        try {
          const backup = await restoreFromBackup();
          if (backup) {
            console.log("[SettingsStorage] Restored settings from backup");
            return backup;
          }
        } catch (backupError) {
          console.error("[SettingsStorage] Failed to restore from backup:", backupError);
        }

        return null;
      }
    },

    /**
     * Clear all settings
     */
    async clearSettings(): Promise<void> {
      try {
        localStorage.removeItem(SETTINGS_KEY);
        localStorage.removeItem(BACKUP_KEY);
        console.log("[SettingsStorage] Settings cleared");
      } catch (error) {
        console.error("[SettingsStorage] Failed to clear settings:", error);
        throw error;
      }
    },

    /**
     * Export settings as JSON string
     */
    async exportSettings(): Promise<string> {
      try {
        const settings = await this.loadSettings();
        if (!settings) {
          throw new Error("No settings to export");
        }

        const exportData: SettingsExportData = {
          settings,
          metadata: {
            exportDate: new Date().toISOString(),
            version: VERSION,
            userAgent: navigator.userAgent,
          },
        };

        return JSON.stringify(exportData, null, 2);
      } catch (error) {
        console.error("[SettingsStorage] Failed to export settings:", error);
        throw error;
      }
    },

    /**
     * Import settings from JSON string
     */
    async importSettings(jsonData: string): Promise<GameSettings> {
      try {
        const importData: SettingsExportData = JSON.parse(jsonData);

        // Validate import data structure
        if (!importData.settings || !importData.metadata) {
          throw new Error("Invalid import data structure");
        }

        // Validate settings
        const settings = validateSettings(importData.settings);
        if (!settings) {
          throw new Error("Invalid settings data");
        }

        // Save imported settings
        await this.saveSettings(settings);

        console.log("[SettingsStorage] Settings imported successfully");
        return settings;
      } catch (error) {
        console.error("[SettingsStorage] Failed to import settings:", error);
        throw error;
      }
    },

    /**
     * Get storage usage statistics
     */
    async getStorageStats(): Promise<{
      used: number;
      available: number;
      settingsSize: number;
    }> {
      try {
        const settingsData = localStorage.getItem(SETTINGS_KEY);
        const settingsSize = settingsData ? new Blob([settingsData]).size : 0;

        // Estimate total localStorage usage
        let totalUsed = 0;
        for (const key in localStorage) {
          if (Object.hasOwn(localStorage, key)) {
            totalUsed += localStorage[key].length + key.length;
          }
        }

        // localStorage quota is typically 5-10MB, but there's no direct way to check
        // We'll estimate based on common limits
        const estimatedQuota = 5 * 1024 * 1024; // 5MB

        return {
          used: totalUsed,
          available: estimatedQuota - totalUsed,
          settingsSize,
        };
      } catch (error) {
        console.error("[SettingsStorage] Failed to get storage stats:", error);
        return {
          used: 0,
          available: 0,
          settingsSize: 0,
        };
      }
    },

    /**
     * Check if settings exist
     */
    async hasSettings(): Promise<boolean> {
      try {
        return localStorage.getItem(SETTINGS_KEY) !== null;
      } catch (error) {
        console.error("[SettingsStorage] Failed to check if settings exist:", error);
        return false;
      }
    },
  };
}

// Singleton instance
export const settingsStorage = createSettingsStorageAdapter();

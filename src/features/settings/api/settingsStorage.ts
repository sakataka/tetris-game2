import type { GameSettings } from "../ui/SettingsPanel";

export interface SettingsExportData {
  settings: GameSettings;
  metadata: {
    exportDate: string;
    version: string;
    userAgent: string;
  };
}

/**
 * Local storage adapter for settings persistence
 */
export class SettingsStorageAdapter {
  private readonly SETTINGS_KEY = "tetris-game-settings";
  private readonly BACKUP_KEY = "tetris-game-settings-backup";
  private readonly VERSION = "1.0.0";

  /**
   * Save settings to localStorage
   */
  async saveSettings(settings: GameSettings): Promise<void> {
    try {
      // Create backup of current settings before saving new ones
      await this.createBackup();

      const settingsData = {
        settings,
        metadata: {
          version: this.VERSION,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
        },
      };

      const serialized = JSON.stringify(settingsData);
      localStorage.setItem(this.SETTINGS_KEY, serialized);

      console.log("[SettingsStorage] Settings saved successfully");
    } catch (error) {
      if (error instanceof DOMException && error.code === 22) {
        // Storage quota exceeded
        console.warn("[SettingsStorage] Storage quota exceeded");
        await this.handleStorageQuotaExceeded();

        // Retry save after cleanup
        const settingsData = {
          settings,
          metadata: {
            version: this.VERSION,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
          },
        };

        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settingsData));
      } else {
        console.error("[SettingsStorage] Failed to save settings:", error);
        throw error;
      }
    }
  }

  /**
   * Load settings from localStorage
   */
  async loadSettings(): Promise<GameSettings | null> {
    try {
      const item = localStorage.getItem(this.SETTINGS_KEY);
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
      if (data.metadata.version !== this.VERSION) {
        console.log(
          `[SettingsStorage] Settings version mismatch: ${data.metadata.version} vs ${this.VERSION}`,
        );
        // Could implement migration logic here
      }

      // Validate settings structure
      const settings = this.validateSettings(data.settings);
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
        const backup = await this.restoreFromBackup();
        if (backup) {
          console.log("[SettingsStorage] Restored settings from backup");
          return backup;
        }
      } catch (backupError) {
        console.error("[SettingsStorage] Failed to restore from backup:", backupError);
      }

      return null;
    }
  }

  /**
   * Clear all settings
   */
  async clearSettings(): Promise<void> {
    try {
      localStorage.removeItem(this.SETTINGS_KEY);
      localStorage.removeItem(this.BACKUP_KEY);
      console.log("[SettingsStorage] Settings cleared");
    } catch (error) {
      console.error("[SettingsStorage] Failed to clear settings:", error);
      throw error;
    }
  }

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
          version: this.VERSION,
          userAgent: navigator.userAgent,
        },
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error("[SettingsStorage] Failed to export settings:", error);
      throw error;
    }
  }

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
      const settings = this.validateSettings(importData.settings);
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
  }

  /**
   * Create backup of current settings
   */
  private async createBackup(): Promise<void> {
    try {
      const current = localStorage.getItem(this.SETTINGS_KEY);
      if (current) {
        localStorage.setItem(this.BACKUP_KEY, current);
      }
    } catch (error) {
      console.warn("[SettingsStorage] Failed to create backup:", error);
    }
  }

  /**
   * Restore settings from backup
   */
  private async restoreFromBackup(): Promise<GameSettings | null> {
    try {
      const backup = localStorage.getItem(this.BACKUP_KEY);
      if (!backup) return null;

      const data = JSON.parse(backup);
      return this.validateSettings(data.settings);
    } catch (error) {
      console.error("[SettingsStorage] Failed to restore from backup:", error);
      return null;
    }
  }

  /**
   * Handle storage quota exceeded error
   */
  private async handleStorageQuotaExceeded(): Promise<void> {
    try {
      // Remove backup to free up space
      localStorage.removeItem(this.BACKUP_KEY);

      // Could also remove other non-essential data here
      console.log("[SettingsStorage] Freed up storage space");
    } catch (error) {
      console.error("[SettingsStorage] Failed to free up storage space:", error);
    }
  }

  /**
   * Validate settings object
   */
  private validateSettings(settings: unknown): GameSettings | null {
    if (!settings || typeof settings !== "object") {
      return null;
    }

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
      if (typeof settings[field] !== "boolean") {
        console.warn(`[SettingsStorage] Invalid ${field}: ${settings[field]}`);
        return null;
      }
    }

    // Check number fields with ranges
    if (
      typeof settings.soundVolume !== "number" ||
      settings.soundVolume < 0 ||
      settings.soundVolume > 1
    ) {
      console.warn(`[SettingsStorage] Invalid soundVolume: ${settings.soundVolume}`);
      return null;
    }

    if (
      typeof settings.autoRepeatDelay !== "number" ||
      settings.autoRepeatDelay < 50 ||
      settings.autoRepeatDelay > 300
    ) {
      console.warn(`[SettingsStorage] Invalid autoRepeatDelay: ${settings.autoRepeatDelay}`);
      return null;
    }

    if (
      typeof settings.autoRepeatRate !== "number" ||
      settings.autoRepeatRate < 20 ||
      settings.autoRepeatRate > 100
    ) {
      console.warn(`[SettingsStorage] Invalid autoRepeatRate: ${settings.autoRepeatRate}`);
      return null;
    }

    if (
      typeof settings.targetFPS !== "number" ||
      settings.targetFPS < 30 ||
      settings.targetFPS > 120
    ) {
      console.warn(`[SettingsStorage] Invalid targetFPS: ${settings.targetFPS}`);
      return null;
    }

    // Check enum fields
    if (!["compact", "normal", "gaming"].includes(settings.theme)) {
      console.warn(`[SettingsStorage] Invalid theme: ${settings.theme}`);
      return null;
    }

    if (!["dark", "light", "auto"].includes(settings.colorScheme)) {
      console.warn(`[SettingsStorage] Invalid colorScheme: ${settings.colorScheme}`);
      return null;
    }

    // Check string fields
    if (typeof settings.language !== "string" || settings.language.length !== 2) {
      console.warn(`[SettingsStorage] Invalid language: ${settings.language}`);
      return null;
    }

    return settings as GameSettings;
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    used: number;
    available: number;
    settingsSize: number;
  }> {
    try {
      const settingsData = localStorage.getItem(this.SETTINGS_KEY);
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
  }

  /**
   * Check if settings exist
   */
  async hasSettings(): Promise<boolean> {
    try {
      return localStorage.getItem(this.SETTINGS_KEY) !== null;
    } catch (error) {
      console.error("[SettingsStorage] Failed to check if settings exist:", error);
      return false;
    }
  }
}

// Singleton instance
export const settingsStorage = new SettingsStorageAdapter();

/**
 * Debug utilities for language settings
 * Only available in development environment
 */

export const debugLanguage = {
  /**
   * Clear all settings from localStorage to test default behavior
   */
  clearSettings: () => {
    if (import.meta.env.DEV) {
      localStorage.removeItem("tetris-settings");
      console.log("[Debug] Cleared tetris-settings from localStorage");
      window.location.reload();
    }
  },

  /**
   * Force English settings
   */
  forceEnglish: () => {
    if (import.meta.env.DEV) {
      localStorage.setItem(
        "tetris-settings",
        JSON.stringify({
          language: "en",
          volume: 0.7,
          showGhostPiece: true,
        }),
      );
      console.log("[Debug] Forced English settings");
      window.location.reload();
    }
  },

  /**
   * Force Japanese settings (for testing)
   */
  forceJapanese: () => {
    if (import.meta.env.DEV) {
      localStorage.setItem(
        "tetris-settings",
        JSON.stringify({
          language: "ja",
          volume: 0.7,
          showGhostPiece: true,
        }),
      );
      console.log("[Debug] Forced Japanese settings");
      window.location.reload();
    }
  },

  /**
   * Show current state
   */
  showState: () => {
    if (import.meta.env.DEV) {
      const storage = localStorage.getItem("tetris-settings");
      const browserLang = navigator.language || navigator.languages?.[0];

      console.log("[Debug] Current state:", {
        browserLanguage: browserLang,
        localStorage: storage ? JSON.parse(storage) : null,
        rawStorage: storage,
      });
    }
  },
};

// Make available globally in development
if (import.meta.env.DEV) {
  (globalThis as typeof globalThis & { debugLanguage: typeof debugLanguage }).debugLanguage =
    debugLanguage;
  console.log("[Debug] Language debug tools available at window.debugLanguage");
}

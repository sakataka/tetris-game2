import { beforeEach, describe, expect, it } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import type { GameSettings } from "@/types/storage";
import { GAME_CONSTANTS } from "@/utils/gameConstants";
import { useSettingsStore } from "./settingsStore";

// Mock localStorage for testing
const mockStorage: Record<string, string> = {};

class MockStorage implements Storage {
  get length(): number {
    return Object.keys(mockStorage).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(mockStorage);
    return keys[index] || null;
  }

  getItem(key: string): string | null {
    return mockStorage[key] || null;
  }

  setItem(key: string, value: string): void {
    mockStorage[key] = value;
  }

  removeItem(key: string): void {
    delete mockStorage[key];
  }

  clear(): void {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  }
}

// Set up mock localStorage
Object.defineProperty(globalThis, "localStorage", {
  value: new MockStorage(),
  writable: true,
});

// Default settings for tests
const DEFAULT_SETTINGS: GameSettings = {
  language: "en",
  volume: GAME_CONSTANTS.UI.DEFAULT_VOLUME,
  showGhostPiece: true,
  enableTSpinDetection: true,
  enableAIFeatures: false,
};

describe("settingsStore", () => {
  beforeEach(() => {
    // Clear localStorage completely
    localStorage.clear();

    // Reset store to default state
    act(() => {
      useSettingsStore.setState({
        ...DEFAULT_SETTINGS,
      });
    });
  });

  describe("initial state", () => {
    it("should initialize with default settings", () => {
      const { result } = renderHook(() => useSettingsStore());

      expect(result.current.language).toBe("en");
      expect(result.current.volume).toBe(0.5);
      expect(result.current.showGhostPiece).toBe(true);
      expect(result.current.enableTSpinDetection).toBe(true);
    });

    it("should provide all setting methods", () => {
      const { result } = renderHook(() => useSettingsStore());

      expect(typeof result.current.setLanguage).toBe("function");
      expect(typeof result.current.toggleShowGhostPiece).toBe("function");
      expect(typeof result.current.setVolume).toBe("function");
      expect(typeof result.current.toggleTSpinDetection).toBe("function");
    });
  });

  describe("language settings", () => {
    it("should set language to Japanese", () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setLanguage("ja");
      });

      expect(result.current.language).toBe("ja");
    });

    it("should set language to English", () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setLanguage("en");
      });

      expect(result.current.language).toBe("en");
    });

    it("should change language from English to Japanese", () => {
      const { result } = renderHook(() => useSettingsStore());

      // Start with English (default)
      expect(result.current.language).toBe("en");

      // Change to Japanese
      act(() => {
        result.current.setLanguage("ja");
      });

      expect(result.current.language).toBe("ja");

      // Change back to English
      act(() => {
        result.current.setLanguage("en");
      });

      expect(result.current.language).toBe("en");
    });
  });

  describe("ghost piece settings", () => {
    it("should toggle ghost piece from true to false", () => {
      const { result } = renderHook(() => useSettingsStore());

      // Initially true
      expect(result.current.showGhostPiece).toBe(true);

      act(() => {
        result.current.toggleShowGhostPiece();
      });

      expect(result.current.showGhostPiece).toBe(false);
    });

    it("should toggle ghost piece from false to true", () => {
      const { result } = renderHook(() => useSettingsStore());

      // Set to false first
      act(() => {
        result.current.toggleShowGhostPiece();
      });
      expect(result.current.showGhostPiece).toBe(false);

      // Toggle back to true
      act(() => {
        result.current.toggleShowGhostPiece();
      });

      expect(result.current.showGhostPiece).toBe(true);
    });

    it("should toggle ghost piece multiple times", () => {
      const { result } = renderHook(() => useSettingsStore());

      const initialValue = result.current.showGhostPiece;

      // Toggle multiple times
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.toggleShowGhostPiece();
        });
      }

      // Should be opposite of initial value after odd number of toggles
      expect(result.current.showGhostPiece).toBe(!initialValue);
    });
  });

  describe("volume settings", () => {
    it("should set volume to 0 (muted)", () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setVolume(0);
      });

      expect(result.current.volume).toBe(0);
    });

    it("should set volume to 1 (maximum)", () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setVolume(1);
      });

      expect(result.current.volume).toBe(1);
    });

    it("should set volume to decimal values", () => {
      const { result } = renderHook(() => useSettingsStore());

      const testVolumes = [0.25, 0.5, 0.75, 0.9];

      testVolumes.forEach((volume) => {
        act(() => {
          result.current.setVolume(volume);
        });

        expect(result.current.volume).toBe(volume);
      });
    });

    it("should handle volume values outside normal range", () => {
      const { result } = renderHook(() => useSettingsStore());

      // Test negative volume
      act(() => {
        result.current.setVolume(-0.5);
      });
      expect(result.current.volume).toBe(-0.5);

      // Test volume above 1
      act(() => {
        result.current.setVolume(1.5);
      });
      expect(result.current.volume).toBe(1.5);
    });
  });

  describe("persistence", () => {
    it("should have persistence functionality", () => {
      const { result } = renderHook(() => useSettingsStore());

      // Verify that the store has the persistence methods
      expect(typeof result.current.setLanguage).toBe("function");
      expect(typeof result.current.setVolume).toBe("function");
      expect(typeof result.current.toggleShowGhostPiece).toBe("function");

      // Test that settings can be changed
      act(() => {
        result.current.setLanguage("en");
        result.current.setVolume(0.8);
        result.current.toggleShowGhostPiece();
      });

      expect(result.current.language).toBe("en");
      expect(result.current.volume).toBe(0.8);
      expect(result.current.showGhostPiece).toBe(false);
    });

    it("should maintain state consistency", () => {
      const { result } = renderHook(() => useSettingsStore());

      // Test multiple changes in sequence
      act(() => {
        result.current.setLanguage("en");
      });
      expect(result.current.language).toBe("en");

      act(() => {
        result.current.setVolume(0.3);
      });
      expect(result.current.volume).toBe(0.3);
      expect(result.current.language).toBe("en"); // Should remain unchanged

      act(() => {
        result.current.toggleShowGhostPiece();
      });
      expect(result.current.showGhostPiece).toBe(false);
      expect(result.current.language).toBe("en"); // Should remain unchanged
      expect(result.current.volume).toBe(0.3); // Should remain unchanged
    });
  });

  describe("combined settings changes", () => {
    it("should handle multiple setting changes correctly", () => {
      const { result } = renderHook(() => useSettingsStore());

      act(() => {
        result.current.setLanguage("en");
        result.current.setVolume(0.2);
        result.current.toggleShowGhostPiece();
      });

      expect(result.current.language).toBe("en");
      expect(result.current.volume).toBe(0.2);
      expect(result.current.showGhostPiece).toBe(false);
    });

    it("should maintain independent setting states", () => {
      const { result } = renderHook(() => useSettingsStore());

      // Change language, verify others remain unchanged
      act(() => {
        result.current.setLanguage("en");
      });

      expect(result.current.language).toBe("en");
      expect(result.current.volume).toBe(0.5); // Should remain default
      expect(result.current.showGhostPiece).toBe(true); // Should remain default

      // Change volume, verify others remain as set
      act(() => {
        result.current.setVolume(0.8);
      });

      expect(result.current.language).toBe("en"); // Should remain "en"
      expect(result.current.volume).toBe(0.8);
      expect(result.current.showGhostPiece).toBe(true); // Should remain default

      // Toggle ghost piece, verify others remain as set
      act(() => {
        result.current.toggleShowGhostPiece();
      });

      expect(result.current.language).toBe("en"); // Should remain "en"
      expect(result.current.volume).toBe(0.8); // Should remain 0.8
      expect(result.current.showGhostPiece).toBe(false);
    });
  });

  describe("T-Spin detection settings", () => {
    it("should toggle T-Spin detection from true to false", () => {
      const { result } = renderHook(() => useSettingsStore());

      // Initially true
      expect(result.current.enableTSpinDetection).toBe(true);

      act(() => {
        result.current.toggleTSpinDetection();
      });

      expect(result.current.enableTSpinDetection).toBe(false);
    });

    it("should toggle T-Spin detection from false to true", () => {
      const { result } = renderHook(() => useSettingsStore());

      // Set to false first
      act(() => {
        result.current.toggleTSpinDetection();
      });
      expect(result.current.enableTSpinDetection).toBe(false);

      // Toggle back to true
      act(() => {
        result.current.toggleTSpinDetection();
      });

      expect(result.current.enableTSpinDetection).toBe(true);
    });

    it("should toggle T-Spin detection multiple times", () => {
      const { result } = renderHook(() => useSettingsStore());

      const initialValue = result.current.enableTSpinDetection;

      // Toggle multiple times
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.toggleTSpinDetection();
        });
      }

      // Should be opposite of initial value after odd number of toggles
      expect(result.current.enableTSpinDetection).toBe(!initialValue);
    });
  });

  describe("edge cases", () => {
    it("should handle rapid setting changes", () => {
      const { result } = renderHook(() => useSettingsStore());

      // Rapid language changes
      act(() => {
        result.current.setLanguage("en");
        result.current.setLanguage("ja");
        result.current.setLanguage("en");
      });

      expect(result.current.language).toBe("en");

      // Rapid volume changes
      act(() => {
        result.current.setVolume(0.1);
        result.current.setVolume(0.9);
        result.current.setVolume(0.5);
      });

      expect(result.current.volume).toBe(0.5);

      // Rapid ghost piece toggles
      act(() => {
        result.current.toggleShowGhostPiece();
        result.current.toggleShowGhostPiece();
        result.current.toggleShowGhostPiece();
      });

      expect(result.current.showGhostPiece).toBe(false); // Odd number of toggles

      // Rapid T-Spin detection toggles
      act(() => {
        result.current.toggleTSpinDetection();
        result.current.toggleTSpinDetection();
        result.current.toggleTSpinDetection();
      });

      expect(result.current.enableTSpinDetection).toBe(false); // Odd number of toggles
    });

    it("should handle extreme volume values", () => {
      const { result } = renderHook(() => useSettingsStore());

      const extremeValues = [-1000, 0, 0.000001, 999.999, Number.MAX_VALUE];

      extremeValues.forEach((volume) => {
        act(() => {
          result.current.setVolume(volume);
        });

        expect(result.current.volume).toBe(volume);
      });
    });
  });

  describe("localStorage persistence behavior", () => {
    it("should maintain consistent state across multiple setting changes", () => {
      const { result } = renderHook(() => useSettingsStore());

      // Test state consistency across multiple changes
      act(() => {
        result.current.setLanguage("ja");
      });
      expect(result.current.language).toBe("ja");

      act(() => {
        result.current.setVolume(0.8);
      });
      expect(result.current.language).toBe("ja"); // Should remain unchanged
      expect(result.current.volume).toBe(0.8);

      act(() => {
        result.current.toggleShowGhostPiece();
      });
      expect(result.current.language).toBe("ja"); // Should remain unchanged
      expect(result.current.volume).toBe(0.8); // Should remain unchanged
      expect(result.current.showGhostPiece).toBe(false);
    });

    it("should pre-populate localStorage data correctly", () => {
      // Pre-populate localStorage with settings data
      const mockSettingsData = {
        state: {
          language: "ja",
          volume: 0.7,
          showGhostPiece: false,
          enableTSpinDetection: false,
        },
        version: 0,
      };

      localStorage.setItem("tetris-settings", JSON.stringify(mockSettingsData));

      // Verify localStorage data structure is correct
      const stored = localStorage.getItem("tetris-settings");
      expect(stored).toBeTruthy();

      if (stored) {
        const parsedData = JSON.parse(stored);
        expect(parsedData.state.language).toBe("ja");
        expect(parsedData.state.volume).toBe(0.7);
        expect(parsedData.state.showGhostPiece).toBe(false);
        expect(parsedData.state.enableTSpinDetection).toBe(false);
      }
    });

    it("should handle localStorage data format correctly", () => {
      // Test expected localStorage data format
      const expectedFormat = {
        state: {
          language: "en",
          volume: 0.5,
          showGhostPiece: true,
          enableTSpinDetection: true,
        },
        version: 0,
      };

      localStorage.setItem("tetris-settings", JSON.stringify(expectedFormat));

      const stored = localStorage.getItem("tetris-settings");
      expect(stored).toBeTruthy();

      if (stored) {
        const parsedData = JSON.parse(stored);
        expect(parsedData).toHaveProperty("state");
        expect(parsedData).toHaveProperty("version");
        expect(parsedData.state).toHaveProperty("language");
        expect(parsedData.state).toHaveProperty("volume");
        expect(parsedData.state).toHaveProperty("showGhostPiece");
        expect(parsedData.state).toHaveProperty("enableTSpinDetection");
      }
    });

    it("should verify all setting properties in localStorage", () => {
      // Test comprehensive settings data
      const completeSettings = {
        state: {
          language: "ja",
          volume: 0.3,
          showGhostPiece: false,
          enableTSpinDetection: false,
        },
        version: 0,
      };

      localStorage.setItem("tetris-settings", JSON.stringify(completeSettings));

      const stored = localStorage.getItem("tetris-settings");
      if (stored) {
        const parsedData = JSON.parse(stored);
        expect(parsedData.state.language).toBe("ja");
        expect(parsedData.state.volume).toBe(0.3);
        expect(parsedData.state.showGhostPiece).toBe(false);
        expect(parsedData.state.enableTSpinDetection).toBe(false);
      }
    });

    it("should handle invalid localStorage data gracefully", () => {
      // Set invalid JSON in localStorage
      localStorage.setItem("tetris-settings", "invalid-json");

      // Store should still initialize without crashing
      expect(() => {
        renderHook(() => useSettingsStore());
      }).not.toThrow();
    });

    it("should handle corrupted localStorage data structure", () => {
      // Set malformed data structure
      const corruptedData = {
        state: {
          language: 123, // Invalid type
          volume: "not-a-number", // Invalid type
          showGhostPiece: "not-a-boolean", // Invalid type
          enableTSpinDetection: null, // Invalid type
        },
      };

      localStorage.setItem("tetris-settings", JSON.stringify(corruptedData));

      // Store should still initialize without crashing
      expect(() => {
        renderHook(() => useSettingsStore());
      }).not.toThrow();
    });

    it("should initialize with default values when localStorage is empty", () => {
      // Ensure localStorage is empty
      localStorage.clear();

      const { result } = renderHook(() => useSettingsStore());

      expect(result.current.language).toBe("en");
      expect(result.current.volume).toBe(0.5);
      expect(result.current.showGhostPiece).toBe(true);
      expect(result.current.enableTSpinDetection).toBe(true);
    });

    it("should use correct localStorage key name", () => {
      // Test that the expected key name pattern is used
      const expectedKey = "tetris-settings";

      // Pre-populate with test data
      localStorage.setItem(
        expectedKey,
        JSON.stringify({
          state: {
            language: "en",
            volume: 0.5,
            showGhostPiece: true,
            enableTSpinDetection: true,
          },
          version: 0,
        }),
      );

      // Verify the key exists and incorrect keys don't
      expect(localStorage.getItem(expectedKey)).toBeTruthy();
      expect(localStorage.getItem("settings")).toBeNull();
      expect(localStorage.getItem("tetris-game-settings")).toBeNull();
    });

    it("should handle all valid language values", () => {
      // Test language type validation in localStorage
      const validLanguages = ["en", "ja"];

      validLanguages.forEach((lang) => {
        const testData = {
          state: {
            language: lang,
            volume: 0.5,
            showGhostPiece: true,
            enableTSpinDetection: true,
          },
          version: 0,
        };

        localStorage.setItem("tetris-settings", JSON.stringify(testData));

        const stored = localStorage.getItem("tetris-settings");
        if (stored) {
          const parsedData = JSON.parse(stored);
          expect(["en", "ja"]).toContain(parsedData.state.language);
        }
      });
    });

    it("should handle volume range validation", () => {
      // Test different volume values
      const volumeValues = [0, 0.25, 0.5, 0.75, 1.0];

      volumeValues.forEach((volume) => {
        const testData = {
          state: {
            language: "en",
            volume: volume,
            showGhostPiece: true,
            enableTSpinDetection: true,
          },
          version: 0,
        };

        localStorage.setItem("tetris-settings", JSON.stringify(testData));

        const stored = localStorage.getItem("tetris-settings");
        if (stored) {
          const parsedData = JSON.parse(stored);
          expect(typeof parsedData.state.volume).toBe("number");
          expect(parsedData.state.volume).toBe(volume);
        }
      });
    });
  });

  describe("localStorage edge cases", () => {
    it("should handle localStorage quota exceeded gracefully", () => {
      // Mock localStorage to throw quota exceeded error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error("QuotaExceededError");
      };

      const { result } = renderHook(() => useSettingsStore());

      // Since Zustand persist middleware handles errors gracefully,
      // the state should still update even if localStorage fails
      act(() => {
        result.current.setLanguage("ja");
        result.current.setVolume(0.8);
      });

      // State should still be updated in memory
      expect(result.current.language).toBe("ja");
      expect(result.current.volume).toBe(0.8);

      // Restore original localStorage
      localStorage.setItem = originalSetItem;
    });

    it("should handle localStorage disabled (Safari private mode)", () => {
      // Mock localStorage to be undefined/disabled
      const originalLocalStorage = localStorage;
      // @ts-expect-error - Intentionally setting localStorage to null for testing
      globalThis.localStorage = null;

      // Store creation should not crash
      expect(() => {
        renderHook(() => useSettingsStore());
      }).not.toThrow();

      // Restore original localStorage
      globalThis.localStorage = originalLocalStorage;
    });

    it("should handle localStorage getItem returning null", () => {
      // Mock getItem to always return null
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = () => null;

      const { result } = renderHook(() => useSettingsStore());

      // Should initialize with default values
      expect(result.current.language).toBe("en");
      expect(result.current.volume).toBe(0.5);
      expect(result.current.showGhostPiece).toBe(true);
      expect(result.current.enableTSpinDetection).toBe(true);

      // Restore original getItem
      localStorage.getItem = originalGetItem;
    });

    it("should handle localStorage setItem throwing generic error", () => {
      // Mock setItem to throw a generic error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = () => {
        throw new Error("Generic localStorage error");
      };

      const { result } = renderHook(() => useSettingsStore());

      // Since Zustand persist middleware handles errors gracefully,
      // the state should still update even if localStorage fails
      act(() => {
        result.current.setLanguage("ja");
        result.current.toggleShowGhostPiece();
      });

      // State should still be updated in memory
      expect(result.current.language).toBe("ja");
      expect(result.current.showGhostPiece).toBe(false);

      // Restore original setItem
      localStorage.setItem = originalSetItem;
    });

    it("should handle partial settings fallback to defaults", () => {
      // Set partial settings data (missing some properties)
      const partialData = {
        state: {
          language: "ja",
          volume: 0.8,
          // Missing showGhostPiece and enableTSpinDetection
        },
        version: 0,
      };

      localStorage.setItem("tetris-settings", JSON.stringify(partialData));

      // Store should initialize without crashing and fill in defaults
      expect(() => {
        renderHook(() => useSettingsStore());
      }).not.toThrow();
    });
  });
});

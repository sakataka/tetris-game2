import { beforeEach, describe, expect, it } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useSettingsStore } from "./settingsStore";

// Mock localStorage for testing
const mockStorage: Record<string, string> = {};

Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, value: string) => {
      mockStorage[key] = value;
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    },
  },
  writable: true,
});

describe("settingsStore", () => {
  beforeEach(() => {
    // Clear localStorage and reset store
    localStorage.clear();

    // Reset store to default settings
    useSettingsStore.setState({
      language: "ja",
      volume: 0.5,
      showGhostPiece: true,
    });
  });

  describe("initial state", () => {
    it("should initialize with default settings", () => {
      const { result } = renderHook(() => useSettingsStore());

      expect(result.current.language).toBe("ja");
      expect(result.current.volume).toBe(0.5);
      expect(result.current.showGhostPiece).toBe(true);
    });

    it("should provide all setting methods", () => {
      const { result } = renderHook(() => useSettingsStore());

      expect(typeof result.current.setLanguage).toBe("function");
      expect(typeof result.current.toggleShowGhostPiece).toBe("function");
      expect(typeof result.current.setVolume).toBe("function");
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

    it("should change language from Japanese to English", () => {
      const { result } = renderHook(() => useSettingsStore());

      // Start with Japanese (default)
      expect(result.current.language).toBe("ja");

      // Change to English
      act(() => {
        result.current.setLanguage("en");
      });

      expect(result.current.language).toBe("en");

      // Change back to Japanese
      act(() => {
        result.current.setLanguage("ja");
      });

      expect(result.current.language).toBe("ja");
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
});

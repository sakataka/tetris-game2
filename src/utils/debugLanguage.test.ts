import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { debugLanguage } from "./debugLanguage";

describe("debugLanguage", () => {
  const originalEnv = import.meta.env;
  let mockLocalStorage: { [key: string]: string };
  let mockConsoleLog: ReturnType<typeof mock>;
  let mockWindowReload: ReturnType<typeof mock>;

  beforeEach(() => {
    // Mock localStorage
    mockLocalStorage = {};
    globalThis.localStorage = {
      getItem: (key: string) => mockLocalStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockLocalStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockLocalStorage[key];
      },
      clear: () => {
        mockLocalStorage = {};
      },
      length: 0,
      key: () => null,
    };

    // Mock console.log
    mockConsoleLog = mock(() => {});
    globalThis.console = { ...console, log: mockConsoleLog };

    // Mock window.location.reload
    mockWindowReload = mock(() => {});
    globalThis.window = {
      ...globalThis.window,
      location: { ...globalThis.window?.location, reload: mockWindowReload },
    };
  });

  afterEach(() => {
    // Reset import.meta.env
    Object.assign(import.meta.env, originalEnv);

    // Reset mocks
    mockConsoleLog.mockClear();
    mockWindowReload.mockClear();
  });

  describe("debugLanguage object structure", () => {
    test("should have all expected methods", () => {
      expect(typeof debugLanguage.clearSettings).toBe("function");
      expect(typeof debugLanguage.forceEnglish).toBe("function");
      expect(typeof debugLanguage.forceJapanese).toBe("function");
      expect(typeof debugLanguage.showState).toBe("function");
    });

    test("should be a valid object", () => {
      expect(typeof debugLanguage).toBe("object");
      expect(debugLanguage).not.toBeNull();
    });
  });

  describe("clearSettings", () => {
    test("should clear localStorage in dev environment", () => {
      // Mock development environment
      import.meta.env.DEV = true;

      // Set up localStorage with test data
      mockLocalStorage["tetris-settings"] = "test-value";

      debugLanguage.clearSettings();

      expect(mockLocalStorage["tetris-settings"]).toBeUndefined();
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "[Debug] Cleared tetris-settings from localStorage",
      );
      expect(mockWindowReload).toHaveBeenCalled();
    });

    test("should not clear localStorage in production environment", () => {
      // Mock production environment
      import.meta.env.DEV = false;

      // Set up localStorage with test data
      mockLocalStorage["tetris-settings"] = "test-value";

      debugLanguage.clearSettings();

      expect(mockLocalStorage["tetris-settings"]).toBe("test-value");
      expect(mockConsoleLog).not.toHaveBeenCalled();
      expect(mockWindowReload).not.toHaveBeenCalled();
    });
  });

  describe("forceEnglish", () => {
    test("should set English settings in dev environment", () => {
      // Mock development environment
      import.meta.env.DEV = true;

      debugLanguage.forceEnglish();

      const expectedSettings = JSON.stringify({
        language: "en",
        volume: 0.7,
        showGhostPiece: true,
      });

      expect(mockLocalStorage["tetris-settings"]).toBe(expectedSettings);
      expect(mockConsoleLog).toHaveBeenCalledWith("[Debug] Forced English settings");
      expect(mockWindowReload).toHaveBeenCalled();
    });

    test("should not set settings in production environment", () => {
      // Mock production environment
      import.meta.env.DEV = false;

      debugLanguage.forceEnglish();

      expect(mockLocalStorage["tetris-settings"]).toBeUndefined();
      expect(mockConsoleLog).not.toHaveBeenCalled();
      expect(mockWindowReload).not.toHaveBeenCalled();
    });
  });

  describe("forceJapanese", () => {
    test("should set Japanese settings in dev environment", () => {
      // Mock development environment
      import.meta.env.DEV = true;

      debugLanguage.forceJapanese();

      const expectedSettings = JSON.stringify({
        language: "ja",
        volume: 0.7,
        showGhostPiece: true,
      });

      expect(mockLocalStorage["tetris-settings"]).toBe(expectedSettings);
      expect(mockConsoleLog).toHaveBeenCalledWith("[Debug] Forced Japanese settings");
      expect(mockWindowReload).toHaveBeenCalled();
    });

    test("should not set settings in production environment", () => {
      // Mock production environment
      import.meta.env.DEV = false;

      debugLanguage.forceJapanese();

      expect(mockLocalStorage["tetris-settings"]).toBeUndefined();
      expect(mockConsoleLog).not.toHaveBeenCalled();
      expect(mockWindowReload).not.toHaveBeenCalled();
    });
  });

  describe("showState", () => {
    test("should show state in dev environment", () => {
      // Mock development environment
      import.meta.env.DEV = true;

      // Mock navigator.language
      const mockNavigator = {
        language: "en-US",
        languages: ["en-US", "en"],
      };
      globalThis.navigator = mockNavigator;

      // Set up localStorage with test data
      const testSettings = { language: "ja", volume: 0.8 };
      mockLocalStorage["tetris-settings"] = JSON.stringify(testSettings);

      debugLanguage.showState();

      expect(mockConsoleLog).toHaveBeenCalledWith("[Debug] Current state:", {
        browserLanguage: "en-US",
        localStorage: testSettings,
        rawStorage: JSON.stringify(testSettings),
      });
    });

    test("should handle null localStorage in dev environment", () => {
      // Mock development environment
      import.meta.env.DEV = true;

      // Mock navigator.language
      const mockNavigator = {
        language: "ja-JP",
        languages: ["ja-JP", "ja"],
      };
      globalThis.navigator = mockNavigator;

      debugLanguage.showState();

      expect(mockConsoleLog).toHaveBeenCalledWith("[Debug] Current state:", {
        browserLanguage: "ja-JP",
        localStorage: null,
        rawStorage: null,
      });
    });

    test("should handle missing navigator.languages", () => {
      // Mock development environment
      import.meta.env.DEV = true;

      // Mock navigator without languages array
      const mockNavigator = {
        language: "fr-FR",
      };
      globalThis.navigator = mockNavigator;

      debugLanguage.showState();

      expect(mockConsoleLog).toHaveBeenCalledWith("[Debug] Current state:", {
        browserLanguage: "fr-FR",
        localStorage: null,
        rawStorage: null,
      });
    });

    test("should not show state in production environment", () => {
      // Mock production environment
      import.meta.env.DEV = false;

      debugLanguage.showState();

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });
  });

  describe("settings consistency", () => {
    test("should use consistent settings structure", () => {
      // Mock development environment
      import.meta.env.DEV = true;

      debugLanguage.forceEnglish();
      const englishSettings = JSON.parse(mockLocalStorage["tetris-settings"]);

      debugLanguage.forceJapanese();
      const japaneseSettings = JSON.parse(mockLocalStorage["tetris-settings"]);

      // Both should have the same structure
      expect(Object.keys(englishSettings)).toEqual(Object.keys(japaneseSettings));
      expect(englishSettings.volume).toBe(japaneseSettings.volume);
      expect(englishSettings.showGhostPiece).toBe(japaneseSettings.showGhostPiece);

      // Only language should differ
      expect(englishSettings.language).toBe("en");
      expect(japaneseSettings.language).toBe("ja");
    });

    test("should use expected default values", () => {
      // Mock development environment
      import.meta.env.DEV = true;

      debugLanguage.forceEnglish();
      const settings = JSON.parse(mockLocalStorage["tetris-settings"]);

      expect(settings.volume).toBe(0.7);
      expect(settings.showGhostPiece).toBe(true);
    });
  });
});

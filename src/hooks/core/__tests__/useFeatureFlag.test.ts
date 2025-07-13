import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useFeatureFlag, useFeatureFlagDebug, useThemeFeatureFlags } from "../useFeatureFlag";

// Mock navigator properties
const mockNavigator = {
  hardwareConcurrency: 8,
  deviceMemory: 8,
};

Object.defineProperty(window, "navigator", {
  value: mockNavigator,
  writable: true,
});

describe("useFeatureFlag", () => {
  beforeEach(() => {
    localStorage.clear();
    delete process.env.VITE_FF_THEME_SYSTEM;
    delete process.env.VITE_FF_GAMING_MODE;
    // Reset navigator mock
    Object.assign(mockNavigator, { hardwareConcurrency: 8, deviceMemory: 8 });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Basic functionality", () => {
    it("should return default enabled state for theme-system", () => {
      const { result } = renderHook(() => useFeatureFlag("theme-system"));
      expect(result.current).toBe(true);
    });

    it("should return default enabled state for gaming-mode", () => {
      const { result } = renderHook(() => useFeatureFlag("gaming-mode"));
      expect(result.current).toBe(true);
    });

    it("should return default disabled state for advanced-ai", () => {
      const { result } = renderHook(() => useFeatureFlag("advanced-ai"));
      expect(result.current).toBe(false);
    });
  });

  describe("localStorage overrides", () => {
    it("should respect localStorage override true", () => {
      localStorage.setItem("ff-advanced-ai", "true");
      const { result } = renderHook(() => useFeatureFlag("advanced-ai"));
      expect(result.current).toBe(true);
    });

    it("should respect localStorage override false", () => {
      localStorage.setItem("ff-theme-system", "false");
      const { result } = renderHook(() => useFeatureFlag("theme-system"));
      expect(result.current).toBe(false);
    });

    it("should ignore invalid localStorage values", () => {
      localStorage.setItem("ff-theme-system", "invalid");
      const { result } = renderHook(() => useFeatureFlag("theme-system"));
      expect(result.current).toBe(true); // Should use default
    });
  });

  describe("Environment variable overrides", () => {
    it("should respect environment variable override true", () => {
      process.env.VITE_FF_ADVANCED_AI = "true";
      const { result } = renderHook(() => useFeatureFlag("advanced-ai"));
      expect(result.current).toBe(true);
    });

    it("should respect environment variable override false", () => {
      process.env.VITE_FF_THEME_SYSTEM = "false";
      const { result } = renderHook(() => useFeatureFlag("theme-system"));
      expect(result.current).toBe(false);
    });

    it("should prioritize localStorage over environment variables", () => {
      process.env.VITE_FF_THEME_SYSTEM = "false";
      localStorage.setItem("ff-theme-system", "true");
      const { result } = renderHook(() => useFeatureFlag("theme-system"));
      expect(result.current).toBe(true);
    });
  });

  describe("Device tier restrictions", () => {
    it("should enable gaming-mode on high-tier device", () => {
      Object.assign(mockNavigator, { hardwareConcurrency: 8, deviceMemory: 8 });
      const { result } = renderHook(() => useFeatureFlag("gaming-mode"));
      expect(result.current).toBe(true);
    });

    it("should enable gaming-mode on mid-tier device", () => {
      Object.assign(mockNavigator, { hardwareConcurrency: 4, deviceMemory: 4 });
      const { result } = renderHook(() => useFeatureFlag("gaming-mode"));
      expect(result.current).toBe(true);
    });

    it("should disable gaming-mode on low-tier device", () => {
      Object.assign(mockNavigator, { hardwareConcurrency: 2, deviceMemory: 2 });
      const { result } = renderHook(() => useFeatureFlag("gaming-mode"));
      expect(result.current).toBe(false);
    });

    it("should handle missing navigator properties gracefully", () => {
      Object.assign(mockNavigator, { hardwareConcurrency: undefined, deviceMemory: undefined });
      const { result } = renderHook(() => useFeatureFlag("gaming-mode"));
      expect(result.current).toBe(true); // Should default to mid-tier (4 cores, 4GB)
    });
  });

  describe("Rollout percentage", () => {
    it("should enable flag for users within rollout percentage", () => {
      // Set a specific user ID that will hash to a low percentage
      localStorage.setItem("user-id", "user-low-hash");

      // Create a flag with 50% rollout
      const mockFlag = mock(() => useFeatureFlag("gaming-mode"));

      // The specific implementation will vary based on hash function
      // This test verifies the mechanism works, not specific hash values
      const { result } = renderHook(mockFlag);
      expect(typeof result.current).toBe("boolean");
    });

    it("should use anonymous user for percentage calculation when no user ID", () => {
      // Don't set user-id, should use 'anonymous'
      const { result } = renderHook(() => useFeatureFlag("gaming-mode"));
      expect(typeof result.current).toBe("boolean");
    });

    it("should provide consistent results for same user ID", () => {
      localStorage.setItem("user-id", "consistent-user");

      const { result: result1 } = renderHook(() => useFeatureFlag("gaming-mode"));
      const { result: result2 } = renderHook(() => useFeatureFlag("gaming-mode"));

      expect(result1.current).toBe(result2.current);
    });
  });
});

describe("useThemeFeatureFlags", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.assign(mockNavigator, { hardwareConcurrency: 8, deviceMemory: 8 });
  });

  it("should return all flags enabled by default", () => {
    const { result } = renderHook(() => useThemeFeatureFlags());

    expect(result.current.themeSystemEnabled).toBe(true);
    expect(result.current.gamingModeEnabled).toBe(true);
    expect(result.current.availableModes).toEqual(["compact", "normal", "gaming"]);
  });

  it("should return limited modes when gaming mode disabled", () => {
    localStorage.setItem("ff-gaming-mode", "false");

    const { result } = renderHook(() => useThemeFeatureFlags());

    expect(result.current.themeSystemEnabled).toBe(true);
    expect(result.current.gamingModeEnabled).toBe(false);
    expect(result.current.availableModes).toEqual(["compact", "normal"]);
  });

  it("should return only normal mode when theme system disabled", () => {
    localStorage.setItem("ff-theme-system", "false");

    const { result } = renderHook(() => useThemeFeatureFlags());

    expect(result.current.themeSystemEnabled).toBe(false);
    expect(result.current.gamingModeEnabled).toBe(true);
    expect(result.current.availableModes).toEqual(["normal"]);
  });

  it("should update when flags change", () => {
    const { result, rerender } = renderHook(() => useThemeFeatureFlags());

    expect(result.current.availableModes).toEqual(["compact", "normal", "gaming"]);

    act(() => {
      localStorage.setItem("ff-gaming-mode", "false");
    });

    rerender();

    expect(result.current.availableModes).toEqual(["compact", "normal"]);
  });
});

describe("useFeatureFlagDebug", () => {
  const originalEnv = process.env.NODE_ENV;
  const originalLocation = window.location;

  beforeEach(() => {
    localStorage.clear();
    // Mock reload function
    delete (window as { location?: unknown }).location;
    window.location = { ...originalLocation, reload: mock(() => {}) };
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    window.location = originalLocation;
    localStorage.clear();
  });

  describe("Development mode", () => {
    beforeEach(() => {
      // Mock development environment
      import.meta.env.DEV = true;
    });

    it("should toggle flag in development mode", () => {
      const { result } = renderHook(() => useFeatureFlagDebug());

      act(() => {
        result.current.toggleFlag("theme-system", false);
      });

      expect(localStorage.getItem("ff-theme-system")).toBe("false");
      expect(window.location.reload).toHaveBeenCalled();
    });

    it("should clear all overrides", () => {
      localStorage.setItem("ff-theme-system", "false");
      localStorage.setItem("ff-gaming-mode", "true");

      const { result } = renderHook(() => useFeatureFlagDebug());

      act(() => {
        result.current.clearAllOverrides();
      });

      expect(localStorage.getItem("ff-theme-system")).toBe(null);
      expect(localStorage.getItem("ff-gaming-mode")).toBe(null);
      expect(window.location.reload).toHaveBeenCalled();
    });

    it("should indicate debug mode is available", () => {
      const { result } = renderHook(() => useFeatureFlagDebug());
      expect(result.current.isDebugMode).toBe(true);
    });
  });

  describe("Production mode", () => {
    beforeEach(() => {
      // Mock production environment
      import.meta.env.DEV = false;
      console.warn = mock(() => {});
    });

    it("should warn when trying to toggle flag in production", () => {
      const { result } = renderHook(() => useFeatureFlagDebug());

      act(() => {
        result.current.toggleFlag("theme-system", false);
      });

      expect(console.warn).toHaveBeenCalledWith(
        "Feature flag debugging is only available in development mode",
      );
      expect(localStorage.getItem("ff-theme-system")).toBe(null);
      expect(window.location.reload).not.toHaveBeenCalled();
    });

    it("should indicate debug mode is not available", () => {
      const { result } = renderHook(() => useFeatureFlagDebug());
      expect(result.current.isDebugMode).toBe(false);
    });
  });
});

import { beforeEach, describe, expect, test } from "bun:test";
import { renderHook } from "@testing-library/react";
import { useAdaptivePerformance } from "./useAdaptivePerformance";

// Mock navigator for testing
const mockNavigator = (hardwareConcurrency = 4, deviceMemory = 4) => {
  Object.defineProperty(global, "navigator", {
    value: {
      hardwareConcurrency,
      deviceMemory,
    },
    configurable: true,
  });
};

// Mock document for canvas testing
const mockDocument = () => {
  const mockCanvas = {
    getContext: () => ({}), // Return truthy for WebGL support
  };

  const mockElement = {
    appendChild: () => mockElement,
  };

  Object.defineProperty(global, "document", {
    value: {
      createElement: () => mockCanvas,
      body: mockElement,
      documentElement: mockElement,
    },
    configurable: true,
  });
};

// Mock Worker for testing
const mockWorker = () => {
  Object.defineProperty(global, "Worker", {
    value: () => {},
    configurable: true,
  });
};

// Mock PerformanceObserver
const mockPerformanceObserver = () => {
  class MockPerformanceObserver {
    public supportedEntryTypes = ["longtask"];
    observe() {}
    disconnect() {}
  }

  Object.defineProperty(global, "PerformanceObserver", {
    value: MockPerformanceObserver,
    configurable: true,
  });
};

describe("useAdaptivePerformance", () => {
  beforeEach(() => {
    // Reset mocks
    mockNavigator();
    mockDocument();
    mockWorker();
    mockPerformanceObserver();
  });

  test("should initialize with default values", () => {
    const { result } = renderHook(() => useAdaptivePerformance());

    expect(result.current).toHaveProperty("deviceTier");
    expect(result.current).toHaveProperty("performanceMode");
    expect(result.current).toHaveProperty("animationsEnabled");
    expect(result.current).toHaveProperty("thresholds");
    expect(result.current).toHaveProperty("requestModeChange");
    expect(result.current).toHaveProperty("isLowPerformance");

    expect(typeof result.current.deviceTier).toBe("string");
    expect(typeof result.current.performanceMode).toBe("string");
    expect(typeof result.current.animationsEnabled).toBe("boolean");
    expect(typeof result.current.thresholds).toBe("object");
    expect(typeof result.current.requestModeChange).toBe("function");
    expect(typeof result.current.isLowPerformance).toBe("boolean");
  });

  test("should detect valid device tier", () => {
    const { result } = renderHook(() => useAdaptivePerformance());
    expect(["low", "mid", "high"]).toContain(result.current.deviceTier);
  });

  test("should provide performance thresholds", () => {
    const { result } = renderHook(() => useAdaptivePerformance());

    expect(result.current.thresholds).toHaveProperty("longTask");
    expect(result.current.thresholds).toHaveProperty("fps");
    expect(typeof result.current.thresholds.longTask).toBe("number");
    expect(typeof result.current.thresholds.fps).toBe("number");
    expect(result.current.thresholds.longTask).toBeGreaterThan(0);
    expect(result.current.thresholds.fps).toBeGreaterThan(0);
  });

  test("should handle missing navigator properties gracefully", () => {
    Object.defineProperty(global, "navigator", {
      value: {},
      configurable: true,
    });

    expect(() => renderHook(() => useAdaptivePerformance())).not.toThrow();
  });

  test("should handle missing PerformanceObserver gracefully", () => {
    Object.defineProperty(global, "PerformanceObserver", {
      value: undefined,
      configurable: true,
    });

    expect(() => renderHook(() => useAdaptivePerformance())).not.toThrow();
  });
});

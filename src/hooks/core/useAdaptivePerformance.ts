import { useCallback, useEffect, useState } from "react";
import type { DeviceTier } from "@/design-tokens/types";

export interface PerformanceConfig {
  deviceTier: DeviceTier;
  performanceMode: "full" | "reduced";
  animationsEnabled: boolean;
  thresholds: {
    longTask: number;
    fps: number;
  };
}

export interface AdaptivePerformance extends PerformanceConfig {
  requestModeChange: (mode: "full" | "reduced") => void;
  isLowPerformance: boolean;
}

/**
 * Device tier detection utility
 * Analyzes hardware capabilities to determine appropriate performance tier
 */
const detectDeviceTier = (): DeviceTier => {
  // Feature detection for device capabilities
  const concurrency = navigator.hardwareConcurrency || 4;
  const memory = (navigator as { deviceMemory?: number }).deviceMemory || 4;

  // Additional capability checks
  const supportsWebGL = !!document.createElement("canvas").getContext("webgl");
  const supportsWorkers = typeof Worker !== "undefined";

  // Tier classification based on hardware
  if (concurrency >= 8 && memory >= 8 && supportsWebGL) return "high";
  if (concurrency >= 4 && memory >= 4 && supportsWorkers) return "mid";
  return "low";
};

/**
 * Get performance thresholds based on device tier
 */
const getThresholdForTier = (tier: DeviceTier) => {
  const thresholds = {
    high: { longTask: 30, fps: 55 },
    mid: { longTask: 50, fps: 45 },
    low: { longTask: 100, fps: 30 },
  };
  return thresholds[tier];
};

/**
 * Adaptive performance hook for device-aware optimization
 *
 * Features:
 * - Device tier detection based on hardware capabilities
 * - Performance monitoring with PerformanceObserver
 * - Automatic performance mode suggestions
 * - Animation control based on device capabilities
 * - Graceful degradation for unsupported browsers
 */
export const useAdaptivePerformance = (): AdaptivePerformance => {
  const [deviceTier, setDeviceTier] = useState<DeviceTier>("mid");
  const [performanceMode, setPerformanceMode] = useState<"full" | "reduced">("full");
  const [longTaskCount, setLongTaskCount] = useState(0);

  // Initialize device tier detection
  useEffect(() => {
    const tier = detectDeviceTier();
    setDeviceTier(tier);

    // Set initial performance mode based on device tier
    if (tier === "low") {
      setPerformanceMode("reduced");
    }
  }, []);

  // Performance monitoring with PerformanceObserver
  useEffect(() => {
    if (!("PerformanceObserver" in window)) {
      // Fallback for browsers without PerformanceObserver support
      console.warn(
        "[useAdaptivePerformance] PerformanceObserver not supported, using default settings",
      );
      setPerformanceMode("full");
      return;
    }

    const thresholds = getThresholdForTier(deviceTier);

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const longTasks = entries.filter((entry) => entry.duration > thresholds.longTask);

      if (longTasks.length > 0) {
        setLongTaskCount((prev) => prev + longTasks.length);

        // Log performance warnings in development
        if (import.meta.env.DEV) {
          console.warn(
            `[useAdaptivePerformance] Detected ${longTasks.length} long tasks (>${thresholds.longTask}ms)`,
          );
        }

        // Suggest mode change after multiple long tasks
        if (longTaskCount > 3 && performanceMode === "full") {
          console.warn(
            "[useAdaptivePerformance] Performance degradation detected. Consider switching to reduced mode.",
          );
        }
      }
    });

    // Only observe if supported by browser
    try {
      observer.observe({ entryTypes: ["longtask"] });
    } catch {
      console.warn("[useAdaptivePerformance] Long task monitoring not supported");
    }

    return () => observer.disconnect();
  }, [deviceTier, longTaskCount, performanceMode]);

  // Manual performance mode change (respects user choice)
  const requestModeChange = useCallback((mode: "full" | "reduced") => {
    setPerformanceMode(mode);
    setLongTaskCount(0); // Reset monitoring

    if (import.meta.env.DEV) {
      console.log(`[useAdaptivePerformance] Performance mode changed to: ${mode}`);
    }
  }, []);

  // Calculate derived values
  const thresholds = getThresholdForTier(deviceTier);
  const animationsEnabled = performanceMode === "full" && deviceTier !== "low";
  const isLowPerformance = deviceTier === "low" || longTaskCount > 5;

  return {
    deviceTier,
    performanceMode,
    animationsEnabled,
    thresholds,
    requestModeChange,
    isLowPerformance,
  };
};

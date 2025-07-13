import { useEffect, useState } from "react";

type FeatureFlag = "theme-system" | "gaming-mode" | "adaptive-performance" | "advanced-ai";

interface FeatureFlagConfig {
  enabled: boolean;
  rolloutPercentage?: number;
  deviceTierRestriction?: "none" | "mid-high" | "high-only";
}

// Default feature flag configuration
const defaultFlags: Record<FeatureFlag, FeatureFlagConfig> = {
  "theme-system": { enabled: true },
  "gaming-mode": {
    enabled: true,
    rolloutPercentage: 100,
    deviceTierRestriction: "mid-high",
  },
  "adaptive-performance": { enabled: true },
  "advanced-ai": { enabled: false },
};

/**
 * Hook for feature flag management with device-aware rollout
 *
 * Features:
 * - localStorage overrides for development
 * - Environment variable support
 * - Device tier restrictions
 * - Percentage-based rollout
 * - Consistent hashing for user assignment
 */
// Helper function to evaluate flag state
const evaluateFlagState = (flag: FeatureFlag): boolean => {
  // Check localStorage override first (for development)
  const localOverride = localStorage.getItem(`ff-${flag}`);
  if (localOverride === "true" || localOverride === "false") {
    return localOverride === "true";
  }

  // Check environment variable override
  const envOverride = process.env[`VITE_FF_${flag.toUpperCase().replace("-", "_")}`];
  if (envOverride === "true" || envOverride === "false") {
    return envOverride === "true";
  }

  // Use default configuration
  const config = defaultFlags[flag];
  let enabled = config.enabled;

  // Apply rollout percentage (consistent user assignment)
  if (config.rolloutPercentage && config.rolloutPercentage < 100) {
    const userId = localStorage.getItem("user-id") || "anonymous";
    const hash = userId.split("").reduce((a, b) => {
      const newA = (a << 5) - a + b.charCodeAt(0);
      return newA & newA;
    }, 0);
    const percentage = Math.abs(hash) % 100;
    enabled = enabled && percentage < config.rolloutPercentage;
  }

  // Apply device tier restriction
  if (config.deviceTierRestriction && config.deviceTierRestriction !== "none") {
    const concurrency = navigator.hardwareConcurrency || 4;
    const memory = (navigator as { deviceMemory?: number }).deviceMemory || 4;

    const isHighTier = concurrency >= 8 && memory >= 8;
    const isMidTier = concurrency >= 4 && memory >= 4;

    if (config.deviceTierRestriction === "high-only" && !isHighTier) {
      enabled = false;
    } else if (config.deviceTierRestriction === "mid-high" && !isMidTier) {
      enabled = false;
    }
  }

  return enabled;
};

export const useFeatureFlag = (flag: FeatureFlag): boolean => {
  const [isEnabled, setIsEnabled] = useState(() => evaluateFlagState(flag));

  useEffect(() => {
    const evaluateFlag = () => {
      setIsEnabled(evaluateFlagState(flag));
    };

    evaluateFlag();

    // Listen for storage changes to update flag in real time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `ff-${flag}`) {
        evaluateFlag();
      }
    };

    // Listen for custom storage events (for same-tab changes)
    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === `ff-${flag}`) {
        evaluateFlag();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("storage-change", handleCustomStorageChange as EventListener);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("storage-change", handleCustomStorageChange as EventListener);
    };
  }, [flag]);

  return isEnabled;
};

/**
 * Hook specifically for theme system feature flags
 *
 * Provides convenient access to theme-related feature flags
 * and determines available theme modes based on flag status.
 */
export const useThemeFeatureFlags = () => {
  const themeSystemEnabled = useFeatureFlag("theme-system");
  const gamingModeEnabled = useFeatureFlag("gaming-mode");

  return {
    themeSystemEnabled,
    gamingModeEnabled,
    availableModes: themeSystemEnabled
      ? gamingModeEnabled
        ? (["compact", "normal", "gaming"] as const)
        : (["compact", "normal"] as const)
      : (["normal"] as const),
  };
};

/**
 * Development utility for toggling feature flags
 * Only works in development mode and uses localStorage
 */
export const useFeatureFlagDebug = () => {
  const toggleFlag = (flag: FeatureFlag, enabled: boolean) => {
    if (import.meta.env.DEV) {
      localStorage.setItem(`ff-${flag}`, enabled.toString());
      // Trigger custom event for same-tab updates
      window.dispatchEvent(
        new CustomEvent("storage-change", {
          detail: { key: `ff-${flag}`, newValue: enabled.toString() },
        }),
      );
      window.location.reload(); // Force re-evaluation
    } else {
      console.warn("Feature flag debugging is only available in development mode");
    }
  };

  const clearAllOverrides = () => {
    if (import.meta.env.DEV) {
      Object.keys(defaultFlags).forEach((flag) => {
        localStorage.removeItem(`ff-${flag}`);
        // Trigger custom event for each cleared flag
        window.dispatchEvent(
          new CustomEvent("storage-change", {
            detail: { key: `ff-${flag}`, newValue: null },
          }),
        );
      });
      window.location.reload();
    }
  };

  return {
    toggleFlag,
    clearAllOverrides,
    isDebugMode: import.meta.env.DEV,
  };
};

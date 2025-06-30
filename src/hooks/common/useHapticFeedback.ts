import { useCallback } from "react";

/**
 * Hook for providing haptic feedback on supported devices
 */
export function useHapticFeedback() {
  const vibrate = useCallback((pattern: number | number[] = 10) => {
    // Check if the Vibration API is supported
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const lightImpact = useCallback(() => {
    vibrate(10); // Very short vibration
  }, [vibrate]);

  const mediumImpact = useCallback(() => {
    vibrate(20); // Medium vibration
  }, [vibrate]);

  const heavyImpact = useCallback(() => {
    vibrate(30); // Longer vibration
  }, [vibrate]);

  const selectionChanged = useCallback(() => {
    vibrate(5); // Ultra-light vibration
  }, [vibrate]);

  return {
    vibrate,
    lightImpact,
    mediumImpact,
    heavyImpact,
    selectionChanged,
  };
}

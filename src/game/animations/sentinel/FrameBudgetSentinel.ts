/**
 * Frame Budget Sentinel - Prototype Implementation
 * Manages frame time budget for animation systems
 *
 * PROTOTYPE VERSION: Minimal implementation for technical validation
 */

export interface FrameBudgetSentinel {
  startMonitoring(): void;
  getCurrentBudget(): number; // remaining ms this frame
  requestBudget(requiredMs: number): boolean;
  stopMonitoring(): void;
  getTargetBudget(): number;
  measureRequestOverhead(): number;
  // PROTOTYPE: getPlatformOverhead() will be added in full implementation
}

/**
 * Minimal implementation for prototype validation
 * Focuses on technical feasibility testing
 */
export function createMinimalFrameBudgetSentinel(): FrameBudgetSentinel {
  let frameStartTime = 0;
  let isMonitoring = false;

  // Platform-specific budget adjustments
  const platformBudgets = {
    safari: 15.5, // Conservative budget for Safari
    default: 16.67,
  };

  // Detect Safari for platform-specific handling
  let budgetMs = platformBudgets.default;
  if (typeof window !== "undefined" && window.navigator) {
    const userAgent = window.navigator.userAgent;
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    if (isSafari) {
      budgetMs = platformBudgets.safari;
    }
  }

  return {
    startMonitoring(): void {
      if (typeof performance === "undefined") {
        console.warn("Performance API not available, frame budget monitoring disabled");
        return;
      }

      isMonitoring = true;

      // Initialize frame start time immediately
      frameStartTime = performance.now();

      // Use requestAnimationFrame to sync with browser rendering
      if (typeof requestAnimationFrame !== "undefined") {
        const frameCallback = (_timestamp: number) => {
          if (!isMonitoring) return;

          // Update frame start time
          frameStartTime = performance.now();

          // Continue monitoring
          requestAnimationFrame(frameCallback);
        };

        requestAnimationFrame(frameCallback);
      }
    },

    getCurrentBudget(): number {
      if (!isMonitoring || typeof performance === "undefined") {
        return 0; // No budget available if not monitoring
      }

      const elapsed = performance.now() - frameStartTime;
      const remaining = Math.max(0, budgetMs - elapsed);

      return remaining;
    },

    requestBudget(requiredMs: number): boolean {
      if (!isMonitoring) {
        return false; // Cannot grant budget if not monitoring
      }

      const currentBudget = this.getCurrentBudget();

      // Simple availability check
      // In production, this could include predictive logic
      return currentBudget >= requiredMs;
    },

    /**
     * Stop monitoring (for cleanup)
     */
    stopMonitoring(): void {
      isMonitoring = false;
    },

    /**
     * Get configured budget for current platform
     */
    getTargetBudget(): number {
      return budgetMs;
    },

    /**
     * Measure overhead of a single requestBudget call
     * Used for performance validation
     */
    measureRequestOverhead(): number {
      if (typeof performance === "undefined") {
        return 0;
      }

      const start = performance.now();
      this.requestBudget(1); // Minimal request
      const end = performance.now();

      return end - start;
    },
  };
}

// Export alias for backward compatibility
export { createMinimalFrameBudgetSentinel as MinimalFrameBudgetSentinel };

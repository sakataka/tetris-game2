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
  // PROTOTYPE: getPlatformOverhead() will be added in full implementation
}

/**
 * Minimal implementation for prototype validation
 * Focuses on technical feasibility testing
 */
export class MinimalFrameBudgetSentinel implements FrameBudgetSentinel {
  private frameStartTime = 0;
  private budgetMs = 16.67; // 60fps target (1000ms / 60)
  private isMonitoring = false;

  // Platform-specific budget adjustments
  private readonly platformBudgets = {
    safari: 15.5, // Conservative budget for Safari
    default: 16.67,
  };

  constructor() {
    // Detect Safari for platform-specific handling
    if (typeof window !== "undefined" && window.navigator) {
      const userAgent = window.navigator.userAgent;
      const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
      if (isSafari) {
        this.budgetMs = this.platformBudgets.safari;
      }
    }
  }

  startMonitoring(): void {
    if (typeof performance === "undefined") {
      console.warn("Performance API not available, frame budget monitoring disabled");
      return;
    }

    this.isMonitoring = true;

    // Initialize frame start time immediately
    this.frameStartTime = performance.now();

    // Use requestAnimationFrame to sync with browser rendering
    if (typeof requestAnimationFrame !== "undefined") {
      const frameCallback = (_timestamp: number) => {
        if (!this.isMonitoring) return;

        // Update frame start time
        this.frameStartTime = performance.now();

        // Continue monitoring
        requestAnimationFrame(frameCallback);
      };

      requestAnimationFrame(frameCallback);
    }
  }

  getCurrentBudget(): number {
    if (!this.isMonitoring || typeof performance === "undefined") {
      return 0; // No budget available if not monitoring
    }

    const elapsed = performance.now() - this.frameStartTime;
    const remaining = Math.max(0, this.budgetMs - elapsed);

    return remaining;
  }

  requestBudget(requiredMs: number): boolean {
    if (!this.isMonitoring) {
      return false; // Cannot grant budget if not monitoring
    }

    const currentBudget = this.getCurrentBudget();

    // Simple availability check
    // In production, this could include predictive logic
    return currentBudget >= requiredMs;
  }

  /**
   * Stop monitoring (for cleanup)
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
  }

  /**
   * Get configured budget for current platform
   */
  getTargetBudget(): number {
    return this.budgetMs;
  }

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
  }
}

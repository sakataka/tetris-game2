/**
 * Mock Frame Budget Sentinel for testing Animation Orchestrator
 * Provides controllable budget simulation for unit testing
 */

import type { FrameBudgetSentinel } from "@/game/animations/sentinel/FrameBudgetSentinel";

export interface MockFrameBudgetConfig {
  initialBudget?: number;
  budgetPerFrame?: number;
  alwaysGrant?: boolean;
  alwaysDeny?: boolean;
}

/**
 * Mock implementation for testing Animation Orchestrator integration
 */
export class MockFrameBudgetSentinel implements FrameBudgetSentinel {
  private isMonitoring = false;
  private currentBudget: number;
  private budgetPerFrame: number;
  private config: Required<MockFrameBudgetConfig>;

  constructor(config: MockFrameBudgetConfig = {}) {
    this.config = {
      initialBudget: config.initialBudget ?? 16.67,
      budgetPerFrame: config.budgetPerFrame ?? 16.67,
      alwaysGrant: config.alwaysGrant ?? false,
      alwaysDeny: config.alwaysDeny ?? false,
    };

    this.currentBudget = this.config.initialBudget;
    this.budgetPerFrame = this.config.budgetPerFrame;
  }

  startMonitoring(): void {
    this.isMonitoring = true;
    this.currentBudget = this.config.initialBudget;
  }

  getCurrentBudget(): number {
    if (!this.isMonitoring) {
      return 0;
    }
    return Math.max(0, this.currentBudget);
  }

  requestBudget(requiredMs: number): boolean {
    if (!this.isMonitoring) {
      return false;
    }

    // Test override modes
    if (this.config.alwaysGrant) {
      return true;
    }
    if (this.config.alwaysDeny) {
      return false;
    }

    // Normal budget checking
    const canGrant = this.currentBudget >= requiredMs;
    if (canGrant) {
      this.currentBudget -= requiredMs;
    }

    return canGrant;
  }

  /**
   * Reset budget to initial value (for testing)
   */
  resetBudget(): void {
    this.currentBudget = this.config.initialBudget;
  }

  /**
   * Set current budget manually (for testing)
   */
  setBudget(budget: number): void {
    this.currentBudget = budget;
  }

  /**
   * Simulate frame advance with budget reset
   */
  advanceFrame(): void {
    this.currentBudget = this.budgetPerFrame;
  }

  /**
   * Stop monitoring (cleanup)
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
  }

  /**
   * Update configuration during test
   */
  updateConfig(config: Partial<MockFrameBudgetConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.initialBudget !== undefined) {
      this.budgetPerFrame = config.initialBudget;
    }
  }

  /**
   * Get current monitoring state
   */
  isCurrentlyMonitoring(): boolean {
    return this.isMonitoring;
  }
}

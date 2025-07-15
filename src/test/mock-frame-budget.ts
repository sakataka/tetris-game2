/**
 * Mock Frame Budget Sentinel for testing
 * Provides a controllable implementation of FrameBudgetSentinel for tests
 */

export interface MockFrameBudgetOptions {
  initialBudget?: number;
  alwaysGrant?: boolean;
}

export class MockFrameBudgetSentinel {
  private budget: number;
  private isMonitoring = false;
  private alwaysGrant: boolean;

  constructor(options: MockFrameBudgetOptions = {}) {
    this.budget = options.initialBudget ?? 16.67;
    this.alwaysGrant = options.alwaysGrant ?? false;
  }

  startMonitoring(): void {
    this.isMonitoring = true;
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
  }

  requestBudget(amount: number): boolean {
    if (this.alwaysGrant) {
      return true;
    }

    if (amount <= this.budget) {
      this.budget -= amount;
      return true;
    }

    return false;
  }

  getRemainingBudget(): number {
    return this.budget;
  }

  resetBudget(): void {
    this.budget = 16.67;
  }

  setBudget(amount: number): void {
    this.budget = amount;
  }

  isActive(): boolean {
    return this.isMonitoring;
  }
}

import { describe, expect, mock, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { milliseconds, useActionCooldown } from "./useActionCooldown";

// ==============================
// Test Helper Functions - Practical Approach
// ==============================

/**
 * Create mock action function
 * Tracks execution count and arguments
 */
function createMockAction() {
  const mockAction = mock(() => {});
  return {
    action: mockAction,
    getCallCount: () => mockAction.mock.calls.length,
    getLastCallArgs: () => mockAction.mock.calls[mockAction.mock.calls.length - 1],
    reset: () => mockAction.mockReset(),
  };
}

/**
 * Helper to render useActionCooldown hook with enhanced error handling
 */
function renderActionCooldownHook(action: (...args: unknown[]) => void, cooldownMs: number) {
  let hookResult: ReturnType<typeof renderHook>;

  try {
    hookResult = renderHook(() => useActionCooldown(action, cooldownMs));
  } catch (error) {
    throw new Error(`Failed to render hook: ${error}`);
  }

  // Give React a moment to initialize the hook
  act(() => {
    // Force update if needed
  });

  // Ensure result is properly initialized with retry logic
  let attempts = 0;
  while (!hookResult.result.current && attempts < 5) {
    act(() => {
      // Force re-render
    });
    attempts++;
  }

  if (!hookResult.result.current) {
    console.error("Hook render debug info:", {
      hasResult: !!hookResult.result,
      current: hookResult.result.current,
      error: hookResult.result.error,
      attempts,
    });
    throw new Error(
      `Hook failed to render properly after ${attempts} attempts - result.current is null`,
    );
  }

  return hookResult;
}

/**
 * Helper to wait for a specific duration (for real timer tests)
 */
function waitForMs(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==============================
// Test Implementation - Real Timer Approach
// ==============================

describe("useActionCooldown - Real Timer Approach", () => {
  // Test setup is handled by global setup.ts file
  // No additional cleanup needed here
  describe("Basic API Structure", () => {
    test("Hook returns expected API", () => {
      // Given: Mock action and cooldown configuration
      const mockAction = mock(() => {});
      const cooldownMs = 100;

      // When: Render the hook
      const { result } = renderActionCooldownHook(mockAction, cooldownMs);

      // Then: Correct API is returned
      expect(typeof result.current).toBe("object");
      expect(typeof result.current.execute).toBe("function");
      expect(typeof result.current.isOnCooldown).toBe("boolean");
      expect(typeof result.current.remainingCooldown).toBe("number");
      expect(typeof result.current.reset).toBe("function");
    });

    test("Initial state has no cooldown", () => {
      // Given: Initial state of hook
      const mockAction = mock(() => {});
      const { result } = renderActionCooldownHook(mockAction, 100);

      // When: After initial rendering
      // Then: Cooldown state is false, remaining time is 0
      expect(result.current.isOnCooldown).toBe(false);
      expect(result.current.remainingCooldown).toBe(0);
    });
  });

  describe("Action execution behavior", () => {
    test("First execution runs action immediately", async () => {
      // Given: Cooldown configuration and mock action
      const mockActionHelper = createMockAction();
      const cooldownMs = 100;
      const { result } = renderActionCooldownHook(mockActionHelper.action, cooldownMs);

      // When: Execute action
      await act(async () => {
        await result.current.execute();
      });

      // Then: Action is executed once
      expect(mockActionHelper.getCallCount()).toBe(1);
    });

    test("Consecutive execution is limited during cooldown period", async () => {
      // Given: Short cooldown configuration
      const mockActionHelper = createMockAction();
      const cooldownMs = 50;
      const { result } = renderActionCooldownHook(mockActionHelper.action, cooldownMs);

      // When: Attempt to execute twice in short time
      await act(async () => {
        await result.current.execute();
        await result.current.execute(); // Immediate re-execution
      });

      // Then: Only first execution occurs
      expect(mockActionHelper.getCallCount()).toBe(1);
    });

    test("Re-execution becomes possible after cooldown period", async () => {
      // Given: Short cooldown configuration
      const mockActionHelper = createMockAction();
      const cooldownMs = 50;
      const { result } = renderActionCooldownHook(mockActionHelper.action, cooldownMs);

      // When: After initial execution, wait for cooldown period then re-execute
      await act(async () => {
        await result.current.execute();
      });

      // Only once after initial execution
      expect(mockActionHelper.getCallCount()).toBe(1);

      // Wait for cooldown period using real timers
      await act(async () => {
        await waitForMs(cooldownMs + 10);
      });

      // Re-execute
      await act(async () => {
        await result.current.execute();
      });

      // Then: Second execution also occurs
      expect(mockActionHelper.getCallCount()).toBe(2);
    });

    test("Actions with arguments are executed correctly", async () => {
      // Given: Action that accepts arguments
      const mockActionHelper = createMockAction();
      const { result } = renderActionCooldownHook(mockActionHelper.action, 100);
      const testArg1 = "test";
      const testArg2 = 42;

      // When: Execute action with arguments
      await act(async () => {
        await result.current.execute(testArg1, testArg2);
      });

      // Then: Action is executed with correct arguments
      expect(mockActionHelper.getCallCount()).toBe(1);
      expect(mockActionHelper.getLastCallArgs()).toEqual([testArg1, testArg2]);
    });
  });

  describe("Cooldown state management", () => {
    test("Enters cooldown state after action execution", async () => {
      // Given: Cooldown configuration
      const mockAction = mock(() => {});
      const cooldownMs = 100;
      const { result } = renderActionCooldownHook(mockAction, cooldownMs);

      // When: Execute action
      await act(async () => {
        await result.current.execute();
      });

      // Then: Enters cooldown state
      expect(result.current.isOnCooldown).toBe(true);
      expect(result.current.remainingCooldown).toBeGreaterThan(0);
    });

    test("State is reset after cooldown period ends", async () => {
      // Given: Short cooldown configuration
      const mockAction = mock(() => {});
      const cooldownMs = 50;
      const { result } = renderActionCooldownHook(mockAction, cooldownMs);

      // When: After action execution, wait for cooldown period
      await act(async () => {
        await result.current.execute();
      });

      await act(async () => {
        await waitForMs(cooldownMs + 10);
      });

      // Then: Cooldown state is cleared
      expect(result.current.isOnCooldown).toBe(false);
      expect(result.current.remainingCooldown).toBe(0);
    });
  });

  describe("Boundary value tests", () => {
    test("Continuous execution without limit when cooldown is 0", async () => {
      // Given: No cooldown configuration
      const mockActionHelper = createMockAction();
      const { result } = renderActionCooldownHook(mockActionHelper.action, 0);

      // When: Execute multiple times consecutively
      await act(async () => {
        await result.current.execute();
        await result.current.execute();
        await result.current.execute();
      });

      // Then: All executions occur
      expect(mockActionHelper.getCallCount()).toBe(3);
    });

    test("Branded Milliseconds type is processed correctly", () => {
      // Given: Cooldown time with branded Milliseconds type
      const mockAction = mock(() => {});
      const cooldownMs = milliseconds(150);

      // When: Render hook
      const { result } = renderActionCooldownHook(mockAction, cooldownMs);

      // Then: Works normally without errors
      expect(typeof result.current.execute).toBe("function");
    });

    test("Cooldown behavior with minimum value", async () => {
      // Given: Minimum cooldown time (1ms)
      const mockActionHelper = createMockAction();
      const cooldownMs = 1;
      const { result } = renderActionCooldownHook(mockActionHelper.action, cooldownMs);

      // When: Attempt consecutive execution
      await act(async () => {
        await result.current.execute();
        await result.current.execute();
      });

      // Then: Only first execution occurs
      expect(mockActionHelper.getCallCount()).toBe(1);
    });
  });

  describe("Error handling tests", () => {
    test("Re-execution during processing is prevented", async () => {
      // Given: Long-running action
      let resolveFn: () => void = () => {};
      const longRunningAction = mock(
        () =>
          new Promise<void>((resolve) => {
            resolveFn = resolve;
          }),
      );
      const { result } = renderActionCooldownHook(longRunningAction, 100);

      // When: Start first execution (don't await yet)
      let promise1: Promise<void>;
      act(() => {
        promise1 = result.current.execute();
      });

      // Re-execute during processing (should be ignored)
      await act(async () => {
        await result.current.execute();
      });

      // Complete the first process
      resolveFn();
      if (promise1) {
        await act(async () => {
          await promise1;
        });
      }

      // Then: Only executed once (re-execution is ignored)
      expect(longRunningAction).toHaveBeenCalledTimes(1);
    });

    test("milliseconds() throws error with negative cooldown time", () => {
      // Given: Negative cooldown time
      // When & Then: Error is thrown
      expect(() => milliseconds(-100)).toThrow("Milliseconds must be non-negative");
    });
  });

  describe("Reset functionality", () => {
    test("reset() clears cooldown state", async () => {
      // Given: State during cooldown
      const mockAction = mock(() => {});
      const cooldownMs = 100;
      const { result } = renderActionCooldownHook(mockAction, cooldownMs);

      // Execute action to enter cooldown state
      await act(async () => {
        await result.current.execute();
      });

      expect(result.current.isOnCooldown).toBe(true);

      // When: Execute reset
      act(() => {
        result.current.reset();
      });

      // Then: Cooldown state is cleared
      expect(result.current.isOnCooldown).toBe(false);
      expect(result.current.remainingCooldown).toBe(0);
    });

    test("Immediate re-execution becomes possible after reset()", async () => {
      // Given: State during cooldown
      const mockActionHelper = createMockAction();
      const cooldownMs = 1000; // Long cooldown
      const { result } = renderActionCooldownHook(mockActionHelper.action, cooldownMs);

      // Initial execution
      await act(async () => {
        await result.current.execute();
      });

      // When: Re-execute after reset
      act(() => {
        result.current.reset();
      });

      await act(async () => {
        await result.current.execute();
      });

      // Then: Re-execution occurs without waiting for cooldown
      expect(mockActionHelper.getCallCount()).toBe(2);
    });
  });

  describe("Type safety", () => {
    test("Error handling with branded Milliseconds type", () => {
      // Given: Creating branded type with valid values
      // When & Then: Created without errors
      expect(() => milliseconds(0)).not.toThrow();
      expect(() => milliseconds(100)).not.toThrow();
      expect(() => milliseconds(1000)).not.toThrow();
    });

    test("Async actions are processed correctly", async () => {
      // Given: Async action
      const asyncAction = mock(async () => {
        // Use real timer for async action
        return new Promise((resolve) => {
          setTimeout(() => resolve("completed"), 10);
        });
      });
      const { result } = renderActionCooldownHook(asyncAction, 50);

      // When: Execute async action
      await act(async () => {
        await result.current.execute();
        // Wait for async action to complete
        await waitForMs(15);
      });

      // Then: Executed successfully
      expect(asyncAction).toHaveBeenCalledTimes(1);
    });
  });
});

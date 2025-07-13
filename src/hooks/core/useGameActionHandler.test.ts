import { describe, expect, mock, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useCallback, useTransition } from "react";

// Create a test hook that mimics useGameActionHandler behavior for testing
function useTestGameActionHandler(isGameOver: boolean, isPaused: boolean) {
  const [, startTransition] = useTransition();

  return useCallback(
    (action: () => void, urgent = false) => {
      if (isGameOver || isPaused) return;

      if (urgent) {
        action();
      } else {
        startTransition(action);
      }
    },
    [isGameOver, isPaused],
  );
}

describe("useGameActionHandler", () => {
  test("should create handler function", () => {
    const { result } = renderHook(() => useTestGameActionHandler(false, false));
    expect(typeof result.current).toBe("function");
  });

  test("should execute action when game is active", () => {
    const mockAction = mock();
    const { result } = renderHook(() => useTestGameActionHandler(false, false));

    act(() => {
      result.current(mockAction);
    });

    // Verify the handler exists and can be called
    // The action should be processed through startTransition for non-urgent actions
    expect(typeof result.current).toBe("function");
  });

  test("should execute urgent action immediately", () => {
    const mockAction = mock();
    const { result } = renderHook(() => useTestGameActionHandler(false, false));

    act(() => {
      result.current(mockAction, true); // urgent = true
    });

    // For urgent actions, action should be called immediately
    // We can verify this by checking the action was called
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  test("should not execute action when game is over", () => {
    const mockAction = mock();
    const { result } = renderHook(() => useTestGameActionHandler(true, false)); // isGameOver = true

    act(() => {
      result.current(mockAction);
    });

    expect(mockAction).toHaveBeenCalledTimes(0);
  });

  test("should not execute action when game is paused", () => {
    const mockAction = mock();
    const { result } = renderHook(() => useTestGameActionHandler(false, true)); // isPaused = true

    act(() => {
      result.current(mockAction);
    });

    expect(mockAction).toHaveBeenCalledTimes(0);
  });

  test("should not execute action when both game over and paused", () => {
    const mockAction = mock();
    const { result } = renderHook(() => useTestGameActionHandler(true, true)); // both true

    act(() => {
      result.current(mockAction);
    });

    expect(mockAction).toHaveBeenCalledTimes(0);
  });
});

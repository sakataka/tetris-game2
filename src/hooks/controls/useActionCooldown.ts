import { useCallback, useRef } from "react";

/**
 * Generic hook for handling action cooldown to prevent multiple rapid executions
 *
 * @param action - The action function to execute
 * @param cooldownMs - Cooldown period in milliseconds
 * @returns A function that executes the action with cooldown protection
 */
export function useActionCooldown<T extends unknown[]>(
  action: (...args: T) => void,
  cooldownMs: number,
) {
  const lastExecutionTimeRef = useRef<number>(0);

  const executeWithCooldown = useCallback(
    (...args: T) => {
      const now = Date.now();

      // Check if enough time has passed since last execution
      if (now - lastExecutionTimeRef.current < cooldownMs) {
        return; // Ignore this execution attempt
      }

      // Update last execution time and execute action
      lastExecutionTimeRef.current = now;
      action(...args);
    },
    [action, cooldownMs],
  );

  return executeWithCooldown;
}

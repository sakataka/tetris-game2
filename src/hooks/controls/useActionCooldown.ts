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
  const isProcessingRef = useRef<boolean>(false);

  const executeWithCooldown = useCallback(
    async (...args: T) => {
      // Prevent re-entrant calls
      if (isProcessingRef.current) {
        return;
      }

      const now = Date.now();

      // Special case: if cooldownMs is 0, always execute
      if (cooldownMs === 0) {
        isProcessingRef.current = true;
        lastExecutionTimeRef.current = now;
        try {
          await Promise.resolve(action(...args));
        } finally {
          isProcessingRef.current = false;
        }
        return;
      }

      // Check if enough time has passed since last execution
      if (now - lastExecutionTimeRef.current < cooldownMs) {
        return; // Ignore this execution attempt
      }

      // Update last execution time and execute action
      isProcessingRef.current = true;
      lastExecutionTimeRef.current = now;
      try {
        await Promise.resolve(action(...args));
      } finally {
        isProcessingRef.current = false;
      }
    },
    [action, cooldownMs],
  );

  return executeWithCooldown;
}

import { useCallback, useRef, useState, useEffect } from "react";

// Branded type for milliseconds to ensure type safety
type Milliseconds = number & { readonly __brand: "Milliseconds" };

// Helper function to create type-safe milliseconds
export const milliseconds = (value: number): Milliseconds => {
  if (value < 0) {
    throw new Error("Milliseconds must be non-negative");
  }
  return value as Milliseconds;
};

// Type-safe action function type
type ActionFunction<TArgs extends readonly unknown[] = readonly []> = (
  ...args: TArgs
) => void | Promise<void>;

// Return type for better type inference
type ActionWithCooldown<TArgs extends readonly unknown[]> = (...args: TArgs) => Promise<void>;

// Hook return type with enhanced API
interface ActionCooldownAPI<TArgs extends readonly unknown[]> {
  readonly execute: ActionWithCooldown<TArgs>;
  readonly isOnCooldown: boolean;
  readonly remainingCooldown: number;
  readonly reset: () => void;
}

/**
 * Generic hook for handling action cooldown to prevent multiple rapid executions
 *
 * Implements mizchi-style TypeScript patterns for enhanced type safety:
 * - Branded types for milliseconds
 * - Explicit function types instead of generic constraints
 * - Clear return type definitions
 * - Rich API with cooldown state and control
 *
 * @param action - The action function to execute
 * @param cooldownMs - Cooldown period in milliseconds (use milliseconds() helper)
 * @returns Object with execute function and cooldown state
 *
 * @example
 * const moveAction = useActionCooldown(
 *   () => console.log("Moving"),
 *   milliseconds(150)
 * );
 *
 * // Execute action
 * await moveAction.execute();
 *
 * // Check cooldown state
 * if (!moveAction.isOnCooldown) {
 *   await moveAction.execute();
 * }
 */
export function useActionCooldown<TArgs extends readonly unknown[] = readonly []>(
  action: ActionFunction<TArgs>,
  cooldownMs: Milliseconds | number,
): ActionCooldownAPI<TArgs> {
  // Convert plain number to Milliseconds for backward compatibility
  const cooldownDuration = typeof cooldownMs === "number" ? milliseconds(cooldownMs) : cooldownMs;
  const lastExecutionTimeRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const [remainingCooldown, setRemainingCooldown] = useState(0);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update cooldown state
  useEffect(() => {
    const updateCooldownState = () => {
      // Skip update if no action has been executed yet
      if (lastExecutionTimeRef.current === 0) {
        return;
      }

      const now = Date.now();
      const timeSinceLastExecution = now - lastExecutionTimeRef.current;
      const remaining = Math.max(0, cooldownDuration - timeSinceLastExecution);

      setRemainingCooldown(remaining);
      setIsOnCooldown(remaining > 0);

      if (remaining > 0) {
        cooldownTimerRef.current = setTimeout(updateCooldownState, 50);
      }
    };

    // Initial call to set state
    updateCooldownState();

    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, [cooldownDuration]);

  const executeWithCooldown: ActionWithCooldown<TArgs> = useCallback(
    async (...args: TArgs): Promise<void> => {
      // Prevent re-entrant calls
      if (isProcessingRef.current) {
        return;
      }

      const now = Date.now();

      // Special case: if cooldownMs is 0, always execute
      if (cooldownDuration === 0) {
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
      if (now - lastExecutionTimeRef.current < cooldownDuration) {
        return; // Ignore this execution attempt
      }

      // Update last execution time and execute action
      isProcessingRef.current = true;
      lastExecutionTimeRef.current = now;
      setIsOnCooldown(true);
      setRemainingCooldown(cooldownDuration);

      // Start cooldown timer
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
      cooldownTimerRef.current = setTimeout(() => {
        setIsOnCooldown(false);
        setRemainingCooldown(0);
      }, cooldownDuration);

      try {
        await Promise.resolve(action(...args));
      } finally {
        isProcessingRef.current = false;
      }
    },
    [action, cooldownDuration],
  );

  const reset = useCallback(() => {
    lastExecutionTimeRef.current = 0;
    setIsOnCooldown(false);
    setRemainingCooldown(0);
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
    }
  }, []);

  return {
    execute: executeWithCooldown,
    isOnCooldown,
    remainingCooldown,
    reset,
  };
}
